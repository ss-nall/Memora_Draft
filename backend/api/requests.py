import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from models.contributor_request import ContributorRequest, RequestStatus
from models.event_member import EventMember, EventRole
from models.notification import Notification
from models.user import User
from api.deps import get_current_user, require_event_role

router = APIRouter()

@router.post("/{event_id}/request-contributor")
def request_contributor(
    *,
    db: Session = Depends(get_db),
    event_id: uuid.UUID,
    current_user: User = Depends(require_event_role([EventRole.USER, EventRole.CONTRIBUTOR, EventRole.ADMIN])),
) -> Any:
    """
    Request contributor access for an event.
    """
    # Check if they are already an admin or contributor
    membership = db.query(EventMember).filter(
        EventMember.event_id == event_id,
        EventMember.user_id == current_user.id
    ).first()
    
    if membership and membership.role in [EventRole.ADMIN, EventRole.CONTRIBUTOR]:
        raise HTTPException(status_code=400, detail="You already have contributor or admin access to this event.")
    existing = db.query(ContributorRequest).filter(
        ContributorRequest.event_id == event_id,
        ContributorRequest.user_id == current_user.id,
        ContributorRequest.status == RequestStatus.PENDING
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending request.")

    req = ContributorRequest(
        event_id=event_id,
        user_id=current_user.id
    )
    db.add(req)
    
    # Find Admin and notify them
    admin_membership = db.query(EventMember).filter(
        EventMember.event_id == event_id,
        EventMember.role == EventRole.ADMIN
    ).first()

    if admin_membership:
        notification = Notification(
            user_id=admin_membership.user_id,
            message=f"{current_user.full_name} requested contributor access for an event.",
            type="CONTRIBUTOR_REQUEST"
        )
        db.add(notification)

    db.commit()
    return {"message": "Request submitted successfully"}

@router.get("/{event_id}/requests")
def get_contributor_requests(
    *,
    db: Session = Depends(get_db),
    event_id: uuid.UUID,
    current_user: User = Depends(require_event_role([EventRole.ADMIN])),
) -> Any:
    """
    Get all contributor requests for an event (Admin only).
    """
    requests = db.query(ContributorRequest).filter(
        ContributorRequest.event_id == event_id
    ).all()
    
    results = []
    for r in requests:
        results.append({
            "id": str(r.id),
            "user": {
                "id": str(r.user.id),
                "full_name": r.user.full_name,
                "email": r.user.email
            },
            "status": r.status.value,
            "requested_at": r.requested_at
        })
    return results

@router.put("/requests/{request_id}/approve")
def approve_request(
    *,
    db: Session = Depends(get_db),
    request_id: uuid.UUID,
    current_user: User = Depends(get_current_user), # Requires explicit check since event_id is not in path
) -> Any:
    """
    Approve a contributor request.
    """
    req = db.query(ContributorRequest).filter(ContributorRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    # Verify current user is admin of this event
    admin_check = db.query(EventMember).filter(
        EventMember.event_id == req.event_id,
        EventMember.user_id == current_user.id,
        EventMember.role == EventRole.ADMIN
    ).first()
    if not admin_check:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    req.status = RequestStatus.APPROVED
    
    # Update Role
    membership = db.query(EventMember).filter(
        EventMember.event_id == req.event_id,
        EventMember.user_id == req.user_id
    ).first()
    if membership:
        membership.role = EventRole.CONTRIBUTOR
        
    # Notify user
    notification = Notification(
        user_id=req.user_id,
        message="Your contributor request has been approved.",
        type="CONTRIBUTOR_APPROVED"
    )
    db.add(notification)
    db.commit()
    return {"message": "Request approved"}

@router.put("/requests/{request_id}/reject")
def reject_request(
    *,
    db: Session = Depends(get_db),
    request_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Reject a contributor request.
    """
    req = db.query(ContributorRequest).filter(ContributorRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    # Verify current user is admin of this event
    admin_check = db.query(EventMember).filter(
        EventMember.event_id == req.event_id,
        EventMember.user_id == current_user.id,
        EventMember.role == EventRole.ADMIN
    ).first()
    if not admin_check:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    req.status = RequestStatus.REJECTED
    
    # Notify user
    notification = Notification(
        user_id=req.user_id,
        message="Your contributor request has been rejected.",
        type="CONTRIBUTOR_REJECTED"
    )
    db.add(notification)
    db.commit()
    return {"message": "Request rejected"}
