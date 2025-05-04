import redis
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from bson import ObjectId
from fastapi import Depends

from db.mongo_config import get_pipeline_collection
from db.redis_config import get_redis
from schemas.mongo.pipeline import PipelineModel, RedisJSONEncoder, PipelineHistoryItem


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

        # 기본 쿼리는 ID만으로 구성
        query = {"_id": pipeline_object_id}

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


def _generate_member_pipelines_key(member_id: int) -> str:
    """멤버별 파이프라인 목록의 Redis 키를 생성합니다."""
    return f"member:{member_id}:pipelines"


def _generate_project_pipelines_key(project_id: int) -> str:
    """프로젝트별 파이프라인 목록의 Redis 키를 생성합니다."""
    return f"project:{project_id}:pipelines"


def _generate_pipeline_key(pipeline_id: str) -> str:
    """파이프라인 데이터의 Redis 키를 생성합니다."""
    return f"pipeline:{pipeline_id}"


class PipelineCacheService:
    def __init__(self, redis_client: redis.asyncio.Redis):
        self.redis = redis_client
        self.TTL = 3600  # 1 hour cache expiration

    async def get_pipeline(self, pipeline_id: str, project_id: int = None, member_id: int = None) -> Optional[
        PipelineModel]:
        """Redis 캐시에서 파이프라인을 조회하고, 없으면 DB에서 가져와 캐시에 저장합니다."""
        cache_key = _generate_pipeline_key(pipeline_id)
        cached_data = await self.redis.get(cache_key)
        if cached_data:
            # 캐시된 데이터가 있으면 역직렬화하여 반환
            pipeline_dict = json.loads(cached_data)
            return PipelineModel.model_validate(pipeline_dict)

        # 캐시에 없으면 DB에서 조회
        pipeline = await _fetch_pipeline_from_db(pipeline_id, project_id, member_id)

        if pipeline:
            # DB에서 가져온 데이터를 캐시에 저장
            await self.update_pipeline_cache(pipeline)

        return pipeline

    async def update_pipeline_cache(self, pipeline: PipelineModel) -> None:
        """파이프라인 데이터를 Redis 캐시에 저장합니다."""
        cache_key = _generate_pipeline_key(str(pipeline.id))

        # PipelineModel을 JSON 문자열로 직렬화
        pipeline_json = json.dumps(
            pipeline.model_dump(by_alias=True),
            cls=RedisJSONEncoder
        )

        # Redis에 저장
        await self.redis.set(cache_key, pipeline_json, ex=self.TTL)

        # 프로젝트별 및 멤버별 파이프라인 목록 업데이트
        project_list_key = _generate_project_pipelines_key(pipeline.project_id)
        member_list_key = _generate_member_pipelines_key(pipeline.member_id)

        # 파이프라인 ID를 정렬된 집합에 추가 (최신 수정 시간 기준으로 정렬)
        pipeline_score = pipeline.modified_at.timestamp()
        await self.redis.zadd(project_list_key, {str(pipeline.id): pipeline_score})
        await self.redis.zadd(member_list_key, {str(pipeline.id): pipeline_score})

        # 정렬된 집합의 만료 시간 설정
        await self.redis.expire(project_list_key, self.TTL)
        await self.redis.expire(member_list_key, self.TTL)

    async def update_pipeline(self,
                              pipeline_id: str,
                              updates: Dict[str, Any],
                              project_id: int = None,
                              member_id: int = None
                              ) -> Optional[PipelineModel]:
        """파이프라인을 업데이트하고 Redis 캐시를 갱신합니다."""
        # 현재 파이프라인 데이터 가져오기
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
        updated_pipeline = await _update_pipeline_in_db(pipeline)

        if updated_pipeline:
            # DB에서 업데이트된 데이터를 캐시에 저장
            await self.update_pipeline_cache(updated_pipeline)

        return updated_pipeline

    async def get_project_pipelines(self, project_id: int, limit: int = 10, skip: int = 0) -> List[PipelineModel]:
        """프로젝트에 속한 파이프라인 목록을 최신순으로 가져옵니다."""
        project_list_key = _generate_project_pipelines_key(project_id)

        # Redis에서 파이프라인 ID 목록 조회 (최신순)
        pipeline_ids = await self.redis.zrevrange(project_list_key, skip, skip + limit - 1)

        pipelines = []
        cached_ids = set()

        # Redis에서 조회된 파이프라인 처리
        for pid in pipeline_ids:
            pipeline_id = pid.decode('utf-8') if isinstance(pid, bytes) else pid
            cached_ids.add(pipeline_id)

            # 각 파이프라인 데이터 조회
            pipeline = await self.get_pipeline(pipeline_id, project_id, 0)
            if pipeline:
                pipelines.append(pipeline)

        # 캐시에서 충분한 결과를 얻지 못한 경우 DB에서 추가 조회
        if len(pipelines) < limit:
            try:
                # MongoDB 컬렉션 가져오기
                pipeline_collection = get_pipeline_collection()

                # 이미 캐시에서 가져온 ID는 제외하고 조회
                query = {
                    "project_id": project_id,
                    "_id": {"$nin": [ObjectId(pid) for pid in cached_ids if ObjectId.is_valid(pid)]}
                }

                # 최신순으로 정렬하여 추가 데이터 조회
                db_pipelines = await pipeline_collection.find(query) \
                    .sort("modified_at", -1) \
                    .skip(max(0, skip - len(cached_ids))) \
                    .limit(limit - len(pipelines)) \
                    .to_list(length=limit)

                # DB에서 조회한 파이프라인 처리
                for p_data in db_pipelines:
                    pipeline = PipelineModel.parse_obj(p_data)
                    pipelines.append(pipeline)

                    # 새로 조회한 파이프라인을 캐시에 저장
                    await self.update_pipeline_cache(pipeline)

                # 정렬된 목록 반환 (수정 시간 기준 내림차순)
                pipelines.sort(key=lambda p: p.modified_at, reverse=True)

            except Exception as e:
                # 예외 처리 및 로깅
                print(f"Error fetching additional pipelines from DB: {e}")

        return pipelines

    async def get_member_pipelines(self, member_id: int, limit: int = 10, skip: int = 0) -> List[PipelineModel]:
        """멤버의 파이프라인 목록을 최신순으로 가져옵니다."""
        member_list_key = _generate_member_pipelines_key(member_id)

        # Redis에서 파이프라인 ID 목록 조회 (최신순)
        pipeline_ids = await self.redis.zrevrange(member_list_key, skip, skip + limit - 1)

        pipelines = []
        cached_ids = set()

        # Redis에서 조회된 파이프라인 처리
        for pid in pipeline_ids:
            pipeline_id = pid.decode('utf-8') if isinstance(pid, bytes) else pid
            cached_ids.add(pipeline_id)

            # 각 파이프라인 데이터 조회
            # 실제 구현에서는 project_id를 정확히 알아야 함
            pipeline = await self.get_pipeline(pipeline_id, 0, member_id)
            if pipeline:
                pipelines.append(pipeline)

        # 캐시에서 충분한 결과를 얻지 못한 경우 DB에서 추가 조회
        if len(pipelines) < limit:
            try:
                # MongoDB 컬렉션 가져오기
                pipeline_collection = get_pipeline_collection()

                # 이미 캐시에서 가져온 ID는 제외하고 조회
                query = {
                    "member_id": member_id,
                    "_id": {"$nin": [ObjectId(pid) for pid in cached_ids if ObjectId.is_valid(pid)]}
                }

                # 최신순으로 정렬하여 추가 데이터 조회
                db_pipelines = await pipeline_collection.find(query) \
                    .sort("modified_at", -1) \
                    .skip(max(0, skip - len(cached_ids))) \
                    .limit(limit - len(pipelines)) \
                    .to_list(length=limit)

                # DB에서 조회한 파이프라인 처리
                for p_data in db_pipelines:
                    pipeline = PipelineModel.parse_obj(p_data)
                    pipelines.append(pipeline)

                    # 새로 조회한 파이프라인을 캐시에 저장
                    await self.update_pipeline_cache(pipeline)

                # 정렬된 목록 반환 (수정 시간 기준 내림차순)
                pipelines.sort(key=lambda p: p.modified_at, reverse=True)

            except Exception as e:
                # 예외 처리 및 로깅
                print(f"Error fetching additional pipelines from DB: {e}")

        return pipelines

    async def add_pipeline_history(self,
                                   pipeline: PipelineModel,
                                   history_item: PipelineHistoryItem,
                                   ) -> Optional[PipelineModel]:

        # 히스토리 항목 추가
        pipeline.history.append(history_item.model_copy())
        pipeline.modified_at = datetime.now()

        # DB 업데이트
        updated_pipeline = await _update_pipeline_in_db(pipeline)

        if updated_pipeline:
            # 캐시 업데이트
            await self.update_pipeline_cache(updated_pipeline)

        return updated_pipeline

    async def invalidate_pipeline_cache(self, pipeline_id: str) -> None:
        """파이프라인 캐시를 무효화합니다."""
        cache_key = _generate_pipeline_key(pipeline_id)
        await self.redis.delete(cache_key)

async def get_pipeline_cache_service(redis_client = Depends(get_redis)) -> PipelineCacheService:
    """PipelineCacheService 인스턴스를 제공합니다."""
    return PipelineCacheService(redis_client)