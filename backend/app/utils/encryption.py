import base64

from cryptography.fernet import Fernet

from app.config import settings

_key = base64.urlsafe_b64encode(settings.encryption_key.encode()[:32].ljust(32, b"\0"))
_fernet = Fernet(_key)


def encrypt_value(value: str) -> str:
    return _fernet.encrypt(value.encode()).decode()


def decrypt_value(token: str) -> str:
    return _fernet.decrypt(token.encode()).decode()
