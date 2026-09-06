import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel

from core.database import get_db
from models.event import Event
from models.user import User
from models.event_member import EventMember
from models.companion_request import CompanionRequest
from models.notification import Notification
from models.media import Media
from api.deps import get_current_user, get_optional_current_user
from core.ai import find_matching_photos

router = APIRouter()

class CompanionRespondRequest(BaseModel):
    action: str  # "ACCEPT" or "REJECT"

class GroupPhotoRequest(BaseModel):
    companion_user_ids: List[str]
    match_mode: str = "INTERSECTION"  # "INTERSECTION" (photos containing both/all) or "UNION" (photos containing any)

@router.get("/event/{event_id}/attendees")
def get_event_attendees(
    event_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> Any:
    """
    List all members who have joined this event, with their companion connection status.
    """
    if not current_user:
        return []

    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Get all members in this event
    members = db.query(EventMember).filter(EventMember.event_id == event_id).all()
    
    # Get all requests involving current_user in this event
    requests = db.query(CompanionRequest).filter(
        CompanionRequest.event_id == event_id,
        (CompanionRequest.sender_id == current_user.id) | (CompanionRequest.receiver_id == current_user.id)
    ).all()

    request_map = {}
    for req in requests:
        other_id = str(req.receiver_id if req.sender_id == current_user.id else req.sender_id)
        is_sender = req.sender_id == current_user.id
        request_map[other_id] = {
            "request_id": str(req.id),
            "status": req.status,
            "is_sender": is_sender
        }

    attendees = []
    for member in members:
        user = member.user
        if not user or user.id == current_user.id:
            continue
        
        user_id_str = str(user.id)
        conn = request_map.get(user_id_str)
        
        if conn:
            if conn["status"] == "ACCEPTED":
                status = "CONNECTED"
            elif conn["status"] == "PENDING":
                status = "PENDING_SENT" if conn["is_sender"] else "PENDING_RECEIVED"
            else:
                status = "REJECTED"
            request_id = conn["request_id"]
        else:
            status = "NONE"
            request_id = None

        attendees.append({
            "id": user_id_str,
            "full_name": user.full_name,
            "email": user.email,
            "profile_picture": user.profile_picture,
            "has_face_enrolled": bool(user.face_embedding_id),
            "connection_status": status,
            "request_id": request_id
        })

    return attendees

@router.post("/event/{event_id}/request")
def send_companion_request(
    event_id: uuid.UUID,
    receiver_id: uuid.UUID = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Send a companion request to another attendee in the event.
    """
    if current_user.id == receiver_id:
        raise HTTPException(status_code=400, detail="Cannot send request to yourself")

    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    receiver = db.query(User).filter(User.id == receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")

    # Check for existing request
    existing = db.query(CompanionRequest).filter(
        CompanionRequest.event_id == event_id,
        (
            ((CompanionRequest.sender_id == current_user.id) & (CompanionRequest.receiver_id == receiver_id)) |
            ((CompanionRequest.sender_id == receiver_id) & (CompanionRequest.receiver_id == current_user.id))
        )
    ).first()

    if existing:
        if existing.status == "ACCEPTED":
            raise HTTPException(status_code=400, detail="You are already connected as companions")
        if existing.status == "PENDING":
            raise HTTPException(status_code=400, detail="A companion request is already pending")
        # If REJECTED, update to PENDING
        existing.status = "PENDING"
        existing.sender_id = current_user.id
        existing.receiver_id = receiver_id
        db.commit()
        req = existing
    else:
        req = CompanionRequest(
            event_id=event_id,
            sender_id=current_user.id,
            receiver_id=receiver_id,
            status="PENDING"
        )
        db.add(req)
        db.commit()
        db.refresh(req)

    # Create notification for receiver
    notif = Notification(
        user_id=receiver_id,
        message=f"{current_user.full_name} wants to connect with you as Family/Friends in {event.title} to share joint photos.",
        type="COMPANION_REQUEST"
    )
    db.add(notif)
    db.commit()

    return {
        "message": "Companion request sent successfully",
        "request_id": str(req.id),
        "status": "PENDING"
    }

@router.put("/request/{request_id}/respond")
def respond_companion_request(
    request_id: uuid.UUID,
    data: CompanionRespondRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Accept or reject an incoming companion request.
    """
    req = db.query(CompanionRequest).filter(
        CompanionRequest.id == request_id,
        CompanionRequest.receiver_id == current_user.id
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Companion request not found")

    action = data.action.upper()
    if action == "ACCEPT":
        req.status = "ACCEPTED"
        # Notify sender
        notif = Notification(
            user_id=req.sender_id,
            message=f"{current_user.full_name} accepted your Family/Friends companion request!",
            type="COMPANION_ACCEPTED"
        )
        db.add(notif)
    elif action == "REJECT":
        req.status = "REJECTED"
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use ACCEPT or REJECT.")

    db.commit()
    return {"message": f"Request {req.status.lower()}ed successfully", "status": req.status}

@router.get("/event/{event_id}/accepted")
def get_accepted_companions(
    event_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> Any:
    """
    Get all accepted family/friends for current user in this event.
    """
    if not current_user:
        return []

    accepted_reqs = db.query(CompanionRequest).filter(
        CompanionRequest.event_id == event_id,
        CompanionRequest.status == "ACCEPTED",
        (CompanionRequest.sender_id == current_user.id) | (CompanionRequest.receiver_id == current_user.id)
    ).all()

    companions = []
    for req in accepted_reqs:
        partner = req.receiver if req.sender_id == current_user.id else req.sender
        if partner:
            companions.append({
                "id": str(partner.id),
                "full_name": partner.full_name,
                "email": partner.email,
                "profile_picture": partner.profile_picture,
                "has_face_enrolled": bool(partner.face_embedding_id)
            })

    return companions

@router.post("/event/{event_id}/group-photos")
def get_group_photos(
    event_id: uuid.UUID,
    payload: GroupPhotoRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Multi-person AI vector matching: Finds photos containing current user and their accepted companions.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Verify that requested companion_user_ids are indeed accepted companions
    accepted_companion_ids = set()
    accepted_reqs = db.query(CompanionRequest).filter(
        CompanionRequest.event_id == event_id,
        CompanionRequest.status == "ACCEPTED",
        (CompanionRequest.sender_id == current_user.id) | (CompanionRequest.receiver_id == current_user.id)
    ).all()

    for r in accepted_reqs:
        partner_id = str(r.receiver_id if r.sender_id == current_user.id else r.sender_id)
        accepted_companion_ids.add(partner_id)

    # Collect embeddings
    import json
    target_embeddings = []
    
    # 1. Current user embedding
    if current_user.face_embedding_id:
        try:
            emb = json.loads(current_user.face_embedding_id)
            target_embeddings.append({"user_id": str(current_user.id), "name": current_user.full_name, "embedding": emb})
        except Exception:
            pass

    # 2. Companion embeddings
    for c_id in payload.companion_user_ids:
        if c_id in accepted_companion_ids:
            companion = db.query(User).filter(User.id == c_id).first()
            if companion and companion.face_embedding_id:
                try:
                    emb = json.loads(companion.face_embedding_id)
                    target_embeddings.append({"user_id": str(companion.id), "name": companion.full_name, "embedding": emb})
                except Exception:
                    pass

    if not target_embeddings:
        return []

    # Run FAISS search for each person
    person_media_matches = {}
    for person in target_embeddings:
        raw_matches = find_matching_photos(db, str(event.id), person["embedding"])
        person_media_matches[person["user_id"]] = {m["media_id"] for m in raw_matches}

    if payload.match_mode == "INTERSECTION" and len(target_embeddings) > 1:
        # Photos where ALL selected people appear together
        matched_media_ids = set.intersection(*person_media_matches.values())
    else:
        # Photos where ANY selected person appears (Group Circle)
        matched_media_ids = set.union(*person_media_matches.values())

    if not matched_media_ids:
        return []

    # Fetch Media records
    media_records = db.query(Media).filter(Media.id.in_(list(matched_media_ids))).all()
    
    results = []
    for m in media_records:
        results.append({
            "id": str(m.id),
            "storage_url": m.storage_url,
            "cloudinary_url": m.cloudinary_url,
            "media_type": m.media_type,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "matched_people": [p["name"] for p in target_embeddings if str(m.id) in person_media_matches.get(p["user_id"], set())]
        })

    return results
