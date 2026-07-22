from typing import Optional
from pydantic import BaseModel, EmailStr
import uuid

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    profile_picture: Optional[str] = None
    email_verified: Optional[str] = "false"

# Properties to return to client
class UserResponse(UserBase):
    id: uuid.UUID
    google_id: Optional[str] = None

    class Config:
        from_attributes = True

# Token schemas
class TokenPayload(BaseModel):
    sub: Optional[str] = None
    type: Optional[str] = None
