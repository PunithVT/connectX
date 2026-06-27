"""Alumni success stories / spotlight — re-engagement & marketing showcase."""
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Spotlight(Base):
    __tablename__ = "spotlights"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    story = Column(Text, nullable=False)
    program_trained = Column(String(255))
    cover_emoji = Column(String(8), default="🏆")
    is_featured = Column(Boolean, default=False, nullable=False, index=True)
    likes = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User")
