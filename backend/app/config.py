from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60
    encryption_key: str
    allowed_origins: str = "http://localhost:3000"

    model_config = {"env_file": ".env"}

    @property
    def effective_database_url(self) -> str:
        """Normalise the DB URL for SQLAlchemy 2.0 (postgres:// → postgresql://)."""
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url


settings = Settings()
