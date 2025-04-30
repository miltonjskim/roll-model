from fastapi import Depends, Request
from fastapi.exceptions import HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from core.config import get_settings

import logging

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