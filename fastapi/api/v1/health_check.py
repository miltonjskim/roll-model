from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from motor.motor_asyncio import AsyncIOMotorDatabase
from db.mysql_config import get_mysql_db
from db.mongo_config import get_mongo
from db.redis_config import get_redis
import redis
import time
import logging

logger = logging.getLogger()
router = APIRouter()

@router.get("/health/all", summary="모든 데이터베이스 연결 상태 확인")
async def check_all_connections(
    db: Session = Depends(get_mysql_db),
    mongo: AsyncIOMotorDatabase = Depends(get_mongo),
    redis_client: redis.Redis = Depends(get_redis)
):
    result = {
        "status": "ok",
        "message": "모든 데이터베이스 연결이 정상 작동 중입니다",
        "timestamp": time.time(),
        "databases": {}
    }
    
    # MySQL 연결 확인
    try:
        mysql_result = db.execute(text("SELECT 1")).scalar()
        result["databases"]["mysql"] = {
            "status": "ok" if mysql_result == 1 else "error",
            "message": "연결 성공" if mysql_result == 1 else "연결 실패"
        }
    except Exception as e:
        logger.error(f"MySQL 연결 오류: {str(e)}")
        result["databases"]["mysql"] = {
            "status": "error",
            "message": f"연결 오류: {str(e)}"
        }
        result["status"] = "partial"
    
    # MongoDB 연결 확인
    try:
        server_info = await mongo.command("serverStatus")
        result["databases"]["mongodb"] = {
            "status": "ok",
            "message": "연결 성공",
            "version": server_info.get("version", "unknown")
        }
    except Exception as e:
        logger.error(f"MongoDB 연결 오류: {str(e)}")
        result["databases"]["mongodb"] = {
            "status": "error",
            "message": f"연결 오류: {str(e)}"
        }
        result["status"] = "partial"
    
    # Redis 연결 확인
    try:
        ping_result = redis_client.ping()
        if ping_result:
            info = redis_client.info()
            result["databases"]["redis"] = {
                "status": "ok",
                "message": "연결 성공",
                "version": info.get("redis_version", "unknown"),
                "memory_used": info.get("used_memory_human", "unknown")
            }
        else:
            result["databases"]["redis"] = {
                "status": "error",
                "message": "PING 응답 없음"
            }
            result["status"] = "partial"
    except Exception as e:
        logger.error(f"Redis 연결 오류: {str(e)}")
        result["databases"]["redis"] = {
            "status": "error",
            "message": f"연결 오류: {str(e)}"
        }
        result["status"] = "partial"
    
    # 모든 데이터베이스 상태가 에러인 경우
    if all(db["status"] == "error" for db in result["databases"].values()):
        result["status"] = "error"
        result["message"] = "모든 데이터베이스 연결 실패"
        raise HTTPException(status_code=500, detail=result)
    
    # 일부 데이터베이스 상태가 에러인 경우
    if result["status"] == "partial":
        result["message"] = "일부 데이터베이스 연결 실패"
    
    return result