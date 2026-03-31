"""Replace discovery_verdict/photonics_evidence with photonics_score/rationale

Revision ID: 007
Revises: 006
"""
from alembic import op
import sqlalchemy as sa

revision = "007"
down_revision = "006"


def upgrade():
    op.add_column("companies", sa.Column("photonics_score", sa.Integer()))
    op.add_column("companies", sa.Column("photonics_rationale", sa.Text()))
    op.drop_column("companies", "discovery_verdict")
    op.drop_column("companies", "photonics_evidence")


def downgrade():
    op.add_column("companies", sa.Column("photonics_evidence", sa.String()))
    op.add_column("companies", sa.Column("discovery_verdict", sa.String()))
    op.drop_column("companies", "photonics_rationale")
    op.drop_column("companies", "photonics_score")
