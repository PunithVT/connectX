"""Community / Group — spaces for alumni to help each other (req #2a)."""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Community(Base):
    __tablename__ = "communities"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    memberships = relationship(
        "GroupMembership",
        back_populates="community",
        cascade="all, delete-orphan",
    )


class GroupMembership(Base):
    __tablename__ = "group_memberships"

    id = Column(Integer, primary_key=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(16), default="member")  # member | moderator
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    community = relationship("Community", back_populates="memberships")
    user = relationship("User")
