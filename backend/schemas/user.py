from typing import Optional
from pydantic import BaseModel, EmailStr
import uuid

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    full_name: str

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str

# Properties to return to client
class UserResponse(UserBase):
    id: uuid.UUID

    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
