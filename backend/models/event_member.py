import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from core.database import Base

class EventRole(enum.Enum):
    ADMIN = "ADMIN"
    CONTRIBUTOR = "CONTRIBUTOR"
    USER = "USER"

class EventMember(Base):
    __tablename__ = "event_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    role = Column(Enum(EventRole), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="active") # active, inactive

    # Relationships
    event = relationship("Event", back_populates="members")
    user = relationship("User", back_populates="event_memberships")
