"""Add subsidiary fields to companies

Revision ID: 009
Revises: 008
"""
from alembic import op
import sqlalchemy as sa

revision = "009"
down_revision = "008"


def upgrade():
    op.add_column("companies", sa.Column("is_non_uk_subsidiary", sa.Boolean(), server_default="false"))
    op.add_column("companies", sa.Column("parent_company", sa.String()))
    op.add_column("companies", sa.Column("parent_country", sa.String()))


def downgrade():
    op.drop_column("companies", "parent_country")
    op.drop_column("companies", "parent_company")
    op.drop_column("companies", "is_non_uk_subsidiary")
