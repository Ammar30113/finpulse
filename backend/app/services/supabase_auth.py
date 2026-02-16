import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from app.config import settings

logger = logging.getLogger("finpulse.supabase")


class SupabaseAuthError(Exception):
    def __init__(self, detail: str, status_code: int = 502):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def _supabase_base() -> str:
    if not settings.supabase_enabled:
        raise SupabaseAuthError("Supabase auth is not configured", status_code=500)
    return settings.supabase_url.rstrip("/")


def _request(
    method: str,
    path: str,
    *,
    body: dict[str, Any] | None = None,
    use_service_role: bool = False,
    bearer_token: str | None = None,
    query: dict[str, str] | None = None,
) -> dict[str, Any]:
    base = _supabase_base()
    url = f"{base}{path}"
    if query:
        url += f"?{urllib.parse.urlencode(query)}"

    payload = None
    if body is not None:
        payload = json.dumps(body).encode("utf-8")

    headers = {
        "Content-Type": "application/json",
        "apikey": settings.supabase_service_role_key if use_service_role else settings.supabase_anon_key,
    }

    if use_service_role and not settings.supabase_service_role_key:
        raise SupabaseAuthError("SUPABASE_SERVICE_ROLE_KEY is required", status_code=500)

    if bearer_token:
        headers["Authorization"] = f"Bearer {bearer_token}"
    elif use_service_role:
        headers["Authorization"] = f"Bearer {settings.supabase_service_role_key}"

    req = urllib.request.Request(url=url, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8") if exc.fp else ""
        detail = "Supabase auth request failed"
        if raw:
            try:
                body = json.loads(raw)
                detail = body.get("msg") or body.get("message") or body.get("error_description") or body.get("error") or detail
            except Exception:
                detail = raw
        raise SupabaseAuthError(detail=detail, status_code=exc.code) from exc
    except urllib.error.URLError as exc:
        raise SupabaseAuthError(
            detail=f"Supabase auth unreachable: {exc.reason}",
            status_code=502,
        ) from exc


def sign_up_user(email: str, password: str, full_name: str) -> dict[str, Any]:
    """Create a Supabase auth user via public signup flow."""
    return _request(
        "POST",
        "/auth/v1/signup",
        body={
            "email": email,
            "password": password,
            "data": {"full_name": full_name},
        },
    )


def sign_in_with_password(email: str, password: str) -> dict[str, Any]:
    """Validate credentials against Supabase."""
    return _request(
        "POST",
        "/auth/v1/token",
        query={"grant_type": "password"},
        body={"email": email, "password": password},
    )


def send_recovery_email(email: str, redirect_to: str | None) -> None:
    query: dict[str, str] = {}
    if redirect_to:
        query["redirect_to"] = redirect_to
    _request("POST", "/auth/v1/recover", body={"email": email}, query=query)


def update_password_with_access_token(access_token: str, new_password: str) -> dict[str, Any]:
    return _request(
        "PUT",
        "/auth/v1/user",
        bearer_token=access_token,
        body={"password": new_password},
    )
