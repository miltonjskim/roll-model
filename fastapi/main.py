from fastapi import FastAPI, Depends
from api.v1.preprocessing.routers import api_router
from core.security import verify_token

import logging
import os

# logs 폴더 만들기
LOG_FILE_PATH = "logs/app.log"
os.makedirs(os.path.dirname(LOG_FILE_PATH), exist_ok=True)

# 루트 로거 가져와서 수동 설정
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)

# 핸들러 다 떼버리고
root_logger.handlers.clear()

# 새 스트림 핸들러 추가
stream_handler = logging.StreamHandler()
stream_handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
root_logger.addHandler(stream_handler)

# 파일 핸들러 추가
file_handler = logging.FileHandler(LOG_FILE_PATH, mode="a")
file_handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
root_logger.addHandler(file_handler)

# 확인용
root_logger.info("로깅 설정 완료")

app = FastAPI(
    title="My Awesome API",
    description="전처리 서버",
    version="1.0.0",
    openapi_url="/openapi.json",   # OpenAPI 스펙 문서 경로
    docs_url="/docs",             # Swagger UI 경로
    redoc_url="/redoc",           # ReDoc 경로
)


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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8082, log_level="info")