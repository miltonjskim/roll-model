from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session
from schemas.mysql.schemas import Pipeline, PipelineStatus
from typing import Dict, Any
import logging

logger = logging.getLogger()

# 수정된 함수: MySQL에 파이프라인 데이터 저장 (MongoDB ObjectID 사용)
async def create_mysql_pipeline(
        db: Session,
        project_id: int,
        dataset_analysis: Dict[str, Any],
        mongo_pipeline_id: str
) -> str:
    """
    MySQL에 파이프라인 데이터 저장
    MongoDB 파이프라인 ID를 MySQL 파이프라인 ID로 사용

    Args:
        db: 데이터베이스 세션
        project_id: 프로젝트 ID
        member_id: 회원 ID
        etag: 원본 데이터셋 ETag
        dataset_analysis: 데이터셋 분석 결과
        mongo_pipeline_id: MongoDB 파이프라인 문서의 ObjectID 문자열

    Returns:
        str: 생성된 파이프라인 ID (MongoDB ObjectID 문자열)
    """
    try:
        # 데이터 행 수 가져오기
        data_count = dataset_analysis.get("total_rows", 0)

        # Pipeline 모델 인스턴스 생성
        # MongoDB ObjectID를 pipeline_id와 parent_pipeline_id로 사용
        pipeline = Pipeline(
            pipeline_id=mongo_pipeline_id,           # MongoDB ObjectID 사용
            parent_pipeline_id=mongo_pipeline_id,    # 자기 자신을 부모로 설정
            project_id=project_id,
            public_yn=False,  # 기본값
            like_count=0,     # 기본값
            fork_count=0,     # 기본값
            download_count=0, # 기본값
            result=None,      # 아직 결과 없음
            data_count=data_count, # 데이터셋 행 수
            target_feature=None,   # 아직 타겟 지정 없음
            status=PipelineStatus.CREATED,  # 기본 상태
            version=None,      # 기본 버전
            deleted_yn=False,  # 기본값
            registered_at=datetime.now(),
            modified_at=datetime.now()
        )

        # DB에 추가하고 즉시 flush하여 저장 확인
        db.add(pipeline)
        db.commit()

        logger.info(f"MySQL 파이프라인 생성: 프로젝트 {project_id}, 파이프라인 ID {mongo_pipeline_id}")

        return mongo_pipeline_id

    except Exception as e:
        logger.error(f"MySQL 파이프라인 생성 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"MySQL 파이프라인 생성 중 오류: {str(e)}")