# 기본 전처리 요청 모델
from pydantic import BaseModel, Field

class BasePreprocessingRequest(BaseModel):
    """모든 전처리 요청의 기본 모델"""
    pass

# 결측치 제거 요청
class MissingValueRemoveRequest(BasePreprocessingRequest):
    column: str = Field(..., description="처리할 컬럼 이름")
    method: str = Field(..., description="제거 방법 ('ROW_REMOVE' 또는 'COL_REMOVE')")

# 결측치 대체 요청
class MissingValueImputationRequest(BasePreprocessingRequest):
    column: str = Field(..., description="처리할 컬럼 이름")
    method: str = Field(..., description="대체 방법 ('MEAN', 'MEDIAN', 'MODE')")

class OutlierRemoveRequest(BasePreprocessingRequest):
    column: str = Field(..., description="처리할 컬럼 이름")
    method: str = Field(..., description="제거 방법 ('ROW_REMOVE' 또는 'COL_REMOVE')")
    detection: str = Field(..., description="탐지 방법 ('ZSCORE', 'IQR')")

# 결측치 대체 요청
class OutlierImputationRequest(BasePreprocessingRequest):
    column: str = Field(..., description="처리할 컬럼 이름")
    method: str = Field(..., description="제거 방법 ('MEAN', 'MEDIAN', 'MODE', ‘THRESHOLD’)")
    detection: str = Field(..., description="탐지 방법 ('ZSCORE', 'IQR')")


class OutlierDetectionRequest(BasePreprocessingRequest):
    column: str = Field(..., description="처리할 컬럼 이름")
    detection: str = Field(..., description="탐지 방법 ('ZSCORE', 'IQR')")

# Z-Score 표준화 요청
class ZScoreRequest(BasePreprocessingRequest):
    column: str = Field(..., description="표준화할 컬럼 이름")

# Min-Max 스케일링 요청
class MinMaxScalingRequest(BasePreprocessingRequest):
    column: str = Field(..., description="스케일링할 컬럼 이름")

# 로그 변환 요청
class LogTransformRequest(BasePreprocessingRequest):
    column: str = Field(..., description="변환할 컬럼 이름")
    offset: float = Field(1.0, description="오프셋 값")

# 제곱근 변환 요청
class SqrtTransformRequest(BasePreprocessingRequest):
    column: str = Field(..., description="변환할 컬럼 이름")

# 원-핫 인코딩 요청
class OneHotEncodingRequest(BasePreprocessingRequest):
    column: str = Field(..., description="인코딩할 컬럼 이름")

# 레이블 인코딩 요청
class LabelEncodingRequest(BasePreprocessingRequest):
    column: str = Field(..., description="인코딩할 컬럼 이름")

# 타겟 인코딩 요청
class TargetEncodingRequest(BasePreprocessingRequest):
    column: str = Field(..., description="인코딩할 컬럼 이름")
    target_column: str = Field(..., description="타겟 컬럼 이름", alias="targetColumn")

# 클래스 불균형 처리 요청
class ClassBalancingRequest(BasePreprocessingRequest):
    target_column: str = Field(..., description="타겟 컬럼 이름", alias="targetColumn")
    sampling_ratio: int = Field(200, description="샘플링 비율 (%)", alias="samplingRatio")
    method: str = Field(..., description="불균형 처리 방법 ('OVER', 'UNDER')")