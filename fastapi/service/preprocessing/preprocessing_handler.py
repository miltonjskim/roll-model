from datetime import datetime
from fastapi import Depends
from fastapi.encoders import jsonable_encoder
from pandas import DataFrame

from core.exception import CustomAPIException
from core.storage import get_minio_client
from schemas.mongo.pipeline import PipelineHistoryItem, PreprocessingStep
import logging
import io

from service.dataset_service import replace_nan_values
from service.db.pipeline_service import PipelineService, get_pipeline_service
from utils.snake_to_camel import convert_dict_to_camel_case


class PreprocessingHandler:
    """전처리 작업을 위한 공통 핸들러 클래스"""

    def __init__(self, pipeline_service, minio_client):
        self.pipeline_service = pipeline_service
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
        if df is None:
            raise CustomAPIException(status_code=500, message="처리된 데이터가 없습니다")
        print(f"인코딩: {encoding}")
        object_name, etag = await self._save_to_minio(pipeline_id, df, encoding)

        # 6. 파이프라인 히스토리 업데이트
        await self._update_pipeline_history(pipeline, preprocessing_type, request, result, etag, object_name)

        # 7. 응답 생성
        response = self._create_response(pipeline_id, result, df.to_dict(orient="records"))

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
            self.logger.error(f"MinIO 데이터 조회 실패: {str(e)}")
            raise CustomAPIException(status_code=500, message=f"데이터 조회 실패: {str(e)}")

    async def _save_to_minio(self, pipeline_id, df, encoding):
        """처리된 데이터를 MinIO에 저장"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        object_name = f"pipeline_{pipeline_id}/dataset_{timestamp}.csv"

        buffer = io.BytesIO()
        if df.columns[0] != "idx":
            df.to_csv(buffer, index=True, index_label='idx', encoding=encoding)
        else:
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
            self.logger.info(f"MinIO 저장 성공: {object_name}, etag: {etag}")
            return object_name, etag
        except Exception as e:
            self.logger.error(f"MinIO 저장 실패: {str(e)}")
            raise CustomAPIException(status_code=500, message=f"데이터 저장 실패: {str(e)}")

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

    def _create_response(self, pipeline_id, result, dataset):
        """결과 응답 생성"""
        # 각 전처리 방법별로 다른 응답 형식이 필요할 수 있음
        # 기본 응답 구조
        response = {
            "data": {
                "pipelineId": pipeline_id,
                "result": convert_dict_to_camel_case(result),  # result 구조에 따라 조정
                "dataset": dataset[:30]  # 전처리된 데이터셋을 여기에 추가
            }
        }
        return jsonable_encoder(replace_nan_values(response, round_decimals=2))

# 공통 의존성 함수
def get_preprocessing_handler(
    pipeline_service: PipelineService = Depends(get_pipeline_service),
    minio_client = Depends(get_minio_client)
) -> PreprocessingHandler:
    return PreprocessingHandler(pipeline_service, minio_client)