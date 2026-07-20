import uuid
from sqlalchemy import Column, Float, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from core.database import Base

class Face(Base):
    __tablename__ = "faces"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False, index=True)
    media_id = Column(UUID(as_uuid=True), ForeignKey("media.id"), nullable=False, index=True)
    
    # Store the 512-dimensional vector as a JSON list of floats
    embedding = Column(JSON, nullable=False)
    
    # Timestamp is used for videos, null for photos
    timestamp = Column(Float, nullable=True)

    # Relationships
    event = relationship("Event")
    media = relationship("Media")
