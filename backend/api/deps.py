import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session
from pydantic import ValidationError

from core.config import settings
from core.database import get_db
from models.user import User
from models.event_member import EventMember, EventRole
from schemas.user import TokenPayload

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)

reusable_oauth2_optional = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    auto_error=False
)

def _to_uuid(val):
    if val is None:
        return None
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except Exception:
        return val

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=["HS256"]
        )
        token_data = TokenPayload(**payload)
        if payload.get("type") != "access":
            raise HTTPException(status_code=403, detail="Not an access token")
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    sub_val = _to_uuid(token_data.sub)
    user = db.query(User).filter(User.id == sub_val).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_optional_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2_optional)
) -> User | None:
    if not token:
        return None
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=["HS256"]
        )
        token_data = TokenPayload(**payload)
        if payload.get("type") != "access":
            return None
        sub_val = _to_uuid(token_data.sub)
        return db.query(User).filter(User.id == sub_val).first()
    except Exception:
        return None

def require_event_role(allowed_roles: list[EventRole]):
    """
    Dependency factory to check if the current user has one of the allowed roles
    for a given event_id (which must be in the route path).
    """
    def role_checker(
        event_id: str,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        ev_id = _to_uuid(event_id)
        u_id = _to_uuid(current_user.id)
        membership = db.query(EventMember).filter(
            EventMember.event_id == ev_id,
            EventMember.user_id == u_id,
            EventMember.status == "active"
        ).first()

        if not membership or membership.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action in this event."
            )
        return current_user
    return role_checker


