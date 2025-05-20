"""
파일 저장소 관련 서비스
: MinIO 객체 저장소와 데이터베이스 상호작용을 위한 서비스 로직 제공

주요 기능:
- 프로젝트 데이터셋 파일 업로드 및 etag 저장
- 파일 다운로드 URL 생성
- 파일 메타데이터 조회 및 관리

데이터베이스와 MinIO 저장소 간 연동 작업을 처리하며 트랜잭션 관리와 예외 처리를 담당
"""

import logging
from typing import Optional, BinaryIO, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session

from core.storage import get_minio_client
from schemas.mysql.schemas import ProjectDataset
import io
import csv

logger = logging.getLogger()

async def delete_dataset(
        db: Session,
        project_id: int
) -> Dict[str, Any]:
    """
    프로젝트 데이터셋을 삭제

    Args:
        db: 데이터베이스 세션
        project_id: 프로젝트 ID

    Returns:
        Dict: 삭제 결과 정보
    """
    try:
        # 데이터베이스에서 프로젝트 데이터셋 조회
        project_dataset = db.query(ProjectDataset).filter(
            ProjectDataset.project_id == project_id
        ).first()

        if not project_dataset:
            raise HTTPException(status_code=404, detail="데이터셋을 찾을 수 없습니다")

        # MinIO 클라이언트 가져오기
        minio_client = get_minio_client()
        bucket_name = "datasets"
        object_name = f"project_{project_id}/dataset"  # 실제 파일명은 저장 패턴에 따라 달라질 수 있음

        # MinIO에서 파일 삭제
        delete_success = minio_client.delete_file(bucket_name, object_name)

        if not delete_success:
            logger.warning(f"MinIO에서 파일 {object_name} 삭제 실패")

        # 데이터베이스에서 레코드 삭제
        db.delete(project_dataset)
        db.commit()

        return {
            "success": True,
            "message": "데이터셋이 성공적으로 삭제되었습니다"
        }

    except HTTPException:
        # 이미 처리된 HTTP 예외는 그대로 전달
        raise
    except Exception as e:
        # 트랜잭션 롤백
        db.rollback()
        raise HTTPException(status_code=500, detail=f"데이터셋 삭제 중 오류 발생: {str(e)}")