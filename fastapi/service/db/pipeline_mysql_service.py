from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import text
from schemas.mysql.schemas import PipelineStatus
from typing import Dict, Any
import logging

logger = logging.getLogger()

# MySQL에 파이프라인 데이터 저장 (MongoDB ObjectID 사용)
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

        # 프로젝트 정보 직접 쿼리
        project_query = db.execute(
            text(f"SELECT * FROM projects WHERE project_id = {project_id}")
        ).fetchone()

        if not project_query:
            logger.error(f"프로젝트 ID {project_id}를 찾을 수 없습니다.")
            raise HTTPException(status_code=404, detail=f"프로젝트 ID {project_id}를 찾을 수 없습니다.")

        # 프로젝트의 public_yn 값 가져오기
        project_public_yn_raw = project_query.public_yn
        logger.info(f"프로젝트 {project_id}의 public_yn 원시 값: {project_public_yn_raw}, 타입: {type(project_public_yn_raw)}")

        # MySQL에서 public_yn 값 그대로 사용
        pipeline_public_yn = project_public_yn_raw

        # 현재 시간
        now = datetime.now()

        # 직접 SQL을 사용하여 파이프라인 추가
        insert_query = """
                       INSERT INTO pipelines
                       (pipeline_id, project_id, public_yn, like_count, fork_count, download_count,
                        data_count, status, deleted_yn, parent_pipeline_id, registered_at, modified_at)
                       VALUES (:pipeline_id, :project_id, :public_yn, 0, 0, 0,
                               :data_count, :status, 0, :parent_pipeline_id, :registered_at, :modified_at) \
                       """

        # 파라미터 준비
        params = {
            "pipeline_id": mongo_pipeline_id,
            "project_id": project_id,
            "public_yn": pipeline_public_yn,  # 프로젝트의 값 그대로 사용
            "data_count": data_count,
            "status": PipelineStatus.CREATED.value,
            "parent_pipeline_id": mongo_pipeline_id,
            "registered_at": now,
            "modified_at": now
        }

        # 저장 전 로깅
        logger.info(f"저장할 파이프라인 public_yn 값: {params['public_yn']}")

        # 쿼리 실행
        db.execute(text(insert_query), params)
        db.commit()

        # 저장 후 확인 - 직접 SQL 쿼리로 확인
        check_query = f"""
        SELECT pipeline_id, public_yn FROM pipelines WHERE pipeline_id = '{mongo_pipeline_id}'
        """
        saved_pipeline = db.execute(text(check_query)).fetchone()

        if saved_pipeline:
            saved_public_yn = bool(saved_pipeline.public_yn)
            saved_public_yn_raw = saved_pipeline.public_yn
            logger.info(f"저장 후 파이프라인 public_yn 값: {saved_public_yn}, 원시 값: {saved_public_yn_raw}")

            # 값이 예상과 다르면 로그로 기록
            if saved_public_yn_raw != pipeline_public_yn:
                logger.warning(f"파이프라인 public_yn 값이 원래 의도한 값과 다릅니다: {saved_public_yn_raw} != {pipeline_public_yn}")

                # 필요하다면 강제로 업데이트
                update_query = f"""
                UPDATE pipelines SET public_yn = :public_yn 
                WHERE pipeline_id = :pipeline_id
                """
                db.execute(text(update_query), {"public_yn": pipeline_public_yn, "pipeline_id": mongo_pipeline_id})
                db.commit()

                # 업데이트 후 다시 확인
                after_update = db.execute(text(check_query)).fetchone()
                if after_update:
                    logger.info(f"업데이트 후 public_yn 값: {after_update.public_yn}")

        logger.info(f"MySQL 파이프라인 생성: 프로젝트 {project_id}, 파이프라인 ID {mongo_pipeline_id}, public_yn: {saved_public_yn}")

        return mongo_pipeline_id

    except Exception as e:
        logger.error(f"MySQL 파이프라인 생성 중 오류: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"MySQL 파이프라인 생성 중 오류: {str(e)}")

