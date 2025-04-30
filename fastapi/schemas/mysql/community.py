from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from db.mysql_config import Base


class Download(Base):
    __tablename__ = "download"

    member_id = Column(Integer, ForeignKey("members.member_id"), primary_key=True)
    pipeline_id = Column(String(36), ForeignKey("pipelines.pipeline_id"), primary_key=True)

    # 관계 설정
    member = relationship("Member", back_populates="downloads")
    pipeline = relationship("Pipeline", back_populates="downloads")

    def __repr__(self):
        return f"<Download(member_id={self.member_id}, pipeline_id='{self.pipeline_id}')>"

# 좋아요 모델
class Like(Base):
    __tablename__ = "like"

    member_id = Column(Integer, ForeignKey("members.member_id"), primary_key=True)
    pipeline_id = Column(String(36), ForeignKey("pipelines.pipeline_id"), primary_key=True)

    # 관계 설정
    member = relationship("Member", back_populates="likes")
    pipeline = relationship("Pipeline", back_populates="likes")

    def __repr__(self):
        return f"<Like(member_id={self.member_id}, pipeline_id='{self.pipeline_id}')>"

# 포크 모델
class Fork(Base):
    __tablename__ = "fork"

    member_id = Column(Integer, ForeignKey("members.member_id"), primary_key=True)
    pipeline_id = Column(String(36), ForeignKey("pipelines.pipeline_id"), primary_key=True)

    # 관계 설정
    member = relationship("Member", back_populates="forks")
    pipeline = relationship("Pipeline", back_populates="forks")

    def __repr__(self):
        return f"<Fork(member_id={self.member_id}, pipeline_id='{self.pipeline_id}')>"
