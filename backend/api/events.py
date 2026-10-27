import uuid
import secrets
import string
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from models.event import Event
from models.user import User
from models.event_member import EventMember, EventRole
from schemas.event import EventCreate, EventResponse, EventUpdate
from api.deps import get_current_user, get_optional_current_user, require_event_role

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
    current_user: User | None = Depends(get_optional_current_user),
) -> Any:
    """
    Create a new event. The logged-in user or demo admin becomes the Event Admin.
    """
    invite_code = generate_invite_code()
    while db.query(Event).filter(Event.invite_code == invite_code).first() is not None:
        invite_code = generate_invite_code()

    event = Event(
        title=event_in.title,
        date=event_in.date,
        description=event_in.description,
        invite_code=invite_code
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Assign Admin role
    admin_user = current_user or db.query(User).filter(User.email == "demo@memora.ai").first()
    if admin_user:
        member = EventMember(
            event_id=event.id,
            user_id=admin_user.id,
            role=EventRole.ADMIN
        )
        db.add(member)
        db.commit()

    return event

@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    *,
    db: Session = Depends(get_db),
    event_id: uuid.UUID,
    event_in: EventUpdate,
    current_user: User = Depends(require_event_role([EventRole.ADMIN])),
) -> Any:
    """
    Update an event (Admin only).
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if event_in.title is not None:
        event.title = event_in.title
    if event_in.date is not None:
        event.date = event_in.date
    if event_in.description is not None:
        event.description = event_in.description
    db.commit()
    db.refresh(event)
    return event

@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> Any:
    """
    Get dashboard analytics for the current user or demo.
    """
    from models.media import Media
    if current_user:
        memberships = db.query(EventMember).filter(EventMember.user_id == current_user.id).all()
        event_ids = [m.event_id for m in memberships]
        active_events = len(event_ids)
        asset_volume = db.query(Media).filter(Media.event_id.in_(event_ids)).count() if event_ids else 0
    else:
        active_events = db.query(Event).count()
        asset_volume = db.query(Media).count()
    
    return {
        "active_events": active_events,
        "asset_volume": asset_volume,
        "recognition_accuracy": 99.8
    }

@router.get("/", response_model=List[EventResponse])
def read_events(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User | None = Depends(get_optional_current_user),
) -> Any:
    """
    Retrieve all events where the current user is a member, or all events if demo/unauthenticated.
    """
    if current_user:
        memberships = db.query(EventMember).filter(EventMember.user_id == current_user.id).offset(skip).limit(limit).all()
        event_ids = [m.event_id for m in memberships]
        events = db.query(Event).filter(Event.id.in_(event_ids)).all()
    else:
        events = db.query(Event).offset(skip).limit(limit).all()
    return events

@router.get("/{event_id}", response_model=EventResponse)
def read_event(
    *,
    db: Session = Depends(get_db),
    event_id: uuid.UUID,
    current_user: User = Depends(require_event_role([EventRole.ADMIN, EventRole.CONTRIBUTOR, EventRole.USER])),
) -> Any:
    """
    Get a specific event by ID (must be a member).
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.delete("/{event_id}")
def delete_event(
    *,
    db: Session = Depends(get_db),
    event_id: uuid.UUID,
    current_user: User = Depends(require_event_role([EventRole.ADMIN])),
) -> Any:
    """
    Delete an event (Admin only).
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully"}
