import uuid
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt.exceptions import InvalidTokenError
from pydantic import BaseModel, ValidationError
from sqlalchemy.orm import Session
from sqlalchemy import func

from core.database import get_db
from core.config import settings
from models.user import User
from models.event import Event
from models.memory import Memory, MemoryType
from schemas.memory import MemoryCreateRequest, MemoryResponse, MemoryTaskResponse
from worker.celery_app import celery_app
from celery.result import AsyncResult

reusable_oauth2_optional = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    auto_error=False
)

def get_current_user_optional(
    db: Session = Depends(get_db), token: Optional[str] = Depends(reusable_oauth2_optional)
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=["HS256"]
        )
        sub = payload.get("sub")
        if payload.get("type") != "access" or not sub:
            return None
        user = db.query(User).filter(User.id == sub).first()
        return user
    except (InvalidTokenError, ValidationError):
        return None

router = APIRouter()

class CompileMemoryRequest(BaseModel):
    event_code: str
    memory_type: str = "AI_REEL"
    face_embedding: Optional[List[float]] = None

@router.post("/compile")
def compile_reel_shortcut(
    payload: CompileMemoryRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> Any:
    """
    Shortcut for compiling an AI Highlight Reel or Video Moment by event invite code.
    """
    clean_code = payload.event_code.strip().upper()
    event = db.query(Event).filter(func.upper(Event.invite_code) == clean_code).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    user_id_str = str(current_user.id) if current_user else None
    
    if payload.memory_type == "VIDEO_MOMENT":
        from worker.tasks import compile_video_moments
        task = compile_video_moments.delay(
            user_id=user_id_str,
            event_id=str(event.id),
            invite_code=event.invite_code,
            target_embedding=payload.face_embedding
        )
    else:
        from worker.tasks import compile_ai_memory_reel
        task = compile_ai_memory_reel.delay(
            user_id=user_id_str,
            event_id=str(event.id),
            invite_code=event.invite_code,
            target_embedding=payload.face_embedding,
            settings={}
        )

    return {"task_id": task.id, "status": task.status, "message": "Highlight compilation task dispatched"}

@router.post("/generate", response_model=MemoryTaskResponse)
def generate_memory(
    request: MemoryCreateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> Any:
    """
    Trigger background compilation of an AI Memory Reel or Video Moments.
    """
    user_id_str = str(current_user.id) if current_user else None
    
    if request.memory_type == MemoryType.AI_REEL:
        # Import task inside function to prevent circular imports
        from worker.tasks import compile_ai_memory_reel
        settings_dict = request.settings.model_dump() if request.settings else {}
        task = compile_ai_memory_reel.delay(
            user_id=user_id_str,
            event_id=str(request.event_id),
            invite_code=request.invite_code,
            target_embedding=request.target_embedding,
            settings=settings_dict
        )
    elif request.memory_type == MemoryType.VIDEO_MOMENT:
        from worker.tasks import compile_video_moments
        task = compile_video_moments.delay(
            user_id=user_id_str,
            event_id=str(request.event_id),
            invite_code=request.invite_code,
            target_embedding=request.target_embedding
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid memory type")

    return {"task_id": task.id, "status": task.status}

@router.get("/tasks/{task_id}")
def get_task_status(task_id: str) -> Any:
    """
    Check the status and result of a memory compilation task.
    """
    res = AsyncResult(task_id, app=celery_app)
    response = {
        "task_id": task_id,
        "status": res.status,
        "result": None,
        "error": None
    }
    
    if res.ready():
        if res.successful():
            response["result"] = res.result
        else:
            response["error"] = str(res.result)
            
    return response

@router.get("/event/{event_id}", response_model=List[MemoryResponse])
def get_memories_for_event(
    event_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
) -> Any:
    """
    Retrieve all saved memories for an event. Requires login.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to view saved memories"
        )
    memories = db.query(Memory).filter(
        Memory.event_id == event_id,
        Memory.user_id == current_user.id
    ).all()
    return memories
