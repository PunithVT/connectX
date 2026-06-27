"""StartupProject — StartupVarsity resource application (req #2c)."""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class StartupProject(Base):
    __tablename__ = "startup_projects"

    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    pitch = Column(Text)
    stage = Column(String(32), default="idea")  # idea | mvp | revenue | scaling
    resources_requested = Column(Text)  # what Rooman resources they want
    status = Column(String(16), default="submitted", nullable=False)
    # submitted | under_review | approved | rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User")
