"""extend income source frequency enum

Revision ID: 20260430_0015
Revises: 20260415_0014
Create Date: 2026-04-30 16:30:00
"""

from alembic import op


revision = "20260430_0015"
down_revision = "20260415_0014"
branch_labels = None
depends_on = None


def _is_sqlite() -> bool:
    return op.get_context().dialect.name == "sqlite"


def upgrade() -> None:
    rule = "frequency IN ('monthly','weekly','biweekly')"
    if _is_sqlite():
        with op.batch_alter_table("income_sources") as batch_op:
            batch_op.drop_constraint("ck_income_sources_frequency_enum", type_="check")
            batch_op.create_check_constraint("ck_income_sources_frequency_enum", rule)
        return

    op.drop_constraint("ck_income_sources_frequency_enum", "income_sources", type_="check")
    op.create_check_constraint("ck_income_sources_frequency_enum", "income_sources", rule)


def downgrade() -> None:
    rule = "frequency IN ('monthly')"
    if _is_sqlite():
        with op.batch_alter_table("income_sources") as batch_op:
            batch_op.drop_constraint("ck_income_sources_frequency_enum", type_="check")
            batch_op.create_check_constraint("ck_income_sources_frequency_enum", rule)
        return

    op.drop_constraint("ck_income_sources_frequency_enum", "income_sources", type_="check")
    op.create_check_constraint("ck_income_sources_frequency_enum", "income_sources", rule)
