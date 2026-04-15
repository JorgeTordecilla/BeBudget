from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.common import PasswordPolicyStr


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    email: EmailStr
    currency_code: Literal["USD", "COP", "EUR", "MXN"]


class RegisterRequest(BaseModel):
    username: str = Field(pattern=r"^[a-zA-Z0-9_]{3,20}$")
    password: PasswordPolicyStr
    email: EmailStr
    currency_code: Literal["USD", "COP", "EUR", "MXN"]

    @field_validator("email")
    @classmethod
    def _normalize_and_validate_email(cls, value: EmailStr) -> str:
        normalized = str(value).strip().lower()
        if len(normalized) > 254:
            raise ValueError("email must be 254 characters or fewer")
        return normalized


class LoginRequest(BaseModel):
    username: str = Field(pattern=r"^[a-zA-Z0-9_]{3,20}$")
    password: PasswordPolicyStr


class AuthSessionResponse(BaseModel):
    user: UserOut
    access_token: str
    access_token_expires_in: int
