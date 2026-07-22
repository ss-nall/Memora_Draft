from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests
from datetime import datetime

from core.database import get_db
from core.security import create_access_token, create_refresh_token
from core.config import settings
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
