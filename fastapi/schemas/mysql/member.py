from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from db.mysql_config import Base

class ProviderType(str, enum.Enum):
    google = "google"
    github = "github"

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