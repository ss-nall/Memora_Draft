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
from schemas.media import MediaResponse
from api.deps import get_current_user
from core.ai import extract_face_embeddings, add_embedding_to_index

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
    Upload a media file (photo/video) for an event.
    """
    # Verify the event exists and the user is the photographer
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.photographer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to upload to this event")

    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Save file locally
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract Face Embeddings using AI Engine
    embeddings = extract_face_embeddings(file_path)
    
    # Create DB record
    media = Media(
        event_id=event_id,
        storage_url=file_path,
        media_type=MediaType.VIDEO if "video" in file.content_type else MediaType.PHOTO
    )
    db.add(media)
    db.commit()
    db.refresh(media)

    # Add to FAISS memory index if faces were detected
    if embeddings:
        for embedding in embeddings:
            add_embedding_to_index(str(event_id), str(media.id), embedding)

    return media

@router.get("/event/{event_id}", response_model=List[MediaResponse])
def get_media_for_event(
    event_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user), # Simple auth check
) -> Any:
    """
    Get all media for a specific event.
    Later, we'll allow guests to view this based on invite_code.
    """
    # Just basic check for now
    media_files = db.query(Media).filter(Media.event_id == event_id).all()
    return media_files
