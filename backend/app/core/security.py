import hashlib
import secrets
import time

import jwt
from fastapi.responses import Response
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext

from app.core.config import settings

_PASSWORD_CONTEXT = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    argon2__type="ID",
)


def hash_password(password: str) -> str:
    return _PASSWORD_CONTEXT.hash(password)


def verify_password(password: str, stored: str) -> bool:
    try:
        return _PASSWORD_CONTEXT.verify(password, stored)
    except (TypeError, ValueError):
        return False


def create_access_token(user_id: str) -> str:
    now = int(time.time())
    payload = {
        "sub": user_id,
        "exp": now + settings.access_token_expires_in,
        "iat": now,
        "nbf": now,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"],
            options={
                "require": ["sub", "exp", "iat", "nbf"],
            },
        )
    except InvalidTokenError as exc:
        raise ValueError("invalid access token") from exc

    if not isinstance(payload, dict):
        raise ValueError("invalid token payload")

    exp = payload.get("exp")
    iat = payload.get("iat")
    nbf = payload.get("nbf")
    sub = payload.get("sub")
    if (
        not isinstance(exp, int)
        or not isinstance(iat, int)
        or not isinstance(nbf, int)
        or not isinstance(sub, str)
        or not sub.strip()
    ):
        raise ValueError("invalid token claims")
    return payload


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        max_age=settings.refresh_token_ttl_seconds,
        path=settings.refresh_cookie_path,
        domain=settings.refresh_cookie_domain,
        secure=settings.refresh_cookie_secure,
        httponly=True,
        samesite=settings.refresh_cookie_samesite,
    )


def clear_refresh_cookie(response: Response) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value="",
        max_age=0,
        path=settings.refresh_cookie_path,
        domain=settings.refresh_cookie_domain,
        secure=settings.refresh_cookie_secure,
        httponly=True,
        samesite=settings.refresh_cookie_samesite,
    )
