"""Add quality metrics to institutions: pct_top10_cited, citations_per_paper

Revision ID: 005
Revises: 004
"""
from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"


def upgrade():
    op.add_column("institutions", sa.Column("pct_top10_cited", sa.Float()))
    op.add_column("institutions", sa.Column("citations_per_paper", sa.Float()))


def downgrade():
    op.drop_column("institutions", "citations_per_paper")
    op.drop_column("institutions", "pct_top10_cited")
