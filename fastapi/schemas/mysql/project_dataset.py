from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from db.mysql_config import Base

class ProjectDataset(Base):
    __tablename__ = "project_dataset"

    project_dataset_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    dataset_etag = Column(String(50), nullable=False)

    # 관계 설정
    project = relationship("Project", back_populates="datasets")

    def __repr__(self):
        return f"<ProjectDataset(project_dataset_id={self.project_dataset_id}, project_id={self.project_id})>"