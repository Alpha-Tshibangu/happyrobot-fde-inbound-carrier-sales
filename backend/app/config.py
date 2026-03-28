import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Use environment variable if set (for Fly.io), otherwise use local path
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./happyrobot.db")
    api_key: str = "hr_9b477b80e2674d708437db35753e3207"
    fmcsa_api_key: str = "cdc33e44d693a3a58451898d4ec9df862c65b954"
    environment: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
