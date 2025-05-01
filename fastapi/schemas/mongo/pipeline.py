from pydantic import BaseModel, Field
from bson import ObjectId
from typing import List, Dict, Any, Optional
from datetime import datetime
import enum

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class PipelineStatus(str, enum.Enum):
    CREATED = "CREATED"
    RUNNING = "RUNNING" 
    LEARNING = "LEARNING"
    PREPROCESSING = "PREPROCESSING"
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

class PreprocessingStep(BaseModel):
    type: PreprocessingStepType
    parameters: Dict[str, Any]
    order: int
    active: bool = True

class DataSplit(BaseModel):
    train_ratio: float
    test_ratio: float
    validation_ratio: float
    random_seed: int

# 모델링 정보 모델
class ModelingInfo(BaseModel):
    algorithm: AlgorithmType
    data_split: DataSplit
    parameters: Dict[str, Any]
    target_feature: str

class PipelineModel(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    pipeline_id: str  # MySQL의 pipeline_id와 동일
    project_id: int  # MySQL의 project_id
    member_id: int  # MySQL의 member_id
    registered_at: datetime = Field(default_factory=datetime.now())
    modified_at: datetime = Field(default_factory=datetime.now())
    original_dataset_id: Optional[PyObjectId] = None
    preprocessed_dataset_id: Optional[PyObjectId] = None
    model_id: Optional[PyObjectId] = None
    preprocessing_steps: List[PreprocessingStep] = []
    modeling_info: Optional[ModelingInfo] = None
    status: PipelineStatus = PipelineStatus.CREATED
    is_public: bool = False
    metrics: Optional[Dict[str, Any]] = None

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}