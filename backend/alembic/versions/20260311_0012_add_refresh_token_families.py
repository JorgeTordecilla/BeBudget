"""add refresh token family lineage fields

Revision ID: 20260311_0012
Revises: 20260310_0011
Create Date: 2026-03-11 11:30:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260311_0012"
down_revision = "20260310_0011"
branch_labels = None
depends_on = None


def _is_sqlite() -> bool:
    return op.get_context().dialect.name == "sqlite"


def upgrade() -> None:
    if _is_sqlite():
        with op.batch_alter_table("refresh_tokens") as batch_op:
            batch_op.add_column(sa.Column("family_id", sa.String(length=36), nullable=True))
            batch_op.add_column(sa.Column("parent_hash", sa.String(length=64), nullable=True))
            batch_op.add_column(sa.Column("rotated_at", sa.DateTime(timezone=True), nullable=True))
            batch_op.add_column(sa.Column("grace_until", sa.DateTime(timezone=True), nullable=True))
            batch_op.create_index("idx_refresh_tokens_family", ["family_id"], unique=False)
        return

    op.add_column("refresh_tokens", sa.Column("family_id", sa.String(length=36), nullable=True))
    op.add_column("refresh_tokens", sa.Column("parent_hash", sa.String(length=64), nullable=True))
    op.add_column("refresh_tokens", sa.Column("rotated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("refresh_tokens", sa.Column("grace_until", sa.DateTime(timezone=True), nullable=True))
    op.create_index("idx_refresh_tokens_family", "refresh_tokens", ["family_id"], unique=False)


def downgrade() -> None:
    if _is_sqlite():
        with op.batch_alter_table("refresh_tokens") as batch_op:
            batch_op.drop_index("idx_refresh_tokens_family")
            batch_op.drop_column("grace_until")
            batch_op.drop_column("rotated_at")
            batch_op.drop_column("parent_hash")
            batch_op.drop_column("family_id")
        return

    op.drop_index("idx_refresh_tokens_family", table_name="refresh_tokens")
    op.drop_column("refresh_tokens", "grace_until")
    op.drop_column("refresh_tokens", "rotated_at")
    op.drop_column("refresh_tokens", "parent_hash")
    op.drop_column("refresh_tokens", "family_id")
