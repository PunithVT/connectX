"""Mentor reviews — post-session ratings powering the mentor leaderboard."""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class MentorReview(Base):
    __tablename__ = "mentor_reviews"

    id = Column(Integer, primary_key=True)
    session_id = Column(
        Integer, ForeignKey("mentorship_sessions.id"), unique=True, nullable=False
    )
    mentor_id = Column(Integer, ForeignKey("mentor_profiles.id"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1..5
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    mentor = relationship("MentorProfile")
    reviewer = relationship("User")
