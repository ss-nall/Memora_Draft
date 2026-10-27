import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import settings

Base = declarative_base()

def _init_engine():
    db_uri = str(settings.SQLALCHEMY_DATABASE_URI)
    try:
        eng = create_engine(db_uri, pool_pre_ping=True)
        with eng.connect():
            pass
        return eng
    except Exception as e:
        print(f"PostgreSQL connection failed ({e}). Falling back to robust SQLite local storage.")
        sqlite_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "memora.db"))
        return create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False})

engine = _init_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
