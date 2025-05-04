from pydantic import BaseModel, Field
from bson import ObjectId
from typing import List, Dict, Any, Optional
from datetime import datetime
import enum
import json

from typing import Annotated, Union
from bson import ObjectId
from pydantic import AfterValidator

class RedisJSONEncoder(json.JSONEncoder):
    """ObjectId와 datetime을 처리하기 위한 JSON 인코더"""
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)
from bson import ObjectId
from pydantic_core import core_schema

class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(
            cls, _source_type: Any, _handler: Any
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ])
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def validate(cls, value) -> ObjectId:
        if not ObjectId.is_valid(value):
            raise ValueError("Invalid ObjectId")

        return ObjectId(value)

# Enums
class PipelineStatus(str, enum.Enum):
    CREATED = "CREATED"
    RUNNING = "RUNNING"
    LEARNING = "LEARNING"
    PREPROCESSED = "PREPROCESSED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class AlgorithmType(str, enum.Enum):
    RANDOM_FOREST = "RANDOM_FOREST"
    LOGISTIC_REGRESSION = "LOGISTIC_REGRESSION"
    LINEAR_REGRESSION = "LINEAR_REGRESSION"

class PreprocessingStepType(str, enum.Enum):
    MISSING_VALUE = "MISSING_VALUE"
    OUTLIER_DETECTION = "OUTLIER_DETECTION"
    FEATURE_SCALING = "FEATURE_SCALING"
    FEATURE_ENCODING = "FEATURE_ENCODING"

# Pydantic models
class PreprocessingStep(BaseModel):
    type: PreprocessingStepType
    parameters: Dict[str, Any]
    order: int
    active: bool = True
    preprocessed_dataset_etag: Optional[str] = ""

class DataSplit(BaseModel):
    train_ratio: float
    test_ratio: float
    validation_ratio: float
    random_seed: int

class ModelingInfo(BaseModel):
    algorithm: AlgorithmType
    data_split: DataSplit
    parameters: Dict[str, Any]
    target_feature: str

class PipelineHistoryItem(BaseModel):
    model_id: Optional[PyObjectId] = None
    preprocessing_steps: List[PreprocessingStep] = []
    modeling_info: Optional[ModelingInfo] = None
    status: PipelineStatus = PipelineStatus.CREATED

class PipelineModel(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    project_id: int
    member_id: int
    registered_at: datetime = Field(default_factory=datetime.now)
    modified_at: datetime = Field(default_factory=datetime.now)
    original_dataset_etag: str = None
    history: List[PipelineHistoryItem] = []

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}