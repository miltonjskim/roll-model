from pydantic import BaseModel, Field
from bson import ObjectId
from typing import List, Dict, Any, Optional
from datetime import datetime
from pipeline import AlgorithmType, PyObjectId

class FeatureImportance(BaseModel):
    feature_name: str
    importance: float

class Model(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    pipeline_id: str
    project_id: int
    member_id: int
    name: str
    type: str
    algorithm: AlgorithmType
    parameters: Dict[str, Any]
    metrics: Dict[str, Any]
    feature_importance: List[FeatureImportance] = []
    file_path: str
    registered_at: datetime = Field(default_factory=datetime.now())
    modified_at: datetime = Field(default_factory=datetime.now())
    is_deleted: bool = False

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}