from core.config import get_settings
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from typing import AsyncGenerator
import logging

logger = logging.getLogger()
settings = get_settings()

MONGO_URI = f"mongodb://{settings.MONGODB_HOST}:{settings.MONGODB_PORT}"

client = AsyncIOMotorClient(MONGO_URI)

db = client[settings.MONGODB_DB]


async def get_mongo() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    """FastAPI 엔드포인트에서 MongoDB 데이터베이스 인스턴스를 비동기적으로 제공"""
    try:
        yield db
        logger.debug("MongoDB 연결 제공")
    finally:
        # 여기서는 연결을 닫지 않음 (공유 연결 사용)
        pass


# 애플리케이션 종료 시 연결 종료 함수
async def close_mongo_connection():
    """애플리케이션 종료 시 MongoDB 연결을 종료"""
    client.close()
    logger.info("MongoDB 연결 종료")


def get_pipeline_collection() -> AsyncIOMotorCollection:
    """파이프라인 컬렉션을 반환"""
    return db["pipelines"]


def get_dataset_collection() -> AsyncIOMotorCollection:
    """데이터셋 컬렉션을 반환"""
    return db["datasets"]


def get_model_collection() -> AsyncIOMotorCollection:
    """모델 컬렉션을 반환"""
    return db["models"]