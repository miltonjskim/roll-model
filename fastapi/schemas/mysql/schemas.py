from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from db.mysql_config import Base

# Enum 정의
class ProviderType(str, enum.Enum):
    google = "google"
    github = "github"

class PipelineStatus(str, enum.Enum):
    CREATED = "CREATED"
    LEARNING = "LEARNING"
    PREPROCESSING = "PREPROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class CategoryType(str, enum.Enum):
    REGRESSION = "REGRESSION"
    CLASSIFICATION = "CLASSIFICATION"

class DomainType(str, enum.Enum):
    FINANCE = "FINANCE"
    HEALTHCARE = "HEALTHCARE"
    RETAIL = "RETAIL"
    MARKETING = "MARKETING"
    MANUFACTURING = "MANUFACTURING"
    EDUCATION = "EDUCATION"
    REAL_ESTATE = "REAL_ESTATE"
    LOGISTICS = "LOGISTICS"
    ENTERTAINMENT = "ENTERTAINMENT"
    GENERAL = "GENERAL"

# Member 모델
class Member(Base):
    __tablename__ = "members"

    member_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider = Column(Enum(ProviderType), nullable=False)
    email = Column(String(30), nullable=False)
    nickname = Column(String(100), nullable=True)
    registered_at = Column(DateTime, nullable=False, server_default=func.now())
    modified_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    deleted_yn = Column(Boolean, nullable=False, default=False)

    # 관계 설정
    projects = relationship("Project", back_populates="member", cascade="all, delete-orphan")
    downloads = relationship("Download", back_populates="member", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="member", cascade="all, delete-orphan")
    forks = relationship("Fork", back_populates="member", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Member(member_id={self.member_id}, email='{self.email}')>"

# Project 모델
class Project(Base):
    __tablename__ = "projects"

    project_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    member_id = Column(Integer, ForeignKey("members.member_id"), nullable=False)
    title = Column(String(30), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(Enum(CategoryType), nullable=False)
    domain = Column(Enum(DomainType), nullable=False)
    registered_at = Column(DateTime, nullable=False, server_default=func.now())
    modified_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    deleted_yn = Column(Boolean, nullable=False, default=False)
    public_yn = Column(Boolean, nullable=False, default=True)

    # 관계 설정
    member = relationship("Member", back_populates="projects")
    pipelines = relationship("Pipeline", back_populates="project", cascade="all, delete-orphan")
    datasets = relationship("ProjectDataset", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project(project_id={self.project_id}, title='{self.title}')>"

# Pipeline 모델
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

# Download 모델
class Download(Base):
    __tablename__ = "downloads"

    member_id = Column(Integer, ForeignKey("members.member_id"), primary_key=True)
    pipeline_id = Column(String(36), ForeignKey("pipelines.pipeline_id"), primary_key=True)

    # 관계 설정
    member = relationship("Member", back_populates="downloads")
    pipeline = relationship("Pipeline", back_populates="downloads")

    def __repr__(self):
        return f"<Download(member_id={self.member_id}, pipeline_id='{self.pipeline_id}')>"

# Like 모델
class Like(Base):
    __tablename__ = "likes"

    member_id = Column(Integer, ForeignKey("members.member_id"), primary_key=True)
    pipeline_id = Column(String(36), ForeignKey("pipelines.pipeline_id"), primary_key=True)

    # 관계 설정
    member = relationship("Member", back_populates="likes")
    pipeline = relationship("Pipeline", back_populates="likes")

    def __repr__(self):
        return f"<Like(member_id={self.member_id}, pipeline_id='{self.pipeline_id}')>"

# Fork 모델
class Fork(Base):
    __tablename__ = "forks"

    member_id = Column(Integer, ForeignKey("members.member_id"), primary_key=True)
    pipeline_id = Column(String(36), ForeignKey("pipelines.pipeline_id"), primary_key=True)

    # 관계 설정
    member = relationship("Member", back_populates="forks")
    pipeline = relationship("Pipeline", back_populates="forks")

    def __repr__(self):
        return f"<Fork(member_id={self.member_id}, pipeline_id='{self.pipeline_id}')>"

# ProjectDataset 모델
class ProjectDataset(Base):
    __tablename__ = "project_datasets"

    project_dataset_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    dataset_etag = Column(String(50), nullable=False)

    # 관계 설정
    project = relationship("Project", back_populates="datasets")

    def __repr__(self):
        return f"<ProjectDataset(project_dataset_id={self.project_dataset_id}, project_id={self.project_id})>"

# 매퍼 구성 - 모든 모델 정의 후 호출
from sqlalchemy.orm import configure_mappers
configure_mappers()