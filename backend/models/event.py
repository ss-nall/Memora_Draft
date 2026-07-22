import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from core.database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
    invite_code = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    members = relationship("EventMember", back_populates="event", cascade="all, delete-orphan")
    media = relationship("Media", back_populates="event", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="event", cascade="all, delete-orphan")
    contributor_requests = relationship("ContributorRequest", back_populates="event", cascade="all, delete-orphan")
