from core.config import get_settings
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging

logger = logging.getLogger()
settings = get_settings()
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{settings.MYSQL_USER}:{settings.MYSQL_PASSWORD}@{settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DB}"
print(SQLALCHEMY_DATABASE_URL)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=True,  # 개발 환경에서만 SQL 쿼리 로깅
    pool_pre_ping=True,  # 연결 유효성 확인
    pool_recycle=3600,   # 1시간마다 연결 재활용
)

# 세션 팩토리 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 모델 기본 클래스
Base = declarative_base()

# DB 의존성 주입을 위한 함수
async def get_mysql_db():
    db = SessionLocal()
    try:
        yield db
        logger.debug("MySQL DB 세션 생성")
    finally:
        db.close()
        logger.debug("MySQL DB 세션 종료")