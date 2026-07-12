from typing import Any, Dict, List, Optional, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, PostgresDsn, validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "Memora"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    # JWT Authentication
    SECRET_KEY: str = "super_secret_key_change_me_in_production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Postgres Database
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: str = "5432"
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None

    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql",
            username=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            port=int(values.get("POSTGRES_PORT")) if values.get("POSTGRES_PORT") else 5432,
            path=f"{values.get('POSTGRES_DB') or ''}",
        )

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")

settings = Settings()
