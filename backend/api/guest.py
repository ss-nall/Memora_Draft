import os
import uuid
import shutil
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from core.database import get_db
from models.event import Event
from models.media import Media
from models.guest import Guest
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
    files: List[UploadFile] = File(...),
    email: str = Form(None),
    db: Session = Depends(get_db)
) -> Any:
    """
    Upload one or multiple selfies (e.g. Front, Left, Right) to build a robust 
    3D-like average face embedding, then find matching photos in the event.
    If an email is provided, save the guest for future notifications.
    """
    # 1. Validate Event
    event = db.query(Event).filter(Event.invite_code == invite_code).first()
    if not event:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    if not files:
        raise HTTPException(status_code=400, detail="No selfies uploaded")

    # 2. Extract and Average Embeddings
    all_embeddings = []
    temp_paths = []
    
    import numpy as np
    
    try:
        for file in files:
            file_extension = file.filename.split(".")[-1]
            temp_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}.{file_extension}")
            temp_paths.append(temp_path)
            
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            embeddings = extract_face_embeddings(temp_path)
            if embeddings:
                all_embeddings.append(embeddings[0]) # assume the primary face is the guest

        if not all_embeddings:
            raise HTTPException(status_code=400, detail="No face detected in any of the selfies")

        # 3. Calculate Centroid (Average Embedding)
        # This merges multiple angles (Front, Left, Right) into a highly robust pseudo-3D representation
        avg_embedding = np.mean(all_embeddings, axis=0)
        
        # Normalize the averaged vector
        norm = np.linalg.norm(avg_embedding)
        if norm > 0:
            target_embedding = (avg_embedding / norm).tolist()
        else:
            target_embedding = avg_embedding.tolist()

        # Save Guest record if email is provided
        if email:
            # Check if already exists to avoid duplicates
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

        # 4. Search FAISS Index
        raw_matched_results = find_matching_photos(db, str(event.id), target_embedding)

        # 5. Group timestamps and deduplicate media_ids preserving FAISS ranking order
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
            
        # 6. Retrieve Media records from DB
        matched_media = db.query(Media).filter(Media.id.in_(matched_media_ids)).all()
        
        # 7. Re-sort DB results to strictly follow FAISS ranking and attach timestamps
        media_dict = {str(m.id): m for m in matched_media}
        sorted_media_responses = []
        
        for m_id in matched_media_ids:
            if m_id in media_dict:
                media_obj = media_dict[m_id]
                # Sort the timestamps chronologically
                t_list = sorted(timestamps_map[m_id]) if timestamps_map[m_id] else None
                
                # We need to construct a dictionary/object that matches MediaResponse schema
                # Since SQLAlchemy models don't have 'timestamps' attribute dynamically easily,
                # we can just add it to the python object instance
                media_obj.timestamps = t_list
                sorted_media_responses.append(media_obj)
        
        return sorted_media_responses

    finally:
        # 6. Cleanup all temporary selfies
        for temp_path in temp_paths:
            if os.path.exists(temp_path):
                os.remove(temp_path)
