from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Any

class ErrorDetail(BaseModel):
    code: str
    message: str

class ResponseStructure(BaseModel):
    status: int
    message: str
    data: Any = None
    error: Any = None

# 표준 API 응답 클래스
class ApiResponse(JSONResponse):
    def __init__(
        self, 
        data: Any = None, 
        message: str = "Success", 
        status_code: int = 200, 

        error_code: str = None,
        error_message: str = None,
        *args, 
        **kwargs
    ) -> None:
        # 에러 정보가 제공된 경우 에러 응답 생성
        if error_code and error_message:
            message = "Failed"
            error = ErrorDetail(code=error_code, message=error_message)
            data = None
        else:
            error = None
            
        content = ResponseStructure(
            status=status_code,
            message=message,
            data=data,
            error=error
        ).model_dump()
        super().__init__(content=content, status_code=status_code, *args, **kwargs)