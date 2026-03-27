from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./happyrobot.db"
    api_key: str = "default-api-key"
    fmcsa_api_key: str = ""
    environment: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
