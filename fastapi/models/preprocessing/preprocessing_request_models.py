# 기본 전처리 요청 모델
from typing import Any, Dict, List, Union
from pydantic import BaseModel, Field

class BasePreprocessingRequest(BaseModel):
    """모든 전처리 요청의 기본 모델"""
    pass

# 결측치 제거 요청
class MissingValueRemoveRequest(BasePreprocessingRequest):
    type: str = "MISSING_VALUE_REMOVE"
    column: str | None = Field(None, description="처리할 컬럼 이름")
    method: str = Field(..., description="제거 방법 ('ROW_REMOVE' 또는 'COL_REMOVE')")

# 결측치 대체 요청
class MissingValueImputationRequest(BasePreprocessingRequest):
    type: str = "MISSING_VALUE_IMPUTATION"
    column: str = Field(..., description="처리할 컬럼 이름")
    method: str = Field(..., description="대체 방법 ('MEAN', 'MEDIAN', 'MODE')")

class OutlierRemoveRequest(BasePreprocessingRequest):
    type: str = "OUTLIER_REMOVE"
    column: str = Field(..., description="처리할 컬럼 이름")
    method: str = Field(..., description="제거 방법 ('ROW_REMOVE' 또는 'COL_REMOVE')")
    detection: str = Field(..., description="탐지 방법 ('ZSCORE', 'IQR')")

# 결측치 대체 요청
class OutlierImputationRequest(BasePreprocessingRequest):
    type: str = "OUTLIER_IMPUTATION"
    column: str = Field(..., description="처리할 컬럼 이름")
    method: str = Field(..., description="제거 방법 ('MEAN', 'MEDIAN', 'MODE', ‘THRESHOLD’)")
    detection: str = Field(..., description="탐지 방법 ('ZSCORE', 'IQR')")


class OutlierDetectionRequest(BasePreprocessingRequest):
    type: str = "OUTLIER_DETECTION"
    column: str | None = Field(None, description="처리할 컬럼 이름")
    detection: str = Field(..., description="탐지 방법 ('ZSCORE', 'IQR')")

# Z-Score 표준화 요청
class ZScoreRequest(BasePreprocessingRequest):
    type: str = "ZSCORE_SCALING"
    column: str | None = Field(None,description="표준화할 컬럼 이름")

# Min-Max 스케일링 요청
class MinMaxScalingRequest(BasePreprocessingRequest):
    type: str = "MINMAX_SCALING"
    column: str | None = Field(None, description="스케일링할 컬럼 이름")

# 로그 변환 요청
class LogTransformRequest(BasePreprocessingRequest):
    type: str = "LOG_TRANSFORM"
    column: str = Field(..., description="변환할 컬럼 이름")
    offset: float = Field(1.0, description="오프셋 값")

# 제곱근 변환 요청
class SqrtTransformRequest(BasePreprocessingRequest):
    type: str = "SQRT_TRANSFORM"
    column: str = Field(..., description="변환할 컬럼 이름")

# 원-핫 인코딩 요청
class OneHotEncodingRequest(BasePreprocessingRequest):
    type: str = "ONEHOT_ENCODING"
    column: str = Field(..., description="인코딩할 컬럼 이름")

# 레이블 인코딩 요청
class LabelEncodingRequest(BasePreprocessingRequest):
    type: str = "LABEL_ENCODING"
    column: str = Field(..., description="인코딩할 컬럼 이름")

# 타겟 인코딩 요청
class TargetEncodingRequest(BasePreprocessingRequest):
    type: str = "TARGET_ENCODING"
    column: str = Field(..., description="인코딩할 컬럼 이름")
    target_column: str = Field(..., description="타겟 컬럼 이름", alias="targetColumn")

# 클래스 불균형 처리 요청
class ClassBalancingRequest(BasePreprocessingRequest):
    type: str = "CLASS_BALANCING"
    target_column: str = Field(..., description="타겟 컬럼 이름", alias="column")
    sampling_ratio: int = Field(200, description="샘플링 비율 (%)", alias="samplingRatio")
    method: str = Field(..., description="불균형 처리 방법 ('OVER', 'UNDER')")

# 모든 요청 타입의 Union
PreprocessingStep = Union[
    MissingValueRemoveRequest,
    MissingValueImputationRequest,
    OutlierRemoveRequest,
    OutlierImputationRequest,
    OutlierDetectionRequest,
    ZScoreRequest,
    MinMaxScalingRequest,
    LogTransformRequest,
    SqrtTransformRequest,
    OneHotEncodingRequest,
    LabelEncodingRequest,
    TargetEncodingRequest,
    ClassBalancingRequest
]

class PreprocessPipelineRequest(BaseModel):
    """전처리 파이프라인 요청 모델"""
    preprocessing_steps: List[Dict[str, Any]] = Field(..., description="전처리 단계 리스트")
    target_column: str | None = Field(None, description="타겟 컬럼 이름")
    
    # 딕셔너리를 적절한 요청 객체로 변환하는 함수
    def get_parsed_steps(self) -> List[PreprocessingStep]:
        parsed_steps = []
        for step_dict in self.preprocessing_steps:
            step_type = step_dict.get("type")
            
            if step_type == "MISSING_VALUE_REMOVE":
                parsed_steps.append(MissingValueRemoveRequest(**step_dict))
            elif step_type == "MISSING_VALUE_IMPUTATION":
                parsed_steps.append(MissingValueImputationRequest(**step_dict))
            elif step_type == "OUTLIER_REMOVE":
                parsed_steps.append(OutlierRemoveRequest(**step_dict))
            elif step_type == "OUTLIER_IMPUTATION":
                parsed_steps.append(OutlierImputationRequest(**step_dict))
            elif step_type == "OUTLIER_DETECTION":
                parsed_steps.append(OutlierDetectionRequest(**step_dict))
            elif step_type == "ZSCORE_SCALING":
                parsed_steps.append(ZScoreRequest(**step_dict))
            elif step_type == "MINMAX_SCALING":
                parsed_steps.append(MinMaxScalingRequest(**step_dict))
            elif step_type == "LOG_TRANSFORM":
                parsed_steps.append(LogTransformRequest(**step_dict))
            elif step_type == "SQRT_TRANSFORM":
                parsed_steps.append(SqrtTransformRequest(**step_dict))
            elif step_type == "ONEHOT_ENCODING":
                parsed_steps.append(OneHotEncodingRequest(**step_dict))
            elif step_type == "LABEL_ENCODING":
                parsed_steps.append(LabelEncodingRequest(**step_dict))
            elif step_type == "TARGET_ENCODING":
                parsed_steps.append(TargetEncodingRequest(**step_dict))
            elif step_type == "CLASS_BALANCING":
                parsed_steps.append(ClassBalancingRequest(**step_dict))
            else:
                raise ValueError(f"알 수 없는 전처리 단계 유형: {step_type}")
                
        return parsed_steps