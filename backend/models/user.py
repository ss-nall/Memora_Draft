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
    google_id = Column(String, unique=True, index=True, nullable=True) # For OAuth
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    profile_picture = Column(String, nullable=True)
    email_verified = Column(String, default="false") # 'true' or 'false'
    
    face_embedding_id = Column(String, nullable=True) # Linked to FAISS index
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    event_memberships = relationship("EventMember", back_populates="user", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
