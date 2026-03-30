"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-03-30
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "companies",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("lat", sa.Float),
        sa.Column("lng", sa.Float),
        sa.Column("website", sa.String),
        sa.Column("city", sa.String),
        sa.Column("postcode", sa.String),
        sa.Column("employees", sa.Integer),
        sa.Column("revenue_gbp", sa.Float),
        sa.Column("funding_usd_m", sa.Float),
        sa.Column("year_founded", sa.Integer),
        sa.Column("description", sa.Text),
        sa.Column("growth_stage", sa.String),
        sa.Column("status", sa.String),
        sa.Column("patent_count", sa.Integer),
        sa.Column("grant_count", sa.Integer),
        sa.Column("total_grant_funding_gbp", sa.Float),
        sa.Column("is_startup", sa.String),
        sa.Column("source_type", sa.String),
        sa.Column("discovery_verdict", sa.String),
        sa.Column("photonics_evidence", sa.String),
        sa.Column("data_strength", sa.String),
        sa.Column("data_strength_score", sa.Integer),
        sa.Column("emp_growth_pct", sa.Float),
        sa.Column("emp_growth_abs", sa.Integer),
        sa.Column("emp_earliest_count", sa.Integer),
        sa.Column("emp_latest_count", sa.Integer),
        sa.Column("emp_earliest_date", sa.String),
        sa.Column("emp_latest_date", sa.String),
        sa.Column("emp_timeseries", postgresql.JSONB),
        sa.Column("grants", postgresql.JSONB),
        sa.Column("sources", postgresql.JSONB),
        sa.Column("rtic", postgresql.JSONB),
    )
    op.create_index("ix_companies_name", "companies", ["name"])
    op.create_index("ix_companies_data_strength", "companies", ["data_strength"])
    op.create_index("ix_companies_employees", "companies", ["employees"])
    op.create_index("ix_companies_funding", "companies", ["funding_usd_m"])

    op.create_table(
        "company_rtic",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("company_id", sa.Integer, sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("rtic_code", sa.String, nullable=False),
    )
    op.create_index("ix_company_rtic_code", "company_rtic", ["rtic_code"])
    op.create_index("ix_company_rtic_company", "company_rtic", ["company_id"])

    op.create_table(
        "infrastructure",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("lat", sa.Float),
        sa.Column("lng", sa.Float),
        sa.Column("classification", sa.String),
        sa.Column("host_org", sa.String),
        sa.Column("address", sa.String),
        sa.Column("description", sa.Text),
        sa.Column("disciplines", sa.String),
        sa.Column("economic_sectors", sa.String),
        sa.Column("keywords", sa.String),
        sa.Column("website", sa.String),
        sa.Column("infraportal_url", sa.String),
        sa.Column("rtic", postgresql.JSONB),
    )
    op.create_index("ix_infrastructure_name", "infrastructure", ["name"])

    op.create_table(
        "institutions",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("lat", sa.Float),
        sa.Column("lng", sa.Float),
        sa.Column("rank", sa.Integer),
        sa.Column("photonics_works", sa.Integer),
        sa.Column("cluster_id", sa.Integer),
        sa.Column("n_grants", sa.Integer),
        sa.Column("n_collaborators", sa.Integer),
    )
    op.create_index("ix_institutions_name", "institutions", ["name"])

    op.create_table(
        "grants",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("reference", sa.String),
        sa.Column("title", sa.String),
        sa.Column("status", sa.String),
        sa.Column("category", sa.String),
        sa.Column("lead_funder", sa.String),
        sa.Column("lead_org", sa.String),
        sa.Column("lead_department", sa.String),
        sa.Column("pi_name", sa.String),
        sa.Column("funding_gbp", sa.Float),
        sa.Column("start_date", sa.String),
        sa.Column("end_date", sa.String),
        sa.Column("research_subjects", sa.String),
        sa.Column("research_topics", sa.String),
        sa.Column("abstract", sa.Text),
        sa.Column("potential_impact", sa.Text),
        sa.Column("gtr_url", sa.String),
        sa.Column("lat", sa.Float),
        sa.Column("lng", sa.Float),
    )
    op.create_index("ix_grants_lead_funder", "grants", ["lead_funder"])
    op.create_index("ix_grants_start_date", "grants", ["start_date"])
    op.create_index("ix_grants_lat", "grants", ["lat"])

    op.create_table(
        "patents",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("publication_number", sa.String),
        sa.Column("assignee", sa.String),
        sa.Column("lat", sa.Float),
        sa.Column("lng", sa.Float),
        sa.Column("cpc_codes", sa.String),
        sa.Column("earliest_filing", sa.String),
        sa.Column("latest_filing", sa.String),
    )
    op.create_index("ix_patents_assignee", "patents", ["assignee"])
    op.create_index("ix_patents_earliest_filing", "patents", ["earliest_filing"])
    op.create_index("ix_patents_latest_filing", "patents", ["latest_filing"])

    op.create_table(
        "people",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("orcid", sa.String),
        sa.Column("current_org", sa.String),
        sa.Column("current_org_type", sa.String),
        sa.Column("department", sa.String),
        sa.Column("role", sa.String),
        sa.Column("lat", sa.Float),
        sa.Column("lng", sa.Float),
        sa.Column("grant_count", sa.Integer),
        sa.Column("total_grant_funding_gbp", sa.Float),
        sa.Column("company_org", sa.String),
        sa.Column("grant_refs", postgresql.JSONB),
        sa.Column("sources", postgresql.JSONB),
    )
    op.create_index("ix_people_name", "people", ["name"])
    op.create_index("ix_people_role", "people", ["role"])
    op.create_index("ix_people_lat", "people", ["lat"])

    op.create_table(
        "company_collaborations",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("company", sa.String, nullable=False),
        sa.Column("company_grant_org", sa.String),
        sa.Column("collaborator", sa.String, nullable=False),
        sa.Column("collaborator_is_company", sa.Boolean),
        sa.Column("shared_grants", sa.Integer),
        sa.Column("collaborator_roles", sa.String),
        sa.Column("company_total_grants", sa.Integer),
    )
    op.create_index("ix_cc_company", "company_collaborations", ["company"])
    op.create_index("ix_cc_collaborator", "company_collaborations", ["collaborator"])

    op.create_table(
        "grant_edges",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("org_a_id", sa.String),
        sa.Column("org_a_name", sa.String),
        sa.Column("org_b_id", sa.String),
        sa.Column("org_b_name", sa.String),
        sa.Column("shared_grants", sa.Integer),
        sa.Column("same_cluster", sa.Boolean),
    )
    op.create_index("ix_ge_org_a_name", "grant_edges", ["org_a_name"])
    op.create_index("ix_ge_org_b_name", "grant_edges", ["org_b_name"])
    op.create_index("ix_ge_shared_grants", "grant_edges", ["shared_grants"])

    op.create_table(
        "coords_lookup",
        sa.Column("name", sa.String, primary_key=True),
        sa.Column("lat", sa.Float, nullable=False),
        sa.Column("lng", sa.Float, nullable=False),
    )

    op.create_table(
        "rtic_sectors",
        sa.Column("code", sa.String, primary_key=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("subsectors", postgresql.JSONB),
    )

    op.create_table(
        "stats",
        sa.Column("key", sa.String, primary_key=True),
        sa.Column("value", sa.String, nullable=False),
    )

    op.create_table(
        "data_version",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("version", sa.String, nullable=False),
        sa.Column("seeded_at", sa.String),
    )


def downgrade():
    for table in [
        "data_version", "stats", "rtic_sectors", "coords_lookup",
        "grant_edges", "company_collaborations", "people", "patents",
        "grants", "institutions", "infrastructure", "company_rtic", "companies",
    ]:
        op.drop_table(table)
