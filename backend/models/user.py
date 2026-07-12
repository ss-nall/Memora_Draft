import uuid
from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, DateTime
# pyrefly: ignore [missing-import]
from sqlalchemy.dialects.postgresql import UUID
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship

from core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True) # Nullable for OAuth users
    full_name = Column(String, nullable=False)
    face_embedding_id = Column(String, nullable=True) # Linked to FAISS index
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    events = relationship("Event", back_populates="photographer", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="user", cascade="all, delete-orphan")
