import io
from datetime import datetime

from fastapi import APIRouter, Depends, Path, HTTPException
from sqlalchemy.orm import Session

from core.security import verify_token
from core.storage import get_minio_client
from db.mysql_config import get_mysql_db
from models.preprocessing.missing_value_models import MissingValueImputationRequest, ImputationResultDetail, \
    MissingValueImputationResponse
from schemas.mongo.pipeline import PreprocessingStep, PreprocessingStepType, PipelineHistoryItem
from schemas.mysql.schemas import PipelineStatus, Pipeline
from service.dataset_service import store_dataset_to_mongodb, analyze_dataset
from service.db.pipeline_cache_service import PipelineCacheService, get_pipeline_cache_service
from service.preprocessing.missing_value_handler import MissingValueHandler
import pandas as pd
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
async def remove_missing_values(
        request: MissingValueImputationRequest,
        pipeline_id: str = Path(..., description="파이프라인 ID"),
        member_id: int = Depends(verify_token),
        pipeline_cache_service: PipelineCacheService = Depends(get_pipeline_cache_service)
    ):
    """
    결측치 제거거 API 응답 시뮬레이션
    
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
    2. 결측치 행 제거
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
        raise HTTPException(status_code=404, detail="파이프라인을 찾을 수 없습니다.")

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

    # MinIO 클라이언트 가져오기
    minio_client = get_minio_client()
    bucket_name = "datasets"

    # 결측치 처리
    minio_output = await minio_client.get_object_by_etag(bucket_name, dataset_etag)
    logger.info(f" minio 호출 결과 : {minio_output['data']}")
    data_io = io.BytesIO(minio_output["data"])
    handler = MissingValueHandler(data_io)
    result = handler.handle_missing_values(column=request.column, method=request.method)
    data_io.close()
    logger.info(f"result: {result}")
    df = result["data"]
    
    # MinIO에 저장할 객체 경로 생성
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    object_name = f"pipeline_{pipeline_id}_{timestamp}/dataset.csv"
    buffer = io.BytesIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)  # 버퍼의 포인터를 처음으로 되돌림

    # MinIO에 저장하고 etag 받기
    etag = await minio_client.save_object_with_etag(
        bucket_name=bucket_name,
        object_name=object_name,
        data=buffer,
        content_type="text/csv"
    )
    buffer.close()

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
            preprocessed_dataset_etag=etag,
            preprocessed_dataset_object_name=object_name
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
            preprocessed_dataset_etag=etag,
            preprocessed_dataset_object_name=object_name
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

@router.post('/missing-values/imputation')
async def imputate_missing_values(
        request: MissingValueImputationRequest,
        pipeline_id: str = Path(..., description="파이프라인 ID"),
        member_id: int = Depends(verify_token),
        pipeline_cache_service: PipelineCacheService = Depends(get_pipeline_cache_service),
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

    # 히스토리에서 찾지 못했으면 원본 데이터셋 ID 사용
    if not dataset_etag:
        dataset_etag = pipeline.original_dataset_etag
    
    logger.info(f"original dataset etag: {dataset_etag}")
    if not dataset_etag:
        raise HTTPException(status_code=404, detail="Dataset ID not found in pipeline")

    # MinIO 클라이언트 가져오기
    minio_client = get_minio_client()
    bucket_name = "datasets"

    # 결측치 처리
    minio_output = await minio_client.get_object_by_etag(bucket_name, dataset_etag)
    logger.info(f" minio 호출 결과 : {minio_output['data']}")
    # 결측치 처리
    minio_output = await minio_client.get_object_by_etag(bucket_name, dataset_etag)
    logger.info(f" minio 호출 결과 : {minio_output['data']}")

    data_io = io.BytesIO(minio_output["data"])
    handler = MissingValueHandler(data_io)
    result = handler.handle_missing_values(column=request.column, method=request.method)
    data_io.close()
    logger.info(f"result: {result}")
    df = result["data"]
    
    # MinIO에 저장할 객체 경로 생성
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    object_name = f"pipeline_{pipeline_id}_{timestamp}/dataset.csv"
    buffer = io.BytesIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)  # 버퍼의 포인터를 처음으로 되돌림

    # MinIO에 저장하고 etag 받기
    etag = await minio_client.save_object_with_etag(
        bucket_name=bucket_name,
        object_name=object_name,
        data=buffer,
        content_type="text/csv"
    )
    buffer.close()
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
            preprocessed_dataset_etag=etag,
            preprocessed_dataset_object_name=object_name
        )
        # history가 비어 있는 경우, 새로운 history 항목 생성
        history_item = PipelineHistoryItem(
            preprocessing_steps=[step]
        )
    else:
        # 기존 히스토리가 있는 경우
        step = PreprocessingStep(
            type=PreprocessingStepType.MISSING_VALUE,
            parameters={
                "column": request.column,
                "method": request.method
            },
            order=pipeline.history[-1].preprocessing_steps[-1].order+1,
            active=True,
            preprocessed_dataset_etag=etag,
            preprocessed_dataset_object_name=object_name
        )
        
        # 새로운 PipelineHistoryItem 객체 생성 (기존 단계들 복사 + 새 단계 추가)
        new_steps = pipeline.history[-1].preprocessing_steps.copy()
        new_steps.append(step)
        
        history_item = PipelineHistoryItem(
            preprocessing_steps=new_steps
        )

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

@router.post('/complete')
async def complete_preprocessing(
    pipeline_id: str = Path(..., description="파이프라인 ID"),
    member_id: int = Depends(verify_token),
    pipeline_cache_service: PipelineCacheService = Depends(get_pipeline_cache_service),
    db: Session = Depends(get_mysql_db),
):
    """
    전처리 파이프라인 완료 API
    
    Parameters:
    -----------
    pipeline_id : str
        파이프라인 ID
    
    로직:
    1. 현재까지의 파이프라인 기록을 Redis/MongoDB에서 가져옴
    2. 최종 전처리된 데이터셋 ETag 확인
    3. pipeline model 업데이트 (status, preprocessed_dataset)
    4. 전처리된 데이터셋 메타데이터 추출 후 datasets 컬렉션에 저장
        
    Returns:
    --------
    dict
        API 응답 형식의 결과
    """
    try:
        # 1. 파이프라인 정보 가져오기
        pipeline = await pipeline_cache_service.get_pipeline(pipeline_id)
        
        if pipeline is None:
            raise HTTPException(status_code=404, detail="파이프라인을 찾을 수 없습니다")
        
        # 2. 최종 전처리된 데이터셋 ETag 확인
        final_dataset_etag = None
        
        if pipeline.history and len(pipeline.history) > 0:
            latest_history = pipeline.history[-1]
            if latest_history.preprocessing_steps and len(latest_history.preprocessing_steps) > 0:
                final_dataset_etag = latest_history.preprocessing_steps[-1].preprocessed_dataset_etag
        
        if not final_dataset_etag:
            raise HTTPException(status_code=400, detail="전처리된 데이터셋이 없습니다")
        
        # MinIO 클라이언트 가져오기
        minio_client = get_minio_client()
        bucket_name = "datasets"
        
        # 3. 최종 데이터셋 데이터 가져오기
        logger.info(f"required etag : {final_dataset_etag}")
        minio_output = await minio_client.get_object_by_etag(bucket_name, final_dataset_etag)
        if not minio_output or not minio_output.get("data"):
            raise HTTPException(status_code=404, detail="최종 데이터셋을 찾을 수 없습니다")

        # 데이터프레임으로 변환
        file_content = minio_output.get("data")
        buffer = io.BytesIO(file_content)
        
        updated_pipeline = await pipeline_cache_service.update_pipeline_status(
            pipeline_id=pipeline_id,
            new_status=PipelineStatus.PREPROCESSED,
            project_id=pipeline.project_id,
            member_id=member_id
        )
        
        if not updated_pipeline:
            raise HTTPException(status_code=500, detail="파이프라인 업데이트 실패")

        # 타입 추론
        buffer.seek(0)
        df = pd.read_csv(buffer)
        columns = df.columns.tolist()  # 데이터프레임의 컬럼명 리스트 가져오기
        logger.info(df.head)

        # 데이터 타입 추론
        inferred_columns = []
        for col in columns:
            # 해당 열에 NaN 값이 있는지 확인
            has_nan = df[col].isna().any()

            # 데이터 타입 추론 로직
            sample_data = df[col].dropna().iloc[:10] if len(df[col].dropna()) > 0 else []

            # 기본값 설정
            inferred_type = "string"

            if len(sample_data) > 0:
                # 날짜 형식 확인 - try-except 대신 더 명시적인 방법 사용
                first_val = sample_data.iloc[0]
                is_datetime = False

                # 문자열인 경우만 날짜 확인 시도
                if isinstance(first_val, str):
                    # 일반적인 날짜 패턴을 정규식으로 확인하거나
                    # 또는 pd.to_datetime의 errors='coerce' 사용해서 변환 성공 여부 확인
                    date_attempt = pd.to_datetime(first_val, errors='coerce')
                    is_datetime = not pd.isna(date_attempt)

                if is_datetime:
                    inferred_type = "datetime"
                # 숫자 형식 확인
                elif pd.api.types.is_numeric_dtype(sample_data):
                    # NaN이 있으면서 정수 같은 값들이라면 float으로 처리
                    if has_nan and all(sample_data.apply(lambda x: x.is_integer() if isinstance(x, float) else True)):
                        inferred_type = "double"
                    # NaN이 없고 모든 값이 정수처럼 보이면 integer
                    elif not has_nan and all(
                            sample_data.apply(lambda x: x.is_integer() if isinstance(x, float) else True)):
                        inferred_type = "integer"
                    else:
                        inferred_type = "double"
                # 불리언 값 확인
                elif all(sample_data.isin([True, False, "True", "False", "true", "false", 0, 1])):
                    inferred_type = "boolean"

            inferred_columns.append({"name": col, "type": inferred_type})

        config = {
            "delimiter": "comma",
            "customDelimiter": None,  
            "encoding": "UTF-8", 
            "hasHeader": True,
            "columns": inferred_columns  # 추론된 컬럼 정보로 업데이트
        }
        
        # 5. 전처리된 데이터셋 메타데이터 추출 및 저장
        dataset_analysis = await analyze_dataset(buffer, config)
        # MongoDB에 전처리된 데이터셋 저장
        buffer.close()
        await store_dataset_to_mongodb(
            project_id=pipeline.project_id,
            member_id=member_id,
            file_name=minio_output.get("object_name"),
            etag=final_dataset_etag,
            dataset_analysis=dataset_analysis,
            config=config,
            file_size=minio_output.get("size"),
            object_name=minio_output.get("object_name"),
        )

        # MYSQL 완료된 파이프라인 생성
        pipeline = db.query(Pipeline).filter(Pipeline.pipeline_id == pipeline_id).first()
        if not pipeline:
            logger.error(f"파이프라인 ID {pipeline_id}에 해당하는 레코드를 찾을 수 없습니다.")
            raise HTTPException(status_code=404, detail="해당하는 파이프라인을 찾을 수 없습니다.")

            # 파이프라인 상태 업데이트
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
                "columns": inferred_columns,
            }
        }
        
        return response
        
    except Exception as e:
        logger.error(f"전처리 완료 처리 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail=f"전처리 완료 처리 중 오류 발생: {str(e)}")