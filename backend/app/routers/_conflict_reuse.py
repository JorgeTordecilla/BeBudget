from typing import TypeVar

from fastapi import Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.audit import emit_audit_event
from app.core.responses import vendor_response
from app.core.utils import utcnow

TModel = TypeVar("TModel")
TSchema = TypeVar("TSchema", bound=BaseModel)


def reuse_or_restore_response(
    *,
    db: Session,
    request: Request,
    user_id: str,
    row: TModel | None,
    resource_type: str,
    schema: type[TSchema],
) -> object | None:
    if row is None:
        return None

    archived_at = getattr(row, "archived_at", None)
    if archived_at is not None:
        now = utcnow()
        setattr(row, "archived_at", None)
        setattr(row, "updated_at", now)
        emit_audit_event(
            db,
            request=request,
            user_id=user_id,
            resource_type=resource_type,
            resource_id=getattr(row, "id"),
            action=f"{resource_type}.restore",
            created_at=now,
        )
        db.commit()
        db.refresh(row)

    payload = schema.model_validate(row).model_dump(mode="json")
    return vendor_response(payload, status_code=200)
