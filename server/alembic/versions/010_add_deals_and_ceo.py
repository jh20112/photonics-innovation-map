"""Add pitchbook_deals, latest_deal_date, ceo_name, ceo_biography

Revision ID: 010
Revises: 009
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "010"
down_revision = "009"


def upgrade():
    op.add_column("companies", sa.Column("pitchbook_deals", JSONB()))
    op.add_column("companies", sa.Column("latest_deal_date", sa.String()))
    op.add_column("companies", sa.Column("ceo_name", sa.String()))
    op.add_column("companies", sa.Column("ceo_biography", sa.Text()))


def downgrade():
    op.drop_column("companies", "ceo_biography")
    op.drop_column("companies", "ceo_name")
    op.drop_column("companies", "latest_deal_date")
    op.drop_column("companies", "pitchbook_deals")
