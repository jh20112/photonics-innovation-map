"""Add positions, education, publication_count to people table.

Revision ID: 002
Revises: 001
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "002"
down_revision = "001"


def upgrade():
    op.add_column("people", sa.Column("publication_count", sa.Integer))
    op.add_column("people", sa.Column("positions", postgresql.JSONB))
    op.add_column("people", sa.Column("education", postgresql.JSONB))


def downgrade():
    op.drop_column("people", "education")
    op.drop_column("people", "positions")
    op.drop_column("people", "publication_count")
