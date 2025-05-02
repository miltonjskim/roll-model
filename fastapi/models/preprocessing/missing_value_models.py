from enum import Enum
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Union

class MissingValueImputationMethod(str, Enum):
    MEAN = "MEAN"
    MEDIAN = "MEDIAN"
    MODE = "MODE"

# 요청 모델 정의
class MissingValueImputationRequest(BaseModel):
    column: str = Field(..., description="처리할 컬럼 이름")
    method: MissingValueImputationMethod = Field(..., description="대체 방법 ('MEAN', 'MEDIAN', 'MODE')")

    class Config:
        json_schema_extra = {
            "example": {
                "column": "temperature",
                "method": "MEAN"
            }
        }

##################################################3

# 응답 모델 정의
class ImputationResultDetail(BaseModel):
    column: str
    method: str
    fill_value: Optional[Union[float, str]] = None
    changed_indices: List[int]
    original_rows: List[Dict[str, Any]]
    changed_rows: List[Dict[str, Any]]
    timestamp: str

class MissingValueImputationResponse(BaseModel):
    pipeline_id: int
    success: bool
    original_missing_count: int
    imputed_count: int 
    result: ImputationResultDetail