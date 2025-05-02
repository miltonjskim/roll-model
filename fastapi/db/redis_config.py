from core.config import get_settings
from typing import Optional, AsyncGenerator
from redis.asyncio import Redis
import logging

logger = logging.getLogger()
settings = get_settings()

class RedisManager:
    _redis_client: Optional[Redis] = None

    @classmethod
    async def get_redis_client(cls) -> Redis:
        """Redis 클라이언트 인스턴스를 반환합니다."""
        if cls._redis_client is None:
            cls._redis_client = Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD,
                db=settings.REDIS_DB,
                decode_responses=True,
                socket_connect_timeout=10.0,
                socket_timeout=10.0,
                health_check_interval=30,
            )
            # 연결 확인
            try:
                await cls._redis_client.ping()
                logger.info("Redis 서버 연결 성공")
            except ConnectionError as e:
                logger.error(f"Redis 서버 연결 실패: {e}")
                cls._redis_client = None
                raise
        return cls._redis_client

    @classmethod
    async def close_connection(cls):
        """Redis 연결을 종료합니다."""
        if cls._redis_client is not None:
            await cls._redis_client.close()
            cls._redis_client = None
            logger.info("Redis 연결 종료")

# FastAPI 의존성 주입을 위한 함수
async def get_redis() -> AsyncGenerator[Redis, None]:
    """FastAPI 엔드포인트에서 Redis 클라이언트를 제공합니다."""
    redis_client = await RedisManager.get_redis_client()
    try:
        yield redis_client  # 실제 Redis 클라이언트 인스턴스 반환
    finally:
        # 여기서는 연결을 닫지 않음 (공유 연결 사용)
        pass
    
# 애플리케이션 종료 시 호출할 함수
async def close_redis_connection():
    """애플리케이션 종료 시 Redis 연결을 종료합니다."""
    await RedisManager.close_connection()