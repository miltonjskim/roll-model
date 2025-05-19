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
from typing import Dict, List, Any, Optional, Union
from openai import OpenAI, project
import pandas as pd
import re
import math

from utils.execution_time_checker import execution_time

from core.exception import CustomAPIException
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

from service.pipeline_fork_service import get_source_pipeline, determine_target_project, \
    create_new_pipeline_model
from service.preprocessing.preprocessing_handler import PreprocessingHandler
from utils.snake_to_camel import convert_dict_to_camel_case
from core.config import get_settings
settings = get_settings()

logger = logging.getLogger()
router = APIRouter()
sample_router = APIRouter()
pipeline_router = APIRouter()

@router.post("/dataset", response_class=ApiResponse)
@execution_time
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

        result["originalDatasets"]["data"] = result["originalDatasets"]["data"][:30]
        # NaN, INF 수동 인코딩
        safe_result = jsonable_encoder(replace_nan_values(result, round_decimals=2))
    
        # 응답 구성
        return ApiResponse(
            data={"result":safe_result},
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

@pipeline_router.get("/reload/preprocess", response_class=ApiResponse)
async def reload_preprocess_pipeline(
    pipeline_id: str = Path(..., description="파이프라인 ID"),                     
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
        pipeline = db.query(Pipeline)\
            .filter(Pipeline.pipeline_id == pipeline_id)\
            .filter(Pipeline.deleted_yn == False)\
            .first()
        project = db.query(Project)\
            .filter(Project.project_id == pipeline.project_id)\
            .filter(Project.deleted_yn == False)\
            .first()
                
        if not pipeline:
            return ApiResponse(
                status_code =404,
                message="프로젝트에 파이프라인이 존재하지 않습니다.",
                data=None
            )
        
        # MongoDB에서 파이프라인 상세 정보 조회
        pipeline_id = pipeline.pipeline_id
        pipeline_details:PipelineModel | None = await pipeline_service.get_pipeline(pipeline_id, pipeline.project_id, member_id)
        
        if not pipeline_details:
            return ApiResponse(
                status_code =404,
                message="파이프라인 상세 정보를 찾을 수 없습니다.",
                data=None
            )
        
        # 5. 전처리 단계만 리로드
        result = None
        if pipeline_details.history and len(pipeline_details.history) > 0:
            latest_history = pipeline_details.history[-1]

            # 전처리 단계가 있는 경우 가장 마지막 단계의 result 추출
            if latest_history.preprocessing_steps and len(latest_history.preprocessing_steps) > 0:
                # 리스트의 마지막 요소의 result (order 순서대로 저장되어 있다고 가정)
                result = latest_history.preprocessing_steps[-1].result
            
        data_dict = await pipeline_service.get_latest_dataset_from_pipeline(
            pipeline=pipeline_details,
            minio_client=minio_client,
            return_full=True
        )

        # 8. 응답 데이터 준비 (카테고리 정보 포함)
        current_step_data = PreprocessingHandler.create_response(
            pipeline_id=pipeline_id,
            result=result, # 전처리 단계 가장 최근 결과
            df=pd.DataFrame(data_dict), # 데이터프레임임
        )
        del current_step_data['data']['result']

        response_data = await prepare_response_data(
            new_pipeline_id=pipeline_id, 
            new_pipeline=pipeline_details, 
            category=project.category, 
            include_all_history=False
        )
        columns = await pipeline_service.get_latest_dataset_columns(pipeline_details)
        response_data["columns"] = columns
        return ApiResponse(
            status_code=200,
            message="파이프라인 전처리 단계가 성공적으로 리로드되었습니다.",
            data=jsonable_encoder(replace_nan_values(convert_dict_to_camel_case(response_data | current_step_data['data']), round_decimals=2))
        )
    
    except Exception as e:
        logger.error(f"워크스페이스 조회 중 오류 발생: {str(e)}")
        return ApiResponse(
            status_code=500,
            message=f"워크스페이스 조회 중 오류가 발생했습니다: {str(e)}",
            data=None
        )
    
@pipeline_router.get("/reload/total", response_class=ApiResponse)
async def reload_modeling_pipeline(
    pipeline_id: str = Path(..., description="파이프라인 ID"),                       
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
        pipeline = db.query(Pipeline)\
            .filter(Pipeline.pipeline_id == pipeline_id)\
            .filter(Pipeline.deleted_yn == False)\
            .first()
        project = db.query(Project)\
            .filter(Project.project_id == pipeline.project_id)\
            .filter(Project.deleted_yn == False)\
            .first()
                
        if not pipeline:
            return ApiResponse(
                status_code =404,
                message="프로젝트에 파이프라인이 존재하지 않습니다.",
                data=None
            )
        
        # MongoDB에서 파이프라인 상세 정보 조회
        pipeline_id = pipeline.pipeline_id
        pipeline_details:PipelineModel | None = await pipeline_service.get_pipeline(pipeline_id)
        
        if not pipeline_details:
            return ApiResponse(
                status_code =404,
                message="파이프라인 상세 정보를 찾을 수 없습니다.",
                data=None
            )
        
        # 5. 모델링 단계 리로드
        response_data = await prepare_response_data(
            pipeline_id,
            pipeline_details,
            project.category,
            include_all_history=True
        )

        columns = await pipeline_service.get_latest_dataset_columns(pipeline_details)
        response_data["columns"] = columns
        return ApiResponse(
            status_code=200,
            message="파이프라인 모델링 단계가 성공적으로 리로드되었습니다.",
            data=jsonable_encoder(replace_nan_values(convert_dict_to_camel_case(response_data), round_decimals=2))
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

        # 2. 원본 프로젝트 정보 조회
        original_project:Project = db.query(Project) \
        .filter(Project.project_id == source_pipeline.project_id) \
        .filter(Pipeline.deleted_yn == False) \
        .first()

        # 3. 타겟 프로젝트 결정 (카테고리도 함께 반환)
        target_project: Project = await determine_target_project(
            db=db, 
            member_id=member_id, 
            source_pipeline=source_pipeline, 
            original_project=original_project,
            source_pipeline_detail=source_pipeline_details
        )

        # 4. 새로운 파이프라인 모델 생성
        new_pipeline = await create_new_pipeline_model(target_project.project_id, member_id, source_pipeline_details)

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
            target_project_id=target_project.project_id,
            source_pipeline=source_pipeline,  # member_id 대신 source_pipeline
            status=PipelineStatus.CREATED,  # status 매개변수 추가
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
            new_pipeline_id=new_pipeline_id, 
            new_pipeline=new_pipeline, 
            category=target_project.category, 
            include_all_history=False
        )
        columns = await pipeline_service.get_latest_dataset_columns(source_pipeline_details)
        response_data["columns"] = columns

        return ApiResponse(
            status_code=200,
            message="파이프라인 전처리 단계가 성공적으로 복제되었습니다.",
            data=jsonable_encoder(replace_nan_values(convert_dict_to_camel_case(response_data | current_step_data["data"]), round_decimals=2))
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

        # 2. 원본 프로젝트 정보 조회
        original_project:Project = db.query(Project) \
        .filter(Project.project_id == source_pipeline.project_id) \
        .filter(Pipeline.deleted_yn == False) \
        .first()

        # 3. 타겟 프로젝트 결정 (카테고리도 함께 반환)
        target_project: Project = await determine_target_project(
            db=db, 
            member_id=member_id, 
            source_pipeline=source_pipeline, 
            original_project=original_project,
            source_pipeline_detail=source_pipeline_details
        )

        # 4. 새로운 파이프라인 모델 생성
        new_pipeline = await create_new_pipeline_model(target_project.project_id, member_id, source_pipeline_details)

        # 5. 모든 히스토리 복제
        latest_history = source_pipeline_details.history[-1]

        # 전체체 포함한 새 히스토리 항목 생성
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
            target_project_id=target_project.project_id,
            source_pipeline=source_pipeline,
            new_pipeline=new_pipeline,
            status=PipelineStatus.PREPROCESSED,
        )

        # 8. 응답 데이터 준비 (카테고리 정보 포함)
        response_data = await prepare_response_data(
            new_pipeline_id,
            new_pipeline,
            target_project.category,
            include_all_history=True
        )

        columns = await pipeline_service.get_latest_dataset_columns(new_pipeline)
        response_data["columns"] = columns

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
