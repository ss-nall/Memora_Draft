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
from api.memories import router as memories_router
from api.companions import router as companions_router


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Memora - AI-powered Event Memory Platform API"
)

# Set all CORS enabled origins (allow localhost, local network IPs for mobile testing, and capacitor)
cors_origins = [str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS]
for default_origin in ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost", "capacitor://localhost"]:
    if default_origin not in cors_origins:
        cors_origins.append(default_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?|capacitor://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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
app.include_router(memories_router, prefix="/memories", tags=["memories"])
app.include_router(memories_router, prefix="/reels", tags=["reels"])
app.include_router(companions_router, prefix="/companions", tags=["companions"])


import os
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
