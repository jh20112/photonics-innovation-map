from sqlalchemy import (
    Boolean, Column, Float, ForeignKey, Index, Integer, String, Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, index=True)
    lat = Column(Float)
    lng = Column(Float)
    website = Column(String)
    city = Column(String)
    postcode = Column(String)
    employees = Column(Integer)
    revenue_gbp = Column(Float)
    funding_usd_m = Column(Float)
    year_founded = Column(Integer)
    description = Column(Text)
    growth_stage = Column(String)
    status = Column(String)
    patent_count = Column(Integer)
    grant_count = Column(Integer)
    total_grant_funding_gbp = Column(Float)
    is_startup = Column(String)
    source_type = Column(String)
    discovery_verdict = Column(String)
    photonics_evidence = Column(String)
    data_strength = Column(String, index=True)
    data_strength_score = Column(Integer)
    # Growth metrics
    emp_growth_pct = Column(Float)
    emp_growth_abs = Column(Integer)
    emp_earliest_count = Column(Integer)
    emp_latest_count = Column(Integer)
    emp_earliest_date = Column(String)
    emp_latest_date = Column(String)
    # JSON columns — read whole, never queried
    emp_timeseries = Column(JSONB)
    grants = Column(JSONB)
    sources = Column(JSONB)
    rtic = Column(JSONB)

    __table_args__ = (
        Index("ix_companies_employees", "employees"),
        Index("ix_companies_funding", "funding_usd_m"),
    )


class CompanyRtic(Base):
    """Denormalized RTIC assignments for efficient sector filtering."""
    __tablename__ = "company_rtic"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    rtic_code = Column(String, nullable=False)

    __table_args__ = (
        Index("ix_company_rtic_code", "rtic_code"),
        Index("ix_company_rtic_company", "company_id"),
    )


class Infrastructure(Base):
    __tablename__ = "infrastructure"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, index=True)
    lat = Column(Float)
    lng = Column(Float)
    classification = Column(String)
    host_org = Column(String)
    address = Column(String)
    description = Column(Text)
    disciplines = Column(String)
    economic_sectors = Column(String)
    keywords = Column(String)
    website = Column(String)
    infraportal_url = Column(String)
    rtic = Column(JSONB)


class Institution(Base):
    __tablename__ = "institutions"

    id = Column(String, primary_key=True)  # OpenAlex URI
    name = Column(String, nullable=False, index=True)
    lat = Column(Float)
    lng = Column(Float)
    rank = Column(Integer)
    photonics_works = Column(Integer)
    total_citations = Column(Integer)
    avg_fwci = Column(Float)
    top_topics = Column(JSONB)
    publications_by_year = Column(JSONB)
    topic_breakdown = Column(JSONB)
    cluster_id = Column(Integer)
    n_grants = Column(Integer)
    n_collaborators = Column(Integer)


class Grant(Base):
    __tablename__ = "grants"

    id = Column(String, primary_key=True)  # UUID
    reference = Column(String)
    title = Column(String)
    status = Column(String)
    category = Column(String)
    lead_funder = Column(String, index=True)
    lead_org = Column(String)
    lead_department = Column(String)
    pi_name = Column(String)
    funding_gbp = Column(Float)
    start_date = Column(String, index=True)
    end_date = Column(String)
    research_subjects = Column(String)
    research_topics = Column(String)
    abstract = Column(Text)
    potential_impact = Column(Text)
    gtr_url = Column(String)
    lat = Column(Float, index=True)
    lng = Column(Float)


class Patent(Base):
    __tablename__ = "patents"

    id = Column(Integer, primary_key=True)
    publication_number = Column(String)
    assignee = Column(String, index=True)
    lat = Column(Float)
    lng = Column(Float)
    cpc_codes = Column(String)
    earliest_filing = Column(String, index=True)
    latest_filing = Column(String, index=True)


class Person(Base):
    __tablename__ = "people"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, index=True)
    orcid = Column(String)
    current_org = Column(String)
    current_org_type = Column(String)
    department = Column(String)
    role = Column(String, index=True)
    lat = Column(Float, index=True)
    lng = Column(Float)
    grant_count = Column(Integer)
    total_grant_funding_gbp = Column(Float)
    company_org = Column(String)
    publication_count = Column(Integer)
    grant_refs = Column(JSONB)
    sources = Column(JSONB)
    positions = Column(JSONB)   # Employment history from ORCID
    education = Column(JSONB)   # Education history from ORCID


class CompanyCollaboration(Base):
    __tablename__ = "company_collaborations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company = Column(String, nullable=False, index=True)
    company_grant_org = Column(String)
    collaborator = Column(String, nullable=False, index=True)
    collaborator_is_company = Column(Boolean)
    shared_grants = Column(Integer)
    collaborator_roles = Column(String)
    company_total_grants = Column(Integer)


class GrantEdge(Base):
    __tablename__ = "grant_edges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    org_a_id = Column(String)
    org_a_name = Column(String, index=True)
    org_b_id = Column(String)
    org_b_name = Column(String, index=True)
    shared_grants = Column(Integer, index=True)
    same_cluster = Column(Boolean)


class CoordsLookup(Base):
    __tablename__ = "coords_lookup"

    name = Column(String, primary_key=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)


class RticSector(Base):
    __tablename__ = "rtic_sectors"

    code = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    subsectors = Column(JSONB)  # [{code, name}, ...]


class Stat(Base):
    __tablename__ = "stats"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)


class DataVersion(Base):
    __tablename__ = "data_version"

    id = Column(Integer, primary_key=True, default=1)
    version = Column(String, nullable=False)
    seeded_at = Column(String)
