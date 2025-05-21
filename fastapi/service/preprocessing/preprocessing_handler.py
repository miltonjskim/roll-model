from datetime import datetime
from fastapi import Depends
from fastapi.encoders import jsonable_encoder
from pandas import DataFrame
import pandas as pd
import logging
from core.exception import CustomAPIException
from core.storage import get_minio_client
from schemas.mongo.pipeline import PipelineHistoryItem, PreprocessingStep
import logging
import io

from service.dataset_service import replace_nan_values
from service.db.pipeline_service import PipelineService, get_pipeline_service

logger = logging.getLogger()

class PreprocessingHandler:
    """전처리 작업을 위한 공통 핸들러 클래스"""

    def __init__(self, pipeline_service, minio_client):
        self.pipeline_service:PipelineService = pipeline_service
        self.minio_client = minio_client
        self.bucket_name = "datasets"
        self.logger = logging.getLogger(self.__class__.__name__)

    async def process(self, pipeline_id, request, member_id, preprocessing_type, handler_class, handler_method,
                      handler_args=None):
        """
        공통 전처리 로직을 처리하는 메서드

        Parameters:
        -----------
        pipeline_id : str
            파이프라인 ID
        request : BaseModel
            요청 데이터 (Pydantic 모델)
        member_id : int
            멤버 ID
        preprocessing_type : PreprocessingStepType
            전처리 단계 유형
        handler_class : class
            전처리 핸들러 클래스 (MissingValueHandler, OutlierHandler 등)
        handler_method : str
            호출할 핸들러 메서드 이름
        handler_args : dict, optional
            핸들러 메서드에 전달할 추가 인자

        Returns:
        --------
        dict
            API 응답
        """
        # 1. 파이프라인 정보 조회
        pipeline = await self.pipeline_service.get_pipeline(pipeline_id)
        
        if pipeline is None:
            raise CustomAPIException(status_code=404, message="파이프라인을 찾을 수 없습니다")

        # 2. 데이터셋 ObjectId 찾기
        dataset_object_name = self._get_dataset_object_name(pipeline)

        # 3. MinIO에서 데이터 가져오기
        minio_output, encoding = await self._get_data_from_minio(dataset_object_name)
        
        encoding = "utf-8"

        # 4. 전처리 작업 수행
        data_io = io.BytesIO(minio_output)
        handler = handler_class(data_io, encoding="utf-8")

        # request 객체에서 필요한 인자 추출
        method_args = {k: getattr(request, k) for k in request.__fields__.keys() if hasattr(request, k)}
        if handler_args:
            method_args.update(handler_args)

        # 핸들러 메서드 호출
        handler_method_func = getattr(handler, handler_method)
        result = handler_method_func(**method_args)

        # 5. 처리된 데이터 MinIO에 저장
        df: DataFrame = handler.df if hasattr(handler, "df") else result.get("data")
        if df is None or df.empty:
            raise CustomAPIException(status_code=500, message="처리된 데이터가 없습니다")

        object_name, etag = await self._save_to_minio(pipeline_id, df, encoding)

        result = jsonable_encoder(replace_nan_values(result, round_decimals=2))
        # 6. 파이프라인 히스토리 업데이트
        await self._update_pipeline_history(pipeline, preprocessing_type, request, result, etag, object_name)

        # 7. 응답 생성
        response = PreprocessingHandler.create_response(pipeline_id, result, df)

        return response

    def _get_dataset_object_name(self, pipeline):
        """파이프라인에서 데이터셋 객체 이름 추출"""
        dataset_object_name = None

        # 히스토리가 있으면 가장 최근 히스토리의 데이터셋 사용
        if pipeline.history and len(pipeline.history) > 0:
            latest_history = pipeline.history[-1]
            if not latest_history.preprocessing_steps or len(latest_history.preprocessing_steps) == 0:
                dataset_object_name = None
            else:
                dataset_object_name = latest_history.preprocessing_steps[-1].preprocessed_dataset_object_name

        # 히스토리에서 찾지 못했으면 원본 데이터셋 ID 사용
        if not dataset_object_name:
            dataset_object_name = pipeline.original_dataset_object_name

        self.logger.info(f"dataset_object_name: {dataset_object_name}")

        if not dataset_object_name:
            raise CustomAPIException(status_code=404, message="데이터셋 객체 이름을 찾을 수 없습니다")

        return dataset_object_name

    async def _get_data_from_minio(self, object_name):
        """MinIO에서 데이터 가져오기"""
        try:
            minio_output = self.minio_client.get_file(self.bucket_name, object_name)
            minio_metadata = self.minio_client.get_metadata(self.bucket_name, object_name)
            encoding = minio_metadata.get("metadata").get("X-Amz-Meta-Encoding")
            self.logger.info(f"MinIO 데이터 조회 성공: {len(minio_output)} bytes")
            return minio_output, encoding
        except Exception as e:
            self.logger.error(f"MinIO 데이터 조회 실패")
            raise CustomAPIException(status_code=500, message=f"데이터 조회 실패")

    async def _save_to_minio(self, pipeline_id, df, encoding):
        """처리된 데이터를 MinIO에 저장"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        object_name = f"pipeline_{pipeline_id}/dataset_{timestamp}.csv"

        buffer = io.BytesIO()   
        df.to_csv(buffer, index=False, encoding=encoding)
        buffer.seek(0)


        try:
            etag = await self.minio_client.save_object_with_etag(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=buffer,
                content_type="text/csv",
                encoding=encoding
            )
            return object_name, etag
        except Exception as e:
            self.logger.error(f"MinIO 저장 실패")
            raise CustomAPIException(status_code=500, message=f"데이터 저장 실패")

    async def _update_pipeline_history(self, pipeline, preprocessing_type, request, result, etag, object_name):
        """파이프라인 히스토리 업데이트"""
        # 파라미터 준비
        parameters = {k: getattr(request, k) for k in request.__fields__.keys() if hasattr(request, k)}

        if not pipeline.history:
            # 히스토리가 없는 경우
            step = PreprocessingStep(
                type=preprocessing_type,
                parameters=parameters,
                order=1,
                active=True,
                result=result,
                preprocessed_dataset_etag=etag,
                preprocessed_dataset_object_name=object_name
            )
            history_item = PipelineHistoryItem(preprocessing_steps=[step])
        else:
            # 기존 히스토리가 있는 경우
            new_steps = pipeline.history[-1].preprocessing_steps.copy()
            step = PreprocessingStep(
                type=preprocessing_type,
                parameters=parameters,
                order=len(new_steps) + 1,
                active=True,
                result=result,
                preprocessed_dataset_etag=etag,
                preprocessed_dataset_object_name=object_name
            )
            new_steps.append(step)
            history_item = PipelineHistoryItem(preprocessing_steps=new_steps)

        await self.pipeline_service.add_pipeline_history(pipeline, history_item)
        self.logger.info(f"파이프라인 히스토리 업데이트 성공: {preprocessing_type}")

    @staticmethod
    def get_dataset_summary(df: DataFrame):
        """데이터셋 요약 정보 생성"""
        # 데이터셋 요약 정보 생성 로직
        # 예시: 데이터셋의 컬럼 수, 행 수, 결측치 비율 등

        total_rows = len(df)
        total_columns = len(df.columns)

        missing_columns = []
        missing_details = {}

        for col in df.columns:
            missing_count = df[col].isna().sum()
            if missing_count > 0:
                missing_percentage = round((missing_count / total_rows) * 100, 2)
                # 모든 결측치 행 인덱스 가져오기 (제한 없음)
                missing_indices = df[df[col].isna()].index.tolist()

                missing_columns.append(col)
                missing_details[col] = {
                    "count": int(missing_count),
                    "percentage": missing_percentage,
                    "rowIndices": missing_indices
                }

        return {
            "total_rows": total_rows,
            "total_columns": total_columns,
            "missing_values": {
                "columns": missing_columns,
                "details": missing_details
            }
        }

    @staticmethod
    def create_response(pipeline_id, result, df):
        """결과 응답 생성"""
        # 각 전처리 방법별로 다른 응답 형식이 필요할 수 있음
        # 7. 데이터셋 요약 정보 생성
        page_size = 30
        start_point = result.get("startPoint", 0) if result is not None else 0
        if result is not None:
            result.pop("startPoint", None)  # startPoint는 응답에서 제거
        aligned_start = (start_point // page_size) * page_size
        # 데이터셋 요약 정보 생성
        dataset_summary = PreprocessingHandler.get_dataset_summary(df)
        # 현재 페이지에 해당하는 부분 추출
        aligned_df = df.iloc[aligned_start:aligned_start + page_size].copy()

        # aligned_start에 맞춰 인덱스 추가
        aligned_df.index = range(aligned_start, aligned_start + len(aligned_df))
        aligned_df = aligned_df.reset_index().rename(columns={'index': 'idx'})
        
        # dict로 변환
        dataset = aligned_df.to_dict(orient="records")
        # 기본 응답 구조
        response = {
            "data": {
                "pipelineId": pipeline_id,
                "result": result,  # result 구조에 따라 조정
                "dataset": dataset,
                "total": len(dataset),
                "page": (aligned_start // page_size) + 1,
                "pageSize": page_size,
                "totalPages": (len(dataset) + page_size - 1) // page_size,
                "startPoint": aligned_start,
                "summary": dataset_summary
            }
        }
        return jsonable_encoder(replace_nan_values(response, round_decimals=2))

    # 전처리 파이프라인 메서드
    async def process_pipeline(self, pipeline_id, preprocessing_tasks, member_id):
        """
        여러 전처리 작업을 파이프라인으로 순차 실행하는 메서드

        Parameters:
        -----------
        pipeline_id : str
            파이프라인 ID
        preprocessing_tasks : list
            전처리 작업 목록. 각 항목은 다음 구조를 가짐:
            {
                'type': PreprocessingStepType,
                'handler_class': class,
                'handler_method': str,
                'request': BaseModel,
                'handler_args': dict (optional)
            }
        member_id : int
            멤버 ID

        Returns:
        --------
        dict
            최종 API 응답
        """
        # 1. 파이프라인 정보 조회
        pipeline = await self.pipeline_service.get_pipeline(pipeline_id)
        
        if pipeline is None:
            raise CustomAPIException(status_code=404, message="파이프라인을 찾을 수 없습니다")

        # 2. 데이터셋 ObjectId 찾기
        dataset_object_name = self._get_dataset_object_name(pipeline)

        # 3. MinIO에서 초기 데이터 가져오기
        minio_output, encoding = await self._get_data_from_minio(dataset_object_name)
        encoding = encoding or "utf-8"

        # 4. 메모리 내에서 단계별 전처리 작업 수행
        current_df = pd.read_csv(io.BytesIO(minio_output), encoding=encoding)
        all_results = []
        history_steps = []
        
        # 현재 파이프라인 히스토리의 마지막 단계 순서 가져오기
        last_order = 0

        if pipeline.history and len(pipeline.history) > 0 and pipeline.history[-1].preprocessing_steps:
            last_order = len(pipeline.history[-1].preprocessing_steps)

        # 각 전처리 작업 순차 실행
        preprocessing_type = None
        for i, task in enumerate(preprocessing_tasks):
            try:
                # 전처리 핸들러 초기화 (데이터프레임 직접 전달)
                handler_class = task['handler_class']
                handler_method = task['handler_method']
                request = task['request']
                preprocessing_type = task['type']
                handler_args = task.get('handler_args', {})
                # 핸들러 인스턴스 생성
                handler = handler_class(df=current_df)
                
                # 요청 매개변수 추출
                method_args = {k: getattr(request, k) for k in request.__fields__.keys() if hasattr(request, k)}
                if handler_args:
                    method_args.update(handler_args)
                
                # 핸들러 메서드 호출
                handler_method_func = getattr(handler, handler_method)
                result = handler_method_func(**method_args)
                
                # 처리된 데이터프레임 가져오기
                current_df = handler.df
                
                # 결과 저장
                all_results.append({
                    "type": preprocessing_type,
                    "result": result
                })
                
                # 히스토리 단계 준비
                step_order = last_order + i + 1
                history_steps.append({
                    "type": preprocessing_type,
                    "parameters": method_args,
                    "order": step_order,
                    "active": True,
                    "result": result,
                    # etag와 object_name은 최종 단계에서만 설정
                })
                
            except Exception as e:
                self.logger.error(f"전처리 작업 실패 (단계 {i+1}:{preprocessing_type}):{str(e)}")
                raise CustomAPIException(
                    status_code=500, 
                    error_code="BATCH_1",
                    message=f"전처리 작업 실패 단계:{i+1}:{preprocessing_type}:{str(e)}"
                )
                
        # 5. 최종 처리된 데이터 MinIO에 저장
        if current_df is None or current_df.empty:
            raise CustomAPIException(status_code=500, message="처리된 데이터가 없습니다")
            
        object_name, etag = await self._save_to_minio(pipeline_id, current_df, encoding)
        
        # 히스토리 단계에 etag와 object_name 설정 (마지막 단계에만)
        if history_steps:
            history_steps[-1]["preprocessed_dataset_etag"] = etag
            history_steps[-1]["preprocessed_dataset_object_name"] = object_name
            
        # 6. 파이프라인 히스토리 업데이트
        await self._update_pipeline_history_batch(pipeline, history_steps)
        
        # 7. 응답 생성 (마지막 전처리 결과 기준)
        final_result = all_results[-1]["result"] if all_results else None
        response = PreprocessingHandler.create_response(pipeline_id, final_result, current_df)
        
        return response
        
    async def _update_pipeline_history_batch(self, pipeline, history_steps):
        """여러 전처리 단계를 한 번에 파이프라인 히스토리에 추가"""
        if not pipeline.history:
            # 히스토리가 없는 경우
            preprocessingSteps = [
                PreprocessingStep(**step) for step in history_steps
            ]
            history_item = PipelineHistoryItem(preprocessing_steps=preprocessingSteps)
        else:
            # 기존 히스토리가 있는 경우
            new_steps = pipeline.history[-1].preprocessing_steps.copy()
            for step in history_steps:
                new_steps.append(PreprocessingStep(**step))
            history_item = PipelineHistoryItem(preprocessing_steps=new_steps)

        await self.pipeline_service.add_pipeline_history(pipeline, history_item)
        self.logger.info(f"파이프라인 히스토리 배치 업데이트 성공: {len(history_steps)} 단계")

# 공통 의존성 함수
def get_preprocessing_handler(
    pipeline_service: PipelineService = Depends(get_pipeline_service),
    minio_client = Depends(get_minio_client)
) -> PreprocessingHandler:
    return PreprocessingHandler(pipeline_service, minio_client)