import logging
from worker.celery_app import celery_app
from core.database import SessionLocal
from models.media import Media
from models.guest import Guest
from core.ai import extract_face_embeddings, add_embedding_to_index
from core.video_utils import extract_frames
import os
import cv2
import tempfile
import requests
from core.email import send_match_notification_email
from models.event import Event

logger = logging.getLogger(__name__)

# ==============================================================================
# AI MODULE EXPLANATION: BACKGROUND PROCESSING WORKER
# Purpose: Run massive AI math asynchronously so the web server doesn't freeze.
# Model used: Celery task.
# Why it was selected: Industry standard for python async execution.
# Input: media_id (UUID string), file_path, event_id.
# Output: Writes embeddings to FAISS and updates the DB status to 'completed'.
# Alternatives: FastAPI BackgroundTasks (not scalable across multiple servers).
# Advantages: Users don't wait for processing; handles massive bursts of uploads smoothly.
# ==============================================================================

@celery_app.task(name="process_image_upload", bind=True, max_retries=3)
def process_media_upload(self, media_id: str, file_path: str, event_id: str, is_video: bool = False):
    logger.info(f"Starting AI processing for media: {media_id} (Video: {is_video})")
    
    import numpy as np
    
    db = SessionLocal()
    temp_file_path = None
    original_file_path = file_path

    try:
        if file_path.startswith("http"):
            logger.info("Downloading file from Cloudinary...")
            response = requests.get(file_path, stream=True)
            response.raise_for_status()
            
            # Create a temp file to process
            ext = ".mp4" if is_video else ".jpg"
            fd, temp_file_path = tempfile.mkstemp(suffix=ext)
            with os.fdopen(fd, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            file_path = temp_file_path
            
        # Load registered guests for notifications
        guests = db.query(Guest).filter(Guest.event_id == event_id, Guest.email.isnot(None)).all()
        event_obj = db.query(Event).filter(Event.id == event_id).first()
        invite_code = event_obj.invite_code if event_obj else "unknown"
        notified_emails = set()
        
        total_faces = 0
        
        def check_and_notify(embedding_list):
            for guest in guests:
                if guest.email in notified_emails:
                    continue
                guest_emb = np.array(guest.embedding)
                target_emb = np.array(embedding_list)
                # Compute cosine similarity
                similarity = np.dot(guest_emb, target_emb) / (np.linalg.norm(guest_emb) * np.linalg.norm(target_emb))
                if similarity > 0.45:  # Same threshold used in FAISS search
                    send_match_notification_email(guest.email, invite_code)
                    notified_emails.add(guest.email)

        if is_video:
            # 1. Video Processing Pipeline
            # Extract frames at 1 fps
            frames = extract_frames(file_path, fps_interval=1)
            
            for timestamp_sec, frame_matrix in frames:
                # We need to save the frame temporarily to disk for InsightFace, 
                # or modify extract_face_embeddings to accept a numpy array.
                # It's faster to pass the numpy array directly to the AI pipeline.
                from core.ai_pipeline import preprocess_image, multi_scale_tiled_detection
                from insightface.app import FaceAnalysis
                
                # We need the app instance. It's globally initialized in core.ai
                from core.ai import app as insightface_app
                
                # Preprocess & Detect
                frame_img = preprocess_image(frame_matrix)
                faces = multi_scale_tiled_detection(frame_img, insightface_app)
                
                for face in faces:
                    norm = np.linalg.norm(face.embedding)
                    if norm > 0:
                        normalized_embedding = face.embedding / norm
                        emb_list = normalized_embedding.tolist()
                        # 2. Save Embeddings to DB Index with Timestamp
                        add_embedding_to_index(db, event_id, media_id, emb_list, timestamp_sec)
                        total_faces += 1
                        check_and_notify(emb_list)
        else:
            # 1. Standard Image Pipeline
            embeddings = extract_face_embeddings(file_path)
            
            # 2. Save Embeddings to DB
            if embeddings:
                for embedding in embeddings:
                    emb_list = embedding.tolist()
                    add_embedding_to_index(db, event_id, media_id, emb_list, None)
                    total_faces += 1
                    check_and_notify(emb_list)
                
        # 3. Mark Media as Completed in Database
        media = db.query(Media).filter(Media.id == media_id).first()
        if media:
            media.status = "completed"
            db.commit()
            
        logger.info(f"Successfully processed {total_faces} faces for media: {media_id}")
        return {"status": "success", "faces_found": total_faces}
        
    except Exception as exc:
        logger.error(f"Failed to process media {media_id}: {exc}")
        # Mark as failed in DB
        media = db.query(Media).filter(Media.id == media_id).first()
        if media:
            media.status = "failed"
            db.commit()
            
        # Retry task if it failed due to a transient error
        raise self.retry(exc=exc, countdown=5)
        
    finally:
        db.close()
        # Clean up temporary file if it was created
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception as e:
                logger.error(f"Failed to delete temp file {temp_file_path}: {e}")
