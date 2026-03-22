from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "gym_user"
    DB_PASSWORD: str = "gym_password"
    DB_NAME: str = "smart_gym"
    DATABASE_URL: str = ""

    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # App
    APP_NAME: str = "Smart Gym Platform"
    DEBUG: bool = False
    API_V1_STR: str = "/api"

    class Config:
        env_file = ".env"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.DATABASE_URL:
            self.DATABASE_URL = (
                f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            )

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
