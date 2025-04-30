from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from db.mysql_config import Base

class CategoryType(str, enum.Enum):
    CATEGORY_1 = "project_category_1"
    CATEGORY_2 = "project_category_2"
    CATEGORY_3 = "project_category_3"

class DomainType(str, enum.Enum):
    DOMAIN_1 = "project_domain_1"
    DOMAIN_2 = "project_domain_2"
    DOMAIN_3 = "project_domain_3"

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