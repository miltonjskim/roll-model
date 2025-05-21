from pydantic import BaseModel, Field
from bson import ObjectId
from typing import List, Dict, Any, Optional
from datetime import datetime
from ..mongo.pipeline import PyObjectId
import enum

class ColumnType(str, enum.Enum):
    string = "string"
    datetime = "datetime"
    integer = "integer"
    boolean = "boolean"
    double = "double"

# 데이터셋 도메인 정의
class DatasetDomain(str, enum.Enum):
    FINANCE = "FINANCE"         # 금융/핀테크 관련 프로젝트
    HEALTHCARE = "HEALTHCARE"   # 의료/헬스케어 관련 프로젝트
    RETAIL = "RETAIL"           # 소매/이커머스 관련 프로젝트
    MARKETING = "MARKETING"     # 마케팅/광고 관련 프로젝트
    MANUFACTURING = "MANUFACTURING"  # 제조/산업 관련 프로젝트
    EDUCATION = "EDUCATION"     # 교육/학습 관련 프로젝트
    REAL_ESTATE = "REAL_ESTATE" # 부동산/건설 관련 프로젝트
    LOGISTICS = "LOGISTICS"     # 운송/물류 관련 프로젝트
    ENTERTAINMENT = "ENTERTAINMENT"  # 엔터테인먼트/미디어 관련 프로젝트
    GENERAL = "GENERAL"         # 일반/기타 범용 프로젝트

# 데이터셋 카테고리 정의
class DatasetCategory(str, enum.Enum):
    REGRESSION = "REGRESSION"       # 회귀 (연속형 변수)
    CLASSIFICATION = "CLASSIFICATION"  # 분류 (범주형 변수)

class DatasetColumn(BaseModel):
    name: str
    type: ColumnType
    statistics: Dict[str, Any]

class DatasetModel(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    project_id: int
    member_id: int
    name: Optional[str] = None  # 선택적 필드
    description: Optional[str] = None # 선택적 필드
    dataset_file_path: str
    file_size: int
    registered_at: datetime = Field(default_factory=datetime.now())
    modified_at: datetime = Field(default_factory=datetime.now())
    etag: str  # MinIO 또는 S3의 ETag
    object_name: str
    is_deleted: bool = False
    metadata: Optional[Dict[str, Any]] = None,
    is_preprocessed: bool = False

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}