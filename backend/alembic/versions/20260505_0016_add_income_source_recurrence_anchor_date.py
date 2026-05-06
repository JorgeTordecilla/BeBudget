"""add recurrence anchor date to income sources

Revision ID: 20260505_0016
Revises: 20260430_0015
Create Date: 2026-05-05 10:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260505_0016"
down_revision = "20260430_0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("income_sources", sa.Column("recurrence_anchor_date", sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column("income_sources", "recurrence_anchor_date")
