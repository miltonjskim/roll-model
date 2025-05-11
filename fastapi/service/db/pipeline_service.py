import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from bson import ObjectId
from fastapi import Depends

from db.mongo_config import get_pipeline_collection
from schemas.mongo.pipeline import PipelineModel, PipelineHistoryItem, PipelineStatus

import logging

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
        logger.info(f"파이프라인 조회 결과: {pipeline_data}")
        # 조회 결과가 있으면 PipelineModel로 변환하여 반환
        if pipeline_data:
            logger.info(f"파이프라인 데이터 변환: {pipeline_data}")
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

    async def get_pipeline(self, pipeline_id: str, project_id: int = None, member_id: int = None) -> Optional[
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

        Args:
            pipeline_id: 파이프라인 ID
            new_status: 새로운 파이프라인 상태 (PipelineStatus enum)
            project_id: 프로젝트 ID (선택적)
            member_id: 멤버 ID (선택적)
            preprocessed_dataset_id: 전처리된 데이터셋 ID (선택적)

        Returns:
            업데이트된 파이프라인 모델 또는 None
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
                if preprocessed_dataset_id is not None:
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

# FastAPI 의존성 주입 함수
async def get_pipeline_service() -> PipelineService:
    """PipelineService 인스턴스를 제공합니다."""
    return PipelineService()