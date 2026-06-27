"""User — authentication identity for an alumnus or admin."""
from sqlalchemy import Boolean, Column, DateTime, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(16), default="alumnus", nullable=False)  # alumnus | admin
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    profile = relationship(
        "AlumniProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    posts = relationship(
        "Post", back_populates="author", cascade="all, delete-orphan"
    )
    mentor_profile = relationship(
        "MentorProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    notifications = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )
