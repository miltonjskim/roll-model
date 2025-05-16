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
from starlette.datastructures import Headers

from fastapi import APIRouter, Depends, File, Form, UploadFile, Path, BackgroundTasks,HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.params import Query, Header
from sqlalchemy.orm import Session
import logging
import json
import io
import time
from typing import Dict, List, Any, Optional
from openai import OpenAI
import pandas as pd
import re
import math

from ....core.exception import CustomAPIException
from core.security import verify_token
from core.storage import MinioClient, get_minio_client
from db.mysql_config import get_mysql_db
from core.api_response import ApiResponse
from models.project.dataset_models import DatasetPageResponse
from models.project.sample_models import get_sample_dataset, get_all_sample_datasets
from schemas.mongo.pipeline import PipelineModel, PipelineHistoryItem, PipelineStatus
from service.dataset_paginator import ChunkedCSVReader
from service.dataset_service import upload_dataset_and_save_metadata, replace_nan_values
from schemas.mysql.schemas import Project, Pipeline
from service.db.pipeline_service import PipelineService, get_pipeline_service
from service.pipeline_fork_service import save_new_pipeline, prepare_response_data

from service.pipeline_fork_service import get_source_pipeline, find_root_pipeline_info, determine_target_project, \
    create_new_pipeline_model
from ....service.preprocessing.preprocessing_handler import PreprocessingHandler
from utils.snake_to_camel import convert_dict_to_camel_case
from core.config import get_settings
settings = get_settings()

client = OpenAI(api_key=settings.OPENAI_API_KEY)
logger = logging.getLogger()
router = APIRouter()
sample_router = APIRouter()
pipeline_router = APIRouter()

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
    recommendations = []
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

        project_info = {
                "title": project.title,
                "description": project.description,
                "domain": project.domain,
                "category": project.category
        }
        member_id = project.member_id
        category = project.category
        domain = project.domain
        contents = await dataFile.read()
        dataFile.file.seek(0) 
        analysis_result = []
        try:

            df = pd.read_csv(io.BytesIO(contents))
            analysis_result = analyze_csv(df)
            analysis_result = clean_for_json(analysis_result)  

        except Exception as e:
            analysis_result = []

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
        
        try:
            recommendations = await generate_preprocessing_recommendations(analysis_result, project_info)
        except Exception as rec_e:
            logger.warning(f"전처리 추천 실패. 빈 리스트로 대체합니다: {rec_e}")
            recommendations = []

        result["originalDatasets"]["data"] = result["originalDatasets"]["data"][:30]
        # NaN, INF 수동 인코딩
        safe_result = jsonable_encoder(replace_nan_values(result, round_decimals=2))
    
        # 응답 구성
        return ApiResponse(
            data={"result":safe_result,"step":recommendations},
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

@sample_router.get("/datasets/samples", response_class=ApiResponse)
async def get_sample_datasets_list():
    """
    사용 가능한 샘플 데이터셋 목록 조회

    Returns:
        ApiResponse: 샘플 데이터셋 목록
    """
    try:
        samples = get_all_sample_datasets()

        # 응답 데이터 구성 (민감한 실제 데이터는 제외)
        response_data = []
        for sample_id, sample_config in samples.items():
            response_data.append({
                "id": sample_config.id,
                "name": sample_config.name,
                "description": sample_config.description,
                "category": sample_config.category,
                "domain": sample_config.domain,
                "columns": sample_config.columns,
                "rowCount": len(sample_config.data),
                "columnCount": len(sample_config.columns)
            })

        return ApiResponse(
            status_code=200,
            message="샘플 데이터셋 목록을 성공적으로 조회했습니다.",
            data=convert_dict_to_camel_case({"samples": response_data})
        )

    except Exception as e:
        logger.error(f"샘플 데이터셋 목록 조회 중 오류: {str(e)}")
        return ApiResponse(
            status_code=500,
            error_code="SAMPLE_LIST_ERROR",
            error_message=f"샘플 데이터셋 목록 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/datasets/samples/{sample_id}", response_class=ApiResponse)
async def upload_project_sample_dataset(
        sample_id: int = Path(..., title="샘플 데이터셋 ID"),
        project_id: int = Path(..., title="프로젝트 ID"),
        member_id: int = Depends(verify_token),
        db: Session = Depends(get_mysql_db),
        background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    프로젝트에 샘플 데이터셋 업로드

    Args:
        sample_id: 사용할 샘플 데이터셋 ID (iris, sales_data, customer_data 등)
        project_id: 데이터셋을 업로드할 프로젝트 ID
        member_id: 사용자 ID (토큰에서 추출)

    처리 과정:
    1. 선택된 샘플 데이터셋 조회
    2. 샘플 데이터를 CSV bytes로 변환
    3. 가상 UploadFile 객체 생성
    4. 기존 upload_dataset_and_save_metadata 함수 활용
    5. 분석 결과 반환
    :param sample_id:
    :param project_id:
    :param member_id:
    :param background_tasks:
    :param db:
    """
    try:
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

        # 선택된 샘플 데이터셋 조회
        sample_config = get_sample_dataset(sample_id)
        if not sample_config:
            return ApiResponse(
                status_code=404,
                error_code="SAMPLE_NOT_FOUND",
                error_message=f"샘플 데이터셋 '{sample_id}'를 찾을 수 없습니다"
            )

        # 샘플 데이터를 CSV bytes로 변환
        csv_bytes = sample_config.to_csv_bytes()

        # 설정 정보 가져오기
        config_dict = sample_config.get_config_dict()
        config_json = json.dumps(config_dict)

        # 가상 UploadFile 객체 생성
        filename = sample_config.get_filename()

        file_obj = io.BytesIO(csv_bytes)

        # 실제 FastAPI UploadFile 객체 생성
        sample_file = UploadFile(
            file=file_obj,
            filename=filename,
            headers = Headers({
                "content-type": "text/csv",
                "content-disposition": 'form-data; name="file"; filename="data.csv"'
            })
        )

        # 데이터셋 업로드 및 분석 (기존 함수 재사용)
        result = await upload_dataset_and_save_metadata(
            db=db,
            project_id=project_id,
            member_id=member_id,
            file=sample_file,
            config_json=config_json,
            background_tasks=background_tasks,
            category=sample_config.category,
            domain=sample_config.domain
        )

        # NaN, INF 수동 인코딩
        result["originalDatasets"]["data"] = result["originalDatasets"]["data"][:30]
        safe_result = jsonable_encoder(replace_nan_values(result, round_decimals=2))

        # 응답 구성
        return ApiResponse(
            data={"result":safe_result},
            message="데이터셋 업로드 및 분석 완료",
            status_code=200
        )

    except Exception as e:
        logger.error(f"샘플 데이터셋 업로드 중 오류: {str(e)}")
        # 예외 발생 시 명시적 롤백
        try:
            db.rollback()
            logger.info("오류로 인한 트랜잭션 롤백 완료")
        except Exception as rollback_error:
            logger.error(f"롤백 중 오류: {str(rollback_error)}")

        return ApiResponse(
            status_code=500,
            error_code="SAMPLE_UPLOAD_ERROR",
            error_message=f"샘플 데이터셋 업로드 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/workspace", response_class=ApiResponse)
async def reload_recent_workspace(
    project_id: int = Path(..., title="프로젝트 ID"),                  
    member_id: int = Depends(verify_token),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
    db: Session = Depends(get_mysql_db),
    minio_client: MinioClient = Depends(get_minio_client)
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
        pipeline_details:PipelineModel | None = await pipeline_service.get_pipeline(pipeline_id, project_id, member_id)
        
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
        # 데이터셋 호출
        workspace_data["dataset"] = await pipeline_service.get_latest_dataset_from_pipeline(
            pipeline_details,
            minio_client,
            n_rows=30,
            return_full=False
        )
        return ApiResponse(
            status_code =200,
            message="최근 워크스페이스를 불러왔습니다.",
            data=jsonable_encoder(replace_nan_values(convert_dict_to_camel_case(workspace_data), round_decimals=2))
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
    db: Session = Depends(get_mysql_db),
    minio_client: MinioClient = Depends(get_minio_client)
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

        # 데이터셋 호출
        workspace_data["dataset"] = await pipeline_service.get_latest_dataset_from_pipeline(
            pipeline_details,
            minio_client,
            n_rows=30,
            return_full=False
        )

        return ApiResponse(
            status_code=200,
            message="워크스페이스를 불러왔습니다.",
            data=jsonable_encoder(replace_nan_values(convert_dict_to_camel_case(workspace_data), round_decimals=2))
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


@pipeline_router.post("/fork/preprocess", response_class=ApiResponse)
async def fork_pipeline_preprocess(
        pipeline_id: str = Path(..., description="복제할 파이프라인 ID"),
        member_id: int = Depends(verify_token),
        pipeline_service: PipelineService = Depends(get_pipeline_service),
        db: Session = Depends(get_mysql_db),
        minio_client: MinioClient = Depends(get_minio_client)
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
            db, pipeline_id, pipeline_service
        )
        if error_response:
            return error_response
        
        if not source_pipeline or not source_pipeline_details:
            return CustomAPIException(
                status_code=404,
                message="파이프라인을 찾을 수 없습니다."
            )

        # 2. 최초 파이프라인 정보 조회
        original_project_id, original_project_owner_id = await find_root_pipeline_info(db, pipeline_id)

        # 3. 타겟 프로젝트 결정 (카테고리도 함께 반환)
        target_project_id, target_project_category = await determine_target_project(
            db, source_pipeline.project_id, member_id, source_pipeline, original_project_id, original_project_owner_id
        )

        # 4. 새로운 파이프라인 모델 생성
        new_pipeline = await create_new_pipeline_model(target_project_id, member_id, source_pipeline_details)

        # 5. 전처리 단계만 복제
        result = None
        if source_pipeline_details.history and len(source_pipeline_details.history) > 0:
            latest_history = source_pipeline_details.history[-1]

            # 전처리 단계가 있는 경우 가장 마지막 단계의 result 추출
            if latest_history.preprocessing_steps and len(latest_history.preprocessing_steps) > 0:
                # 리스트의 마지막 요소의 result (order 순서대로 저장되어 있다고 가정)
                result = latest_history.preprocessing_steps[-1].result
            
            # 전처리 단계만 포함한 새 히스토리 항목 생성
            new_history_item = PipelineHistoryItem(
                preprocessing_steps=latest_history.preprocessing_steps if latest_history.preprocessing_steps else [],
                status=PipelineStatus.CREATED
            )

            new_pipeline.history.append(new_history_item)

        # 7. 새 파이프라인 저장 - 수정된 부분
        new_pipeline_id = await save_new_pipeline(
            db=db,
            new_pipeline=new_pipeline,
            pipeline_id=pipeline_id,
            target_project_id=target_project_id,
            source_pipeline=source_pipeline,  # member_id 대신 source_pipeline
            status=PipelineStatus.CREATED,  # status 매개변수 추가
            pipeline_service=pipeline_service
        )

        data_dict = await pipeline_service.get_latest_dataset_from_pipeline(
            pipeline=source_pipeline_details,
            minio_client=minio_client,
            return_full=True
        )

        # 8. 응답 데이터 준비 (카테고리 정보 포함)
        current_step_data = PreprocessingHandler.create_response(
            pipeline_id=new_pipeline_id,
            result=result, # 전처리 단계 가장 최근 결과
            df=pd.DataFrame(data_dict), # 데이터프레임임
        )

        response_data = await prepare_response_data(
            new_pipeline_id, new_pipeline, target_project_category
        )

        return ApiResponse(
            status_code=200,
            message="파이프라인 전처리 단계가 성공적으로 복제되었습니다.",
            data=jsonable_encoder(replace_nan_values(convert_dict_to_camel_case(response_data | current_step_data), round_decimals=2))
        )

    except Exception as e:
        logger.error(f"파이프라인 전처리 단계 복제 중 오류 발생: {str(e)}")
        return ApiResponse(
            status_code=500,
            message=f"파이프라인 전처리 단계 복제 중 오류가 발생했습니다: {str(e)}",
            data=None
        )


@pipeline_router.post("/fork/total", response_class=ApiResponse)
async def fork_pipeline_total(
        pipeline_id: str = Path(..., description="복제할 파이프라인 ID"),
        member_id: int = Depends(verify_token),
        pipeline_service: PipelineService = Depends(get_pipeline_service),
        minio_client: MinioClient = Depends(get_minio_client),
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
            db, pipeline_id, pipeline_service
        )
        if error_response:
            return error_response

        if not source_pipeline or not source_pipeline_details:
            return CustomAPIException(
                status_code=404,
                message="파이프라인을 찾을 수 없습니다."
            )

        # 2. 최초 파이프라인 정보 조회
        original_project_id, original_project_owner_id = await find_root_pipeline_info(db, pipeline_id)

        # 3. 타겟 프로젝트 결정 (카테고리도 함께 반환)
        target_project_id, target_project_category = await determine_target_project(
            db, source_pipeline, member_id, source_pipeline, original_project_id, original_project_owner_id
        )

        # 4. 새로운 파이프라인 모델 생성
        new_pipeline = await create_new_pipeline_model(target_project_id, member_id, source_pipeline_details)

        # 5. 모든 히스토리 복제
        latest_history = source_pipeline_details.history[-1]

        # 전처리 단계만 포함한 새 히스토리 항목 생성
        new_history_item = PipelineHistoryItem(
            preprocessing_steps=latest_history.preprocessing_steps if latest_history.preprocessing_steps else [],
            modeling_info=latest_history.modeling_info if latest_history.modeling_info else None,
            status=PipelineStatus.PREPROCESSED
        )

        new_pipeline.history.append(new_history_item)

        # 7. 새 파이프라인 저장
        new_pipeline_id = await save_new_pipeline(
            db=db,
            pipeline_id=pipeline_id,
            pipeline_service=pipeline_service,
            target_project_id=target_project_id,
            source_pipeline=source_pipeline,
            new_pipeline=new_pipeline,
            status=PipelineStatus.PREPROCESSED,
        )

        # 8. 응답 데이터 준비 (카테고리 정보 포함)
        response_data = await prepare_response_data(
            new_pipeline_id,
            new_pipeline,
            target_project_category,
            include_all_history=True
        )

        return ApiResponse(
            status_code=200,
            message="파이프라인이 성공적으로 복제되었습니다.",
            data=jsonable_encoder(replace_nan_values(convert_dict_to_camel_case(response_data), round_decimals=2))
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
        last_idx: Optional[int] = Query(None, description="마지막 인덱스 (idx 컬럼이 있는 경우)"),
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
        
        # 사용할 데이터셋 객체명 결정 로직 개선
        bucket_name = "datasets"
        object_name = None
        
        # 1. 히스토리가 있고 비어있지 않은 경우 확인
        if pipeline.history and len(pipeline.history) > 0:
            # 최신 히스토리의 전처리 단계가 있는지 확인
            latest_history = pipeline.history[-1]
            if (latest_history.preprocessing_steps and 
                len(latest_history.preprocessing_steps) > 0):
                # 최신 전처리된 데이터셋 사용
                latest_step = latest_history.preprocessing_steps[-1]
                object_name = latest_step.preprocessed_dataset_object_name
                
        # 2. 전처리된 데이터셋이 없으면 원본 데이터셋 사용
        if not object_name:
            object_name = pipeline.original_dataset_object_name

        # 3. 여전히 객체명이 없으면 오류 반환
        if not object_name:
            return ApiResponse(
                status_code=404,
                message="파이프라인에 연결된 데이터셋 정보가 없습니다."
            )

        logger.info(f"사용할 데이터셋: {bucket_name}/{object_name}")

        # CSV 리더 생성
        csv_reader = ChunkedCSVReader(
            minio_client=minio_client,
            bucket_name=bucket_name,
            object_name=object_name
        )

        # 페이지 크기 검증 및 제한
        if size <= 0:
            size = 10
        elif size > 1000:  # 최대 페이지 크기 제한
            size = 1000

        # 페이지 번호 검증
        if page <= 0:
            page = 1

        # 데이터셋 조회 (필터 조건과 last_idx도 전달)
        result = await csv_reader.query_csv_with_paging(
            page=page,
            page_size=size,
            last_idx=last_idx,
            filter_condition=filter_condition
        )

        # 디버그 정보 출력
        if result['data']:
            logger.info(f"- 첫 번째 행: {result['data'][0]}")
            logger.info(f"- 총 {len(result['data'])}개 행 반환")
        else:
            logger.info("- 반환된 데이터 없음")

        # DatasetPageResponse 모델에 맞는 응답 데이터 구조로 변경
        response_data = {
            "data": result['data'],
            "total": result.get('total', 0),
            "page": result.get('page', page),
            "page_size": result.get('page_size', size),
            "total_pages": result.get('total_pages', 0),
        }

        return ApiResponse(
            status_code=200,
            message="데이터셋 조회 성공",
            data=DatasetPageResponse(**jsonable_encoder(replace_nan_values(response_data, round_decimals=2)))
        )

    except FileNotFoundError as e:
        logger.error(f"파일을 찾을 수 없음: {str(e)}")
        return ApiResponse(
            status_code=404,
            message=f"데이터셋 파일을 찾을 수 없습니다: {str(e)}"
        )
    except Exception as e:
        logger.error(f"데이터셋 조회 중 오류 발생: {str(e)}", exc_info=True)
        return ApiResponse(
            status_code=500,
            message=f"데이터셋 조회 실패: {str(e)}"
        )
    

async def generate_preprocessing_recommendations(safe_result: Dict[str, Any], project_info: Dict[str, Any] = None) -> List[Dict[str, Any]]:
   
    """OpenAI API를 사용하여 전처리 추천을 생성합니다."""
    recommendations=[]
    prompt = f"""
    CSV 파일 분석 결과: {json.dumps(safe_result, ensure_ascii=False)}

    프로젝트 정보: {json.dumps(project_info, ensure_ascii=False) if project_info else "정보 없음"}

    위 데이터를 분석하고 적절한 데이터 전처리 단계를 추천해주세요. 다음 JSON 형식으로 응답해주세요:

    [
      {{
        "active": true,
        "categoryId": "전처리 카테고리 ID",
        "optionId": "옵션 ID",
        "optionName": "옵션 이름",
        "optionDescription": "옵션 설명",
        "order": 숫자(타임스탬프),
        "parameters": {{
          필요한 매개변수들
        }},
        "type": "카테고리 ID와 동일"
      }}
    ]

    사용 가능한 전처리 카테고리와 옵션:
    {json.dumps(PREPROCESSING_CATEGORIES, ensure_ascii=False)}

    참고사항:
    1. 결측치 처리 시 필요한 매개변수: columnId, method, fillValue 등
    2. 이상치 탐지 시 필요한 매개변수: columnId, detection, minThreshold, maxThreshold, outlierIndices 등
    3. 결측치나 이상치 등에 필요한 매개 변수의 값들을 소수점 2자리까지만 나오게 채워주세요.
    4. order는 타임스탬프 형식으로 현재 시간을 밀리초로 변환한 값을 사용하세요.
    5. 위에 응답 형식을 정확하게 지켜주세요.
    6. 추천하는 전처리 순서를 정확하게 지켜서 보내주세요.
    7. 만약 전처리할 필요가 없다면 step 배열안에 null로 보내주세요.
    """

    try:
        logger.info("OpenAI API 호출 시작")
        start = time.time()

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "당신은 데이터 분석 전문가입니다."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=2000
        )
        
        duration = (time.time() - start) * 1000
        logger.info(f"OpenAI 응답 수신 완료 - 소요 시간: {duration:.2f}ms")

        response_text = response.choices[0].message.content

        if not response_text:
            logger.error("GPT 응답이 비어 있습니다! 응답 객체 전체:\n%s", response)
            return []

        logger.info(f"GPT 응답 본문:\n{response_text}")
        try:
            recommendations = parse_openai_response(response_text)
        except Exception :
            logger.error("GPT 응답 파싱 실패, 빈 리스트 반환")
            return []
           
        #recommendations = parse_openai_response(response_text)
        #recommendations = json.loads(response_text)
        logger.info(f"파싱된 전처리 추천 개수: {len(recommendations)}")

        return recommendations

    except Exception as e:
        logger.error("OpenAI API 호출 중 예외 발생", exc_info=True)
        logger.info("기본 추천 로직으로 대체합니다.")
        return generate_default_recommendations(safe_result)

def generate_default_recommendations(safe_result: Dict[str, Any]) -> List[Dict[str, Any]]:
    """기본 전처리 추천을 생성합니다 (API 호출 실패 시)."""
    recommendations = []

    # 결측치 처리
    missing_values = safe_result.get("missing_values", {})
    for col, count in missing_values.items():
        if count > 0 and col in safe_result.get("numeric_columns", []):
            # 결측치가 있는 수치형 열은 평균값으로 대체
            mean_value = safe_result.get("stats", {}).get(col, {}).get("mean", 0)
            recommendations.append({
                "active": True,
                "categoryId": "missing-values",
                "optionId": "mean",
                "optionName": "평균값으로 대체",
                "optionDescription": "결측치를 평균값으로 대체",
                "order": int(time.time() * 1000),
                "parameters": {
                    "columnId": col,
                    "fillValue": mean_value,
                    "method": "MEAN"
                },
                "type": "MISSING-VALUES"
            })

    # 이상치 탐지 (최대 1개 열에 대해)
    for col in safe_result.get("numeric_columns", [])[:1]:
        stats = safe_result.get("stats", {}).get(col, {})
        if stats:
            # Z-점수 기반 이상치 탐지 (임의의 값)
            recommendations.append({
                "active": True,
                "categoryId": "outlier-detection",
                "optionId": "z-score",
                "optionName": "Z-점수 기반 탐지",
                "optionDescription": "Z-점수로 이상치 탐지",
                "order": int(time.time() * 1000) + 1,
                "parameters": {
                    "columnId": col,
                    "detection": "ZSCORE",
                    "minThreshold": -3,
                    "maxThreshold": 3,
                    "method": "ZSCORE",
                    "outlierIndices": []
                },
                "type": "OUTLIER-DETECTION"
            })

    return recommendations

PREPROCESSING_CATEGORIES = {
    "missing-values": {
        "id": "missing-values",
        "name": "결측치 처리",
        "icon": "❓",
        "description": "빠진 데이터를 채우거나 삭제할 수 있습니다.",
        "options": [
            {
                "id": "mean",
                "name": "평균값으로 대체",
                "description": "결측치를 평균값으로 대체",
                "apiEndpoint": "/missing-values/imputation",
                "method": "MEAN"
            },
            {
                "id": "median",
                "name": "중앙값으로 대체",
                "description": "결측치를 중앙값으로 대체",
                "apiEndpoint": "/missing-values/imputation",
                "method": "MEDIAN"
            },
            {
                "id": "mode",
                "name": "최빈값으로 대체",
                "description": "결측치를 최빈값으로 대체",
                "apiEndpoint": "/missing-values/imputation",
                "method": "MODE"
            },
            {
                "id": "drop-rows",
                "name": "결측치가 있는 행 제거",
                "description": "결측치가 있는 행 제거",
                "apiEndpoint": "/missing-values/remove",
                "method": "ROW_REMOVE"
            },
            {
                "id": "drop-columns",
                "name": "결측치가 있는 열 제거",
                "description": "결측치가 있는 열 제거",
                "apiEndpoint": "/missing-values/remove",
                "method": "COL_REMOVE"
            },
        ]
    },
    "outlier-detection": {
        "id": "outlier-detection",
        "name": "이상치 탐지",
        "icon": "🔍",
        "description": "데이터의 이상값을 탐지합니다.",
        "options": [
            {
                "id": "z-score",
                "name": "Z-점수 기반 탐지",
                "description": "Z-점수로 이상치 탐지",
                "apiEndpoint": "/outliers/detection",
                "method": "ZSCORE"
            },
            {
                "id": "iqr",
                "name": "IQR 기반 탐지",
                "description": "IQR로 이상치 탐지",
                "apiEndpoint": "/outliers/detection",
                "method": "IQR"
            },
        ]
    },
    "outlier-handle": {
        "id": "outlier-handle",
        "name": "이상치 처리",
        "icon": "🛠️",
        "description": "탐지된 이상치를 제거하거나 대체합니다.",
        "options": [
            {
                "id": "replace",
                "name": "이상치 대체",
                "description": "이상치를 대체합니다.",
                "apiEndpoint": "/outliers/imputation"
            },
            {
                "id": "remove-rows",
                "name": "행 제거",
                "description": "이상치가 있는 행을 제거합니다.",
                "apiEndpoint": "/outliers/remove",
                "method": "ROW_REMOVE"
            },
            {
                "id": "remove-cols",
                "name": "열 제거",
                "description": "이상치가 있는 열을 제거합니다.",
                "apiEndpoint": "/outliers/remove",
                "method": "COL_REMOVE"
            },
        ]
    },
    "data-transformation": {
        "id": "data-transformation",
        "name": "데이터 변환",
        "icon": "🔁",
        "description": "데이터를 정규화 및 변환합니다.",
        "options": [
            {
                "id": "z-score",
                "name": "Z-점수 정규화",
                "description": "Z-score 정규화 적용",
                "apiEndpoint": "/transform/z-score"
            },
            {
                "id": "min-max",
                "name": "Min-Max 정규화",
                "description": "Min-Max 정규화 적용",
                "apiEndpoint": "/transform/min-max"
            },
            {
                "id": "log",
                "name": "로그 변환",
                "description": "로그 변환 적용",
                "apiEndpoint": "/transform/log"
            },
            {
                "id": "sqrt",
                "name": "제곱근 변환",
                "description": "제곱근 변환 적용",
                "apiEndpoint": "/transform/sqrt"
            },
        ]
    },
    "encoding": {
        "id": "encoding",
        "name": "인코딩",
        "icon": "🧮",
        "description": "범주형 데이터 인코딩",
        "options": [
            {
                "id": "one-hot",
                "name": "원핫 인코딩",
                "description": "One-hot 인코딩",
                "apiEndpoint": "/encoding/one-hot"
            },
            {
                "id": "label",
                "name": "레이블 인코딩",
                "description": "Label 인코딩",
                "apiEndpoint": "/encoding/label"
            },
            {
                "id": "target",
                "name": "타겟 인코딩",
                "description": "Target 인코딩",
                "apiEndpoint": "/encoding/target"
            },
        ]
    },
    "class-balancing": {
        "id": "class-balancing",
        "name": "클래스 불균형 처리",
        "icon": "⚖️",
        "description": "클래스 불균형 문제 해결",
        "options": [
            {
                "id": "over",
                "name": "오버샘플링",
                "description": "Over Sampling 적용",
                "apiEndpoint": "/class-balancing",
                "method": "OVER"
            },
            {
                "id": "under",
                "name": "언더샘플링",
                "description": "Under Sampling 적용",
                "apiEndpoint": "/class-balancing",
                "method": "UNDER"
            },
        ]
    }
}

def parse_openai_response(response_text: str):
    try:
        # 마크다운 블록 제거
        cleaned_text = re.sub(r"^```(?:json)?|```$", "", response_text.strip(), flags=re.MULTILINE).strip()
    
        cleaned_text = re.sub(r"//.*", "", cleaned_text)
        logger.info(f"마크다운 제거 후:\n{cleaned_text}")

        return json.loads(cleaned_text)
    except Exception as e:
        logger.error("GPT 응답 파싱 실패", exc_info=True)
        raise
def clean_for_json(obj):
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(i) for i in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    return obj

def safe_float(val):
    if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
        return None
    return float(val)

def analyze_csv(df: pd.DataFrame) -> Dict[str, Any]:
    """CSV 파일을 분석하여 기본 통계 및 특성을 반환합니다."""
    analysis = {
        "shape": df.shape,
        "columns": list(df.columns),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "missing_values": {col: int(df[col].isna().sum()) for col in df.columns},
        "numeric_columns": list(df.select_dtypes(include=['number']).columns),
        "categorical_columns": list(df.select_dtypes(include=['object', 'category']).columns),
        "datetime_columns": list(df.select_dtypes(include=['datetime']).columns),
        "stats": {}
    }

    # 수치형 열에 대한 기본 통계
    for col in analysis["numeric_columns"]:
        try:
            analysis["stats"][col] = {
                "mean": safe_float(df[col].mean()),
                "median": safe_float(df[col].median()),
                "std": safe_float(df[col].std()),
                "min": safe_float(df[col].min()),
                "max": safe_float(df[col].max()),
                "q1": safe_float(df[col].quantile(0.25)),
                "q3": safe_float(df[col].quantile(0.75))
            }
        except:
            pass

    # 범주형 열에 대한 기본 통계
    for col in analysis["categorical_columns"]:
        try:
            value_counts = df[col].value_counts().to_dict()
            analysis["stats"][col] = {
                "unique_values": len(value_counts),
                "top_values": dict(sorted(value_counts.items(), key=lambda x: x[1], reverse=True)[:5])
            }
        except:
            pass

    return analysis