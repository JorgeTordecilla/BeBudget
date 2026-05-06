import re
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.money import validate_limit_cents, validate_user_currency_for_money
from app.core.responses import vendor_response
from app.db import get_db
from app.core.utils import utcnow
from app.dependencies import get_current_user
from app.errors import (
    budget_duplicate_error,
    budget_month_invalid_error,
    category_archived_error,
    category_not_owned_error,
    forbidden_error,
)
from app.models import Budget, BudgetMonthGeneration, BudgetTemplate, BudgetTemplateItem, Category, User
from app.repositories import SQLAlchemyBudgetRepository, SQLAlchemyCategoryRepository
from app.schemas import (
    BudgetCreate,
    BudgetListResponse,
    BudgetMonthOut,
    BudgetOut,
    BudgetTemplateOut,
    BudgetTemplateUpdate,
    BudgetUpdate,
)

router = APIRouter(prefix="/budgets", tags=["budgets"])

_MONTH_PATTERN = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")


def _validate_month_or_400(month: str) -> str:
    if not _MONTH_PATTERN.fullmatch(month):
        raise budget_month_invalid_error("month must match YYYY-MM")
    return month


def _owned_budget_or_403(db: Session, user_id: str, budget_id: str) -> Budget:
    budget = SQLAlchemyBudgetRepository(db).get_owned(user_id, budget_id)
    if not budget:
        raise forbidden_error("Not allowed")
    return budget


def _owned_active_category_or_409(db: Session, user_id: str, category_id: str):
    category = SQLAlchemyCategoryRepository(db).get_owned(user_id, category_id)
    if not category:
        raise category_not_owned_error()
    if category.archived_at is not None:
        raise category_archived_error()
    return category


def _get_or_create_template(db: Session, user_id: str) -> BudgetTemplate:
    template = db.scalar(select(BudgetTemplate).where(BudgetTemplate.user_id == user_id))
    if template is not None:
        return template
    template = BudgetTemplate(user_id=user_id, version=1)
    db.add(template)
    db.flush()
    return template


def _template_payload(db: Session, template: BudgetTemplate) -> BudgetTemplateOut:
    items = list(
        db.scalars(
            select(BudgetTemplateItem)
            .where(BudgetTemplateItem.template_id == template.id)
            .order_by(BudgetTemplateItem.created_at.asc(), BudgetTemplateItem.id.asc())
        )
    )
    return BudgetTemplateOut(
        id=template.id,
        version=template.version,
        items=[
            {
                "id": item.id,
                "category_id": item.category_id,
                "limit_cents": item.limit_cents,
                "is_active": item.is_active,
            }
            for item in items
        ],
        created_at=template.created_at,
        updated_at=template.updated_at,
    )


@router.get("")
def list_budgets(
    from_: str = Query(alias="from"),
    to: str = Query(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from_month = _validate_month_or_400(from_)
    to_month = _validate_month_or_400(to)
    if from_month > to_month:
        raise budget_month_invalid_error("from must be less than or equal to to")
    rows = SQLAlchemyBudgetRepository(db).list_for_user_month_range(current_user.id, from_month, to_month)
    payload = BudgetListResponse(items=[BudgetOut.model_validate(row) for row in rows]).model_dump(mode="json")
    return vendor_response(payload)


@router.get("/template")
def get_budget_template(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    template = _get_or_create_template(db, current_user.id)
    db.commit()
    db.refresh(template)
    return vendor_response(_template_payload(db, template).model_dump(mode="json"))


@router.put("/template")
def put_budget_template(payload: BudgetTemplateUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    validate_user_currency_for_money(current_user.currency_code)
    template = _get_or_create_template(db, current_user.id)
    categories = {
        row.id: row
        for row in db.scalars(select(Category).where(Category.user_id == current_user.id, Category.archived_at.is_(None)))
    }
    for item in payload.items:
        if item.category_id not in categories:
            raise category_not_owned_error()
        if categories[item.category_id].type.value != "expense":
            raise category_not_owned_error("Category must be expense type")
        validate_limit_cents(item.limit_cents)

    db.query(BudgetTemplateItem).filter(BudgetTemplateItem.template_id == template.id).delete()
    now = utcnow()
    for item in payload.items:
        db.add(
            BudgetTemplateItem(
                template_id=template.id,
                category_id=item.category_id,
                limit_cents=validate_limit_cents(item.limit_cents),
                is_active=item.is_active,
            )
        )
    template.version += 1
    template.updated_at = now
    db.commit()
    db.refresh(template)
    return vendor_response(_template_payload(db, template).model_dump(mode="json"))


@router.post("/{month}/generate-from-template")
def generate_month_from_template(month: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    month = _validate_month_or_400(month)
    template = _get_or_create_template(db, current_user.id)
    items = list(
        db.scalars(
            select(BudgetTemplateItem)
            .join(Category, Category.id == BudgetTemplateItem.category_id)
            .where(BudgetTemplateItem.template_id == template.id)
            .where(BudgetTemplateItem.is_active.is_(True))
            .where(Category.archived_at.is_(None))
            .where(Category.user_id == current_user.id)
        )
    )
    existing = {
        row.category_id: row
        for row in db.scalars(
            select(Budget).where(Budget.user_id == current_user.id, Budget.month == month, Budget.archived_at.is_(None))
        )
    }
    for item in items:
        if item.category_id in existing:
            continue
        db.add(
            Budget(
                user_id=current_user.id,
                category_id=item.category_id,
                month=month,
                limit_cents=item.limit_cents,
                source="template",
            )
        )
    generation = db.scalar(
        select(BudgetMonthGeneration).where(BudgetMonthGeneration.user_id == current_user.id, BudgetMonthGeneration.month == month)
    )
    if generation is None:
        generation = BudgetMonthGeneration(
            user_id=current_user.id,
            month=month,
            generated_from_template_version=template.version,
            generated_at=utcnow(),
        )
        db.add(generation)
    else:
        generation.generated_from_template_version = template.version
        generation.generated_at = utcnow()
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
    return get_month_budget(month, current_user=current_user, db=db)


@router.get("/month/{month}")
def get_month_budget(month: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    month = _validate_month_or_400(month)
    rows = list(
        db.scalars(
            select(Budget)
            .where(Budget.user_id == current_user.id, Budget.month == month, Budget.archived_at.is_(None))
            .order_by(Budget.created_at.asc(), Budget.id.asc())
        )
    )
    generation = db.scalar(
        select(BudgetMonthGeneration).where(BudgetMonthGeneration.user_id == current_user.id, BudgetMonthGeneration.month == month)
    )
    payload = BudgetMonthOut(
        month=month,
        items=[BudgetOut.model_validate(row) for row in rows],
        generated_at=None if generation is None else generation.generated_at,
        generated_from_template_version=None if generation is None else generation.generated_from_template_version,
    )
    return vendor_response(payload.model_dump(mode="json"))


@router.put("/month/{month}")
def put_month_budget(
    month: str,
    payload: BudgetTemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    month = _validate_month_or_400(month)
    validate_user_currency_for_money(current_user.currency_code)
    categories = {
        row.id: row
        for row in db.scalars(select(Category).where(Category.user_id == current_user.id, Category.archived_at.is_(None)))
    }
    for item in payload.items:
        if item.category_id not in categories:
            raise category_not_owned_error()
        if categories[item.category_id].type.value != "expense":
            raise category_not_owned_error("Category must be expense type")
        validate_limit_cents(item.limit_cents)

    existing = {
        row.category_id: row
        for row in db.scalars(select(Budget).where(Budget.user_id == current_user.id, Budget.month == month, Budget.archived_at.is_(None)))
    }
    now = utcnow()
    for item in payload.items:
        amount = validate_limit_cents(item.limit_cents)
        row = existing.get(item.category_id)
        if row is None:
            db.add(
                Budget(
                    user_id=current_user.id,
                    category_id=item.category_id,
                    month=month,
                    limit_cents=amount,
                    source="override",
                )
            )
            continue
        row.limit_cents = amount
        row.source = "override"
        row.updated_at = now
    db.commit()
    return get_month_budget(month, current_user=current_user, db=db)


@router.post("")
def create_budget(payload: BudgetCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = payload.model_dump()
    validate_user_currency_for_money(current_user.currency_code)
    data["month"] = _validate_month_or_400(data["month"])
    data["limit_cents"] = validate_limit_cents(data["limit_cents"])
    _owned_active_category_or_409(db, current_user.id, data["category_id"])

    repo = SQLAlchemyBudgetRepository(db)
    row = Budget(user_id=current_user.id, **data)
    repo.add(row)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise budget_duplicate_error() from exc
    db.refresh(row)
    return vendor_response(BudgetOut.model_validate(row).model_dump(mode="json"), status_code=201)


@router.get("/{budget_id}")
def get_budget(budget_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = _owned_budget_or_403(db, current_user.id, str(budget_id))
    return vendor_response(BudgetOut.model_validate(row).model_dump(mode="json"))


@router.patch("/{budget_id}")
def patch_budget(
    budget_id: UUID,
    payload: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = _owned_budget_or_403(db, current_user.id, str(budget_id))
    data = payload.model_dump(exclude_unset=True)

    merged_month = _validate_month_or_400(data.get("month", row.month))
    merged_limit = validate_limit_cents(data.get("limit_cents", row.limit_cents))
    merged_category_id = data.get("category_id", row.category_id)
    _owned_active_category_or_409(db, current_user.id, merged_category_id)

    data["month"] = merged_month
    data["limit_cents"] = merged_limit
    data["category_id"] = merged_category_id
    for key, value in data.items():
        setattr(row, key, value)
    row.updated_at = utcnow()
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise budget_duplicate_error() from exc
    db.refresh(row)
    return vendor_response(BudgetOut.model_validate(row).model_dump(mode="json"))


@router.delete("/{budget_id}", status_code=204)
def delete_budget(budget_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = _owned_budget_or_403(db, current_user.id, str(budget_id))
    now = utcnow()
    row.archived_at = now
    row.updated_at = now
    db.commit()
    return Response(status_code=204)
