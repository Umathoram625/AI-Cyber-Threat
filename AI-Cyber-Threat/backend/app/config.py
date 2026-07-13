from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    MONGODB_URI: str
    DATABASE_NAME: str = "cyber_threat_intel"
    PORT: int = 8000

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    NEWSDATA_API_KEY: Optional[str] = ""
    SERPER_API_KEY: Optional[str] = ""
    OPENAI_API_KEY: Optional[str] = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    GOOGLE_CLIENT_ID: Optional[str] = ""

    ADMIN_EMAIL: str = "admin@cti.local"
    ADMIN_PASSWORD: str = "AdminPassword123!"

    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
