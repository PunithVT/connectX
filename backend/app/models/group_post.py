"""Group posts — each community gets its own discussion feed (req #2a)."""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class GroupPost(Base):
    __tablename__ = "group_posts"

    id = Column(Integer, primary_key=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    community = relationship("Community")
    author = relationship("User")
