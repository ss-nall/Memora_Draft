import os
import uuid
import shutil
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from core.database import get_db
from models.media import Media, MediaType
from models.event import Event
from models.user import User
from models.event_member import EventMember, EventRole
from models.notification import Notification
from schemas.media import MediaResponse
from api.deps import get_current_user
from worker.tasks import process_media_upload
from datetime import datetime
from core.config import settings
import cloudinary
import cloudinary.uploader
import cloudinary.api

cloudinary.config(
  cloud_name = settings.CLOUDINARY_CLOUD_NAME,
  api_key = settings.CLOUDINARY_API_KEY,
  api_secret = settings.CLOUDINARY_API_SECRET,
  secure = True
)

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=MediaResponse)
async def upload_media(
    event_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Upload a media file (photo/video) for an event. Requires Admin or Contributor role.
    """
    # Verify the event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # Verify RBAC for upload
    membership = db.query(EventMember).filter(
        EventMember.event_id == event_id,
        EventMember.user_id == current_user.id,
        EventMember.status == "active"
    ).first()
    
    if not membership or membership.role not in [EventRole.ADMIN, EventRole.CONTRIBUTOR]:
        raise HTTPException(status_code=403, detail="Not authorized to upload to this event")

    # Upload to Cloudinary if keys exist, else fallback to local for development
    is_video = "video" in file.content_type
    
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY:
        upload_result = cloudinary.uploader.upload(
            file.file, 
            resource_type="video" if is_video else "image",
            folder=f"memora/events/{event_id}"
        )
        file_path = upload_result.get("secure_url")
        cloudinary_url = upload_result.get("secure_url")
        cloudinary_public_id = upload_result.get("public_id")
    else:
        # Fallback to local
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        cloudinary_url = None
        cloudinary_public_id = None

    # Create DB record
    media = Media(
        event_id=event_id,
        uploader_id=current_user.id,
        storage_url=file_path,
        cloudinary_url=cloudinary_url,
        cloudinary_public_id=cloudinary_public_id,
        media_type=MediaType.VIDEO if is_video else MediaType.PHOTO,
        status="processing",
        created_at=datetime.utcnow()
    )
    db.add(media)
    db.commit()
    db.refresh(media)

    # Dispatch Background Task to Celery
    process_media_upload.delay(str(media.id), file_path, str(event.id), is_video)

    return media

@router.get("/event/{event_id}", response_model=List[MediaResponse])
def get_media_for_event(
    event_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get all media for a specific event. Any event member can view.
    """
    membership = db.query(EventMember).filter(
        EventMember.event_id == event_id,
        EventMember.user_id == current_user.id,
        EventMember.status == "active"
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this event")

    from sqlalchemy.orm import joinedload
    media_files = db.query(Media).options(joinedload(Media.uploader)).filter(Media.event_id == event_id).all()
    return media_files

@router.delete("/{media_id}")
def delete_media(
    media_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Delete a media file. Requires Admin role, or the user must be the uploader.
    """
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
        
    membership = db.query(EventMember).filter(
        EventMember.event_id == media.event_id,
        EventMember.user_id == current_user.id,
        EventMember.status == "active"
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if membership.role != EventRole.ADMIN and media.uploader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this media")

    # Delete from Cloudinary if exists
    if media.cloudinary_public_id and settings.CLOUDINARY_API_KEY:
        try:
            cloudinary.uploader.destroy(
                media.cloudinary_public_id,
                resource_type="video" if media.media_type == MediaType.VIDEO else "image"
            )
        except Exception as e:
            print(f"Failed to delete from Cloudinary: {e}")
            
    # Delete local file if it exists (fallback)
    if not media.cloudinary_public_id and os.path.exists(media.storage_url):
        try:
            os.remove(media.storage_url)
        except OSError:
            pass

    # Delete embeddings manually (if cascade isn't set up perfectly)
    from models.face import Face
    db.query(Face).filter(Face.media_id == media_id).delete()

    # Delete media record
    db.delete(media)
    db.commit()
    
    return {"status": "success", "message": "Media deleted"}
