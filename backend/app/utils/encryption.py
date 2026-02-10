import base64

from cryptography.fernet import Fernet

from app.config import settings

_raw_key = settings.encryption_key.encode()
if len(_raw_key) < 32:
    raise ValueError(
        f"ENCRYPTION_KEY must be at least 32 bytes, got {len(_raw_key)}. "
        "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
    )
_key = base64.urlsafe_b64encode(_raw_key[:32])
_fernet = Fernet(_key)


def encrypt_value(value: str) -> str:
    return _fernet.encrypt(value.encode()).decode()


def decrypt_value(token: str) -> str:
    return _fernet.decrypt(token.encode()).decode()
