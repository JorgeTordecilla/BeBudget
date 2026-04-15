"""add user email

Revision ID: 20260415_0014
Revises: 20260313_0013
Create Date: 2026-04-15 08:55:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260415_0014"
down_revision = "20260313_0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email", sa.String(length=254), nullable=True))
    op.execute(sa.text("UPDATE users SET email = lower(username) || '@bebudget.local' WHERE email IS NULL"))
    op.alter_column("users", "email", existing_type=sa.String(length=254), nullable=False)
    op.create_unique_constraint("uq_users_email", "users", ["email"])
    op.create_index("ix_users_email", "users", ["email"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.drop_constraint("uq_users_email", "users", type_="unique")
    op.drop_column("users", "email")
