import io
from datetime import datetime

from fastapi import APIRouter, Depends, Path, HTTPException
from core.security import verify_token
from core.storage import get_minio_client
from models.preprocessing.missing_value_models import MissingValueImputationRequest, ImputationResultDetail, \
    MissingValueImputationResponse
from schemas.mongo.pipeline import PreprocessingStep, PreprocessingStepType, PipelineHistoryItem
from service.db.pipeline_cache_service import PipelineCacheService, get_pipeline_cache_service
from service.preprocessing.missing_value_handler import MissingValueHandler
from db.redis_config import get_redis
from bson import ObjectId
import logging

logger = logging.getLogger()
router = APIRouter()

@router.post('/outliers/remove')
def remove_outliers(member_id: int = Depends(verify_token)):
    logger.info(f"Member ID: {member_id}")

    return "Outliers Removed"

@router.post('/outliers/imputation')
def imputate_outliers(
        pipeline_id: int = Path(..., description="파이프라인 ID"),                   
        member_id: int = Depends(verify_token)
    ):
    '''
    
    column : str
        처리할 컬럼 이름
    method : str
        탐지 방법 ('iqr', 'zscore')
    treatment : str
        처리 방법 ('cap', 'remove', 'mean', 'median')
    '''
    return "Transform outliers"

@router.post('/missing-values/remove')
def remove_missing_values(
        pipeline_id: int = Path(..., description="파이프라인 ID"),
        member_id: int = Depends(verify_token)
    ):
    return "Missing values removed"

@router.post('/missing-values/imputation')
async def imputate_missing_values(
        request: MissingValueImputationRequest,
        pipeline_id: str = Path(..., description="파이프라인 ID"),
        member_id: int = Depends(verify_token),
        pipeline_cache_service: PipelineCacheService = Depends(get_pipeline_cache_service)
    ):
    """
    결측치 처리 API 응답 시뮬레이션
    
    Parameters:
    -----------
    pipeline_id : int
        파이프라인 ID
    -> 파이프라인에서 데이터셋 경로 찾기 -> 
    column : str
        처리할 컬럼 이름
    method : str
        대체 방법 ('mean', 'median', 'mode')

    로직
    1. 데이터셋 to dataframe
    2. 결측치 처리 + 바뀐 행 정보 보관
    3. 결과 redis 저장 
    4. 결과 반환
        
    Returns:
    --------
    dict
        API 응답 형식의 결과
    """

    pipeline = await pipeline_cache_service.get_pipeline(pipeline_id)
    logger.info(f"pipeline_id: {pipeline_id} \n pipeline_content: {pipeline}")
    # 데이터셋 ObjectId 찾기
    dataset_etag = None

    if pipeline is None:
        raise HTTPException(status_code=404, detail="<UNK> <UNK> <UNK>")

    # 히스토리가 있고, 가장 최근 히스토리에 preprocessed_dataset_etag가 있는지 확인
    if pipeline.history and len(pipeline.history) > 0:
        latest_history = pipeline.history[-1]
        dataset_etag = latest_history.preprocessing_steps[-1].preprocessed_dataset_etag
    logger.info(f"pipeline_id: {dataset_etag}")

    # 히스토리에서 찾지 못했으면 원본 데이터셋 ID 사용
    if not dataset_etag:
        dataset_etag = pipeline.original_dataset_etag
    
    if not dataset_etag:
        raise HTTPException(status_code=404, detail="Dataset ID not found in pipeline")

    # 데이터셋 조회
    # dataset = await dataset_collection.find_one({"_id": dataset_etag})
    #
    # if not dataset:
    #     raise HTTPException(status_code=404, detail=f"Dataset with ID {dataset_etag} not found")
    #
    # # 데이터셋 파일 경로 추출
    # dataset_file_path = dataset.get("dataset_file_path")

    # MinIO 클라이언트 가져오기
    minio_client = get_minio_client()
    bucket_name = "datasets"

    # 결측치 처리
    minio_output = await minio_client.get_object_by_etag(bucket_name, dataset_etag)
    logger.info(f" minio 호출 결과 : {minio_output['data']}")
    handler = MissingValueHandler(minio_output["data"])
    result = handler.handle_missing_values(column=request.column, method=request.method)
    logger.info(f"result: {result}")
    df = result["data"]
    
    buffer = io.BytesIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)  # 버퍼의 포인터를 처음으로 되돌림

    # MinIO에 저장할 객체 경로 생성
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    object_name = f"pipeline_{pipeline_id}_{timestamp}/dataset.csv"
    
    # MinIO에 저장하고 etag 받기
    etag = await minio_client.save_object_with_etag(
        bucket_name=bucket_name,
        object_name=object_name,
        data=buffer,
        content_type="text/csv"
    )
    # 결과 redis 저장
    logger.info(f"etag : {etag}")
    # pipeline.history 확인 및 처리
    if not pipeline.history:
        step = PreprocessingStep(
            type=PreprocessingStepType.MISSING_VALUE,
            parameters={
                "column": request.column,
                "method": request.method
            },
            order=1,
            active=True,
            preprocessed_dataset_etag=etag
        )
        # history가 비어 있는 경우, 새로운 history 항목 생성
        history_item = PipelineHistoryItem(
            preprocessing_steps=[step]
        )
    else:
        # 둘 다 존재하는 경우, 기존 steps에 추가
        step = PreprocessingStep(
            type=PreprocessingStepType.MISSING_VALUE,
            parameters={
                "column": request.column,
                "method": request.method
            },
            order=pipeline.history[-1].preprocessing_steps[-1].order+1,
            active=True,
            preprocessed_dataset_etag=etag
        )
        history_item = pipeline.history[-1].preprocessing_steps.copy()
        history_item.append(step)

    # 새 history 항목을 리스트에 추가
    await pipeline_cache_service.add_pipeline_history(pipeline, history_item)
    imputation_detail = ImputationResultDetail(
        column=result["column"],
        method=result["method"],
        fill_value=result["fill_value"],
        changed_indices=result["changed_indices"],
        original_rows=result["original_rows"],
        changed_rows=result["changed_rows"],
        timestamp=result["timestamp"]
    )
    response = MissingValueImputationResponse(
        pipeline_id=1,  
        success=True,  # Set based on your operation success
        original_missing_count=len(result["changed_indices"]),  # Count of missing values before imputation
        imputed_count=len(result["changed_indices"]),  # Count of successfully imputed values
        result=imputation_detail
    )

    return response