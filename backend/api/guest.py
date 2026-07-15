import os
import uuid
import shutil
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from core.database import get_db
from models.event import Event
from models.media import Media
from schemas.event import EventResponse
from schemas.media import MediaResponse
from core.ai import extract_face_embeddings, find_matching_photos

router = APIRouter()

TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

@router.get("/event/{invite_code}", response_model=EventResponse)
def get_event_by_invite(
    invite_code: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Validate invite code and get basic event details.
    """
    event = db.query(Event).filter(Event.invite_code == invite_code).first()
    if not event:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    return event

@router.post("/match/{invite_code}", response_model=List[MediaResponse])
async def match_guest_photos(
    invite_code: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
) -> Any:
    """
    Upload a selfie and find matching photos in the event.
    """
    # 1. Validate Event
    event = db.query(Event).filter(Event.invite_code == invite_code).first()
    if not event:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    # 2. Save Selfie Temporarily
    file_extension = file.filename.split(".")[-1]
    temp_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}.{file_extension}")
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 3. Extract Face from Selfie
        embeddings = extract_face_embeddings(temp_path)
        if not embeddings:
            raise HTTPException(status_code=400, detail="No face detected in selfie")

        target_embedding = embeddings[0]

        # 4. Search FAISS Index
        raw_matched_media_ids = find_matching_photos(str(event.id), target_embedding)

        # 5. Deduplicate preserving FAISS order (closest matches first)
        matched_media_ids = []
        seen = set()
        for media_id in raw_matched_media_ids:
            if media_id not in seen:
                seen.add(media_id)
                matched_media_ids.append(media_id)

        if not matched_media_ids:
            return []
            
        # 6. Retrieve Media records from DB
        matched_media = db.query(Media).filter(Media.id.in_(matched_media_ids)).all()
        
        # 7. Re-sort DB results to strictly follow FAISS ranking
        media_dict = {str(m.id): m for m in matched_media}
        sorted_media = [media_dict[m_id] for m_id in matched_media_ids if m_id in media_dict]
        
        return sorted_media

    finally:
        # 6. Cleanup temporary selfie
        if os.path.exists(temp_path):
            os.remove(temp_path)
