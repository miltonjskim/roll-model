from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError
from api.v1.preprocessing.routers import api_router
from core.api_response import ApiResponse
from core.exception import (
    startlette_http_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    custom_exception_handler,
    general_exception_handler,
    CustomAPIException
)
import logging
import os
import time
import sys
import io

# logs 폴더 만들기
LOG_FILE_PATH = "logs/app.log"
os.makedirs(os.path.dirname(LOG_FILE_PATH), exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        # 콘솔 출력용 핸들러
        logging.StreamHandler(io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')),
        # 파일 저장용 핸들러
        logging.FileHandler(LOG_FILE_PATH, mode="a", encoding="utf-8")
    ]
)

logger = logging.getLogger()

app = FastAPI(
    title="My Awesome API",
    description="전처리 서버",
    version="1.0.0",
    openapi_url="/openapi.json",   # OpenAPI 스펙 문서 경로
    docs_url="/docs",             # Swagger UI 경로
    redoc_url="/redoc",           # ReDoc 경로
    default_response_class=ApiResponse,
)

app.add_exception_handler(StarletteHTTPException, startlette_http_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(CustomAPIException, custom_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

@app.get('/')
def welcome_root():
    '''
    주요 로직 순서
    1. 파라미터 전달받기 (api 호출로 설정)
    2. 미니오에서 데이터 다운로드 or 스트리밍 (미니오 연동 서비스 구현)
    3. 데이터 전처리 (각각의 전처리 서비스 구현)
    4. 변환된 데이터를 저장 (미니오 연동 서비스 구현)
    5. 변환된 데이터의 위치와 실행한 처리를 레디스에 저장 (레디스 연동 서비스 구현)
    6. 사용자에게 바뀐 데이터 결과 반환하기 (api response로 반환)
    '''
    return "Welcome to root"

app.include_router(api_router, prefix="/api", tags=["api"])

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
    logger.info(f"Response status code: {response}")
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8082, log_level="info")
