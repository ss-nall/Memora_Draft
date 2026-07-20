import uuid
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from models.event import Event
from models.user import User
from models.event_member import EventMember, EventRole
from api.deps import get_current_user, require_event_role
from schemas.user import UserResponse

router = APIRouter()

@router.post("/{invite_code}/join")
def join_event(
    *,
    db: Session = Depends(get_db),
    invite_code: str,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Join an event using an invite code. User gets the 'USER' role by default.
    """
    event = db.query(Event).filter(Event.invite_code == invite_code).first()
    if not event:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    # Check if already a member
    membership = db.query(EventMember).filter(
        EventMember.event_id == event.id,
        EventMember.user_id == current_user.id
    ).first()

    if membership:
        if membership.status == "inactive":
            membership.status = "active"
            db.commit()
        return {"message": "Successfully joined the event", "event_id": str(event.id), "role": membership.role.value}

    # Add as USER
    new_member = EventMember(
        event_id=event.id,
        user_id=current_user.id,
        role=EventRole.USER
    )
    db.add(new_member)
    db.commit()

    return {"message": "Successfully joined the event", "event_id": str(event.id), "role": "USER"}

@router.get("/{event_id}/members")
def get_event_members(
    *,
    db: Session = Depends(get_db),
    event_id: uuid.UUID,
    current_user: User = Depends(require_event_role([EventRole.ADMIN])),
) -> Any:
    """
    Get all members of an event (Admin only).
    """
    memberships = db.query(EventMember).filter(EventMember.event_id == event_id).all()
    results = []
    for m in memberships:
        results.append({
            "user": {
                "id": str(m.user.id),
                "full_name": m.user.full_name,
                "email": m.user.email,
                "profile_picture": m.user.profile_picture
            },
            "role": m.role.value,
            "joined_at": m.joined_at,
            "status": m.status
        })
    return results

@router.delete("/{event_id}/members/{user_id}")
def remove_member(
    *,
    db: Session = Depends(get_db),
    event_id: uuid.UUID,
    user_id: uuid.UUID,
    current_user: User = Depends(require_event_role([EventRole.ADMIN])),
) -> Any:
    """
    Remove a member (Admin only).
    """
    membership = db.query(EventMember).filter(
        EventMember.event_id == event_id,
        EventMember.user_id == user_id
    ).first()

    if not membership:
        raise HTTPException(status_code=404, detail="Member not found")
    
    if membership.role == EventRole.ADMIN:
        raise HTTPException(status_code=400, detail="Cannot remove the event admin")

    db.delete(membership)
    db.commit()
    return {"message": "Member removed successfully"}
