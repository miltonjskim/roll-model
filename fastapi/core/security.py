from fastapi import Depends, Request
from fastapi.exceptions import HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from typing import Dict
from core.config import get_settings

import logging

from db.mysql_config import get_mysql_db
from schemas.mysql.schemas import Project
from service.db.pipeline_service import PipelineService, get_pipeline_service

logger = logging.getLogger()
settings = get_settings()

class CustomHTTPBearer(HTTPBearer):
    async def __call__(self, request: Request):
        try:
            return await super().__call__(request)
        except HTTPException as exc:
            # 사용자 정의 형식으로 예외 다시 발생
            raise HTTPException(
                status_code=exc.status_code,
                detail=exc.detail,
                headers=exc.headers
            )

security = CustomHTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        # HTTPBearer에서는 credentials.credentials로 토큰을 가져옴
        token = credentials.credentials
        logger.info("토큰 검증 시작")  # 디버깅용 로그
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        logger.info(f"Decoded payload: {payload}")  # 디버깅용 로그
        
        member_id: int = payload.get("memberId")
        if member_id is None:
            raise HTTPException(
                    status_code=401,
                    detail="인증이 필요합니다",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        
        return member_id
    
    except JWTError as e:
        logger.error(f"JWT 오류: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="유효하지 않은 토큰입니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    except Exception as e:
        logger.error(f"인증 처리 중 오류 발생: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="인증 정보를 확인할 수 없습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
async def verify_pipeline_ownership(
    pipeline_id: str,
    member_id: int = Depends(verify_token),
    pipeline_service: PipelineService = Depends(get_pipeline_service),
    db: Session = Depends(get_mysql_db)
) -> Dict:
    """파이프라인 소유권 확인 의존성"""
    
    # 파이프라인 정보 조회
    pipeline = await pipeline_service.get_pipeline(pipeline_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="파이프라인을 찾을 수 없습니다")
    
    # 프로젝트 정보 조회
    project = db.query(Project).filter(
        Project.project_id == pipeline.project_id,
        Project.deleted_yn == False
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")
    
    # 프로젝트 소유자 확인
    if project.member_id != member_id:
        raise HTTPException(
            status_code=403,
            detail="이 파이프라인의 프로젝트에 대한 권한이 없습니다"
        )
    
    return member_id