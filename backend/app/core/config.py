from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    GOOGLE_API_KEY: str
    AT_API_KEY: str
    AT_USERNAME: str
    AT_SENDER_ID: str = "REMOTRIAGE"
    APP_ENV: str = "development"
    MOCK_AI: bool = False

    class Config:
        env_file = ".env"

settings = Settings()