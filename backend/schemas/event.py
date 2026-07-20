from typing import Optional
from datetime import datetime
from pydantic import BaseModel
import uuid

# Shared properties
class EventBase(BaseModel):
    title: str
    date: datetime
    description: Optional[str] = None

# Properties to receive on creation
class EventCreate(EventBase):
    pass

# Properties to receive on update
class EventUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[datetime] = None
    description: Optional[str] = None

# Properties to return to client
class EventResponse(EventBase):
    id: uuid.UUID
    invite_code: str
    created_at: datetime

    class Config:
        from_attributes = True
