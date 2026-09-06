from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests
from datetime import datetime
import os
import uuid
import shutil
import json
import numpy as np

from core.database import get_db
from core.security import create_access_token, create_refresh_token
from core.config import settings
from core.ai import extract_face_embeddings
from models.user import User
from models.refresh_token import RefreshToken
from schemas.user import UserResponse
from api.deps import get_current_user

router = APIRouter()

class GoogleLoginRequest(BaseModel):
    token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class RefreshRequest(BaseModel):
    refresh_token: str

class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/google/login", response_model=TokenResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Verifies the Google ID token sent by the frontend, creates or updates the user,
    and issues JWT access & refresh tokens.
    """
    try:
        # Verify the token with Google
        id_info = id_token.verify_oauth2_token(
            payload.token, 
            requests.Request(), 
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=60  # Allow up to 60 seconds of clock drift
        )
        
        google_id = id_info.get("sub")
        email = id_info.get("email")
        full_name = id_info.get("name")
        profile_picture = id_info.get("picture")
        email_verified = str(id_info.get("email_verified", "false")).lower()
        
        if not email:
            raise HTTPException(status_code=400, detail="No email provided by Google")

        # Find or create user
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                google_id=google_id,
                email=email,
                full_name=full_name,
                profile_picture=profile_picture,
                email_verified=email_verified
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Update info if changed
            user.google_id = google_id
            user.profile_picture = profile_picture
            db.commit()

        # Create JWT tokens
        access_token = create_access_token(user.id)
        refresh_token_str = create_refresh_token(user.id)
        
        # Store refresh token in DB
        import jwt
        from core.security import ALGORITHM, settings as sec_settings
        decoded_refresh = jwt.decode(refresh_token_str, sec_settings.SECRET_KEY, algorithms=[ALGORITHM])
        expires_at = datetime.fromtimestamp(decoded_refresh["exp"])
        
        db_refresh_token = RefreshToken(
            user_id=user.id,
            token=refresh_token_str,
            expires_at=expires_at
        )
        db.add(db_refresh_token)
        db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_str,
            "user": user
        }

    except ValueError as e:
        import logging
        logging.error(f"Google Token Verification Failed: {e}")
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")

class DevLoginRequest(BaseModel):
    email: str = "demo@memora.ai"
    full_name: str = "Demo User"

@router.post("/dev/login", response_model=TokenResponse)
def dev_login(payload: DevLoginRequest = None, db: Session = Depends(get_db)):
    """
    Development/Demo login to test Memora locally without needing Google Cloud credentials.
    """
    email = payload.email if (payload and payload.email) else "demo@memora.ai"
    full_name = payload.full_name if (payload and payload.full_name) else "Demo User"

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            google_id="dev-demo-user",
            email=email,
            full_name=full_name,
            profile_picture="https://api.dicebear.com/7.x/avataaars/svg?seed=Demo",
            email_verified="true"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(user.id)
    refresh_token_str = create_refresh_token(user.id)

    import jwt
    from core.security import ALGORITHM, settings as sec_settings
    decoded_refresh = jwt.decode(refresh_token_str, sec_settings.SECRET_KEY, algorithms=[ALGORITHM])
    expires_at = datetime.fromtimestamp(decoded_refresh["exp"])

    db_refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=expires_at
    )
    db.add(db_refresh_token)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token_str,
        "user": user
    }

class RegisterRequest(BaseModel):
    email: str
    full_name: str
    password: str = None

@router.post("/register", response_model=UserResponse)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registers a new user with email and full name.
    """
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        profile_picture=f"https://api.dicebear.com/7.x/avataaars/svg?seed={payload.full_name}",
        email_verified="true"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

TEMP_AUTH_DIR = "temp_uploads"
os.makedirs(TEMP_AUTH_DIR, exist_ok=True)

@router.post("/face-login", response_model=TokenResponse)
async def face_login(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Biometric Face ID authentication. Captures face from webcam/device camera,
    matches against registered user embeddings with InsightFace cosine similarity,
    and returns JWT access & refresh tokens.
    """
    file_ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    temp_path = os.path.join(TEMP_AUTH_DIR, f"auth_{uuid.uuid4()}.{file_ext}")
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        embeddings = extract_face_embeddings(temp_path)
        if not embeddings:
            raise HTTPException(
                status_code=400, 
                detail="No face detected. Please ensure your face is well-lit and directly facing the camera."
            )
            
        target_vec = np.array(embeddings[0], dtype=np.float32)
        
        # Find matching user among those with registered face embeddings
        users_with_faces = db.query(User).filter(User.face_embedding_id.isnot(None)).all()
        
        best_user = None
        best_similarity = -1.0
        
        for user in users_with_faces:
            try:
                user_embedding = json.loads(user.face_embedding_id)
                user_vec = np.array(user_embedding, dtype=np.float32)
                sim = float(np.dot(target_vec, user_vec))
                if sim > best_similarity:
                    best_similarity = sim
                    best_user = user
            except Exception:
                continue
                
        # Cosine similarity threshold for Face ID authentication
        if best_user is None or best_similarity < 0.45:
            raise HTTPException(
                status_code=404, 
                detail="Face not recognized. Please sign in with email or register this face."
            )
            
        # Successful Biometric Authentication!
        access_token = create_access_token(best_user.id)
        refresh_token_str = create_refresh_token(best_user.id)
        
        import jwt
        from core.security import ALGORITHM, settings as sec_settings
        decoded_refresh = jwt.decode(refresh_token_str, sec_settings.SECRET_KEY, algorithms=[ALGORITHM])
        expires_at = datetime.fromtimestamp(decoded_refresh["exp"])
        
        db_refresh_token = RefreshToken(
            user_id=best_user.id,
            token=refresh_token_str,
            expires_at=expires_at
        )
        db.add(db_refresh_token)
        db.commit()
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token_str,
            "user": best_user
        }
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

@router.post("/register-face")
async def register_face(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Enrolls the current logged-in user's biometric Face ID profile using the camera.
    """
    file_ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    temp_path = os.path.join(TEMP_AUTH_DIR, f"reg_{uuid.uuid4()}.{file_ext}")
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        embeddings = extract_face_embeddings(temp_path)
        if not embeddings:
            raise HTTPException(
                status_code=400, 
                detail="No face detected. Please ensure your face is well-lit and centered."
            )
            
        embedding_json = json.dumps(embeddings[0].tolist())
        current_user.face_embedding_id = embedding_json
        db.commit()
        db.refresh(current_user)
        
        return {"status": "success", "message": "Biometric Face ID successfully enrolled!"}
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

@router.post("/face-register", response_model=TokenResponse)
async def face_register(
    file: UploadFile = File(...),
    email: str = Form(...),
    full_name: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    One-step account creation with Biometric Face ID registration.
    """
    file_ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    temp_path = os.path.join(TEMP_AUTH_DIR, f"reg_new_{uuid.uuid4()}.{file_ext}")
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        embeddings = extract_face_embeddings(temp_path)
        if not embeddings:
            raise HTTPException(
                status_code=400, 
                detail="No face detected in camera capture. Please try again."
            )
            
        embedding_json = json.dumps(embeddings[0].tolist())
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                full_name=full_name,
                face_embedding_id=embedding_json,
                profile_picture=f"https://api.dicebear.com/7.x/avataaars/svg?seed={full_name}",
                email_verified="true"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.face_embedding_id = embedding_json
            user.full_name = full_name
            db.commit()
            db.refresh(user)
            
        access_token = create_access_token(user.id)
        refresh_token_str = create_refresh_token(user.id)
        
        import jwt
        from core.security import ALGORITHM, settings as sec_settings
        decoded_refresh = jwt.decode(refresh_token_str, sec_settings.SECRET_KEY, algorithms=[ALGORITHM])
        expires_at = datetime.fromtimestamp(decoded_refresh["exp"])
        
        db_refresh_token = RefreshToken(
            user_id=user.id,
            token=refresh_token_str,
            expires_at=expires_at
        )
        db.add(db_refresh_token)
        db.commit()
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token_str,
            "user": user
        }
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

@router.post("/refresh", response_model=RefreshResponse)
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    """
    Issues a new access token if the refresh token is valid and not revoked.
    """
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == payload.refresh_token,
        RefreshToken.is_revoked == False
    ).first()
    
    if not db_token:
        raise HTTPException(status_code=401, detail="Invalid or revoked refresh token")
        
    if db_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Refresh token expired")

    access_token = create_access_token(db_token.user_id)
    return {"access_token": access_token}

@router.post("/logout")
def logout(payload: RefreshRequest, db: Session = Depends(get_db)):
    """
    Invalidates the refresh token.
    """
    db_token = db.query(RefreshToken).filter(RefreshToken.token == payload.refresh_token).first()
    if db_token:
        db_token.is_revoked = True
        db.commit()
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Returns the currently logged in user based on the Access Token.
    """
    return current_user

@router.delete("/me")
def delete_account(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Deletes the current user and all associated data.
    """
    # Delete refresh tokens
    db.query(RefreshToken).filter(RefreshToken.user_id == current_user.id).delete()
    
    # Delete events where user is ADMIN (cascade will handle event members if set up, otherwise we delete members first)
    from models.event_member import EventMember, EventRole
    from models.event import Event
    from models.media import Media
    
    # Simple manual cascade
    admin_memberships = db.query(EventMember).filter(EventMember.user_id == current_user.id, EventMember.role == EventRole.ADMIN).all()
    event_ids = [m.event_id for m in admin_memberships]
    
    if event_ids:
        # Delete media for these events
        db.query(Media).filter(Media.event_id.in_(event_ids)).delete()
        # Delete memberships
        db.query(EventMember).filter(EventMember.event_id.in_(event_ids)).delete()
        # Delete events
        db.query(Event).filter(Event.id.in_(event_ids)).delete()
        
    # Delete remaining memberships
    db.query(EventMember).filter(EventMember.user_id == current_user.id).delete()
    
    # Delete the user
    db.delete(current_user)
    db.commit()
    
    return {"message": "Account successfully deleted"}
