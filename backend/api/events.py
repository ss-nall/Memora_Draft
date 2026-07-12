import uuid
import secrets
import string
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from models.event import Event
from models.user import User
from schemas.event import EventCreate, EventResponse, EventUpdate
from api.deps import get_current_user

router = APIRouter()

def generate_invite_code(length: int = 8) -> str:
    """Generate a random alphanumeric invite code."""
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

@router.post("/", response_model=EventResponse)
def create_event(
    *,
    db: Session = Depends(get_db),
    event_in: EventCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create a new event. The logged-in user becomes the photographer/organizer.
    """
    # Auto-generate a unique invite code
    invite_code = generate_invite_code()
    while db.query(Event).filter(Event.invite_code == invite_code).first() is not None:
        invite_code = generate_invite_code()

    event = Event(
        name=event_in.name,
        date=event_in.date,
        location=event_in.location,
        description=event_in.description,
        settings=event_in.settings,
        photographer_id=current_user.id,
        invite_code=invite_code
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.get("/", response_model=List[EventResponse])
def read_events(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve all events created by the current user.
    """
    events = db.query(Event).filter(Event.photographer_id == current_user.id).offset(skip).limit(limit).all()
    return events

@router.get("/{event_id}", response_model=EventResponse)
def read_event(
    *,
    db: Session = Depends(get_db),
    event_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get a specific event by ID.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.photographer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return event
