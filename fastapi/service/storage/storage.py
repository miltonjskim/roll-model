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


async def upload_dataset_and_save_etag(
        db: Session,
        project_id: int,
        file_data: BinaryIO,
        file_name: str,
        content_type: Optional[str] = None,
        encoding: Optional[str] = 'utf-8'
) -> Dict[str, Any]:
    """
    데이터셋 파일을 MinIO에 업로드하고 etag를 데이터베이스에 저장

    Args:
        db: 데이터베이스 세션
        project_id: 프로젝트 ID
        file_data: 업로드할 파일 데이터
        file_name: 파일 이름
        content_type: 파일 컨텐츠 타입

    Returns:
        Dict: 업로드 결과 정보
    """
    try:
        # MinIO 클라이언트 가져오기
        minio_client = get_minio_client()
        bucket_name = "datasets"  # 설정에서 가져올 수도 있음

        # 객체 이름 생성 (프로젝트 ID 기반)
        object_name = f"project_{project_id}/{file_name}"

        # 파일 데이터가 CSV인 경우 인덱스 추가
        indexed_data = file_data
        if file_name.lower().endswith('.csv'):
            # CSV에 인덱스 추가
            indexed_data = add_index_to_csv(file_data)

        # 파일 업로드
        upload_success = minio_client.upload_file(
            bucket_name=bucket_name,
            object_name=object_name,
            file_data=indexed_data,
            content_type=content_type,
            encoding=encoding
        )
        
        if not upload_success:
            logger.error(f"파일 {object_name} 업로드 실패")
            raise HTTPException(status_code=500, detail="파일 업로드 실패")

        # 업로드된 객체의 etag 가져오기
        stat = minio_client.client.stat_object(bucket_name, object_name)
        etag = stat.etag

        # 따옴표가 포함된 경우 제거 (MinIO에서 반환하는 etag는 (때로) 따옴표로 둘러싸여 있음)
        etag = etag.strip('"')

        # 데이터베이스에 etag 저장
        project_dataset = ProjectDataset(
            project_id=project_id,
            dataset_etag=etag
        )

        # 데이터베이스에 저장
        db.add(project_dataset)
        db.commit()
        db.refresh(project_dataset)

        # 파일 URL 생성
        file_url = minio_client.get_file_url(bucket_name, object_name)

        return {
            "success": True,
            "project_dataset_id": project_dataset.project_dataset_id,
            "project_id": project_id,
            "dataset_etag": etag,
            "file_url": file_url
        }

    except Exception as e:
        # 트랜잭션 롤백
        db.rollback()
        logger.error(f"데이터셋 업로드 및 etag 저장 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"저장 처리 중 오류 발생: {str(e)}")


async def get_dataset_by_project_id(
        db: Session,
        project_id: int
) -> Optional[Dict[str, Any]]:
    """
    프로젝트 ID로 데이터셋 정보를 조회

    Args:
        db: 데이터베이스 세션
        project_id: 프로젝트 ID

    Returns:
        Optional[Dict]: 데이터셋 정보
    """
    try:
        # 데이터베이스에서 프로젝트 데이터셋 조회
        project_dataset = db.query(ProjectDataset).filter(
            ProjectDataset.project_id == project_id
        ).first()

        if not project_dataset:
            return None

        # MinIO 클라이언트 가져오기
        minio_client = get_minio_client()
        bucket_name = "datasets"
        object_name = f"project_{project_id}/dataset"  # 실제 파일명은 저장 패턴에 따라 달라질 수 있음
        
        # 파일 URL 생성
        file_url = minio_client.get_file_url(bucket_name, object_name)

        return {
            "project_dataset_id": project_dataset.project_dataset_id,
            "project_id": project_dataset.project_id,
            "dataset_etag": project_dataset.dataset_etag,
            "file_url": file_url
        }

    except Exception as e:
        logger.error(f"데이터셋 조회 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"데이터셋 조회 중 오류 발생: {str(e)}")


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
        logger.error(f"데이터셋 삭제 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"데이터셋 삭제 중 오류 발생: {str(e)}")
    
def add_index_to_csv(file_data: BinaryIO) -> BinaryIO:
    """
    CSV 파일에 인덱스 열 추가 (idx 컬럼이 없는 경우에만)
    
    Args:
        file_data: 원본 CSV 파일 데이터
        
    Returns:
        BinaryIO: 인덱스가 추가된 CSV 데이터 또는 원본 데이터
    """
    # BinaryIO를 텍스트로 변환
    text_data = file_data.read().decode('utf-8')
    file_data.seek(0)  # 원본 파일 포인터 리셋
    
    # CSV 리더 생성
    reader = csv.reader(io.StringIO(text_data))
    
    # 헤더 확인
    header = next(reader)
    
    # idx 컬럼이 이미 있는지 확인
    if 'idx' in header:
        # 이미 idx가 있으면 원본 파일 그대로 반환
        file_data.seek(0)  # 파일 포인터를 다시 처음으로
        return file_data
    
    # idx가 없는 경우에만 추가
    output = io.StringIO()
    writer = csv.writer(output)
    
    # 헤더에 idx 추가
    writer.writerow(['idx'] + header)
    
    # 데이터 행에 인덱스 추가
    for idx, row in enumerate(reader, start=1):
        writer.writerow([idx] + row)
    
    # StringIO를 BytesIO로 변환
    csv_bytes = io.BytesIO(output.getvalue().encode('utf-8'))
    
    return csv_bytes