from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
import uuid
from models.memory import MemoryType

class ReelSettingsSchema(BaseModel):
    template: Optional[str] = "minimal"
    transition: Optional[str] = "fade"
    background: Optional[str] = "solid"
    speed: Optional[str] = "normal"
    musicUrl: Optional[str] = None

class MemoryCreateRequest(BaseModel):
    event_id: uuid.UUID
    invite_code: str
    memory_type: MemoryType
    target_embedding: List[float]
    settings: Optional[ReelSettingsSchema] = None

class MemoryResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    event_id: uuid.UUID
    memory_type: MemoryType
    result_url: str
    created_at: datetime

    class Config:
        from_attributes = True

class MemoryTaskResponse(BaseModel):
    task_id: str
    status: str
