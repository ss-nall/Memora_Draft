import os
import uuid
import json
import shutil
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
import numpy as np

from core.database import get_db
from models.event import Event
from models.media import Media
from models.guest import Guest
from models.user import User
from schemas.event import EventResponse
from schemas.media import MediaResponse
from core.ai import extract_face_embeddings, find_matching_photos
from api.deps import get_current_user, get_optional_current_user

router = APIRouter()

TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

class MatchEmbeddingRequest(BaseModel):
    embedding: List[float]

def _get_matched_media_for_embedding(db: Session, event_id: str, target_embedding: List[float]) -> List[Media]:
    """
    Core FAISS vector search & media retrieval helper for a given target embedding.
    """
    raw_matched_results = find_matching_photos(db, event_id, target_embedding)
    if not raw_matched_results:
        return []

    matched_media_ids = []
    timestamps_map = {}
    
    for result in raw_matched_results:
        media_id = result["media_id"]
        timestamp = result["timestamp"]
        
        if media_id not in timestamps_map:
            timestamps_map[media_id] = []
            matched_media_ids.append(media_id)
            
        if timestamp is not None and timestamp not in timestamps_map[media_id]:
            timestamps_map[media_id].append(timestamp)

    if not matched_media_ids:
        return []
        
    matched_media = db.query(Media).filter(Media.id.in_(matched_media_ids)).all()
    media_dict = {str(m.id): m for m in matched_media}
    sorted_media_responses = []
    
    for m_id in matched_media_ids:
        if m_id in media_dict:
            media_obj = media_dict[m_id]
            t_list = sorted(timestamps_map[m_id]) if timestamps_map[m_id] else None
            media_obj.timestamps = t_list
            sorted_media_responses.append(media_obj)
            
    return sorted_media_responses

@router.get("/event/{invite_code}", response_model=EventResponse)
def get_event_by_invite(
    invite_code: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Validate invite code and get basic event details.
    """
    clean_code = invite_code.strip().upper()
    event = db.query(Event).filter(func.upper(Event.invite_code) == clean_code).first()
    if not event:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    return event

@router.post("/match/{invite_code}", response_model=List[MediaResponse])
async def match_guest_photos(
    invite_code: str,
    response: Response,
    files: List[UploadFile] = File(...),
    email: str = Form(None),
    db: Session = Depends(get_db)
) -> Any:
    """
    Upload one or multiple selfies (e.g. Front, Left, Right) to build a robust 
    3D-like average face embedding, then find matching photos in the event.
    If an email is provided, save the guest for future notifications.
    """
    clean_code = invite_code.strip().upper()
    event = db.query(Event).filter(func.upper(Event.invite_code) == clean_code).first()
    if not event:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    if not files:
        raise HTTPException(status_code=400, detail="No selfies uploaded")

    all_embeddings = []
    temp_paths = []
    
    try:
        for file in files:
            file_extension = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
            temp_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}.{file_extension}")
            temp_paths.append(temp_path)
            
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            embeddings = extract_face_embeddings(temp_path)
            if embeddings:
                all_embeddings.append(embeddings[0])

        if not all_embeddings:
            raise HTTPException(status_code=400, detail="No face detected in any of the selfies")

        # 3. Calculate Centroid (Average Embedding)
        avg_embedding = np.mean(all_embeddings, axis=0)
        norm = np.linalg.norm(avg_embedding)
        if norm > 0:
            target_embedding = (avg_embedding / norm).tolist()
        else:
            target_embedding = avg_embedding.tolist()

        # Save Guest record if email is provided
        if email:
            existing_guest = db.query(Guest).filter(Guest.event_id == event.id, Guest.email == email).first()
            if not existing_guest:
                new_guest = Guest(
                    event_id=event.id,
                    email=email,
                    embedding=target_embedding
                )
                db.add(new_guest)
                db.commit()
            else:
                existing_guest.embedding = target_embedding
                db.commit()

        sorted_media_responses = _get_matched_media_for_embedding(db, str(event.id), target_embedding)
        response.headers["X-Guest-Embedding"] = json.dumps(target_embedding)
        return sorted_media_responses

    finally:
        for temp_path in temp_paths:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

@router.post("/match-embedding/{invite_code}", response_model=List[MediaResponse])
def match_photos_by_saved_embedding(
    invite_code: str,
    payload: MatchEmbeddingRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Search event gallery using an existing extracted face embedding vector.
    Allows instant re-matching and live syncing of newly uploaded photos 
    without needing camera or selfie scans again.
    """
    clean_code = invite_code.strip().upper()
    event = db.query(Event).filter(func.upper(Event.invite_code) == clean_code).first()
    if not event:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    if not payload.embedding or len(payload.embedding) != 512:
        raise HTTPException(status_code=400, detail="Invalid 512-D face embedding vector")

    return _get_matched_media_for_embedding(db, str(event.id), payload.embedding)

@router.get("/my-photos/{invite_code}", response_model=List[MediaResponse])
def get_my_photos_with_face_id(
    invite_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Direct 1-click photo discovery for logged-in users with an enrolled Face ID.
    Zero manual scans needed!
    """
    clean_code = invite_code.strip().upper()
    event = db.query(Event).filter(func.upper(Event.invite_code) == clean_code).first()
    if not event:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    if not current_user.face_embedding_id:
        return []

    try:
        user_embedding = json.loads(current_user.face_embedding_id)
    except Exception:
        return []

    return _get_matched_media_for_embedding(db, str(event.id), user_embedding)
