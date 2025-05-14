import io
from datetime import datetime
import math
import time
from fastapi import APIRouter, Depends, Path, HTTPException, UploadFile, Form, BackgroundTasks, File
from fastapi.encoders import jsonable_encoder
from fastapi.params import Query
from sqlalchemy.orm import Session

from core.api_response import ApiResponse
from core.security import verify_token, verify_pipeline_ownership
from core.storage import get_minio_client, MinioClient
from db.mysql_config import get_mysql_db
from models.preprocessing.preprocessing_request_models import ClassBalancingRequest, TargetEncodingRequest, \
    LabelEncodingRequest, OneHotEncodingRequest, SqrtTransformRequest, LogTransformRequest, MinMaxScalingRequest, \
    ZScoreRequest, MissingValueRemoveRequest, MissingValueImputationRequest
from schemas.mongo.pipeline import PreprocessingStepType, PipelineModel
from schemas.mysql.schemas import PipelineStatus, Pipeline, Project
from service.dataset_service import store_dataset_to_mongodb, analyze_dataset, replace_nan_values
from service.db.pipeline_service import PipelineService, get_pipeline_service
from service.preprocessing.class_balancing_handler import ClassBalancingHandler
from service.preprocessing.encoding_handler import EncodingHandler
from service.preprocessing.missing_value_handler import MissingValueHandler
from typing import Dict, Optional
import pandas as pd
import logging

from service.preprocessing.outlier_handler import OutlierHandler
from service.preprocessing.preprocessing_handler import PreprocessingHandler, get_preprocessing_handler
from service.preprocessing.transform_handler import TransformationHandler
from utils.snake_to_camel import convert_dict_to_camel_case

import numpy as np
import re
import uuid
import aiohttp
import asyncio
from typing import Dict, List, Any, Optional, Tuple, Set
import json
from fastapi.responses import JSONResponse
from openai import OpenAI
from dotenv import load_dotenv
from pydantic import BaseModel
import os
from core.config import get_settings
settings = get_settings()

client = OpenAI(api_key=settings.OPENAI_API_KEY)

logger = logging.getLogger()
router = APIRouter()
logging.basicConfig(level=logging.INFO)

@router.post('/missing-values/remove')
async def remove_missing_values(
    request: MissingValueRemoveRequest,
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    member_id: int = Depends(verify_pipeline_ownership),
    preprocessing_handler: PreprocessingHandler = Depends(get_preprocessing_handler)
):
    """결측치 제거 API"""
    return await preprocessing_handler.process(
        pipeline_id=pipeline_id,
        request=request,
        member_id=member_id,
        preprocessing_type=PreprocessingStepType.MISSING_VALUE_REMOVE,
        handler_class=MissingValueHandler,
        handler_method="handle_missing_values_remove"
    )

@router.post('/missing-values/imputation')
async def imputate_missing_values(
    request: MissingValueImputationRequest,
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    member_id: int = Depends(verify_pipeline_ownership),
    preprocessing_handler: PreprocessingHandler = Depends(get_preprocessing_handler)
):
    """결측치 대체 API"""
    return await preprocessing_handler.process(
        pipeline_id=pipeline_id,
        request=request,
        member_id=member_id,
        preprocessing_type=PreprocessingStepType.MISSING_VALUE_IMPUTATION,
        handler_class=MissingValueHandler,
        handler_method="handle_missing_values_imputation"
    )

@router.post('/outliers/detection')
async def detect_outlier(
    request: LabelEncodingRequest,
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    member_id: int = Depends(verify_pipeline_ownership),
    preprocessing_handler: PreprocessingHandler = Depends(get_preprocessing_handler)
):
    """이상치 탐지 API"""
    return await preprocessing_handler.process(
        pipeline_id=pipeline_id,
        request=request,
        member_id=member_id,
        preprocessing_type=PreprocessingStepType.OUTLIER_DETECTION,
        handler_class=OutlierHandler,
        handler_method="handle_outliers_detection"
    )

@router.post('/outliers/imputation')
async def impute_outlier(
    request: LabelEncodingRequest,
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    member_id: int = Depends(verify_pipeline_ownership),
    preprocessing_handler: PreprocessingHandler = Depends(get_preprocessing_handler)
):
    """이상치 대체 API"""
    return await preprocessing_handler.process(
        pipeline_id=pipeline_id,
        request=request,
        member_id=member_id,
        preprocessing_type=PreprocessingStepType.OUTLIER_IMPUTATION,
        handler_class=OutlierHandler,
        handler_method="handle_outliers_imputation"
    )

@router.post('/outliers/remove')
async def remove_outlier(
    request: LabelEncodingRequest,
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    member_id: int = Depends(verify_pipeline_ownership),
    preprocessing_handler: PreprocessingHandler = Depends(get_preprocessing_handler)
):
    """이상치 제거 API"""
    return await preprocessing_handler.process(
        pipeline_id=pipeline_id,
        request=request,
        member_id=member_id,
        preprocessing_type=PreprocessingStepType.OUTLIER_REMOVE,
        handler_class=OutlierHandler,
        handler_method="handle_outliers_remove"
    )

@router.post('/transform/z-score')
async def scale_zscore(
    request: ZScoreRequest,
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    member_id: int = Depends(verify_pipeline_ownership),
    preprocessing_handler: PreprocessingHandler = Depends(get_preprocessing_handler)
):
    """Z-Score 표준화 API"""
    return await preprocessing_handler.process(
        pipeline_id=pipeline_id,
        request=request,
        member_id=member_id,
        preprocessing_type=PreprocessingStepType.ZSCORE_SCALING,
        handler_class=TransformationHandler,  # 새로운 핸들러 클래스 필요
        handler_method="scale_zscore"
    )

@router.post('/transform/min-max')
async def scale_minmax(
    request: MinMaxScalingRequest,
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    member_id: int = Depends(verify_pipeline_ownership),
    preprocessing_handler: PreprocessingHandler = Depends(get_preprocessing_handler)
):
    """Min-Max 스케일링 API"""
    return await preprocessing_handler.process(
        pipeline_id=pipeline_id,
        request=request,
        member_id=member_id,
        preprocessing_type=PreprocessingStepType.MINMAX_SCALING,
        handler_class=TransformationHandler,
        handler_method="scale_minmax"
    )

@router.post('/transform/log')
async def transform_log(
    request: LogTransformRequest,
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    member_id: int = Depends(verify_pipeline_ownership),
    preprocessing_handler: PreprocessingHandler = Depends(get_preprocessing_handler)
):
    """로그 변환 API"""
    return await preprocessing_handler.process(
        pipeline_id=pipeline_id,
        request=request,
        member_id=member_id,
        preprocessing_type=PreprocessingStepType.LOG_TRANSFORM,
        handler_class=TransformationHandler,
        handler_method="transform_log"
    )

@router.post('/transform/sqrt')
async def transform_sqrt(
    request: SqrtTransformRequest,
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    member_id: int = Depends(verify_pipeline_ownership),
    preprocessing_handler: PreprocessingHandler = Depends(get_preprocessing_handler)
):
    """제곱근 변환 API"""
    return await preprocessing_handler.process(
        pipeline_id=pipeline_id,
        request=request,
        member_id=member_id,
        preprocessing_type=PreprocessingStepType.SQRT_TRANSFORM,
        handler_class=TransformationHandler,
        handler_method="transform_sqrt"
    )

@router.post('/encoding/one-hot')
async def encode_onehot(
    request: OneHotEncodingRequest,
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    member_id: int = Depends(verify_pipeline_ownership),
    preprocessing_handler: PreprocessingHandler = Depends(get_preprocessing_handler)
):
    """원-핫 인코딩 API"""
    return await preprocessing_handler.process(
        pipeline_id=pipeline_id,
        request=request,
        member_id=member_id,
        preprocessing_type=PreprocessingStepType.ONEHOT_ENCODING,
        handler_class=EncodingHandler,  # 새로운 핸들러 클래스 필요
        handler_method="encode_onehot"
    )

@router.post('/encoding/label')
async def encode_label(
    request: LabelEncodingRequest,
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    member_id: int = Depends(verify_pipeline_ownership),
    preprocessing_handler: PreprocessingHandler = Depends(get_preprocessing_handler)
):
    """레이블 인코딩 API"""
    return await preprocessing_handler.process(
        pipeline_id=pipeline_id,
        request=request,
        member_id=member_id,
        preprocessing_type=PreprocessingStepType.LABEL_ENCODING,
        handler_class=EncodingHandler,
        handler_method="encode_label"
    )

@router.post('/encoding/target')
async def encode_target(
    request: TargetEncodingRequest,
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    member_id: int = Depends(verify_token),
    preprocessing_handler: PreprocessingHandler = Depends(get_preprocessing_handler)
):
    """타겟 인코딩 API"""
    return await preprocessing_handler.process(
        pipeline_id=pipeline_id,
        request=request,
        member_id=member_id,
        preprocessing_type=PreprocessingStepType.TARGET_ENCODING,
        handler_class=EncodingHandler,
        handler_method="encode_target"
    )

@router.post('/class-balancing')
async def balance_class(
    request: ClassBalancingRequest,
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    member_id: int = Depends(verify_pipeline_ownership),
    preprocessing_handler: PreprocessingHandler = Depends(get_preprocessing_handler)
):
    """클래스 불균형 처리 API"""
    return await preprocessing_handler.process(
        pipeline_id=pipeline_id,
        request=request,
        member_id=member_id,
        preprocessing_type=PreprocessingStepType.CLASS_BALANCING,
        handler_class=ClassBalancingHandler,  # 새로운 핸들러 클래스 필요
        handler_method="balance_class"
    )

@router.post('/delete', response_class=ApiResponse)
async def delete_preprocessing(
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    step_index: Optional[int] = Query(
        None, 
        alias="stepIndex",
        description="되돌아갈 스텝 인덱스. None이면 마지막 스텝 제거, -1이면 모든 스텝 제거",
        ge=-1
    ),
    member_id: int = Depends(verify_pipeline_ownership),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
    minio_client: MinioClient = Depends(get_minio_client),
):
    """
    전처리 스텝 삭제 API
    
    파이프라인의 전처리 스텝을 제거합니다.
    - step_index가 None인 경우: 가장 최근 스텝 하나를 제거
    - step_index가 -1인 경우: 모든 전처리 스텝을 제거
    - step_index가 0 이상인 경우: 해당 인덱스까지의 스텝만 유지 (이후 스텝들은 제거)
    """
    try:
        # 전처리 스텝 되돌리기/제거
        result = await pipeline_service.revert_to_preprocessing_step(
            pipeline_id=pipeline_id,
            step_index=step_index,
            member_id=member_id,
            add_to_history=True,
            minio_client=minio_client
        )
        
        if result is None:
            raise HTTPException(
                status_code=404, 
                detail="파이프라인을 찾을 수 없거나 처리할 수 없습니다."
            )
        
        return ApiResponse(
            status_code=200,
            message="삭제 성공",
            data=jsonable_encoder(replace_nan_values(convert_dict_to_camel_case(result), round_decimals=2))
        )
    except Exception as e:
        logger.error(f"전처리 스텝 삭제 중 오류 발생: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail="스텝 제거에 실패했습니다.",
        )

@router.post('/complete')
async def complete_preprocessing(
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    member_id: int = Depends(verify_pipeline_ownership),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
    db: Session = Depends(get_mysql_db),
):
    """
    전처리 파이프라인 완료 API
    """
    try:
        # 1. 파이프라인 정보 가져오기
        pipeline:PipelineModel = await pipeline_service.get_pipeline(pipeline_id)
        
        if pipeline is None:
            raise HTTPException(status_code=404, detail="파이프라인을 찾을 수 없습니다")
        
        # 2. 최종 전처리된 데이터셋 object name 확인
        final_dataset_object_name = None
        final_dataset_etag = None
        if pipeline.history and len(pipeline.history) > 0:
            latest_history = pipeline.history[-1]
            if latest_history.preprocessing_steps and len(latest_history.preprocessing_steps) > 0:
                final_dataset_object_name = latest_history.preprocessing_steps[-1].preprocessed_dataset_object_name
                final_dataset_etag = latest_history.preprocessing_steps[-1].preprocessed_dataset_etag
        
        if not final_dataset_object_name:
            final_dataset_object_name = pipeline.original_dataset_object_name
        
        # MinIO 클라이언트 가져오기
        minio_client = get_minio_client()
        bucket_name = "datasets"
        
        # 3. 최종 데이터셋 데이터 가져오기
        logger.info(f"required object name : {final_dataset_object_name}")
        minio_output = minio_client.get_file(bucket_name, final_dataset_object_name)
        minio_metadata = minio_client.get_metadata(bucket_name, final_dataset_object_name)
        encoding = minio_metadata.get("metadata").get("X-Amz-Meta-Encoding")
        if not minio_output:
            raise HTTPException(status_code=404, detail="최종 데이터셋을 찾을 수 없습니다")

        # 데이터프레임으로 변환
        file_content = minio_output
        buffer = io.BytesIO(file_content)

        # 파일 크기 먼저 구하기 (버퍼를 닫기 전에)
        buffer.seek(0, io.SEEK_END)  # 파일 끝으로 이동
        file_size = buffer.tell()    # 현재 위치(파일 크기) 가져오기
        buffer.seek(0)               # 파일 처음으로 다시 이동

        # 타입 추론
        df = pd.read_csv(buffer, encoding=encoding)
        columns = df.columns.tolist()  # 데이터프레임의 컬럼명 리스트 가져오기
        logger.info(df.head)

        # 데이터 타입 추론
        inferred_columns = []
        for col in columns:
            # 해당 열에 NaN 값이 있는지 확인
            has_nan = df[col].isna().any()

            # 데이터 타입 추론 로직

            # 기본값 설정
            inferred_type = "string"

            if len(df[col]) > 0:
                is_datetime = False

                # 문자열인 경우만 날짜 확인 시도

                if df[col].dtype == 'object':  # 문자열 컬럼인 경우
                    try:
                        # 모든 값을 날짜로 변환 시도
                        parsed_dates = df[col].apply(lambda x: pd.to_datetime(x, errors='coerce'))
                        # 모든 값이 성공적으로 날짜로 변환되었는지 확인
                        is_datetime = parsed_dates.notna().all()
                    except (ValueError, TypeError) as e:
                        is_datetime = False
                if is_datetime:
                    inferred_type = "datetime"
                # 숫자 형식 확인
                elif pd.api.types.is_numeric_dtype(df[col]):
                    # NaN이 있으면서 정수 같은 값들이라면 float으로 처리
                    if has_nan and all(df[col].apply(lambda x: x.is_integer() if isinstance(x, float) else True)):
                        inferred_type = "double"
                    # NaN이 없고 모든 값이 정수처럼 보이면 integer
                    elif not has_nan and all(
                            df[col].apply(lambda x: x.is_integer() if isinstance(x, float) else True)):
                        inferred_type = "integer"
                    else:
                        inferred_type = "double"
                # 불리언 값 확인
                elif all(df[col].isin([True, False, "True", "False", "true", "false", 0, 1])):
                    inferred_type = "boolean"

            inferred_columns.append({"name": col, "type": inferred_type})

        config = {
            "delimiter": "comma",
            "customDelimiter": None,
            "encoding":  encoding,
            "hasHeader": True,
            "columns": inferred_columns  # 추론된 컬럼 정보로 업데이트
        }

        project = db.query(Project).filter(Project.project_id == pipeline.project_id).first()

        # 버퍼 위치를 처음으로 되돌림
        buffer.seek(0)
        
        # 5. 전처리된 데이터셋 메타데이터 추출 및 저장
        dataset_analysis = await analyze_dataset(buffer, config)

        # MongoDB에 전처리된 데이터셋 저장
        dataset_id: str = await store_dataset_to_mongodb(
            project_id=pipeline.project_id,
            member_id=member_id,
            etag=final_dataset_etag,
            dataset_analysis=dataset_analysis,
            config=config,
            file_size=file_size,  # 미리 구한 파일 크기 사용
            object_name=final_dataset_object_name,
            sample_data = dataset_analysis["data_sample"]["data"][:10] if dataset_analysis.get("data_sample") and "data" in dataset_analysis["data_sample"] else [],
            category = project.category,
            domain = project.domain,
            is_preprocessed=True,
        )
 
        # 파이프라인 업데이트
        updated_pipeline = await pipeline_service.update_pipeline_status(
            pipeline_id=pipeline_id,
            new_status=PipelineStatus.PREPROCESSED,
            project_id=pipeline.project_id,
            member_id=member_id,
            preprocessed_dataset_id=dataset_id
        )

        if not updated_pipeline:
            raise HTTPException(status_code=500, detail="파이프라인 업데이트 실패")

        # MYSQL 완료된 파이프라인 생성
        pipeline:Pipeline | None = db.query(Pipeline).filter(Pipeline.pipeline_id == pipeline_id).first()
        if not pipeline:
            logger.error(f"파이프라인 ID {pipeline_id}에 해당하는 레코드를 찾을 수 없습니다.")
            raise HTTPException(status_code=404, detail="해당하는 파이프라인을 찾을 수 없습니다.")

        # 파이프라인 상태 업데이트
        pipeline.data_count = len(dataset_analysis["data_sample"]["data"]) if dataset_analysis.get("data_sample") and "data" in dataset_analysis["data_sample"] else 0
        pipeline.status = PipelineStatus.PREPROCESSED
        pipeline.modified_at = datetime.now()
        
        # 변경사항 커밋
        db.commit()
        db.refresh(pipeline)
        
        # 응답 데이터 구성
        response = {
            "status": 200,
            "message": "전처리 완료",
            "data": {
                "pipelineId": pipeline_id,
                "category": project.category,
                "columns": inferred_columns,
            }
        }

        return response

    except Exception as e:
        logger.error(f"전처리 완료 처리 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail=f"전처리 완료 처리 중 오류 발생: {str(e)}")


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

# 캐시 저장소
csv_analysis_cache = {}

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

async def generate_preprocessing_recommendations(csv_analysis: Dict[str, Any], project_info: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """OpenAI API를 사용하여 전처리 추천을 생성합니다."""

    prompt = f"""
    CSV 파일 분석 결과: {json.dumps(csv_analysis, ensure_ascii=False)}

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
            raise ValueError("GPT 응답이 비어 있음")

        logger.info(f"GPT 응답 본문:\n{response_text}")
        recommendations = parse_openai_response(response_text)
        #recommendations = json.loads(response_text)
        logger.info(f"파싱된 전처리 추천 개수: {len(recommendations)}")

        return recommendations

    except Exception as e:
        logger.error("OpenAI API 호출 중 예외 발생", exc_info=True)
        logger.info("기본 추천 로직으로 대체합니다.")
        return generate_default_recommendations(csv_analysis)

def generate_default_recommendations(csv_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
    """기본 전처리 추천을 생성합니다 (API 호출 실패 시)."""
    recommendations = []

    # 결측치 처리
    missing_values = csv_analysis.get("missing_values", {})
    for col, count in missing_values.items():
        if count > 0 and col in csv_analysis.get("numeric_columns", []):
            # 결측치가 있는 수치형 열은 평균값으로 대체
            mean_value = csv_analysis.get("stats", {}).get(col, {}).get("mean", 0)
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
    for col in csv_analysis.get("numeric_columns", [])[:1]:
        stats = csv_analysis.get("stats", {}).get(col, {})
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


class ProjectInfo(BaseModel):
    project_name: str
    project_description: Optional[str] = None
    target_column: Optional[str] = None
    task_type: Optional[str] = None
    additional_info: Optional[Dict[str, Any]] = None

@router.post("/analyze/csv")
async def analyze_csv_endpoint(
    file: UploadFile = File(...),
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    background_tasks: BackgroundTasks = None
):
    """CSV 파일 분석 엔드포인트"""
    logger.info("csv 파일 분석 시작")
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        analysis_result = analyze_csv(df)
        analysis_result = clean_for_json(analysis_result)  

        file_id = str(uuid.uuid4())
        csv_analysis_cache[file_id] = analysis_result

        return {
            "status": "success",
            "message": "CSV 파일 분석 완료",
            "file_id": file_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV 분석 중 오류 발생: {str(e)}")

@router.post("/recommend/{file_id:str}/preprocessing")
async def recommend_preprocessing(
    file_id: str = Path(...),
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    project_info: Optional[str] = Form(None)
):
    """전처리 추천 엔드포인트"""
    try:
        # 캐시에서 CSV 분석 결과 가져오기
        if file_id not in csv_analysis_cache:
            raise HTTPException(status_code=404, detail="분석된 CSV 파일을 찾을 수 없습니다")

        csv_analysis = csv_analysis_cache[file_id]

        # 프로젝트 정보 파싱
        project_data = json.loads(project_info) if project_info else None

        # 전처리 추천 생성
        recommendations = await generate_preprocessing_recommendations(csv_analysis, project_data)

        return { "step": recommendations }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"전처리 추천 중 오류 발생: {str(e)}")