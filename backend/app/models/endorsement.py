"""Skill endorsements — LinkedIn-style social proof between connected alumni.

One alum endorses another for a specific skill. Counts roll up on the profile.
"""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Endorsement(Base):
    __tablename__ = "endorsements"
    __table_args__ = (
        UniqueConstraint("endorser_id", "endorsee_id", "skill", name="uq_endorsement"),
    )

    id = Column(Integer, primary_key=True)
    endorser_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    endorsee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill = Column(String(80), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    endorser = relationship("User", foreign_keys=[endorser_id])
    endorsee = relationship("User", foreign_keys=[endorsee_id])
