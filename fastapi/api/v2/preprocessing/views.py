import io
from datetime import datetime
import json
from xml.sax import handler
from fastapi import APIRouter, BackgroundTasks, Depends, Path, HTTPException, UploadFile, background
from fastapi.encoders import jsonable_encoder
from fastapi.params import Query
from starlette.datastructures import Headers
from sqlalchemy.orm import Session

from core.api_response import ApiResponse
from core.security import verify_token, verify_pipeline_ownership
from core.storage import get_minio_client, MinioClient
from db.mysql_config import get_mysql_db
from models.preprocessing.preprocessing_request_models import ClassBalancingRequest, ColumnDropRequest, ColumnKeepRequest, OutlierDetectionRequest, OutlierImputationRequest, OutlierRemoveRequest, PreprocessPipelineRequest, TargetEncodingRequest, \
    LabelEncodingRequest, OneHotEncodingRequest, SqrtTransformRequest, LogTransformRequest, MinMaxScalingRequest, \
    ZScoreRequest, MissingValueRemoveRequest, MissingValueImputationRequest
from schemas.mongo.pipeline import PreprocessingStepType, PipelineModel
from schemas.mysql.schemas import PipelineStatus, Pipeline, Project
from service.column_type_inferer import process_columns_with_inference
from service.dataset_service import calculate_and_update_statistics, store_dataset_to_mongodb, analyze_dataset, replace_nan_values, upload_dataset_and_save_metadata
from service.db.pipeline_service import PipelineService, get_pipeline_service
from service.preprocessing.class_balancing_handler import ClassBalancingHandler
from service.preprocessing.column_handler import ColumnHandler
from service.preprocessing.encoding_handler import EncodingHandler
from service.preprocessing.missing_value_handler import MissingValueHandler
from typing import Annotated, Any, Dict, List, Optional
import pandas as pd
import logging

from service.preprocessing.outlier_handler import OutlierHandler
from service.preprocessing.preprocessing_handler import PreprocessingHandler, get_preprocessing_handler
from service.preprocessing.transform_handler import TransformationHandler
from utils.execution_time_checker import execution_time
from utils.snake_to_camel import convert_dict_to_camel_case
from typing import Optional
from openai import OpenAI
from core.config import get_settings
settings = get_settings()

client = OpenAI(api_key=settings.OPENAI_API_KEY)

logger = logging.getLogger()
router = APIRouter()

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
    request: OutlierDetectionRequest,
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
    request: OutlierImputationRequest,
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
    request: OutlierRemoveRequest,
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

@router.post('/column/drop')
async def drop_columns(
    request: ColumnDropRequest,
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    member_id: int = Depends(verify_pipeline_ownership),
    preprocessing_handler: PreprocessingHandler = Depends(get_preprocessing_handler)
):
    """컬럼 제거 API"""
    return await preprocessing_handler.process(
        pipeline_id=pipeline_id,
        request=request,
        member_id=member_id,
        preprocessing_type=PreprocessingStepType.COLUMN_DROP,
        handler_class=ColumnHandler,  # 새로운 핸들러 클래스 필요
        handler_method="remove_columns"
    )

@router.post('/column/keep')
async def keep_columns(
    request: ColumnKeepRequest,
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    member_id: int = Depends(verify_pipeline_ownership),
    preprocessing_handler: PreprocessingHandler = Depends(get_preprocessing_handler)
):
    """컬럼 유지 API"""
    return await preprocessing_handler.process(
        pipeline_id=pipeline_id,
        request=request,
        member_id=member_id,
        preprocessing_type=PreprocessingStepType.COLUMN_KEEP,
        handler_class=ColumnHandler,  # 새로운 핸들러 클래스 필요
        handler_method="keep_columns"
    )

@router.post('/delete', response_class=ApiResponse)
async def delete_preprocessing(
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    step_index: Annotated[Optional[int], Query(
        alias="stepIndex",
        description="되돌아갈 스텝 인덱스. None이면 마지막 스텝 제거, -1이면 모든 스텝 제거",
        ge=-1
    )] = None,
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
            data=jsonable_encoder(replace_nan_values(convert_dict_to_camel_case(result, exclude_keys=["dataset"]), round_decimals=2))
        )
    except Exception as e:
        logger.error(f"전처리 스텝 삭제 중 오류 발생: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail="스텝 제거에 실패했습니다.",
        )

@router.post('/complete')
@execution_time
async def complete_preprocessing(
    background_tasks: BackgroundTasks,
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
        pipelineModel:PipelineModel | None = await pipeline_service.get_pipeline(pipeline_id)
        
        if pipelineModel is None:
            raise HTTPException(status_code=404, detail="파이프라인을 찾을 수 없습니다")
        
        # 2. 최종 전처리된 데이터셋 object name 확인
        final_dataset_object_name = None
        final_dataset_etag = None
        if pipelineModel.history and len(pipelineModel.history) > 0:
            latest_history = pipelineModel.history[-1]
            if latest_history.preprocessing_steps and len(latest_history.preprocessing_steps) > 0:
                final_dataset_object_name = latest_history.preprocessing_steps[-1].preprocessed_dataset_object_name
                final_dataset_etag = latest_history.preprocessing_steps[-1].preprocessed_dataset_etag
        
        if not final_dataset_object_name:
            final_dataset_object_name = pipelineModel.original_dataset_object_name
        
        # MinIO 클라이언트 가져오기
        minio_client = get_minio_client()
        bucket_name = "datasets"
        
        # 3. 최종 데이터셋 데이터 가져오기
        logger.info(f"required object name : {final_dataset_object_name}")
        minio_output = minio_client.get_file(bucket_name, final_dataset_object_name)
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
        df = pd.read_csv(buffer, encoding="utf-8")
        logger.info(f"Original dataframe shape: {df.shape}")
        logger.info(df.head())

        # 최적화된 컬럼 타입 추론 및 필터링
        df_filtered, inferred_columns, valid_columns = process_columns_with_inference(
            df, 
            exclude_types=["string", "datetime"],
            sample_size=1000
        )
        
        if df_filtered.empty:
            raise HTTPException(status_code=400, detail="유효한 컬럼이 없습니다.")
        
        logger.info(f"총 {len(df.columns)}개 컬럼 중 {len(valid_columns)}개 컬럼 유지")
        logger.info(f"제거된 컬럼: {len(df.columns) - len(valid_columns)}개")

        config = {
            "delimiter": "comma",
            "customDelimiter": None,
            "encoding":  "UTF-8",
            "hasHeader": True,
            "columns": inferred_columns  # 정리된 컬럼 정보
        }
        project = db.query(Project).filter(Project.project_id == pipelineModel.project_id).first()

        # 수정된 데이터프레임을 다시 CSV로 변환하여 buffer에 저장
        updated_buffer = io.BytesIO()
        logger.info(f"Updated dataframe shape: {df_filtered.columns}")
        df_filtered.to_csv(updated_buffer, index=False, encoding='utf-8')
        
        final_dataset_etag = await minio_client.save_object_with_etag(
            bucket_name="datasets",
            object_name=final_dataset_object_name,
            data=updated_buffer,
            content_type="text/csv",
            encoding="utf-8",
        )
        # 5. 전처리된 데이터셋 메타데이터 추출 및 저장
        dataset_analysis = await analyze_dataset(updated_buffer, config)

        # MongoDB에 전처리된 데이터셋 저장
        dataset_id: str = await store_dataset_to_mongodb(
            project_id=pipelineModel.project_id,
            member_id=member_id,
            etag=final_dataset_etag,
            dataset_analysis=dataset_analysis,
            config=config,
            file_size=len(updated_buffer.getvalue()),  # 수정된 파일 크기 사용
            object_name=final_dataset_object_name,
            sample_data = dataset_analysis["data_sample"]["data"][:30] if dataset_analysis.get("data_sample") and "data" in dataset_analysis["data_sample"] else [],
            category = project.category,
            domain = project.domain,
            is_preprocessed=True,
        )
 
        # 파이프라인 업데이트
        updated_pipeline = await pipeline_service.update_pipeline_status(
            pipeline_id=pipeline_id,
            new_status=PipelineStatus.PREPROCESSED,
            project_id=pipelineModel.project_id,
            member_id=member_id,
            preprocessed_dataset_id=dataset_id,
            
        )

        if not updated_pipeline:
            raise HTTPException(status_code=500, detail="파이프라인 업데이트 실패")

        # MYSQL 완료된 파이프라인 생성
        pipeline:Pipeline | None = db.query(Pipeline).filter(Pipeline.pipeline_id == pipeline_id).first()
        if not pipeline:
            logger.error(f"파이프라인 ID {pipeline_id}에 해당하는 레코드를 찾을 수 없습니다.")
            raise HTTPException(status_code=404, detail="해당하는 파이프라인을 찾을 수 없습니다.")

        # 파이프라인 상태 업데이트
        pipeline.data_count = len(dataset_analysis["data_sample"]["data"]) if dataset_analysis["data_sample"] and "data" in dataset_analysis["data_sample"] else 0
        pipeline.status = PipelineStatus.PREPROCESSED
        pipeline.modified_at = datetime.now()
                
        # 변경사항 커밋
        db.commit()
        db.refresh(pipeline)
        
        background_tasks.add_task(
            calculate_and_update_statistics,
            dataset_id=dataset_id,
            data=dataset_analysis["data_sample"]["data"],
            columns=inferred_columns,
        )

        # 응답 데이터 구성
        response = {
            "status": 200,
            "message": "전처리 완료",
            "data": {
                "pipelineId": pipeline_id,
                "category": project.category,
                "columns": inferred_columns,
                "dataset": dataset_analysis["data_sample"]["data"][:30]
            }
        }
        return jsonable_encoder(replace_nan_values(convert_dict_to_camel_case(response, exclude_keys=["dataset"]), round_decimals=2))

    except Exception as e:
        logger.error(f"전처리 완료 처리 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail=f"전처리 완료 처리 중 오류 발생: {str(e)}")





@router.post("/batch")
async def perform_batch_preprocessing(
    pipeline_id: str,
    request: PreprocessPipelineRequest,
    member_id: int = Depends(verify_pipeline_ownership),
    preprocessing_handler: PreprocessingHandler = Depends(get_preprocessing_handler)
):
    """여러 전처리 작업을 파이프라인으로 한번에 실행"""
    
    # 전처리 작업 목록 준비
    tasks = []
    
    # 요청에서 전처리 단계 파싱하여 객체로 변환
    parsed_steps = request.get_parsed_steps()
    
    # 파싱된 단계 객체 처리
    for step in parsed_steps:
        # 요청 객체의 클래스 유형에 따라 적절한 핸들러 결정
        handler_config = get_handler_config_by_request_type(step)
        
        tasks.append({
            'type': handler_config['preprocessing_type'],
            'handler_class': handler_config['handler_class'],
            'handler_method': handler_config['handler_method'],
            'request': step
        })
    
    # 파이프라인 전처리 실행
    result = await preprocessing_handler.process_pipeline(
        pipeline_id=pipeline_id,
        preprocessing_tasks=tasks,
        member_id=member_id
    )
    
    return result

def get_handler_config_by_request_type(request):
    """요청 객체 타입에 따라 적절한 핸들러 구성 반환"""
    
    # 이 함수는 요청 객체의 클래스 유형에 따라 적절한 핸들러를 반환
    if isinstance(request, MissingValueRemoveRequest):
        return {
            'preprocessing_type': 'MISSING_VALUE_REMOVE',
            'handler_class': MissingValueHandler,
            'handler_method': 'handle_missing_values_remove'
        }
    elif isinstance(request, MissingValueImputationRequest):
        return {
            'preprocessing_type': 'MISSING_VALUE_IMPUTATION',
            'handler_class': MissingValueHandler,
            'handler_method': 'handle_missing_values_imputation'
        }
    elif isinstance(request, OutlierRemoveRequest):
        return {
            'preprocessing_type': 'OUTLIER_REMOVE',
            'handler_class': OutlierHandler,
            'handler_method': 'handle_outliers_remove'
        }
    elif isinstance(request, OutlierImputationRequest):
        return {
            'preprocessing_type': 'OUTLIER_IMPUTATION',
            'handler_class': OutlierHandler,
            'handler_method': 'handle_outliers_imputation'
        }
    elif isinstance(request, OutlierDetectionRequest):
        return {
            'preprocessing_type': 'OUTLIER_DETECTION',
            'handler_class': OutlierHandler,
            'handler_method': 'handle_outliers_detection'
        }
    elif isinstance(request, ZScoreRequest):
        return {
            'preprocessing_type': 'ZSCORE_SCALING',
            'handler_class': TransformationHandler,
            'handler_method': 'scale_zscore'
        }
    elif isinstance(request, MinMaxScalingRequest):
        return {
            'preprocessing_type': 'MINMAX_SCALING',
            'handler_class': TransformationHandler,
            'handler_method': 'scale_minmax'
        }
    elif isinstance(request, LogTransformRequest):
        return {
            'preprocessing_type': 'LOG_TRANSFORM',
            'handler_class': TransformationHandler,
            'handler_method': 'transform_log'
        }
    elif isinstance(request, SqrtTransformRequest):
        return {
            'preprocessing_type': 'SQRT_TRANSFORM',
            'handler_class': TransformationHandler,
            'handler_method': 'transform_sqrt'
        }
    elif isinstance(request, OneHotEncodingRequest):
        return {
            'preprocessing_type': 'ONEHOT_ENCODING',
            'handler_class': EncodingHandler,
            'handler_method': 'encode_onehot'
        }
    elif isinstance(request, LabelEncodingRequest):
        return {
            'preprocessing_type': 'LABEL_ENCODING',
            'handler_class': EncodingHandler,
            'handler_method': 'encode_label'
        }
    elif isinstance(request, TargetEncodingRequest):
        return {
            'preprocessing_type': 'TARGET_ENCODING',
            'handler_class': EncodingHandler,
            'handler_method': 'encode_target'
        }
    elif isinstance(request, ClassBalancingRequest):
        return {
            'preprocessing_type': 'CLASS_BALANCING',
            'handler_class': ClassBalancingHandler,
            'handler_method': 'balance_class'
        }
    elif isinstance(request, ColumnDropRequest):
        return {
            'preprocessing_type': 'COLUMN_DROP',
            'handler_class': ColumnHandler,
            'handler_method': 'remove_columns'
        }
    elif isinstance(request, ColumnKeepRequest):
        return {
            'preprocessing_type': 'COLUMN_KEEP',
            'handler_class': ColumnHandler,
            'handler_method': 'keep_columns'
        }
    else:
        raise ValueError(f"지원하지 않는 전처리 요청 유형: {type(request)}")