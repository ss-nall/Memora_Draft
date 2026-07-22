import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from core.database import Base

class MediaType(enum.Enum):
    PHOTO = "PHOTO"
    VIDEO = "VIDEO"

class Media(Base):
    __tablename__ = "media"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False, index=True)
    uploader_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    media_type = Column(Enum(MediaType), nullable=False, index=True)
    
    # Cloudinary fields
    cloudinary_public_id = Column(String, nullable=True)
    cloudinary_url = Column(String, nullable=True)
    storage_url = Column(String, nullable=False) # Keep this for backwards compatibility or local fallback
    
    status = Column(String, default="processing") # 'processing', 'completed', 'failed'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    event = relationship("Event", back_populates="media")
    uploader = relationship("User")
