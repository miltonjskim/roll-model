from fastapi import Request
from fastapi.exceptions import HTTPException
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError
from core.api_response import ApiResponse
import logging

logger = logging.getLogger()

class CustomAPIException(Exception):
    def __init__(
        self, 
        status_code: int = 400, 
        error_code: str = "AUTHORIZATION_ERROR", 
        message: str = "인증 오류가 발생했습니다"
    ):
        self.status_code = status_code
        self.error_code = error_code
        self.message = message
        super().__init__(self.message)

# 기본 HTTPException 핸들러
async def startlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.error(f"HTTP 에러: {exc.detail}")
    return ApiResponse(
        status_code=exc.status_code,
        error_code="HTTP_ERROR",
        error_message=str(exc.detail)
    )


# 기본 HTTPException 핸들러
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTP 에러: {exc.detail}")
    return ApiResponse(
        status_code=exc.status_code,
        error_code="HTTP_ERROR",
        error_message=str(exc.detail)
    )

# 요청 유효성 검증 에러 핸들러
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"유효성 검증 에러: {exc}")
    
    # 유효성 검증 오류 상세 정보 처리
    error_details = exc.errors()
    error_message = "입력 데이터 유효성 검증 실패"
    
    # 첫 번째 오류 메시지를 사용하거나 기본 메시지 사용
    if error_details and len(error_details) > 0:
        first_error = error_details[0]
        if "msg" in first_error:
            error_message = first_error["msg"]
    
    return ApiResponse(
        status_code=400,
        error_code="VALIDATION_ERROR",
        error_message=error_message
    )

async def custom_exception_handler(request: Request, exc: CustomAPIException):
    logger.error(f"API 오류: {exc.message}")
    return ApiResponse(
        status_code=exc.status_code,
        error_code=exc.error_code,
        error_message=exc.message
    )

# 일반 예외 핸들러
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"예상치 못한 에러: {str(exc)}", exc_info=True)
    return ApiResponse(
        status_code=500,
        error_code="INTERNAL_SERVER_ERROR",
        error_message="서버 내부 오류가 발생했습니다"
    )