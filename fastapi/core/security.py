from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt
from core.config import get_settings
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

logger = logging.getLogger()

# OAuth2PasswordBearer 대신 HTTPBearer 사용 (토큰 발급 경로 없이)
security = HTTPBearer()

settings = get_settings()

# JWT 토큰 검증
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보를 확인할 수 없습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # HTTPBearer에서는 credentials.credentials로 토큰을 가져옴
        token = credentials.credentials
        logger.info(f"token: -----------------------------")  # 디버깅용 로그
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        logger.info(f"Decoded payload: {payload}")  # 디버깅용 로그
        member_id: int = payload.get("memberId")
        if member_id is None:
            raise credentials_exception
        return member_id
    except JWTError:
        raise credentials_exception
    except Exception:
        raise credentials_exception