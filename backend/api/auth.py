from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from starlette.requests import Request
from authlib.integrations.starlette_client import OAuth, OAuthError

from core.database import get_db
from core.security import verify_password, get_password_hash, create_access_token
from core.config import settings
from models.user import User
from schemas.user import UserCreate, UserResponse, Token

router = APIRouter()

oauth = OAuth()
oauth.register(
    name='google',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    client_kwargs={
        'scope': 'openid email profile'
    }
)


@router.post("/register", response_model=UserResponse)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/google/login")
async def google_login(request: Request):
    """
    Redirects the user to the Google consent screen.
    """
    # The URL that Google will redirect back to
    redirect_uri = "http://localhost:8000/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """
    Handles the callback from Google, exchanges the code for a token,
    fetches user info, and logs them in (or registers them).
    """
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as error:
        raise HTTPException(status_code=400, detail=str(error.error))
        
    user_info = token.get('userinfo')
    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to fetch user info from Google")
        
    email = user_info.get("email")
    full_name = user_info.get("name")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")
        
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Create a new user if they don't exist
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=None  # No password for OAuth users
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    # Generate our JWT token for the session
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        user.id, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name
        }
    }
