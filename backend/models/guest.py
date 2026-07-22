import uuid
from sqlalchemy import Column, String, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from core.database import Base

class Guest(Base):
    __tablename__ = "guests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False, index=True)
    email = Column(String, nullable=True, index=True)
    
    # Store the 512-dimensional vector as a JSON list of floats
    embedding = Column(JSON, nullable=False)

    # Relationships
    event = relationship("Event")
