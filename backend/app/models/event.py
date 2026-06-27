"""Events & webinars — alumni meetups, program launches, mentor AMAs (req #2a).

A major community-engagement driver: alumni RSVP, see who's attending, and get
in-app reminders/notifications.
"""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text)
    kind = Column(String(16), default="webinar", nullable=False, index=True)
    # webinar | meetup | ama | launch | workshop
    location = Column(String(255))  # physical venue or "Online"
    meeting_url = Column(String(512))  # for online events
    starts_at = Column(DateTime(timezone=True), nullable=False, index=True)
    ends_at = Column(DateTime(timezone=True))
    capacity = Column(Integer)  # optional cap; null = unlimited
    cover_emoji = Column(String(8), default="📅")
    status = Column(String(16), default="published", nullable=False)  # published | cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    host = relationship("User")
    rsvps = relationship(
        "EventRSVP", back_populates="event", cascade="all, delete-orphan"
    )


class EventRSVP(Base):
    __tablename__ = "event_rsvps"
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_rsvp"),
    )

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(16), default="going", nullable=False)  # going | waitlist
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="rsvps")
    user = relationship("User")
