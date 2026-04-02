"""Add research_edges table for publication co-authorship

Revision ID: 011
Revises: 010
"""
from alembic import op
import sqlalchemy as sa

revision = "011"
down_revision = "010"


def upgrade():
    op.create_table(
        "research_edges",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("inst_a", sa.String, nullable=False, index=True),
        sa.Column("inst_b", sa.String, nullable=False, index=True),
        sa.Column("shared_publications", sa.Integer, index=True),
    )


def downgrade():
    op.drop_table("research_edges")
