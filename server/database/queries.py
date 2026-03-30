"""
Database query functions — one per API endpoint.

Each function takes a Session and filter parameters, returns Python dicts
matching the original JSON API response shapes.
"""

from sqlalchemy import func, select, or_
from sqlalchemy.orm import Session

from server.database.models import (
    Company, CompanyCollaboration, CompanyRtic, CoordsLookup,
    Grant, GrantEdge, Infrastructure, Institution, Patent, Person,
    RticSector, Stat,
)


def _escape_like(s: str) -> str:
    """Escape LIKE/ILIKE wildcards so they are treated as literals."""
    return s.replace("\\", "\\\\").replace("%", r"\%").replace("_", r"\_")


def _ilike_pattern(s: str) -> str:
    return f"%{_escape_like(s)}%"


def _model_to_dict(obj, exclude: set[str] | None = None) -> dict:
    """Convert a single ORM model instance to a dict."""
    excl = exclude or set()
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns if c.name not in excl}


# --- Companies ---

def get_companies(
    db: Session,
    sectors: list[str] | None = None,
    sources: list[str] | None = None,
    strengths: list[str] | None = None,
    min_employees: int | None = None,
    min_funding: float | None = None,
    search: str | None = None,
) -> list[dict]:
    q = select(Company)

    if sectors:
        company_ids = (
            select(CompanyRtic.company_id)
            .where(CompanyRtic.rtic_code.in_(sectors))
            .distinct()
        )
        q = q.where(Company.id.in_(company_ids))
    if strengths:
        q = q.where(Company.data_strength.in_(strengths))
    if min_employees:
        q = q.where(func.coalesce(Company.employees, 0) >= min_employees)
    if min_funding:
        q = q.where(func.coalesce(Company.funding_usd_m, 0) >= min_funding)
    if search:
        q = q.where(Company.name.ilike(_ilike_pattern(search)))

    results = [_model_to_dict(c) for c in db.scalars(q).all()]

    # Source filtering done in Python since sources is a JSONB array
    if sources:
        results = [
            c for c in results
            if any(s in (c.get("sources") or []) for s in sources)
        ]

    return results


def get_company_by_id(db: Session, company_id: int) -> dict | None:
    c = db.get(Company, company_id)
    return _model_to_dict(c) if c else None


# --- Infrastructure ---

def get_infrastructure(
    db: Session,
    classification: str | None = None,
    sectors: list[str] | None = None,
    search: str | None = None,
) -> list[dict]:
    q = select(Infrastructure).where(Infrastructure.classification != "Not Photonics")
    if classification:
        q = q.where(func.lower(Infrastructure.classification) == classification.lower())
    if search:
        q = q.where(
            or_(
                Infrastructure.name.ilike(_ilike_pattern(search)),
                Infrastructure.host_org.ilike(_ilike_pattern(search)),
            )
        )

    results = [_model_to_dict(f) for f in db.scalars(q).all()]

    # Sector filtering on JSONB rtic array — done in Python
    if sectors:
        results = [
            f for f in results
            if any(r["code"] in sectors for r in (f.get("rtic") or []))
        ]

    return results


# --- Institutions ---

def get_institutions(
    db: Session,
    min_works: int | None = None,
    limit: int = 200,
    search: str | None = None,
) -> list[dict]:
    q = select(Institution)
    if min_works:
        q = q.where(func.coalesce(Institution.photonics_works, 0) >= min_works)
    if search:
        q = q.where(Institution.name.ilike(_ilike_pattern(search)))
    q = q.limit(limit)
    return [_model_to_dict(i) for i in db.scalars(q).all()]


# --- Grants ---

def get_grants(
    db: Session,
    funder: str | None = None,
    min_amount: float | None = None,
    year_from: int | None = None,
    year_to: int | None = None,
    status: str | None = None,
    search: str | None = None,
    geocoded_only: bool = False,
) -> list[dict]:
    q = select(Grant)
    if geocoded_only:
        q = q.where(Grant.lat.isnot(None))
    if funder:
        q = q.where(Grant.lead_funder.ilike(_ilike_pattern(funder)))
    if min_amount:
        q = q.where(Grant.funding_gbp >= min_amount)
    if year_from:
        q = q.where(func.substr(Grant.start_date, 1, 4).cast(int) >= year_from)
    if year_to:
        q = q.where(func.substr(Grant.start_date, 1, 4).cast(int) <= year_to)
    if status:
        q = q.where(func.lower(Grant.status) == status.lower())
    if search:
        q = q.where(
            or_(
                Grant.title.ilike(_ilike_pattern(search)),
                Grant.lead_org.ilike(_ilike_pattern(search)),
            )
        )
    return [_model_to_dict(g) for g in db.scalars(q).all()]


def get_grant_topics(
    db: Session,
    year_from: int | None = None,
    year_to: int | None = None,
) -> list[dict]:
    q = select(Grant.research_topics, Grant.start_date)
    if year_from:
        q = q.where(func.substr(Grant.start_date, 1, 4).cast(int) >= year_from)
    if year_to:
        q = q.where(func.substr(Grant.start_date, 1, 4).cast(int) <= year_to)

    topic_counts: dict[str, int] = {}
    for row in db.execute(q):
        topics_str = row.research_topics
        if not topics_str:
            continue
        for topic in topics_str.split(";"):
            topic = topic.strip()
            if topic:
                topic_counts[topic] = topic_counts.get(topic, 0) + 1

    result = [{"topic": t, "count": c} for t, c in topic_counts.items()]
    result.sort(key=lambda x: x["count"], reverse=True)
    return result


# --- Patents ---

def get_patents(
    db: Session,
    cpc_code: str | None = None,
    year_from: int | None = None,
    year_to: int | None = None,
    search: str | None = None,
) -> list[dict]:
    q = select(Patent)
    if cpc_code:
        q = q.where(Patent.cpc_codes.ilike(_ilike_pattern(cpc_code)))
    if year_from:
        q = q.where(func.substr(Patent.earliest_filing, 1, 4).cast(int) >= year_from)
    if year_to:
        q = q.where(func.substr(Patent.latest_filing, 1, 4).cast(int) <= year_to)
    if search:
        q = q.where(Patent.assignee.ilike(_ilike_pattern(search)))
    return [_model_to_dict(p) for p in db.scalars(q).all()]


# --- People ---

def get_people(
    db: Session,
    role: str | None = None,
    org: str | None = None,
    org_type: str | None = None,
    search: str | None = None,
    geocoded_only: bool = False,
) -> list[dict]:
    q = select(Person)
    if geocoded_only:
        q = q.where(Person.lat.isnot(None))
    if role:
        q = q.where(Person.role == role)
    if org:
        q = q.where(Person.current_org.ilike(_ilike_pattern(org)))
    if org_type:
        q = q.where(Person.current_org_type == org_type)
    if search:
        q = q.where(
            or_(
                Person.name.ilike(_ilike_pattern(search)),
                Person.current_org.ilike(_ilike_pattern(search)),
            )
        )
    return [_model_to_dict(p) for p in db.scalars(q).all()]


def get_person_by_id(db: Session, person_id: int) -> dict | None:
    p = db.get(Person, person_id)
    return _model_to_dict(p) if p else None


# --- Collaborations ---

def get_collaborations(
    db: Session,
    entity: str | None = None,
    min_shared: int = 1,
    company_only: bool = False,
) -> list[dict]:
    q = select(CompanyCollaboration)
    if entity:
        el = entity.lower()
        q = q.where(
            or_(
                func.lower(CompanyCollaboration.company) == el,
                func.lower(CompanyCollaboration.collaborator) == el,
            )
        )
    if min_shared > 1:
        q = q.where(CompanyCollaboration.shared_grants >= min_shared)
    if company_only:
        q = q.where(CompanyCollaboration.collaborator_is_company.is_(True))
    return [_model_to_dict(c, exclude={"id"}) for c in db.scalars(q).all()]


def get_grant_edges(
    db: Session,
    org_name: str | None = None,
    min_shared: int = 1,
) -> list[dict]:
    q = select(GrantEdge)
    if org_name:
        ol = org_name.lower()
        q = q.where(
            or_(
                func.lower(GrantEdge.org_a_name) == ol,
                func.lower(GrantEdge.org_b_name) == ol,
            )
        )
    if min_shared > 1:
        q = q.where(GrantEdge.shared_grants >= min_shared)
    return [_model_to_dict(e, exclude={"id"}) for e in db.scalars(q).all()]


# --- Coords ---

def get_coords_lookup(db: Session) -> dict[str, list[float]]:
    rows = db.execute(select(CoordsLookup.name, CoordsLookup.lat, CoordsLookup.lng)).all()
    return {r.name: [r.lat, r.lng] for r in rows}


# --- RTIC Sectors ---

def get_rtic_sectors(db: Session) -> list[dict]:
    return [_model_to_dict(s) for s in db.scalars(select(RticSector)).all()]


# --- Stats ---

def get_stats(db: Session) -> dict:
    rows = db.execute(select(Stat.key, Stat.value)).all()
    stats = {}
    for r in rows:
        try:
            stats[r.key] = float(r.value) if "." in r.value else int(r.value)
        except ValueError:
            stats[r.key] = r.value

    # Compute live counts
    infra_count = db.scalar(
        select(func.count()).select_from(Infrastructure).where(
            Infrastructure.classification != "Not Photonics"
        )
    )
    people_count = db.scalar(select(func.count()).select_from(Person))
    stats["infrastructure"] = infra_count
    stats["people"] = people_count
    return stats


# --- Search ---

def search_all(db: Session, query: str) -> list[dict]:
    pattern = _ilike_pattern(query)
    results = []

    for c in db.scalars(select(Company).where(Company.name.ilike(pattern))).all():
        results.append({"type": "company", "id": c.id, "name": c.name, "lat": c.lat, "lng": c.lng})

    for f in db.scalars(select(Infrastructure).where(Infrastructure.name.ilike(pattern))).all():
        results.append({"type": "infrastructure", "id": f.id, "name": f.name, "lat": f.lat, "lng": f.lng})

    for i in db.scalars(select(Institution).where(Institution.name.ilike(pattern))).all():
        results.append({"type": "institution", "id": i.id, "name": i.name, "lat": i.lat, "lng": i.lng})

    for p in db.scalars(
        select(Person).where(
            or_(Person.name.ilike(pattern), Person.current_org.ilike(pattern))
        ).where(Person.lat.isnot(None))
    ).all():
        results.append({"type": "person", "id": p.id, "name": p.name, "lat": p.lat, "lng": p.lng})

    return results[:50]
