"""Add inst_type column to institutions

Revision ID: 012
Revises: 011
"""
from alembic import op
import sqlalchemy as sa

revision = "012"
down_revision = "011"


def upgrade():
    op.add_column("institutions", sa.Column("inst_type", sa.String()))


def downgrade():
    op.drop_column("institutions", "inst_type")
