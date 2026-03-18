"""widen money columns to bigint

Revision ID: 20260313_0013
Revises: 20260311_0012
Create Date: 2026-03-13 16:30:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260313_0013"
down_revision = "20260311_0012"
branch_labels = None
depends_on = None


MONEY_COLUMNS: dict[str, tuple[str, ...]] = {
    "accounts": ("initial_balance_cents",),
    "transactions": ("amount_cents",),
    "income_sources": ("expected_amount_cents",),
    "monthly_rollover": ("amount_cents",),
    "budgets": ("limit_cents",),
    "bills": ("budget_cents",),
    "bill_payments": ("actual_cents",),
    "savings_goals": ("target_cents",),
    "savings_contributions": ("amount_cents",),
}


def _is_sqlite() -> bool:
    return op.get_context().dialect.name == "sqlite"


def _upgrade_postgres() -> None:
    for table_name, columns in MONEY_COLUMNS.items():
        for column in columns:
            op.alter_column(
                table_name,
                column,
                existing_type=sa.Integer(),
                type_=sa.BigInteger(),
                existing_nullable=False,
            )


def _downgrade_postgres() -> None:
    for table_name, columns in MONEY_COLUMNS.items():
        for column in columns:
            op.alter_column(
                table_name,
                column,
                existing_type=sa.BigInteger(),
                type_=sa.Integer(),
                existing_nullable=False,
            )


def _upgrade_sqlite() -> None:
    for table_name, columns in MONEY_COLUMNS.items():
        with op.batch_alter_table(table_name) as batch_op:
            for column in columns:
                batch_op.alter_column(
                    column,
                    existing_type=sa.Integer(),
                    type_=sa.BigInteger(),
                    existing_nullable=False,
                )


def _downgrade_sqlite() -> None:
    for table_name, columns in MONEY_COLUMNS.items():
        with op.batch_alter_table(table_name) as batch_op:
            for column in columns:
                batch_op.alter_column(
                    column,
                    existing_type=sa.BigInteger(),
                    type_=sa.Integer(),
                    existing_nullable=False,
                )


def upgrade() -> None:
    if _is_sqlite():
        _upgrade_sqlite()
        return
    _upgrade_postgres()


def downgrade() -> None:
    if _is_sqlite():
        _downgrade_sqlite()
        return
    _downgrade_postgres()
