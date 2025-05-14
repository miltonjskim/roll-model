from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pathlib import Path
import logging

logger = logging.getLogger()

# 루트 디렉토리 경로를 찾습니다
BASE_DIR = Path(__file__).resolve().parent.parent  # core 디렉토리의 부모 디렉토리


class Settings(BaseSettings):
    # 앱 설정
    APP_NAME: str = "Data Processing Service"
    DEBUG: bool = False
    VERSION: str = "0.1.0"
    SECRET_KEY: str

    # MYSQL
    MYSQL_HOST: str
    MYSQL_PORT: int
    MYSQL_USER: str
    MYSQL_PASSWORD: str
    MYSQL_DB: str
    # MONGO
    MONGODB_HOST: str
    MONGODB_PORT: int
    MONGODB_DB: str
    
    # REDIS
    REDIS_HOST: str
    REDIS_PORT: int
    REDIS_PASSWORD: str
    REDIS_DB: int

    # API 기본 경로
    API_V1_STR: str = "/api/v2"

    # MinIO 설정
    MINIO_ENDPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_SECURE: bool
    MINIO_DATASET_BUCKET: str
    MINIO_MODEL_BUCKET: str

    OPENAI_API_KEY: str
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8"
    )
    
@lru_cache
def get_settings():
    return Settings()