"""Alumni profile — captures current employment & expertise at registration."""
from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, func
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

    # Network intent flags
    open_to_mentoring = Column(String(8), default="no")     # paid mentorship
    open_to_opportunities = Column(String(8), default="no") # seeking jobs
    interested_in_startupvarsity = Column(String(8), default="no")

    headline = Column(String(255))
    bio = Column(Text)
    avatar_url = Column(String(512))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="profile")
