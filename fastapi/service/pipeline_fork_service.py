from datetime import datetime

from sqlalchemy import text

from core.api_response import ApiResponse
from core.exception import CustomAPIException
from db.mongo_config import get_pipeline_collection
from schemas.mongo.pipeline import PipelineModel, PyObjectId
from schemas.mysql.schemas import Pipeline, Project
import logging

from service.db.pipeline_service import PipelineService

logger = logging.getLogger()


async def get_source_pipeline(db, pipeline_id, pipeline_service: PipelineService):
    """
    원본 파이프라인과 상세 정보를 조회합니다.
    """
    # MySQL에서 기본 파이프라인 정보 조회
    source_pipeline = db.query(Pipeline) \
        .filter(Pipeline.pipeline_id == pipeline_id) \
        .filter(Pipeline.deleted_yn == False) \
        .first()

    if not source_pipeline:
        return None, None, ApiResponse(
            status_code=404,
            message="복제할 파이프라인을 찾을 수 없습니다.",
            data=None
        )

    # MongoDB에서 파이프라인 상세 정보 조회
    source_pipeline_details = await pipeline_service.get_pipeline(pipeline_id)
    logger.info(f"source_pipeline_detailsssssssssssssssssssssssss: {source_pipeline_details}")
    if not source_pipeline_details:
        return None, None, ApiResponse(
            status_code=404,
            message="파이프라인 상세 정보를 찾을 수 없습니다.",
            data=None
        )

    return source_pipeline, source_pipeline_details, None


async def find_root_pipeline_info(db, pipeline_id):
    """
    최초 파이프라인 정보를 조회합니다. (재귀 CTE 사용)
    """
    # MySQL 8.0 이상의 재귀 CTE 구문 사용
    recursive_query = text("""
                           WITH RECURSIVE pipeline_ancestors AS (
                               -- 초기 쿼리: 현재 파이프라인
                               SELECT p.pipeline_id,
                                      p.parent_pipeline_id,
                                      p.project_id
                               FROM pipelines p
                               WHERE p.pipeline_id = :pipeline_id

                               UNION ALL

                               -- 재귀 쿼리: 부모 파이프라인을 찾음
                               SELECT p.pipeline_id,
                                      p.parent_pipeline_id,
                                      p.project_id
                               FROM pipelines p
                                        JOIN pipeline_ancestors pa ON p.pipeline_id = pa.parent_pipeline_id
                               WHERE p.pipeline_id != p.parent_pipeline_id -- 자기 자신이 부모인 경우 제외
                               AND p.parent_pipeline_id IS NOT NULL        -- 부모가 없는 경우 제외
                               )
                           -- 최초 원본 파이프라인 (더 이상 부모가 없거나 부모가 자기 자신인 경우)
                           SELECT p.pipeline_id as root_pipeline_id,
                                  p.project_id  as root_project_id,
                                  pj.member_id  as root_member_id
                           FROM (SELECT pipeline_id,
                                        parent_pipeline_id,
                                        project_id,
                                        ROW_NUMBER() OVER (ORDER BY (SELECT 0)) as rn
                                 FROM pipeline_ancestors
                                 WHERE pipeline_id = parent_pipeline_id
                                    OR parent_pipeline_id IS NULL) p
                                    JOIN projects pj ON p.project_id = pj.project_id
                           WHERE p.rn = 1 -- 가장 깊은 조상 선택
                           """)

    result = db.execute(recursive_query, {"pipeline_id": pipeline_id}).fetchone()

    original_project_id = None
    original_project_owner_id = None

    if result:
        original_project_id = result.root_project_id
        original_project_owner_id = result.root_member_id

    return original_project_id, original_project_owner_id


async def determine_target_project(db, project_id, member_id, source_pipeline, original_project_id,
                                   original_project_owner_id):
    """
    타겟 프로젝트를 결정합니다.

    복제 로직:
    1. 본인의 파이프라인 복제 → 같은 프로젝트에 새 버전 생성
    2. 타인의 파이프라인 복제
       a. 해당 파이프라인 계통이 있는 프로젝트가 있으면 → 그 프로젝트에 새 버전 생성
       b. 계통이 없으면 → 새 프로젝트 생성 후 복제

    Args:
        db: 데이터베이스 세션
        project_id: 현재 프로젝트 ID
        member_id: 현재 사용자 ID
        source_pipeline: 원본 파이프라인 객체
        original_project_id: 최초 루트 프로젝트 ID
        original_project_owner_id: 최초 루트 프로젝트 소유자 ID

    Returns:
        tuple: (target_project_id, target_project_category) - 타겟 프로젝트 ID와 카테고리
    """
    # 중요: 결과가 없을 경우를 대비해 초기값을 None으로 설정
    target_project_id = None
    target_project_category = None

    try:
        logger.info(f"타겟 프로젝트 결정 시작: 원본 프로젝트 ID={original_project_id}, 원본 소유자 ID={original_project_owner_id}")

        # 1. 프로젝트 소유자 확인 - 프로젝트 객체 조회
        if original_project_owner_id == member_id:
            logger.info(f"사용자가 원본 프로젝트의 소유자입니다. 원본 프로젝트에 복제합니다.")
            # 원본 프로젝트 정보 조회
            original_project = db.query(Project).filter(Project.project_id == original_project_id).first()
            if original_project:
                return original_project_id, original_project.category
            return original_project_id, None

        # 2. 타인의 파이프라인 복제 처리
        logger.info("타인의 파이프라인을 복제합니다. 적절한 타겟 프로젝트를 결정합니다.")

        # 3. 사용자가 소유한 프로젝트 목록 조회 (프로젝트 객체 전체)
        user_projects = db.query(Project) \
            .filter(Project.member_id == member_id) \
            .filter(Project.deleted_yn == False) \
            .all()

        user_project_ids = [p.project_id for p in user_projects]
        # 프로젝트 ID를 키로 하는 딕셔너리 생성
        user_projects_dict = {p.project_id: p for p in user_projects}
        logger.info(f"사용자 소유 프로젝트 IDs: {user_project_ids}")

        if not user_project_ids:
            logger.info("사용자의 프로젝트가 없습니다. 새 프로젝트를 생성합니다.")
            new_project_id, new_project_category = await create_new_project(db, original_project_id, member_id)
            return (new_project_id, new_project_category) if new_project_id else (None, None)

        # 4. 원본 파이프라인 ID 가져오기
        original_pipeline_id = source_pipeline.pipeline_id
        logger.info(f"원본 파이프라인 ID: {original_pipeline_id}")

        # 5. 조상 파이프라인 조회
        ancestor_query = text("""
                              WITH RECURSIVE ancestors
                                  AS (SELECT pipeline_id, parent_pipeline_id, project_id, 0 AS depth
                                      FROM pipelines
                                      WHERE pipeline_id = :pipeline_id

                                      UNION ALL

                                      SELECT p.pipeline_id, p.parent_pipeline_id, p.project_id, a.depth + 1
                                      FROM pipelines p
                                               JOIN ancestors a ON p.pipeline_id = a.parent_pipeline_id
                                      WHERE p.deleted_yn = False
                                        AND p.pipeline_id
                                  != a.pipeline_id                     -- 자기 참조 방지
                                  AND p.parent_pipeline_id IS NOT NULL -- NULL 참조 방지
                                  AND a.depth
                                 < 10                                  -- 깊이 제한
                                  )
                              SELECT pipeline_id
                              FROM ancestors
                              WHERE depth > 0
                              """)

        ancestor_results = db.execute(ancestor_query, {"pipeline_id": original_pipeline_id}).fetchall()
        ancestor_ids = [row[0] for row in ancestor_results]
        logger.info(f"조상 파이프라인 IDs: {ancestor_ids}")

        # 6. 자손 파이프라인 조회
        descendant_query = text("""
                                WITH RECURSIVE descendants AS (SELECT pipeline_id
                                                               FROM pipelines
                                                               WHERE pipeline_id = :pipeline_id

                                                               UNION ALL

                                                               SELECT p.pipeline_id
                                                               FROM pipelines p
                                                                        JOIN descendants d ON p.parent_pipeline_id = d.pipeline_id
                                                               WHERE p.deleted_yn = False
                                                                 AND p.pipeline_id != d.pipeline_id
                                    )
                                SELECT pipeline_id
                                FROM descendants LIMIT 30
                                """)

        descendant_results = db.execute(descendant_query, {"pipeline_id": original_pipeline_id}).fetchall()
        descendant_ids = [row[0] for row in descendant_results]
        logger.info(f"자손 파이프라인 IDs: {descendant_ids}")

        # 7. 모든 계통 파이프라인 ID 목록 생성 (조상 + 자손 + 원본)
        all_lineage_ids = list(set(ancestor_ids + descendant_ids + [original_pipeline_id]))
        logger.info(f"전체 계통 파이프라인 IDs: {all_lineage_ids}")

        # 8. 사용자 프로젝트 중에서 이 계통에 속한 프로젝트 찾기
        # 개선된 방식: all_lineage_ids 길이에 따라 다른 쿼리 사용
        if all_lineage_ids:
            has_related_project = False

            try:
                if len(all_lineage_ids) == 1:
                    # 단일 값일 경우
                    related_project_query = text("""
                                                 SELECT DISTINCT p.project_id
                                                 FROM pipelines p
                                                          JOIN projects prj ON p.project_id = prj.project_id
                                                 WHERE p.pipeline_id = :pipeline_id
                                                   AND p.deleted_yn = False
                                                   AND prj.member_id = :member_id
                                                 GROUP BY p.project_id LIMIT 1
                                                 """)

                    logger.info(f"단일 파이프라인 ID로 계통 관련 프로젝트 조회: {all_lineage_ids[0]}")
                    related_project_result = db.execute(
                        related_project_query,
                        {"pipeline_id": all_lineage_ids[0], "member_id": member_id}
                    ).fetchone()
                else:
                    # 여러 값일 경우
                    related_project_query = text("""
                                                 SELECT DISTINCT p.project_id
                                                 FROM pipelines p
                                                          JOIN projects prj ON p.project_id = prj.project_id
                                                 WHERE p.pipeline_id IN :lineage_ids
                                                   AND p.deleted_yn = False
                                                   AND prj.member_id = :member_id
                                                 GROUP BY p.project_id
                                                 ORDER BY COUNT(p.pipeline_id) DESC LIMIT 1
                                                 """)

                    logger.info(f"여러 파이프라인 ID로 계통 관련 프로젝트 조회: {len(all_lineage_ids)}개")
                    related_project_result = db.execute(
                        related_project_query,
                        {"lineage_ids": tuple(all_lineage_ids), "member_id": member_id}
                    ).fetchone()

                if related_project_result:
                    has_related_project = True
                    target_project_id = related_project_result[0]
                    # 이미 조회한 프로젝트 딕셔너리에서 카테고리 가져오기
                    target_project_category = user_projects_dict.get(target_project_id,
                                                                     {}).category if target_project_id in user_projects_dict else None
                    logger.info(f"파이프라인 계통이 있는 프로젝트 {target_project_id}에 파이프라인을 복제합니다.")
                else:
                    logger.info("계통 관련 프로젝트가 없습니다.")
                    has_related_project = False

            except Exception as e:
                logger.error(f"계통 관련 프로젝트 조회 중 오류 발생: {str(e)}")
                has_related_project = False

            # 9. 관련 프로젝트가 없으면 반드시 새 프로젝트 생성
            if not has_related_project:
                logger.info("사용자 프로젝트 중에 이 파이프라인 계통이 없습니다. 새 프로젝트를 생성합니다.")
                new_project_id, new_project_category = await create_new_project(db, original_project_id, member_id)

                if new_project_id:
                    logger.info(f"새 프로젝트 {new_project_id}가 생성되었습니다.")
                    target_project_id = new_project_id
                    target_project_category = new_project_category
        else:
            # 계통 파이프라인이 없는 경우에도 새 프로젝트 생성
            logger.warning("파이프라인 계통을 찾을 수 없습니다. 새 프로젝트를 생성합니다.")
            new_project_id, new_project_category = await create_new_project(db, original_project_id, member_id)

            if new_project_id:
                logger.info(f"새 프로젝트 {new_project_id}가 생성되었습니다.")
                target_project_id = new_project_id
                target_project_category = new_project_category
            else:
                logger.warning(f"새 프로젝트 생성에 실패했습니다. 사용자의 첫 번째 프로젝트 {user_project_ids[0]}에 복제합니다.")
                target_project_id = user_project_ids[0]
                target_project_category = user_projects_dict.get(target_project_id,
                                                                 {}).category if target_project_id in user_projects_dict else None

        # 10. 타겟 프로젝트가 없으면 새 프로젝트 생성 (마지막 안전장치)
        if target_project_id is None:
            logger.warning("타겟 프로젝트가 결정되지 않았습니다. 새 프로젝트를 생성합니다.")
            new_project_id, new_project_category = await create_new_project(db, original_project_id, member_id)

            if new_project_id:
                target_project_id = new_project_id
                target_project_category = new_project_category
            elif user_project_ids:
                target_project_id = user_project_ids[0]
                target_project_category = user_projects_dict.get(target_project_id,
                                                                 {}).category if target_project_id in user_projects_dict else None
            else:
                raise CustomAPIException(
                    status_code=400,
                    message="프로젝트 설정에 완전히 실패했습니다."
                )

    except Exception as e:
        logger.error(f"타겟 프로젝트 결정 중 오류 발생: {str(e)}")
        # 오류 발생 시 새 프로젝트 생성
        try:
            logger.warning("오류로 인해 새 프로젝트를 생성합니다.")
            new_project_id, new_project_category = await create_new_project(db, original_project_id, member_id)
            if new_project_id:
                target_project_id = new_project_id
                target_project_category = new_project_category
        except Exception as create_error:
            logger.error(f"새 프로젝트 생성 중 오류 발생: {str(create_error)}")
            # 마지막 대안: 사용자의 첫 번째 프로젝트 또는 원본 프로젝트
            return ApiResponse(status_code=500, message="타겟 프로젝트 결정 중 오류가 발생했습니다.", data=None)

    logger.info(f"최종 타겟 프로젝트: {target_project_id}, 카테고리: {target_project_category}")
    return target_project_id, target_project_category


async def create_new_project(db, original_project_id, member_id):
    """
    원본 프로젝트를 복제하여 새 프로젝트를 생성합니다.
    - 원본 프로젝트의 정보를 복제하되 ID는 새로 부여
    - 소유자는 현재 사용자(member_id)로 변경

    Args:
        db: 데이터베이스 세션
        original_project_id: 복제할 원본 프로젝트 ID
        member_id: 새 프로젝트의 소유자 ID

    Returns:
        tuple: (project_id, category) - 생성된 새 프로젝트의 ID와 카테고리
    """
    try:
        # 원본 프로젝트 정보 조회
        original_project = db.query(Project).filter(
            Project.project_id == original_project_id
        ).first()

        if not original_project:
            logger.error(f"원본 프로젝트 {original_project_id}를 찾을 수 없습니다.")
            return None, None

        # 새 프로젝트 생성 (원본 정보 복제)
        new_project = Project(
            title=f"{original_project.title} - Copy",  # 이름에 Copy 표시 추가
            description=original_project.description,
            domain=original_project.domain,
            member_id=member_id,  # 소유자를 현재 사용자로 변경
            category=original_project.category,
            public_yn=False,  # 비공개로 설정
            deleted_yn=False,
            registered_at=datetime.now(),
            modified_at=datetime.now()
        )

        # 데이터베이스에 새 프로젝트 저장
        db.add(new_project)
        db.flush()  # ID 생성을 위해 flush
        new_project_id = new_project.project_id
        db.commit()  # 명시적으로 커밋

        # 프로젝트 생성 로그
        logger.info(f"새 프로젝트가 생성되었습니다. ID: {new_project_id}, 소유자: {member_id}, 카테고리: {new_project.category}")

        return new_project_id, new_project.category

    except Exception as e:
        db.rollback()
        logger.error(f"새 프로젝트 생성 중 오류 발생: {str(e)}")
        return None, None


async def create_new_pipeline_model(target_project_id, member_id, source_pipeline_details):
    """
    새로운 파이프라인 모델을 생성합니다.
    """
    return PipelineModel(
        project_id=target_project_id,
        member_id=member_id,
        registered_at=datetime.now(),
        modified_at=datetime.now(),
        original_dataset_id=source_pipeline_details.original_dataset_id,
        original_dataset_object_name=source_pipeline_details.original_dataset_object_name,
        original_dataset_etag=source_pipeline_details.original_dataset_etag,
        history=[]
    )


async def save_new_pipeline(db, new_pipeline, pipeline_id, target_project_id,
                            source_pipeline, status, pipeline_service: PipelineService):
    """
    새 파이프라인을 MongoDB와 MySQL에 저장합니다.
    """
    # MongoDB에 새 파이프라인 저장
    pipeline_collection = get_pipeline_collection()
    result = await pipeline_collection.insert_one(new_pipeline.model_dump(by_alias=True, exclude={"id"}))
    new_pipeline_id = str(result.inserted_id)

    # MySQL에 새 파이프라인 데이터 저장
    new_mysql_pipeline = Pipeline(
        pipeline_id=new_pipeline_id,
        parent_pipeline_id=pipeline_id,  # 원본 파이프라인을 부모로 설정
        project_id=target_project_id,
        public_yn=False,
        like_count=0,
        fork_count=0,
        download_count=0,
        data_count=source_pipeline.data_count,
        status=status,
        deleted_yn=False,
        registered_at=datetime.now(),
        modified_at=datetime.now()
    )

    db.add(new_mysql_pipeline)

    # 원본 파이프라인의 fork_count 증가
    source_pipeline.fork_count += 1
    db.commit()

    return new_pipeline_id


async def prepare_response_data(new_pipeline_id, new_pipeline, category, include_all_history=False):
    """
    응답 데이터를 준비합니다.
    """
    response_data = {
        "pipelineId": new_pipeline_id,
        "category": category,  # 전달받은 category 사용
    }

    # 데이터셋 관련 필드 제외
    dataset_fields_to_exclude = {
        'preprocessed_dataset_id',
        'preprocessed_dataset_etag',
        'preprocessed_dataset_object_name'
    }

    # 히스토리 정보 추가
    if include_all_history and new_pipeline.history:
        latest_history = new_pipeline.history[-1]
        response_data["preprocessingSteps"] = [
            step.model_dump(exclude=dataset_fields_to_exclude)
            for step in latest_history.preprocessing_steps
        ] if latest_history.preprocessing_steps else []
        response_data["status"] = latest_history.status
        # modelingInfo는 포함하지 않음
    elif new_pipeline.history:
        new_history_item = new_pipeline.history[0]
        response_data["preprocessingSteps"] = [
            step.model_dump(exclude=dataset_fields_to_exclude)
            for step in new_history_item.preprocessing_steps
        ] if new_history_item.preprocessing_steps else []

    return response_data