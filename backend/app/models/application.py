"""Job applications & referrals — connects opportunities to real candidates.

Bridges the opportunity board toward an ATS-style flow: alumni apply to a
hiring post, or refer a connection (referral bonus eligible).
"""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("opportunity_id", "applicant_id", name="uq_application"),
    )

    id = Column(Integer, primary_key=True)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id"), nullable=False, index=True)
    applicant_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    referred_by = Column(Integer, ForeignKey("users.id"))  # set if a connection referred them
    note = Column(Text)
    status = Column(String(16), default="applied", nullable=False)
    # applied | shortlisted | hired | rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    opportunity = relationship("Opportunity")
    applicant = relationship("User", foreign_keys=[applicant_id])
    referrer = relationship("User", foreign_keys=[referred_by])
