from enum import Enum
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Union

class MissingValueImputationMethod(str, Enum):
    MEAN = "mean"
    MEDIAN = "median"
    MODE = "mode"

# 요청 모델 정의
class MissingValueImputationRequest(BaseModel):
    pipelineId: int = Field(..., description="파이프라인 ID")
    column: str = Field(..., description="처리할 컬럼 이름")
    method: MissingValueImputationMethod = Field(..., description="대체 방법 ('mean', 'median', 'mode')")

    class Config:
        schema_extra = {
            "example": {
                "pipeline_id": 123,
                "column": "temperature",
                "method": "mean"
            }
        }
        
##################################################3

# 응답 모델 정의

class ImputationRow(BaseModel):
    # 데이터 행을 표현하는 모델 (실제 컬럼에 맞게 조정 필요)
    # 동적 필드를 허용하기 위해 Dict[str, Any] 타입 사용
    __root__: Dict[str, Any]

class ImputationResultDetail(BaseModel):
    column: str
    method: str
    fillValue: Optional[Union[float, str]] = None
    changedIndices: List[int]
    originalRows: List[Dict[str, Any]]
    changedRows: List[Dict[str, Any]]
    timestamp: str

class MissingValueImputationResponse(BaseModel):
    pipelineId: int
    success: bool
    message: str
    originalMissingCount: int
    imputedCount: int
    result: ImputationResultDetail