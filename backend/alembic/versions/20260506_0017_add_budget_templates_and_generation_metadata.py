"""add budget templates and month generation metadata

Revision ID: 20260506_0017
Revises: 20260505_0016
Create Date: 2026-05-06 10:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260506_0017"
down_revision = "20260505_0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("budgets", sa.Column("source", sa.String(length=16), nullable=True))
    op.execute("UPDATE budgets SET source = 'manual' WHERE source IS NULL")
    op.alter_column("budgets", "source", existing_type=sa.String(length=16), nullable=False)

    op.create_table(
        "budget_templates",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_budget_templates_user"),
    )
    op.create_index("idx_budget_templates_user_created", "budget_templates", ["user_id", "created_at"], unique=False)

    op.create_table(
        "budget_template_items",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("template_id", sa.String(length=36), nullable=False),
        sa.Column("category_id", sa.String(length=36), nullable=False),
        sa.Column("limit_cents", sa.BigInteger(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["template_id"], ["budget_templates.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("template_id", "category_id", name="uq_budget_template_items_template_category"),
    )
    op.create_index("idx_budget_template_items_template", "budget_template_items", ["template_id"], unique=False)

    op.create_table(
        "budget_month_generations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("month", sa.String(length=7), nullable=False),
        sa.Column("generated_from_template_version", sa.Integer(), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "month", name="uq_budget_month_generations_user_month"),
    )
    op.create_index("idx_budget_month_generations_user_month", "budget_month_generations", ["user_id", "month"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_budget_month_generations_user_month", table_name="budget_month_generations")
    op.drop_table("budget_month_generations")

    op.drop_index("idx_budget_template_items_template", table_name="budget_template_items")
    op.drop_table("budget_template_items")

    op.drop_index("idx_budget_templates_user_created", table_name="budget_templates")
    op.drop_table("budget_templates")

    op.drop_column("budgets", "source")
