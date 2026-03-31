"""Add enriched institution fields: citations, FWCI, topics, publications_by_year

Revision ID: 003
Revises: 002
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "003"
down_revision = "002"


def upgrade():
    op.add_column("institutions", sa.Column("total_citations", sa.Integer()))
    op.add_column("institutions", sa.Column("avg_fwci", sa.Float()))
    op.add_column("institutions", sa.Column("top_topics", JSONB()))
    op.add_column("institutions", sa.Column("publications_by_year", JSONB()))


def downgrade():
    op.drop_column("institutions", "publications_by_year")
    op.drop_column("institutions", "top_topics")
    op.drop_column("institutions", "avg_fwci")
    op.drop_column("institutions", "total_citations")
