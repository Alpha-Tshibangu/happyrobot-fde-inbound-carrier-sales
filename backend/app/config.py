import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Use environment variable if set (for Fly.io), otherwise use local path
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./happyrobot.db")
    api_key: str = os.getenv("API_KEY", "")
    happy_robot_api_key: str = os.getenv("HAPPY_ROBOT_API_KEY", "")
    fmcsa_api_key: str = os.getenv("FMCSA_API_KEY", "")
    environment: str = os.getenv("ENVIRONMENT", "development")

    class Config:
        env_file = ".env"


settings = Settings()
