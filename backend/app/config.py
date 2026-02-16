from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60
    password_reset_expiration_minutes: int = 30
    encryption_key: str
    frontend_base_url: str | None = "http://localhost:3000"
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    allowed_origin_regex: str | None = r"https://.*\.vercel\.app"
    cors_allow_credentials: bool = False

    model_config = {"env_file": ".env"}

    @property
    def effective_database_url(self) -> str:
        """Normalise the DB URL for SQLAlchemy 2.0 (postgres:// → postgresql://)."""
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    @property
    def cors_origins(self) -> list[str]:
        raw = self.allowed_origins.strip()
        if raw == "*":
            return ["*"]
        return [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]

    @property
    def cors_origin_regex(self) -> str | None:
        regex = (self.allowed_origin_regex or "").strip()
        return regex or None


settings = Settings()
