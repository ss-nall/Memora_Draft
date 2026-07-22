import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from core.database import Base

class MemoryType(enum.Enum):
    GALLERY = "GALLERY"
    VIDEO_MOMENT = "VIDEO_MOMENT"
    AI_REEL = "AI_REEL"

class Memory(Base):
    __tablename__ = "memories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False)
    memory_type = Column(Enum(MemoryType), nullable=False)
    result_url = Column(String, nullable=False) # Cloudinary URL or JSON serialized URLs
    created_at = Column(DateTime, default=datetime.utcnow)

    # Constraints: A user can have one memory result of a specific type per event. 
    # E.g. one AI_REEL for Event A. (Could be multiple galleries depending on business logic, but unique constraint fits typical AI generated reels)
    __table_args__ = (
        UniqueConstraint('user_id', 'event_id', 'memory_type', name='uix_user_event_memory_type'),
    )

    # Relationships
    user = relationship("User", back_populates="memories")
    event = relationship("Event", back_populates="memories")
