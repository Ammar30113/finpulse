from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60
    encryption_key: str
    allowed_origins: str = "http://localhost:3000"

    model_config = {"env_file": ".env"}


settings = Settings()
