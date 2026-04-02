"""Add last_funding_date and last_funding_round to companies

Revision ID: 008
Revises: 007
"""
from alembic import op
import sqlalchemy as sa

revision = "008"
down_revision = "007"


def upgrade():
    op.add_column("companies", sa.Column("last_funding_date", sa.String()))
    op.add_column("companies", sa.Column("last_funding_round", sa.String()))


def downgrade():
    op.drop_column("companies", "last_funding_round")
    op.drop_column("companies", "last_funding_date")
