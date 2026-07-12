from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from core.config import settings
from api.auth import router as auth_router
from api.events import router as events_router
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Memora - AI-powered Event Memory Platform API"
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
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
