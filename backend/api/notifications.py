import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from models.notification import Notification
from models.user import User
from api.deps import get_current_user

router = APIRouter()

@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get all active notifications for the current user.
    """
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_archived == False
    ).order_by(Notification.created_at.desc()).all()
    
    results = []
    for n in notifications:
        results.append({
            "id": str(n.id),
            "user_id": str(n.user_id),
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None
        })
    return results

@router.put("/{notification_id}/read")
def mark_read(
    *,
    db: Session = Depends(get_db),
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Mark a notification as read.
    """
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.delete("/{notification_id}")
def archive_notification(
    *,
    db: Session = Depends(get_db),
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Archive a notification.
    """
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_archived = True
    db.commit()
    return {"message": "Notification archived"}
