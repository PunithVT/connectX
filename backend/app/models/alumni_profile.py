"""Alumni profile — captures current employment & expertise at registration."""
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


class AlumniProfile(Base):
    __tablename__ = "alumni_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Rooman history
    program_trained = Column(String(255))      # which Rooman program they took
    batch_year = Column(Integer)

    # Captured at registration (requirement #3)
    current_company = Column(String(255))
    current_title = Column(String(255))
    expertise_domain = Column(String(255))     # e.g. "Cloud / DevOps"
    skills = Column(Text)                       # comma-separated or JSON
    location = Column(String(255))
    linkedin_url = Column(String(512))

    # Network intent flags (set during onboarding)
    open_to_mentoring = Column(Boolean, default=False)       # paid mentorship
    open_to_opportunities = Column(Boolean, default=False)   # seeking jobs
    interested_in_startupvarsity = Column(Boolean, default=False)

    headline = Column(String(255))
    bio = Column(Text)
    avatar_url = Column(String(512))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="profile")
