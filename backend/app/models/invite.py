"""Invite — a tokenized invitation to join the alumni network (req #1)."""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func

from app.db.base import Base


class Invite(Base):
    __tablename__ = "invites"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), index=True, nullable=False)
    full_name = Column(String(255))

    # Rooman training history (pre-filled from alumni records)
    program_trained = Column(String(255))
    batch_year = Column(Integer)

    token = Column(String(128), unique=True, index=True, nullable=False)
    status = Column(String(16), default="pending", nullable=False)
    # pending | sent | accepted | expired

    invited_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
