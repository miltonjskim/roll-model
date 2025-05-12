"""
프로젝트 데이터셋 관리 API 라우터
: 프로젝트의 원본 데이터셋 업로드 및 관리를 위한 REST API 엔드포인트 제공

주요 기능:
- 데이터셋 파일 업로드 및 저장
- 업로드된 데이터셋 분석 및 요약 정보 제공
- MinIO에 파일 저장 및 MySQL에 ETag 저장
- MongoDB에 파이프라인 및 데이터셋 정보 저장
- MySQL에 파이프라인 데이터 저장

파이프라인의 시작점
 -> 업로드된 데이터셋을 분석하고 추후 전처리 작업의 기반이 되는 정보 제공
"""
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile, Path, BackgroundTasks
from fastapi.encoders import jsonable_encoder
from fastapi.params import Query
from sqlalchemy.orm import Session
import logging
import json

from core.exception import CustomAPIException
from core.security import verify_token
from core.storage import MinioClient, get_minio_client
from db.mysql_config import get_mysql_db
from core.api_response import ApiResponse
from models.project.dataset_models import DatasetPageResponse
from schemas.mongo.pipeline import PipelineModel, PipelineHistoryItem, PipelineStatus
from service.dataset_service import upload_dataset_and_save_metadata, replace_nan_values
from schemas.mysql.schemas import Project, Pipeline
from service.db.pipeline_service import PipelineService, get_pipeline_service
from service.pipeline_fork_service import save_new_pipeline, prepare_response_data

from service.pipeline_fork_service import get_source_pipeline, find_root_pipeline_info, determine_target_project, \
    create_new_pipeline_model
from utils.snake_to_camel import convert_dict_to_camel_case

router = APIRouter()
pipeline_router = APIRouter()
logger = logging.getLogger()

@router.post("/dataset", response_class=ApiResponse)
async def upload_project_dataset(
    background_tasks: BackgroundTasks,
    project_id: int = Path(..., title="프로젝트 ID"),
    config: str = Form(..., description="데이터셋 설정 JSON"),
    dataFile: UploadFile = File(..., description="CSV 파일"),
    db: Session = Depends(get_mysql_db),
):
    """
    프로젝트에 원본 데이터셋 업로드

    - **project_id**: 데이터셋을 업로드할 프로젝트 ID
    - **config**: 데이터셋 설정 (JSON 문자열)
      - delimiter: 구분자 타입 (comma, semicolon, tab, other)
      - customDelimiter: 사용자 정의 구분자 (delimiter가 'other'인 경우)
      - encoding: 파일 인코딩 (UTF-8, CP949 등)
      - hasHeader: 헤더 존재 여부
      - columns: 컬럼 정보 배열 (name, type - string/datetime/integer/boolean/double)
    - **dataFile**: 업로드할 CSV 파일

    처리 과정:
    1. 파일 MinIO에 저장
    2. ETag MySQL에 저장
    3. 데이터셋 분석 수행
    4. MongoDB에 파이프라인 생성 및 ID 가져오기
    5. MySQL에 파이프라인 데이터 저장 (MongoDB ID 사용)
    6. MongoDB에 데이터셋 정보 저장
    7. 분석 결과 및 생성된 ID 반환
    """
    try:
        # 설정 유효성 검사
        try:
            config_data = json.loads(config)
            # 필수 필드 확인
            if "delimiter" not in config_data:
                return ApiResponse(
                    status_code=400,
                    error_code="INVALID_CONFIG",
                    error_message="delimiter 필드가 필요합니다"
                )

            # other delimiter인 경우 customDelimiter 확인
            if config_data.get("delimiter") == "other" and "customDelimiter" not in config_data:
                return ApiResponse(
                    status_code=400,
                    error_code="INVALID_CONFIG",
                    error_message="'other' 구분자를 사용할 경우 customDelimiter 필드가 필요합니다"
                )
        except json.JSONDecodeError:
            return ApiResponse(
                status_code=400,
                error_code="INVALID_JSON",
                error_message="JSON 형식이 올바르지 않습니다"
            )

        # 파일 유효성 검사
        if not dataFile.content_type or not dataFile.content_type.endswith(('csv', 'text/csv', 'application/csv')):
            return ApiResponse(
                status_code=400,
                error_code="INVALID_FILE_TYPE",
                error_message="CSV 파일만 업로드 가능합니다"
            )

        # 프로젝트 존재 여부 및 소유자 확인
        project = db.query(Project).filter(
            Project.project_id == project_id,
            Project.deleted_yn == False
        ).first()

        if not project:
            return ApiResponse(
                status_code=404,
                error_code="PROJECT_NOT_FOUND",
                error_message="프로젝트를 찾을 수 없습니다"
            )

        member_id = project.member_id
        category = project.category
        domain = project.domain

        # 데이터셋 업로드 및 분석
        result = await upload_dataset_and_save_metadata(
            db=db,
            project_id=project_id,
            member_id=member_id,
            file=dataFile,
            config_json=config,
            background_tasks=background_tasks,
            category = category,
            domain = domain
        )
        # NaN, INF 수동 인코딩
        safe_result = jsonable_encoder(replace_nan_values(result, round_decimals=2))

        # 응답 구성
        return ApiResponse(
            data=safe_result,
            message="데이터셋 업로드 및 분석 완료",
            status_code=200
        )

    except Exception as e:
        logger.error(f"데이터셋 업로드 중 오류: {str(e)}")
        # 예외 발생 시 명시적 롤백
        try:
            db.rollback()
            logger.info("오류로 인한 트랜잭션 롤백 완료")
        except Exception as rollback_error:
            logger.error(f"롤백 중 오류: {str(rollback_error)}")

        return ApiResponse(
            status_code=500,
            error_code="UPLOAD_ERROR",
            error_message=f"데이터셋 업로드 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/workspace", response_class=ApiResponse)
async def reload_recent_workspace(
    project_id: int = Path(..., title="프로젝트 ID"),                  
    member_id: int = Depends(verify_token),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
    db: Session = Depends(get_mysql_db)
):
    """
    가장 최근에 작업한 파이프라인 워크스페이스 정보를 불러옵니다.

    Parameters:
    -----------
    project_id: int
        프로젝트 ID
    member_id: int
        회원 ID 
    
    Returns:
    --------
    ApiResponse
        워크스페이스 정보
    """
    try:
        latest_pipeline: Pipeline | None = db.query(Pipeline)\
            .join(Project, Project.project_id == Pipeline.project_id)\
            .filter(Pipeline.project_id == project_id)\
            .filter(Project.member_id == member_id)\
            .filter(Pipeline.deleted_yn == False)\
            .order_by(Pipeline.modified_at.desc())\
            .first()
                
        if not latest_pipeline:
            return ApiResponse(
                status_code =404,
                message="프로젝트에 파이프라인이 존재하지 않습니다.",
                data=None
            )
        
        # MongoDB에서 파이프라인 상세 정보 조회
        pipeline_id = latest_pipeline.pipeline_id
        pipeline_details:PipelineModel = await pipeline_service.get_pipeline(pipeline_id, project_id, member_id)
        
        if not pipeline_details:
            return ApiResponse(
                status_code =404,
                message="파이프라인 상세 정보를 찾을 수 없습니다.",
                data=None
            )
        
        # 워크스페이스 응답 데이터 구성
        workspace_data = {
            "pipelineId": str(pipeline_details.id),
            "status": latest_pipeline.status,
            "registeredAt": pipeline_details.registered_at.isoformat(),
            "modifiedAt": pipeline_details.modified_at.isoformat(),
            "preprocessingSteps": [],
            "modelingInfo": None
        }

        # 전처리 단계 정보 추가
        if pipeline_details.history and len(pipeline_details.history) > 0:
            latest_history = pipeline_details.history[-1]
            if latest_history.preprocessing_steps:
                for step in latest_history.preprocessing_steps:
                    workspace_data["preprocessingSteps"].append({
                        "type": step.type,
                        "parameters": step.parameters,
                        "order": step.order,
                        "active": step.active,
                        "result": step.result,
                    })
            if latest_history.modeling_info:
                workspace_data["modelingInfo"] = latest_history.modeling_info

            workspace_data["status"] = latest_history.status
        
        return ApiResponse(
            status_code =200,
            message="최근 워크스페이스를 불러왔습니다.",
            data=convert_dict_to_camel_case(workspace_data)
        )
    
    except Exception as e:
        logger.error(f"워크스페이스 조회 중 오류 발생: {str(e)}")
        return ApiResponse(
            status_code =500,
            message=f"워크스페이스 조회 중 오류가 발생했습니다: {str(e)}",
            data=None
        )

@router.get("/pipelines/{pipeline_id}/workspace", response_class=ApiResponse)
async def reload_workspace_by_pipeline_version(
    project_id: int = Path(..., title="프로젝트 ID"),
    pipeline_id: str = Path(..., description="파이프라인 ID"),                   
    member_id: int = Depends(verify_token),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
    db: Session = Depends(get_mysql_db)
):
    """
    특정 파이프라인 버전의 워크스페이스 정보를 불러옵니다.

    Parameters:
    -----------
    project_id: int
        프로젝트 ID
    pipeline_id: str
        파이프라인 ID
    member_id: int
        회원 ID 
    
    Returns:
    --------
    ApiResponse
        워크스페이스 정보
    """
    try:
        # MySQL에서 특정 파이프라인 조회 (project_id, member_id, pipeline_id 기준)
        pipeline = db.query(Pipeline)\
            .join(Project, Project.project_id == Pipeline.project_id)\
            .filter(Pipeline.pipeline_id == pipeline_id)\
            .filter(Pipeline.project_id == project_id)\
            .filter(Pipeline.deleted_yn == False)\
            .first()
        
        if not pipeline:
            return ApiResponse(
                status_code=404,
                message="해당 파이프라인을 찾을 수 없습니다.",
                data=None
            )
        
        # MongoDB에서 파이프라인 상세 정보 조회
        pipeline_details = await pipeline_service.get_pipeline(pipeline_id, project_id, member_id)
        
        if not pipeline_details:
            return ApiResponse(
                status_code=404,
                message="파이프라인 상세 정보를 찾을 수 없습니다.",
                data=None
            )
        
        # 워크스페이스 응답 데이터 구성
        workspace_data = {
            "pipelineId": str(pipeline_details.id),
            "projectId": pipeline_details.project_id,
            "status": None,
            "registeredAt": pipeline_details.registered_at.isoformat(),
            "modifiedAt": pipeline_details.modified_at.isoformat(),
            "preprocessingSteps": [],
            "modelingInfo": None
        }
        
        # 전처리 단계 정보 추가
        if pipeline_details.history and len(pipeline_details.history) > 0:
            latest_history = pipeline_details.history[-1]
            if latest_history.preprocessing_steps:
                for step in latest_history.preprocessing_steps:
                    workspace_data["preprocessingSteps"].append({
                        "type": step.type,
                        "parameters": step.parameters,
                        "order": step.order,
                        "active": step.active,
                        "result": step.result,
                    })
            if latest_history.modeling_info:
                workspace_data["modelingInfo"] = latest_history.modeling_info

            workspace_data["status"] = latest_history.status

        return ApiResponse(
            status_code=200,
            message="워크스페이스를 불러왔습니다.",
            data=convert_dict_to_camel_case(workspace_data)
        )
    
    except Exception as e:
        logger.error(f"워크스페이스 조회 중 오류 발생: {str(e)}")
        return ApiResponse(
            status_code=500,
            message=f"워크스페이스 조회 중 오류가 발생했습니다: {str(e)}",
            data=None
        )
    
@router.get("/versions", response_class=ApiResponse)
async def get_pipeline_versions(
    project_id: int = Path(..., description="프로젝트 ID"),
    member_id: int = Depends(verify_token),
    db: Session = Depends(get_mysql_db)
):
    """
    프로젝트의 모든 파이프라인 버전을 조회합니다.

    Parameters:
    -----------
    project_id: int
        프로젝트 ID
    member_id: int
        회원 ID 
    
    Returns:
    --------
    ApiResponse
        파이프라인 버전 목록
    """
    try:
        # MySQL에서 프로젝트의 모든 파이프라인 조회
        pipelines = db.query(Pipeline)\
            .filter(Pipeline.project_id == project_id)\
            .filter(Pipeline.deleted_yn == False)\
            .order_by(Pipeline.modified_at.desc())\
            .all()
        
        if not pipelines:
            return ApiResponse(
                status_code=404,
                message="프로젝트에 파이프라인이 존재하지 않습니다.",
                data={"versions": []}
            )
        
        # 버전 정보 구성
        versions = []
        for pipeline in pipelines:
            version_info = {
                "pipelineId": pipeline.pipeline_id,
                "parentPipelineId": pipeline.parent_pipeline_id,
                "status": pipeline.status,
                "version": pipeline.version,
                "registeredAt": pipeline.registered_at.isoformat(),
                "modifiedAt": pipeline.modified_at.isoformat(),
            }
            versions.append(version_info)
        
        return ApiResponse(
            status_code=200,
            message="파이프라인 버전 목록을 불러왔습니다.",
            data={"versions": versions}
        )
    
    except Exception as e:
        logger.error(f"파이프라인 버전 조회 중 오류 발생: {str(e)}")
        return ApiResponse(
            status_code=500,
            message=f"파이프라인 버전 조회 중 오류가 발생했습니다: {str(e)}",
            data=None
        )

@router.post("/pipelines/{pipeline_id}/fork/preprocess", response_class=ApiResponse)
async def fork_pipeline_preprocess(
        project_id: int = Path(..., description="프로젝트 ID"),
        pipeline_id: str = Path(..., description="복제할 파이프라인 ID"),
        member_id: int = Depends(verify_token),
        pipeline_service: PipelineService = Depends(get_pipeline_service),
        db: Session = Depends(get_mysql_db)
):
    """
    기존 파이프라인의 전처리 단계만 복제하여 새로운 파이프라인을 생성합니다.
    복제 로직:
    1. 일반적인 경우: 본인의 파이프라인 복제 → 같은 프로젝트에 새 버전 생성
    2. 타인의 파이프라인 복제 → 내 프로젝트에 새 파이프라인 생성
    3. 내 원본 프로젝트에서 포크된 파이프라인을 복제 → 원본 프로젝트에 새 버전 생성
    """
    try:
        # 1. 원본 파이프라인 조회
        source_pipeline, source_pipeline_details, error_response = await get_source_pipeline(
            db, pipeline_id, project_id, pipeline_service
        )
        if error_response:
            return error_response

        # 2. 최초 파이프라인 정보 조회
        original_project_id, original_project_owner_id = await find_root_pipeline_info(db, pipeline_id)
        # 3. 타겟 프로젝트 결정
        target_project_id = await determine_target_project(
            db, project_id, member_id, source_pipeline, original_project_id, original_project_owner_id
        )
        # 4. 새로운 파이프라인 모델 생성
        new_pipeline = await create_new_pipeline_model(target_project_id, member_id, source_pipeline_details)

        # 5. 전처리 단계만 복제
        if source_pipeline_details.history and len(source_pipeline_details.history) > 0:
            latest_history = source_pipeline_details.history[-1]

            # 전처리 단계만 포함한 새 히스토리 항목 생성
            new_history_item = PipelineHistoryItem(
                preprocessing_steps=latest_history.preprocessing_steps if latest_history.preprocessing_steps else [],
                status=PipelineStatus.PREPROCESSED
            )

            new_pipeline.history.append(new_history_item)

        # 7. 새 파이프라인 저장
        new_pipeline_id = await save_new_pipeline(
            db, new_pipeline, pipeline_id, target_project_id, member_id,
            source_pipeline, PipelineStatus.PREPROCESSED, None, pipeline_service
        )

        # 8. 응답 데이터 준비
        response_data = await prepare_response_data(
            new_pipeline_id, target_project_id, pipeline_id, original_project_id,
            None, new_pipeline, include_all_history=False
        )

        return ApiResponse(
            status_code=200,
            message="파이프라인 전처리 단계가 성공적으로 복제되었습니다.",
            data=convert_dict_to_camel_case(response_data)
        )

    except Exception as e:
        logger.error(f"파이프라인 전처리 단계 복제 중 오류 발생: {str(e)}")
        return ApiResponse(
            status_code=500,
            message=f"파이프라인 전처리 단계 복제 중 오류가 발생했습니다: {str(e)}",
            data=None
        )


@router.post("/pipelines/{pipeline_id}/fork/total", response_class=ApiResponse)
async def fork_pipeline_total(
        project_id: int = Path(..., description="프로젝트 ID"),
        pipeline_id: str = Path(..., description="복제할 파이프라인 ID"),
        member_id: int = Depends(verify_token),
        pipeline_service: PipelineService = Depends(get_pipeline_service),
        db: Session = Depends(get_mysql_db)
):
    """
    기존 파이프라인을 전체 복제하여 새로운 파이프라인을 생성합니다.
    복제 로직:
    1. 일반적인 경우: 본인의 파이프라인 복제 → 같은 프로젝트에 새 버전 생성
    2. 타인의 파이프라인 복제 → 내 프로젝트에 새 파이프라인 생성
    3. 내 원본 프로젝트에서 직간접적으로 포크된 파이프라인을 복제 → 원본 프로젝트에 새 버전 생성
    """
    try:
        # 1. 원본 파이프라인 조회
        source_pipeline, source_pipeline_details, error_response = await get_source_pipeline(
            db, pipeline_id, project_id, pipeline_service
        )
        if error_response:
            return error_response

        # 2. 최초 파이프라인 정보 조회
        original_project_id, original_project_owner_id = await find_root_pipeline_info(db, pipeline_id)

        # 3. 타겟 프로젝트 결정
        target_project_id = await determine_target_project(
            db, project_id, member_id, source_pipeline, original_project_id, original_project_owner_id
        )

        # 4. 새로운 파이프라인 모델 생성
        new_pipeline = await create_new_pipeline_model(target_project_id, member_id, source_pipeline_details)

        # 5. 모든 히스토리 복제
        if source_pipeline_details.history and len(source_pipeline_details.history) > 0:
            for history_item in source_pipeline_details.history:
                new_pipeline.history.append(history_item.model_copy())

        # 7. 새 파이프라인 저장
        new_pipeline_id = await save_new_pipeline(
            db, new_pipeline, pipeline_id, target_project_id, member_id,
            source_pipeline, source_pipeline.status, None, pipeline_service
        )

        # 8. 응답 데이터 준비
        response_data = await prepare_response_data(
            new_pipeline_id, target_project_id, pipeline_id, original_project_id,
            None, new_pipeline, include_all_history=True
        )

        return ApiResponse(
            status_code=200,
            message="파이프라인이 성공적으로 복제되었습니다.",
            data=convert_dict_to_camel_case(response_data)
        )

    except Exception as e:
        logger.error(f"파이프라인 복제 중 오류 발생: {str(e)}")
        return ApiResponse(
            status_code=500,
            message=f"파이프라인 복제 중 오류가 발생했습니다: {str(e)}",
            data=None
        )


@pipeline_router.get("/dataset", response_class=ApiResponse)
async def get_dataset_page(
        pipeline_id: str = Path(..., description="파이프라인 ID"),
        page: int = Query(1, description="페이지 번호 (1부터 시작)"),
        size: int = Query(10, description="페이지 크기"),
        filter_condition: Optional[str] = Query(None, description="필터링 조건 (SQL WHERE 절)"),
        pipeline_service: PipelineService = Depends(get_pipeline_service),
        minio_client: MinioClient = Depends(get_minio_client)
):
    """
    파이프라인의 데이터셋을 페이징하여 조회합니다.
    """
    try:
        # 파이프라인 정보 조회
        pipeline = await pipeline_service.get_pipeline(pipeline_id)
        if not pipeline:
            return ApiResponse(
                status_code=404,
                message=f"파이프라인 ID {pipeline_id}를 찾을 수 없습니다."
            )
        
        bucket_name = "datasets"
        object_name = None
        if pipeline.history is None or len(pipeline.history) == 0:
            raise CustomAPIException(
                status_code=404,
                message=f"전처리된 데이터셋을 찾을 수 없습니다."
            )
        if pipeline.history[-1].preprocessing_steps is None or len(pipeline.history[-1].preprocessing_steps) == 0:
            object_name = pipeline.original_dataset_object_name
        else:
            object_name = pipeline.history[-1].preprocessing_steps[-1].preprocessed_dataset_object_name
        bucket_name = "datasets"

        if not bucket_name or not object_name:
            return ApiResponse(
                status_code=404,
                message="파이프라인에 연결된 데이터셋 정보가 없습니다."
            )

        # MinioClient에서 CSV 데이터 조회
        dataset_page = await minio_client.query_csv_with_paging(
            bucket_name=bucket_name,
            object_name=object_name,
            page=page,
            page_size=size,
            filter_condition=filter_condition,
        )
        return ApiResponse(
            status_code=200,
            message="데이터셋 조회 성공",
            data=DatasetPageResponse(**jsonable_encoder(replace_nan_values(dataset_page, round_decimals=2)))
        )

    except Exception as e:
        return ApiResponse(
            status_code=400,
            message=f"데이터셋 조회 실패: {str(e)}"
        )