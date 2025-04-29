from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from db.mysql_config import Base

class PipelineStatus(str, enum.Enum):
    CREATED = "CREATED"
    LEARNING = "LEARNING"
    PREPROCESSING = "PREPROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Pipeline(Base):
    __tablename__ = "pipelines"

    pipeline_id = Column(String(36), primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    public_yn = Column(Boolean, nullable=False, default=False)
    like_count = Column(Integer, nullable=False, default=0)
    fork_count = Column(Integer, nullable=False, default=0)
    download_count = Column(Integer, nullable=False, default=0)
    result = Column(Float, nullable=True)
    data_count = Column(Integer, nullable=True)
    target_feature = Column(String(20), nullable=True)
    status = Column(Enum(PipelineStatus), nullable=False, default=PipelineStatus.CREATED)
    version = Column(Float, nullable=False, default=1.0)
    registered_at = Column(DateTime, nullable=False, server_default=func.now())
    modified_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    deleted_yn = Column(Boolean, nullable=False, default=False)

    # 관계 설정
    project = relationship("Project", back_populates="pipelines")
    downloads = relationship("Download", back_populates="pipeline", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="pipeline", cascade="all, delete-orphan")
    forks = relationship("Fork", back_populates="pipeline", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Pipeline(pipeline_id={self.pipeline_id}, status='{self.status}')>"