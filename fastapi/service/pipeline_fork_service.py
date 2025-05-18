from datetime import datetime
from urllib import response

from bson import ObjectId
from fastapi import HTTPException
from sqlalchemy import text

from core.api_response import ApiResponse
from core.exception import CustomAPIException
from db.mongo_config import get_dataset_collection, get_pipeline_collection
from schemas.mongo.dataset import DatasetModel
from schemas.mongo.pipeline import PipelineModel
from schemas.mysql.schemas import Pipeline, Project, ProjectDataset, VersionModel
import logging

from service.db.pipeline_service import PipelineService

logger = logging.getLogger()


async def get_source_pipeline(db, pipeline_id, pipeline_service: PipelineService):
    """
    원본 파이프라인과 상세 정보를 조회합니다.
    """
    # MySQL에서 기본 파이프라인 정보 조회
    source_pipeline:Pipeline = db.query(Pipeline) \
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
    source_pipeline_details: PipelineModel = await pipeline_service.get_pipeline(pipeline_id)
    if not source_pipeline_details:
        return None, None, ApiResponse(
            status_code=404,
            message="파이프라인 상세 정보를 찾을 수 없습니다.",
            data=None
        )

    return source_pipeline, source_pipeline_details, None

async def determine_target_project(db, original_project: Project, member_id, source_pipeline:Pipeline, source_pipeline_detail:PipelineModel)->Project:
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
    original_project_id = original_project.project_id
    original_project_owner_id = original_project.member_id
    project_id = original_project.project_id

    target_project = None

    # 1. 본인의 파이프라인 복제
    if member_id == original_project_owner_id:
        # 같은 프로젝트에 새 버전 생성
        target_project = db.query(Project.category).filter(
            Project.project_id == project_id
        ).first().category
        logger.info(f"본인의 파이프라인 복제: {target_project.project_id}")
    else:
        # 2. 타인의 파이프라인 복제
        # a. 해당 파이프라인 계통이 있는 프로젝트가 있으면 → 그 프로젝트에 새 버전 생성
        source_version = db.query(VersionModel).filter(
            VersionModel.pipeline_id == source_pipeline.pipeline_id
        ).first()

        if source_version:
            group_id = source_version.group_id
            logger.info(f"소스 파이프라인 계통 (그룹 ID): {group_id}")
            
            # 같은 계통의 파이프라인 중에서 현재 사용자가 소유한 것이 있는지 확인
            same_group_pipeline = db.query(Pipeline).join(
                VersionModel, Pipeline.pipeline_id == VersionModel.pipeline_id
            ).join(
                Project, Pipeline.project_id == Project.project_id
            ).filter(
                VersionModel.group_id == group_id,
                Project.member_id == member_id,
                Pipeline.deleted_yn == False,
                Project.deleted_yn == False
            ).first()
            
            if same_group_pipeline:
                # 기존 프로젝트에 새 버전 생성
                target_project_id = same_group_pipeline.project_id
                
                target_project = db.query(Project).filter(
                    Project.project_id == target_project_id
                ).first()

                logger.info(f"기존 파이프라인 계통 발견: 프로젝트 ID {target_project_id}")
            else:
                # b. 계통이 없으면 → 새 프로젝트 생성
                # 새 프로젝트 생성
                target_project = await create_new_project(db, original_project, member_id)
                await create_new_dataset(db, target_project, source_pipeline_detail)
                logger.info(f"프로젝트 {project_id}의 데이터셋 ETag가 성공적으로 저장되었습니다")
        else:
            # 버전 정보가 없는 경우 (비정상 케이스)
            logger.warning(f"소스 파이프라인의 버전 정보를 찾을 수 없음: {source_pipeline.pipeline_id}")
            raise CustomAPIException(
                status_code=400,
                message="버전이 없는 파이프라인입니다.",
            )
    if not target_project:
        logger.error(f"타겟 프로젝트를 찾을 수 없습니다. 원본 프로젝트 ID: {original_project_id}, 소유자 ID: {original_project_owner_id}")
        raise CustomAPIException(
            status_code=404,
            message="타겟 프로젝트를 찾을 수 없습니다.",
        )
    
    logger.info(f"최종 타겟 프로젝트: {target_project}")
    return target_project


async def create_new_project(db, original_project, member_id):
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
            Project.project_id == original_project.project_id,
        ).first()

        if not original_project:
            logger.error(f"원본 프로젝트 {original_project.project_id}를 찾을 수 없습니다.")
            return None, None

        # 새 프로젝트 생성 (원본 정보 복제)
        new_project = Project(
            title=f"{original_project.title}_copy",  # 이름에 Copy 표시 추가
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

        return new_project

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
                            source_pipeline, status):
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

async def create_new_dataset(db, target_project: Project, source_pipeline_details:PipelineModel):
    """
    새로운 데이터셋을 생성합니다.
    """
    # 원본 데이터셋 정보 조회
    datasets = get_dataset_collection()
    original_dataset = await datasets.find_one({"_id": ObjectId(source_pipeline_details.original_dataset_id)})
    
    if not original_dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if not original_dataset:
        logger.error(f"원본 데이터셋 {source_pipeline_details.original_dataset_id}를 찾을 수 없습니다.")
        return None

    # 새 데이터셋 생성 (원본 정보 복제)
    new_dataset = original_dataset.copy()
    if "_id" in new_dataset:
        del new_dataset["_id"]

    new_dataset["project_id"] = target_project.project_id
    new_dataset["member_id"] = target_project.member_id

    # MongoDB에 새 데이터셋 저장
    dataset_collection = get_dataset_collection()
    await dataset_collection.insert_one(new_dataset)
    new_dataset_etag = new_dataset["etag"]

    # MySQL에 새 데이터셋 정보 저장
    new_mysql_dataset = ProjectDataset(
        project_id=target_project.project_id,
        dataset_etag=new_dataset_etag,
    )

    db.add(new_mysql_dataset)
    db.commit()

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
        response_data["modelingInfo"] = latest_history.modeling_info.model_dump(exclude=dataset_fields_to_exclude) if latest_history.modeling_info else None
        # modelingInfo는 포함하지 않음
    elif new_pipeline.history:
        new_history_item = new_pipeline.history[0]
        response_data["preprocessingSteps"] = [
            step.model_dump(exclude=dataset_fields_to_exclude)
            for step in new_history_item.preprocessing_steps
        ] if new_history_item.preprocessing_steps else []


    return response_data