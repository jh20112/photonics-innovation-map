"""Add topic_breakdown to institutions

Revision ID: 004
Revises: 003
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "004"
down_revision = "003"


def upgrade():
    op.add_column("institutions", sa.Column("topic_breakdown", JSONB()))


def downgrade():
    op.drop_column("institutions", "topic_breakdown")
