from fastapi import FastAPI, Request
from pydantic_settings import BaseSettings, SettingsConfigDict
from fastapi.middleware.cors import CORSMiddleware
from functools import lru_cache
from pathlib import Path
import logging
import time

logger = logging.getLogger()

app = FastAPI()

# 루트 디렉토리 경로를 찾습니다
BASE_DIR = Path(__file__).resolve().parent.parent  # core 디렉토리의 부모 디렉토리


class Settings(BaseSettings):
    # 앱 설정
    APP_NAME: str = "Data Processing Service"
    DEBUG: bool = False
    VERSION: str = "0.1.0"
    SECRET_KEY: str
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8"
    )

@lru_cache
def get_settings():
    return Settings()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 오리진 허용 (프로덕션에서는 구체적인 도메인 지정 권장)
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 헤더 허용
)

# 처리 시간을 측정하는 미들웨어
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request URL: {request.url.path}")
    print(f"logger: {logger}")
    response = await call_next(request)
    logger.info(f"Response status code: {response.status_code}")
    return response