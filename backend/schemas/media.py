from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel
import uuid

class MediaBase(BaseModel):
    event_id: uuid.UUID

class MediaCreate(MediaBase):
    storage_url: str
    media_type: str

class UploaderInfo(BaseModel):
    full_name: str
    
    class Config:
        from_attributes = True

class MediaResponse(MediaBase):
    id: uuid.UUID
    storage_url: str
    media_type: Any
    created_at: datetime
    timestamps: Optional[list[float]] = None
    uploader: Optional[UploaderInfo] = None

    class Config:
        from_attributes = True
