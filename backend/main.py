from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from fastapi.staticfiles import StaticFiles

from core.config import settings
from api.auth import router as auth_router
from api.events import router as events_router
from api.media import router as media_router
from api.guest import router as guest_router
from api.members import router as members_router
from api.requests import router as requests_router
from api.notifications import router as notifications_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Memora - AI-powered Event Memory Platform API"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Required for Authlib (Google OAuth)
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

@app.get("/health")
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(events_router, prefix="/events", tags=["events"])
app.include_router(members_router, prefix="/events", tags=["members"])
app.include_router(requests_router, prefix="/events", tags=["requests"])
app.include_router(media_router, prefix="/media", tags=["media"])
app.include_router(guest_router, prefix="/guest", tags=["guest"])
app.include_router(notifications_router, prefix="/notifications", tags=["notifications"])

import os
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
