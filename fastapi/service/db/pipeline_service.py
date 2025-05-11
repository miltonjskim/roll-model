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

    async def revert_to_preprocessing_step(self,
                                           pipeline_id: str,
                                           step_index: Optional[int] = None,
                                           project_id: int = None,
                                           member_id: int = None,
                                           add_to_history: bool = True) -> Optional[Dict[str, Any]]:
        """
        특정 전처리 스텝까지 되돌립니다.

        Args:
            pipeline_id: 파이프라인 ID
            step_index: 되돌아갈 스텝의 인덱스 (None이면 마지막 스텝 제거)
            project_id: 프로젝트 ID (선택적)
            member_id: 멤버 ID (선택적)
            add_to_history: 변경사항을 히스토리에 기록할지 여부

        Returns:
            변경 후 현재 최신 스텝 정보 또는 None
        """
        try:
            # 현재 파이프라인 데이터 가져오기
            pipeline = await self.get_pipeline(pipeline_id, project_id, member_id)

            if not pipeline:
                logger.error(f"Pipeline {pipeline_id} not found")
                return None

            # 파이프라인에 히스토리가 없으면 처리할 수 없음
            if not pipeline.history:
                logger.error(f"Pipeline {pipeline_id} has no history")
                return None

            current_history = pipeline.history[-1]

            # 전처리 스텝이 없으면 처리할 수 없음
            if not current_history.preprocessing_steps:
                logger.info(f"Pipeline {pipeline_id} has no preprocessing steps")
                return {"message": "No preprocessing steps to revert"}

            # step_index가 None이면 마지막 스텝 제거 (현재 길이 - 1)
            if step_index is None:
                step_index = len(current_history.preprocessing_steps) - 2

            # 스텝 인덱스 유효성 검사
            if step_index < -1 or step_index >= len(current_history.preprocessing_steps):
                logger.error(f"Invalid step index {step_index}")
                return None

            # step_index가 -1이면 모든 스텝 제거
            if step_index == -1:
                new_steps = []
            else:
                new_steps = current_history.preprocessing_steps[:step_index + 1]

            # 변경사항을 히스토리에 기록
            if add_to_history:
                # 새로운 히스토리 항목 생성
                new_history_item = PipelineHistoryItem(
                    status=current_history.status,
                    preprocessing_steps=new_steps.copy()
                )
                pipeline.history.append(new_history_item)
            else:
                # 현재 히스토리 항목을 직접 수정
                current_history.preprocessing_steps = new_steps

            # 수정 시간 업데이트
            pipeline.modified_at = datetime.now()

            # DB 업데이트
            updated_pipeline = await _update_pipeline_in_db(pipeline)

            if not updated_pipeline:
                logger.error(f"Failed to update pipeline {pipeline_id}")
                return None

            # 업데이트된 파이프라인의 최신 스텝 반환
            latest_history = updated_pipeline.history[-1]
            if latest_history.preprocessing_steps:
                latest_step = latest_history.preprocessing_steps[-1]
                return {
                    "latestStep": latest_step.model_dump(),
                    "totalSteps": len(latest_history.preprocessing_steps),
                }
            else:
                # 더 이상 전처리 스텝이 없음
                return {
                    "latestStep": None,
                    "totalSteps": 0,
                }

        except Exception as e:
            logger.error(f"Error reverting preprocessing step: {e}")
            return None

# FastAPI 의존성 주입 함수
async def get_pipeline_service() -> PipelineService:
    """PipelineService 인스턴스를 제공합니다."""
    return PipelineService()