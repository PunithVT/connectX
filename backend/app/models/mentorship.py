"""Mentorship — paid sessions on Rooman programs (req #2b)."""
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


class MentorProfile(Base):
    """An alum who has opted in to deliver paid mentorship."""

    __tablename__ = "mentor_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    programs = Column(Text)  # comma-separated Rooman programs they can mentor on
    headline = Column(String(255))
    bio = Column(Text)
    hourly_rate = Column(Float, default=0.0)  # INR/hour, industry standard
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="mentor_profile")
    sessions = relationship(
        "MentorshipSession",
        back_populates="mentor",
        cascade="all, delete-orphan",
    )


class MentorshipSession(Base):
    """A booked (and paid) mentorship session."""

    __tablename__ = "mentorship_sessions"

    id = Column(Integer, primary_key=True)
    mentor_id = Column(Integer, ForeignKey("mentor_profiles.id"), nullable=False)
    mentee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    program = Column(String(255))
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, default=60)
    amount = Column(Float, default=0.0)
    status = Column(String(16), default="requested", nullable=False)
    # requested | confirmed | completed | cancelled
    payment_status = Column(String(16), default="pending", nullable=False)
    # pending | paid | refunded
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    mentor = relationship("MentorProfile", back_populates="sessions")
    mentee = relationship("User", foreign_keys=[mentee_id])
