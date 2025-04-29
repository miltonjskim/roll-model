from enum import Enum
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Union
from pydantic import RootModel

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

class ImputationRow(RootModel):
    root: Dict[str, Any]

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
    message: str
    original_missing_count: int
    imputed_count: int
    result: ImputationResultDetail