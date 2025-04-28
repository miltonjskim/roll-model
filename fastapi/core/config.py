from fastapi import FastAPI, Request
from pydantic_settings import BaseSettings, SettingsConfigDict
import time
from fastapi.middleware.cors import CORSMiddleware
from functools import lru_cache
import logging

logger = logging.getLogger()

app = FastAPI()

class Settings(BaseSettings):
    # 앱 설정
    APP_NAME: str = "Data Processing Service"
    DEBUG: bool = False
    VERSION: str = "0.1.0"
    SECRET_KEY: str = "fbb584f3af3c2b31c06c0b63e931cfb687e27e16c79847eb42472c0cc8722474b836e3a650c64cf374837ebeb771ec8f867165f223606263f049c1fe2e1cd42170dca2b89cd5396ce7a3328a8dea418b2be6fa4e7c08876efdf359b4535b992e7b776557214270c0f2c98031d6606ece77a6504a3db27755c4ebcfe3d1ef4fb478d5671ecd0986d03f9e2603512823d13c9be7a311ea49b80c704fa1e39817a0567063f86291f46cefe3eed3bdb99922357630036f16bd53f4b4dcbc164dc691d6c495eb8e8043e52af14333a923c9658d86c3440284d3510399c551654908280dc630b13aa09e932c6c4c260667fdc31b88e"
    model_config = SettingsConfigDict(env_file=".env")

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