import logging
from typing import Optional
import uuid
from worker.celery_app import celery_app
from core.database import SessionLocal
from core.config import settings
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
# MoviePy 1.x and 2.x Compatibility Helpers
# ==============================================================================
def safe_set_duration(clip, duration: float):
    if hasattr(clip, "with_duration"):
        return clip.with_duration(duration)
    return clip.set_duration(duration)

def safe_set_audio(clip, audio):
    if hasattr(clip, "with_audio"):
        return clip.with_audio(audio)
    return clip.set_audio(audio)

def safe_subclip(clip_or_audio, start: float, end: float):
    if hasattr(clip_or_audio, "subclipped"):
        return clip_or_audio.subclipped(start, end)
    return clip_or_audio.subclip(start, end)

def safe_fade(clip, duration: float = 0.5):
    try:
        from moviepy import vfx
        if hasattr(clip, "with_effects"):
            return clip.with_effects([vfx.FadeIn(duration), vfx.FadeOut(duration)])
    except Exception:
        pass
    if hasattr(clip, "fadein") and hasattr(clip, "fadeout"):
        try:
            return clip.fadein(duration).fadeout(duration)
        except Exception:
            pass
    return clip


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
        if self is not None and hasattr(self, "retry"):
            raise self.retry(exc=exc, countdown=5)
        return {"status": "failed", "error": str(exc)}
        
    finally:
        db.close()
        # Clean up temporary file if it was created
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception as e:
                logger.error(f"Failed to delete temp file {temp_file_path}: {e}")


# ==============================================================================
# AI MEMORY REEL COMPILATION TASK
# ==============================================================================
@celery_app.task(name="compile_ai_memory_reel")
def compile_ai_memory_reel(user_id: Optional[str], event_id: str, invite_code: str, target_embedding: list, settings_dict: dict) -> dict:
    logger.info(f"Starting AI Memory Reel compilation for event: {event_id}")
    db = SessionLocal()
    temp_paths = []
    clips = []
    audio_clip = None
    final_clip = None
    
    try:
        # 1. Search DB faces using target_embedding to find matching photo media
        from core.ai import find_matching_photos
        matched_results = find_matching_photos(db, event_id, target_embedding)
        matched_media_ids = list(set(r["media_id"] for r in matched_results))
        
        if not matched_media_ids:
            return {"status": "failed", "detail": "No matched media found for user"}
            
        from models.media import Media, MediaType
        photos = db.query(Media).filter(
            Media.event_id == event_id,
            Media.id.in_(matched_media_ids),
            Media.media_type == MediaType.PHOTO
        ).all()
        
        if not photos:
            return {"status": "failed", "detail": "No matched photos found for user"}
            
        # 2. Setup Slideshow Settings
        slide_duration = 4.0
        speed = settings_dict.get("speed", "normal")
        if speed == "slow":
            slide_duration = 6.0
        elif speed == "fast":
            slide_duration = 2.0
            
        # 3. Create ImageClips using MoviePy
        from moviepy import ImageClip, concatenate_videoclips
        
        for photo in photos:
            path = photo.cloudinary_url or photo.storage_url
            if path.startswith("http"):
                # Download file
                response = requests.get(path, stream=True)
                response.raise_for_status()
                fd, temp_p = tempfile.mkstemp(suffix=".jpg")
                with os.fdopen(fd, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                temp_paths.append(temp_p)
                local_path = temp_p
            else:
                local_path = path
                
            if os.path.exists(local_path):
                clip = ImageClip(local_path)
                clip = safe_set_duration(clip, slide_duration)
                
                # Apply simple fadein/fadeout transitions
                transition = settings_dict.get("transition", "fade")
                if transition == "fade":
                    clip = safe_fade(clip, 0.5)
                clips.append(clip)
                
        if not clips:
            return {"status": "failed", "detail": "Failed to load any image clips"}
            
        # 4. Concatenate and apply audio if requested
        final_clip = concatenate_videoclips(clips, method="compose")
        
        music_url = settings_dict.get("musicUrl")
        if music_url and music_url.startswith("http"):
            try:
                response = requests.get(music_url, stream=True)
                response.raise_for_status()
                fd_a, temp_a = tempfile.mkstemp(suffix=".mp3")
                with os.fdopen(fd_a, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                temp_paths.append(temp_a)
                
                from moviepy import AudioFileClip
                audio_clip = AudioFileClip(temp_a)
                if audio_clip.duration > final_clip.duration:
                    audio_clip = safe_subclip(audio_clip, 0, final_clip.duration)
                final_clip = safe_set_audio(final_clip, audio_clip)
            except Exception as e:
                logger.error(f"Failed to attach audio soundtrack: {e}")
                
        # 5. Write final output MP4 to disk
        fd_out, temp_out = tempfile.mkstemp(suffix=".mp4")
        os.close(fd_out)
        temp_paths.append(temp_out)
        
        final_clip.write_videofile(
            temp_out,
            fps=24,
            codec="libx264",
            audio_codec="aac" if audio_clip else None,
            verbose=False,
            logger=None
        )
        
        # 6. Upload compiled video to Cloudinary or save local fallback
        import cloudinary
        import cloudinary.uploader
        
        cloudinary.config(
          cloud_name = settings.CLOUDINARY_CLOUD_NAME,
          api_key = settings.CLOUDINARY_API_KEY,
          api_secret = settings.CLOUDINARY_API_SECRET,
          secure = True
        )
        
        if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY:
            upload_result = cloudinary.uploader.upload(
                temp_out,
                resource_type="video",
                folder=f"memora/reels/{event_id}"
            )
            result_url = upload_result.get("secure_url")
        else:
            os.makedirs("uploads/reels", exist_ok=True)
            local_filename = f"{uuid.uuid4()}.mp4"
            dest_path = os.path.join("uploads/reels", local_filename)
            import shutil
            shutil.copyfile(temp_out, dest_path)
            result_url = dest_path
            
        # 7. Persist to DB if user is authenticated
        if user_id:
            from models.memory import Memory, MemoryType
            memory = db.query(Memory).filter(
                Memory.user_id == user_id,
                Memory.event_id == event_id,
                Memory.memory_type == MemoryType.AI_REEL
            ).first()
            if not memory:
                memory = Memory(
                    user_id=user_id,
                    event_id=event_id,
                    memory_type=MemoryType.AI_REEL,
                    result_url=result_url
                )
                db.add(memory)
            else:
                memory.result_url = result_url
            db.commit()
            
        return {"status": "success", "result_url": result_url}
        
    except Exception as exc:
        logger.error(f"Failed compiling AI Reel: {exc}")
        return {"status": "failed", "error": str(exc)}
        
    finally:
        db.close()
        # Clean up MoviePy references to free video handles
        if final_clip:
            try:
                final_clip.close()
            except:
                pass
        for c in clips:
            try:
                c.close()
            except:
                pass
        if audio_clip:
            try:
                audio_clip.close()
            except:
                pass
        # Clean up all temp files
        for p in temp_paths:
            if os.path.exists(p):
                try:
                    os.remove(p)
                except Exception as e:
                    logger.error(f"Failed deleting temp file {p}: {e}")


# ==============================================================================
# VIDEO MOMENTS COMPILATION TASK
# ==============================================================================
@celery_app.task(name="compile_video_moments")
def compile_video_moments(user_id: Optional[str], event_id: str, invite_code: str, target_embedding: list) -> dict:
    logger.info(f"Starting Video Moments compilation for event: {event_id}")
    db = SessionLocal()
    temp_paths = []
    clips = []
    source_videos = []
    final_clip = None
    
    try:
        # 1. Search DB faces using target_embedding to find matching video media & timestamps
        from core.ai import find_matching_photos
        matched_results = find_matching_photos(db, event_id, target_embedding)
        
        if not matched_results:
            return {"status": "failed", "detail": "No matches found"}
            
        from models.media import Media, MediaType
        
        # Group timestamps by video media ID
        video_timestamps = {}
        for r in matched_results:
            media_id = r["media_id"]
            timestamp = r["timestamp"]
            if timestamp is not None:
                media = db.query(Media).filter(Media.id == media_id).first()
                if media and media.media_type == MediaType.VIDEO:
                    if media_id not in video_timestamps:
                        video_timestamps[media_id] = []
                    video_timestamps[media_id].append(timestamp)
                    
        if not video_timestamps:
            return {"status": "failed", "detail": "No matched video moments found"}
            
        # 2. Extract subclips using MoviePy
        from moviepy import VideoFileClip, concatenate_videoclips
        
        for media_id, t_list in video_timestamps.items():
            media = db.query(Media).filter(Media.id == media_id).first()
            path = media.cloudinary_url or media.storage_url
            if path.startswith("http"):
                response = requests.get(path, stream=True)
                response.raise_for_status()
                fd_v, temp_v = tempfile.mkstemp(suffix=".mp4")
                with os.fdopen(fd_v, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                temp_paths.append(temp_v)
                local_path = temp_v
            else:
                local_path = path
                
            if os.path.exists(local_path):
                video = VideoFileClip(local_path)
                source_videos.append(video)
                
                # Sort timestamps chronologically
                t_list = sorted(t_list)
                for t in t_list:
                    # Clip ±2 seconds around the matched timestamp
                    start = max(0, t - 2.0)
                    end = min(video.duration, t + 2.0)
                    if end > start:
                        sub = safe_subclip(video, start, end)
                        clips.append(sub)
                        
        if not clips:
            return {"status": "failed", "detail": "Failed to slice any video moments"}
            
        # 3. Concatenate clips
        final_clip = concatenate_videoclips(clips, method="compose")
        
        # 4. Write final output MP4 to disk
        fd_out, temp_out = tempfile.mkstemp(suffix=".mp4")
        os.close(fd_out)
        temp_paths.append(temp_out)
        
        final_clip.write_videofile(
            temp_out,
            fps=24,
            codec="libx264",
            audio_codec="aac",
            verbose=False,
            logger=None
        )
        
        # 5. Upload compiled video to Cloudinary or save local fallback
        import cloudinary
        import cloudinary.uploader
        
        cloudinary.config(
          cloud_name = settings.CLOUDINARY_CLOUD_NAME,
          api_key = settings.CLOUDINARY_API_KEY,
          api_secret = settings.CLOUDINARY_API_SECRET,
          secure = True
        )
        
        if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY:
            upload_result = cloudinary.uploader.upload(
                temp_out,
                resource_type="video",
                folder=f"memora/moments/{event_id}"
            )
            result_url = upload_result.get("secure_url")
        else:
            os.makedirs("uploads/moments", exist_ok=True)
            local_filename = f"{uuid.uuid4()}.mp4"
            dest_path = os.path.join("uploads/moments", local_filename)
            import shutil
            shutil.copyfile(temp_out, dest_path)
            result_url = dest_path
            
        # 6. Persist to DB if user is authenticated
        if user_id:
            from models.memory import Memory, MemoryType
            memory = db.query(Memory).filter(
                Memory.user_id == user_id,
                Memory.event_id == event_id,
                Memory.memory_type == MemoryType.VIDEO_MOMENT
            ).first()
            if not memory:
                memory = Memory(
                    user_id=user_id,
                    event_id=event_id,
                    memory_type=MemoryType.VIDEO_MOMENT,
                    result_url=result_url
                )
                db.add(memory)
            else:
                memory.result_url = result_url
            db.commit()
            
        return {"status": "success", "result_url": result_url}
        
    except Exception as exc:
        logger.error(f"Failed compiling Video Moments: {exc}")
        return {"status": "failed", "error": str(exc)}
        
    finally:
        db.close()
        # Clean up MoviePy references to free video handles
        if final_clip:
            try:
                final_clip.close()
            except:
                pass
        for c in clips:
            try:
                c.close()
            except:
                pass
        for v in source_videos:
            try:
                v.close()
            except:
                pass
        # Clean up all temp files
        for p in temp_paths:
            if os.path.exists(p):
                try:
                    os.remove(p)
                except Exception as e:
                    logger.error(f"Failed deleting temp file {p}: {e}")

