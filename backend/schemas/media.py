from typing import Optional
from datetime import datetime
from pydantic import BaseModel
import uuid

class MediaBase(BaseModel):
    event_id: uuid.UUID

class MediaCreate(MediaBase):
    file_path: str
    file_type: str
    face_embeddings_id: Optional[str] = None

class MediaResponse(MediaBase):
    id: uuid.UUID
    file_path: str
    file_type: str
    face_embeddings_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
