"""Opportunity — hiring need OR job-seeking post (req #4a / #4b)."""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    kind = Column(String(8), nullable=False, index=True)  # hiring | seeking
    title = Column(String(255), nullable=False)
    description = Column(Text)
    expertise_domain = Column(String(255), index=True)  # used for matching
    location = Column(String(255))
    company = Column(String(255))
    status = Column(String(16), default="open", nullable=False)  # open | closed
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    author = relationship("User")
