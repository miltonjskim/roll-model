import stat
from typing import Dict, Any, List, Optional, Coroutine
from datetime import datetime
from bson import ObjectId

from core.api_response import ApiResponse
from core.storage import MinioClient
from db.mongo_config import get_pipeline_collection, get_dataset_collection
from models.preprocessing.client_preprocess_step_label import client_preprocess_step_label_mapper
from schemas.mongo.dataset import DatasetModel, DatasetColumn
from schemas.mongo.pipeline import PipelineModel, PipelineHistoryItem, PipelineStatus, PyObjectId

import logging
import pandas as pd
import io

logger = logging.getLogger()
async def _update_pipeline_in_db(pipeline: PipelineModel) -> Optional[PipelineModel]:
    """데이터베이스에서 파이프라인을 업데이트합니다."""
    try:
        # MongoDB 컬렉션 가져오기
        pipeline_collection = get_pipeline_collection()

        # PipelineModel 객체를 dictionary로 변환 (id 필드 제외)
        pipeline_dict = pipeline.model_dump(exclude={"id"}, by_alias=True)

        # 수정 시간 업데이트
        pipeline_dict["modified_at"] = datetime.now()

        # MongoDB 업데이트 수행
        result = await pipeline_collection.update_one(
            {"_id": pipeline.id},
            {"$set": pipeline_dict}
        )

        # 업데이트 성공 여부 확인
        if result.modified_count > 0 or result.matched_count > 0:
            # 업데이트 성공 시 업데이트된 파이프라인 반환
            updated_pipeline = await pipeline_collection.find_one({"_id": pipeline.id})
            if updated_pipeline:
                return PipelineModel.model_validate(updated_pipeline)

        # 업데이트 실패 시 None 반환
        return None

    except Exception as e:
        # 예외 처리 및 로깅
        print(f"Error updating pipeline in DB: {e}")
        return None


async def _fetch_pipeline_from_db(pipeline_id: str, project_id: int = None, member_id: int = None) -> \
Optional[PipelineModel]:
    """데이터베이스에서 파이프라인을 조회합니다."""
    try:
        # MongoDB 컬렉션 가져오기
        pipeline_collection = get_pipeline_collection()

        # ObjectId로 변환
        pipeline_object_id = ObjectId(pipeline_id) if not isinstance(pipeline_id, ObjectId) else pipeline_id
        logger.info(f"파이프라인 ObjectId: {pipeline_object_id}")
        # 기본 쿼리는 ID만으로 구성
        query = {"_id": pipeline_object_id}
        logger.info(f"파이프라인 쿼리: {query}")
        # 추가 필터가 있는 경우 쿼리에 추가
        if project_id is not None:
            query["project_id"] = project_id
        if member_id is not None:
            query["member_id"] = member_id
        logger.info(f"파이프라인 쿼리 (추가 필터 포함): {query}")
        # MongoDB에서 파이프라인 조회
        pipeline_data = await pipeline_collection.find_one(query)
        # 조회 결과가 있으면 PipelineModel로 변환하여 반환
        if pipeline_data:
            return PipelineModel.model_validate(pipeline_data)

        # 조회 결과가 없으면 None 반환
        return None

    except Exception as e:
        # 예외 처리 및 로깅
        print(f"Error fetching pipeline from DB: {e}")
        return None


async def _create_pipeline_in_db(pipeline: PipelineModel) -> Optional[PipelineModel]:
    """MongoDB에 새 파이프라인을 저장합니다."""
    try:
        # MongoDB 컬렉션 가져오기
        pipeline_collection = get_pipeline_collection()

        # PipelineModel 객체를 dictionary로 변환 (id 필드 제외)
        pipeline_dict = pipeline.model_dump(exclude={"id"}, by_alias=True)

        # 생성 및 수정 시간 설정
        current_time = datetime.now()
        if not pipeline_dict.get("registered_at"):
            pipeline_dict["registered_at"] = current_time
        pipeline_dict["modified_at"] = current_time

        # MongoDB에 삽입
        result = await pipeline_collection.insert_one(pipeline_dict)

        # 삽입 성공 시 삽입된 파이프라인 반환
        if result.inserted_id:
            # 삽입된 파이프라인 조회
            new_pipeline = await pipeline_collection.find_one({"_id": result.inserted_id})
            if new_pipeline:
                return PipelineModel.model_validate(new_pipeline)

        # 삽입 실패 시 None 반환
        return None

    except Exception as e:
        # 예외 처리 및 로깅
        print(f"Error creating pipeline in DB: {e}")
        return None

class PipelineService:
    def __init__(self):
        pass

    async def get_pipeline(self, pipeline_id: str, project_id: int | None = None, member_id: int | None = None) -> Optional[
        PipelineModel]:
        """MongoDB에서 파이프라인을 조회합니다."""
        logger.info(f"파이프라인 조회: {pipeline_id}, {project_id}, {member_id}")
        return await _fetch_pipeline_from_db(pipeline_id, project_id, member_id)

    async def update_pipeline(self,
                              pipeline_id: str,
                              updates: Dict[str, Any],
                              project_id: int = None,
                              member_id: int = None
                              ) -> Optional[PipelineModel]:
        """파이프라인을 업데이트합니다."""
        # 현재 파이프라인 데이터 가져오기
        logger.info(f"파이프라인 {pipeline_id}의 현재 데이터: {project_id}, {member_id}")
        pipeline = await self.get_pipeline(pipeline_id, project_id, member_id)
        if not pipeline:
            return None

        # 파이프라인 업데이트
        for key, value in updates.items():
            if hasattr(pipeline, key):
                setattr(pipeline, key, value)

        # 수정 시간 업데이트
        pipeline.modified_at = datetime.now()

        # DB 업데이트
        return await _update_pipeline_in_db(pipeline)

    async def get_project_pipelines(self, project_id: int, limit: int = 10, skip: int = 0) -> List[PipelineModel]:
        """프로젝트에 속한 파이프라인 목록을 최신순으로 가져옵니다."""
        try:
            # MongoDB 컬렉션 가져오기
            pipeline_collection = get_pipeline_collection()

            # 프로젝트 ID로 쿼리 구성
            query = {"project_id": project_id}

            # 최신순으로 정렬하여 데이터 조회
            pipeline_data = await pipeline_collection.find(query) \
                .sort("modified_at", -1) \
                .skip(skip) \
                .limit(limit) \
                .to_list(length=limit)

            # 결과를 PipelineModel 리스트로 변환
            pipelines = [PipelineModel.model_validate(p_data) for p_data in pipeline_data]
            return pipelines

        except Exception as e:
            # 예외 처리 및 로깅
            print(f"Error fetching project pipelines from DB: {e}")
            return []

    async def get_member_pipelines(self, member_id: int, limit: int = 10, skip: int = 0) -> List[PipelineModel]:
        """멤버의 파이프라인 목록을 최신순으로 가져옵니다."""
        try:
            # MongoDB 컬렉션 가져오기
            pipeline_collection = get_pipeline_collection()

            # 멤버 ID로 쿼리 구성
            query = {"member_id": member_id}

            # 최신순으로 정렬하여 데이터 조회
            pipeline_data = await pipeline_collection.find(query) \
                .sort("modified_at", -1) \
                .skip(skip) \
                .limit(limit) \
                .to_list(length=limit)

            # 결과를 PipelineModel 리스트로 변환
            pipelines = [PipelineModel.model_validate(p_data) for p_data in pipeline_data]
            return pipelines

        except Exception as e:
            # 예외 처리 및 로깅
            print(f"Error fetching member pipelines from DB: {e}")
            return []

    async def add_pipeline_history(self,
                                   pipeline: PipelineModel,
                                   history_item: PipelineHistoryItem,
                                   ) -> Optional[PipelineModel]:
        """파이프라인 히스토리를 추가합니다."""
        # 히스토리 항목 추가
        pipeline.history.append(history_item.model_copy())
        pipeline.modified_at = datetime.now()

        # DB 업데이트
        return await _update_pipeline_in_db(pipeline)

    async def update_pipeline_status(self,
                              pipeline_id: str,
                              new_status: PipelineStatus,
                              project_id: int = None,
                              member_id: int = None,
                              preprocessed_dataset_id: str = None,
                              ) -> Optional[PipelineModel]:
        """
        파이프라인의 상태를 업데이트합니다.
        """
        try:
            # 현재 파이프라인 데이터 가져오기
            pipeline = await self.get_pipeline(pipeline_id, project_id, member_id)

            if not pipeline:
                return None

            # 파이프라인에 히스토리가 있는지 확인
            if not pipeline.history:
                # 히스토리가 없으면 새로운 히스토리 항목 생성
                new_history_item = PipelineHistoryItem(
                    status=new_status,
                    preprocessing_steps=[]
                )
                pipeline.history.append(new_history_item)
            else:
                # 히스토리의 마지막 항목 상태 업데이트
                current_history = pipeline.history[-1]
                
                # preprocessed_dataset_id 업데이트 (result 필드는 그대로 유지)
                if preprocessed_dataset_id is not None and current_history.preprocessing_steps:
                    current_history.preprocessing_steps[-1].preprocessed_dataset_id = preprocessed_dataset_id
                    
                # 상태가 이미 같으면 업데이트 불필요
                if current_history.status == new_status:
                    return pipeline

                # 상태 업데이트
                current_history.status = new_status

            # 수정 시간 업데이트
            pipeline.modified_at = datetime.now()

            # DB 업데이트
            updated_pipeline = await _update_pipeline_in_db(pipeline)

            if updated_pipeline:
                print(f"Pipeline {pipeline_id} status updated to {new_status}")

            return updated_pipeline

        except Exception as e:
            # 예외 처리 및 로깅
            print(f"Error updating pipeline status: {e}")
            return None

    async def create_pipeline(self, pipeline: PipelineModel) -> Optional[PipelineModel]:
        """새로운 파이프라인을 생성하고 저장합니다."""
        # 파이프라인 ID가 이미 있는지 확인하고, 있다면 제거 (MongoDB가 자동 생성)
        if hasattr(pipeline, "id") and pipeline.id:
            pipeline.id = None

        # 히스토리가 없으면 빈 배열로 초기화
        if not pipeline.history:
            pipeline.history = []

        # 생성 시간과 수정 시간 설정
        current_time = datetime.now()
        pipeline.registered_at = current_time
        pipeline.modified_at = current_time

        # DB에 저장
        return await _create_pipeline_in_db(pipeline)

    async def revert_to_preprocessing_step(self,
                                     pipeline_id: str,
                                     minio_client: MinioClient,
                                     step_index: Optional[int] = None,
                                     project_id: int = None,
                                     member_id: int = None,
                                     add_to_history: bool = True
                                 ) -> Optional[Dict[str, Any]]:
        """
        특정 전처리 스텝까지 되돌립니다.
        """
        logger.info(f"====== 전처리 스텝 되돌리기 시작: pipeline_id={pipeline_id}, step_index={step_index} ======")
        try:
            # 현재 파이프라인 데이터 가져오기
            logger.debug(f"파이프라인 데이터 조회 중: {pipeline_id}")
            pipeline = await self.get_pipeline(pipeline_id, project_id, member_id)

            if not pipeline:
                logger.error(f"Pipeline {pipeline_id} not found")
                return None

            logger.debug(f"파이프라인 데이터 조회 완료: {pipeline_id}")
            logger.debug(f"파이프라인 히스토리 개수: {len(pipeline.history) if pipeline.history else 0}")
            
            # 파이프라인에 히스토리가 없으면 처리할 수 없음
            if not pipeline.history:
                logger.error(f"Pipeline {pipeline_id} has no history")
                return None

            current_history = pipeline.history[-1]
            logger.debug(f"현재 히스토리 상태: {current_history.status}")
            logger.debug(f"현재 전처리 스텝 개수: {len(current_history.preprocessing_steps) if current_history.preprocessing_steps else 0}")
            
            # 전처리 스텝이 없으면 처리할 수 없음
            if not current_history.preprocessing_steps:
                logger.info(f"전처리 스텝이 없습니다.")
                return {"message": "전처리 스텝이 없습니다."}

            # step_index가 None이면 마지막 스텝 제거 (현재 길이 - 1)
            if step_index is None:
                step_index = len(current_history.preprocessing_steps) - 2
                logger.info(f"step_index가 None이므로 마지막 스텝 제거. 설정된 인덱스: {step_index}")

            # 스텝 인덱스 유효성 검사
            if step_index < -1 or step_index >= len(current_history.preprocessing_steps):
                logger.error(f"유효하지 않은 스텝입니다: {step_index}, 유효 범위: -1 ~ {len(current_history.preprocessing_steps) - 1}")
                return None

            # step_index가 -1이면 모든 스텝 제거
            if step_index == -1:
                logger.info("모든 전처리 스텝 제거")
                new_steps = []
            else:
                logger.info(f"인덱스 {step_index}까지의 스텝만 유지 (총 {step_index + 1}개)")
                new_steps = current_history.preprocessing_steps[:step_index + 1]
                
            # 디버깅을 위한 스텝 정보 출력
            for i, step in enumerate(new_steps):
            
            # 변경사항을 히스토리에 기록
            if add_to_history:
                # 스텝 복사 과정 로깅
                for i, step in enumerate(new_steps):
                    logger.debug(f"스텝 {i} 타입: {type(step)}")
                
                try:
                    # 새로운 히스토리 항목 생성
                    new_steps_copy = new_steps.copy()  # 이 부분에서 오류 가능성
                    
                    # 복사된 스텝의 타입 확인
                    for i, step in enumerate(new_steps_copy):
                        logger.debug(f"복사된 스텝 {i} 타입: {type(step)}")
                    
                    new_history_item = PipelineHistoryItem(
                        status=current_history.status,
                        preprocessing_steps=new_steps_copy
                    )
                    pipeline.history.append(new_history_item)
                    logger.debug("새 히스토리 항목 추가 성공")
                except Exception as copy_error:
                    logger.error(f"스텝 복사 또는 히스토리 항목 생성 중 오류: {copy_error}")
                    # 오류 세부 정보 출력
                    import traceback
                    logger.error(f"스택 트레이스: {traceback.format_exc()}")
                    raise  # 오류를 다시 던져서 상위 예외 처리로 전달
            else:
                logger.info("현재 히스토리 항목 직접 수정")
                current_history.preprocessing_steps = new_steps

            # 수정 시간 업데이트
            pipeline.modified_at = datetime.now()
            logger.info(f"파이프라인 수정 시간 업데이트: {pipeline.modified_at}")

            # DB 업데이트
            updated_pipeline = await _update_pipeline_in_db(pipeline)

            if not updated_pipeline:
                logger.error(f"Failed to update pipeline {pipeline_id}")
                return None

            # 업데이트된 파이프라인의 최신 스텝 반환
            latest_history = updated_pipeline.history[-1]
            logger.info(f"업데이트된 파이프라인의 최신 스텝 개수: {len(latest_history.preprocessing_steps) if latest_history.preprocessing_steps else 0}")
            
            logger.info("최신 데이터셋 샘플 조회 중...")
            dataset_sample = await self.get_latest_dataset_from_pipeline(
                updated_pipeline,
                minio_client,
                n_rows=30,
                return_full=False
            )
            
            columns = dataset_sample[0].keys() if dataset_sample else []

            if latest_history.preprocessing_steps:
                latest_step = latest_history.preprocessing_steps[-1]
                logger.info(f"최신 스텝 타입: {type(latest_step)}")
                
                columns = list(dataset_sample[0].keys()) if dataset_sample else []
                
                result = {
                    "latestStep": latest_step.model_dump(mode='json'),
                    "totalSteps": len(latest_history.preprocessing_steps),
                    "originalDatasets": {
                        "columns": columns,
                        "data": dataset_sample
                    }
                }
                result["latestStep"]["type"] = client_preprocess_step_label_mapper(result["latestStep"]["type"])
                logger.info("반환 데이터 구성 완료")
                logger.info(f"====== 전처리 스텝 되돌리기 완료: pipeline_id={pipeline_id} ======")
                return result
            else:
                logger.info("최신 히스토리에 전처리 스텝이 없음")
                result = {
                    "latestStep": None,
                    "totalSteps": 0,
                    "originalDatasets": {
                        "columns": columns,
                        "data": dataset_sample
                    }
                }
                logger.info(f"====== 전처리 스텝 되돌리기 완료: pipeline_id={pipeline_id} ======")
                return result
        except Exception as e:
            logger.error(f"전처리 스텝 되돌리기 중 오류: {e}")
            # 상세 오류 정보 출력
            import traceback
            logger.error(f"====== 전처리 스텝 되돌리기 실패: pipeline_id={pipeline_id} ======")
            return None

    async def get_latest_dataset_from_pipeline(
        self,
        pipeline: PipelineModel,
        minio_client: MinioClient,
        n_rows: Optional[int] = 30,
        return_full: bool = False,
        start_point: Optional[int] = 0
    ) -> list[dict] | None:
        """
        파이프라인에서 가장 최근 데이터셋을 가져옵니다.
        
        Args:
            pipeline: 파이프라인 모델
            minio_client: MinIO 클라이언트
            n_rows: 반환할 행 수 (None이면 모든 행 반환)
            return_full: True면 전체 데이터 반환, False면 n_rows만 반환
            
        Returns:
            Tuple[List[Dict], str, str]: (데이터셋, 데이터 타입, 파일명) 또는 None
            - 데이터 타입: "preprocessed" 또는 "original"
            - 파일명: MinIO에서의 객체 이름
        """
        try:
            # 파이프라인에 히스토리가 있는지 확인
            if not pipeline.history:
                # 원본 데이터 사용
                object_name = pipeline.original_dataset_object_name
            else:
                latest_history = pipeline.history[-1]
            
                # 전처리 스텝이 있는지 확인
                if latest_history.preprocessing_steps:
                    # 가장 최근 전처리된 데이터 사용
                    latest_step = latest_history.preprocessing_steps[-1]
                    object_name = latest_step.preprocessed_dataset_object_name
                else:
                    # 원본 데이터 사용
                    object_name = pipeline.original_dataset_object_name
            
            if not object_name:
                logger.error(f"No dataset object name found")
                return None
                
            # MinIO에서 파일 가져오기
            file_data = minio_client.get_file("datasets", object_name)
            if not file_data:
                logger.error(f"Failed to get file {object_name} from MinIO")
                return None
                
            # 파일 형식에 따라 파싱
            df = await _parse_file_data(file_data, object_name)
            if df is None:
                return None
                
            # 행 수 제한
            if not return_full and n_rows is not None:
                df = df[start_point:start_point+n_rows]
                
            # Dictionary 형태로 변환
            dataset = df.to_dict(orient="records")
            
            return dataset
            
        except Exception as e:
            logger.error(f"Error getting latest dataset: {e}")
            return None

    async def get_latest_dataset_columns(
            self,
            pipeline: PipelineModel,
    ) -> list[DatasetColumn] | None:
        """
        파이프라인에서 가장 최근 데이터셋 컬럼을 가져옵니다.

        Args:
            pipeline: 파이프라인 모델

        Returns:
            List[Dict]: (데이터셋, 데이터 타입, 파일명) 또는 None
        """
        try:
            # 파이프라인에 히스토리가 있는지 확인
            dataset_id = None
            if not pipeline:
                return ApiResponse(
                    status_code=400,
                    message="파이프라인이 없습니다.",
                )
            if not pipeline.history:
                # 원본 데이터 사용
                dataset_id = pipeline.original_dataset_id
            else:
                latest_history = pipeline.history[-1]
                if latest_history.preprocessing_steps:
                    # 가장 최근 전처리된 데이터 사용
                    latest_step = latest_history.preprocessing_steps[-1]
                    dataset_id = latest_step.preprocessed_dataset_id
                else:
                    # 원본 데이터 사용
                    dataset_id = pipeline.original_dataset_id
                
            datasets = get_dataset_collection()
            dataset:DatasetModel = await datasets.find_one({"_id": ObjectId(dataset_id)})
            data_types_dict = dataset["metadata"]["data_types"]

            columns = []
            for column_name, column_type in data_types_dict.items():
                columns.append({
                    'name': column_name,
                    'type': column_type
                })

            return columns

        except Exception as e:
            logger.error(f"Error getting latest dataset: {e}")
            return None

async def _parse_file_data(file_data: bytes, object_name: str) -> Optional[pd.DataFrame]:
    """
    파일 형식에 따라 데이터를 파싱합니다.
    
    Args:
        file_data: 파일 데이터 (bytes)
        object_name: 파일명 (확장자 판단용)
        
    Returns:
        pandas DataFrame 또는 None
    """
    try:
        # 파일 확장자에 따라 적절한 파싱 방법 선택
        if object_name.endswith('.parquet'):
            df = pd.read_parquet(io.BytesIO(file_data))
        elif object_name.endswith('.json'):
            df = pd.read_json(io.BytesIO(file_data))
        elif object_name.endswith('.xlsx') or object_name.endswith('.xls'):
            df = pd.read_excel(io.BytesIO(file_data))
        else:  # CSV 또는 기타 형식은 CSV로 처리
            df = pd.read_csv(io.BytesIO(file_data))
            
        return df
        
    except Exception as e:
        logger.error(f"Error parsing file {object_name}: {e}")
        return None

# FastAPI 의존성 주입 함수
async def get_pipeline_service() -> PipelineService:
    """PipelineService 인스턴스를 제공합니다."""
    return PipelineService()