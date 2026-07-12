from typing import Optional
from datetime import datetime
from pydantic import BaseModel
import uuid

# Shared properties
class EventBase(BaseModel):
    name: str
    date: datetime
    location: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[dict] = {}

# Properties to receive on creation
class EventCreate(EventBase):
    pass

# Properties to receive on update
class EventUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[datetime] = None
    location: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[dict] = None
    is_active: Optional[bool] = None

# Properties to return to client
class EventResponse(EventBase):
    id: uuid.UUID
    photographer_id: uuid.UUID
    invite_code: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
