from pydantic import BaseModel, Field
from bson import ObjectId
from typing import List, Dict, Any, Optional
from datetime import datetime
from pipeline import PyObjectId
import enum

class ColumnType(str, enum.Enum):
    NUMERIC = "NUMERIC"
    CATEGORICAL = "CATEGORICAL" 
    TEXT = "TEXT"
    DATETIME = "DATETIME"

class DatasetColumn(BaseModel):
    name: str
    type: ColumnType
    statistics: Dict[str, Any]

class DatasetModel(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    project_id: int
    member_id: int
    name: str
    description: Optional[str] = None
    file_path: str
    file_size: int
    columns: List[DatasetColumn] = []
    registered_at: datetime = Field(default_factory=datetime.now())
    modified_at: datetime = Field(default_factory=datetime.now())
    etag: str  # MinIO 또는 S3의 ETag
    is_deleted: bool = False

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}