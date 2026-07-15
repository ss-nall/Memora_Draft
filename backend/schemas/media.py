from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel
import uuid

class MediaBase(BaseModel):
    event_id: uuid.UUID

class MediaCreate(MediaBase):
    storage_url: str
    media_type: str

class MediaResponse(MediaBase):
    id: uuid.UUID
    storage_url: str
    media_type: Any
    created_at: datetime

    class Config:
        from_attributes = True
