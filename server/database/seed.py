"""
Seed the database from pipeline JSON files.

Can be run standalone: python -m server.database.seed
Or called from the app lifespan for auto-seeding.
"""

import hashlib
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import insert, select, text
from sqlalchemy.orm import Session

from server.database.engine import SessionLocal, engine
from server.database.models import (
    Base, Company, CompanyCollaboration, CompanyRtic, CoordsLookup,
    DataVersion, Grant, GrantEdge, Infrastructure, Institution, Patent,
    Person, RticSector, Stat,
)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# Tables to truncate in reverse-dependency order
_ALL_TABLES = [
    "data_version", "stats", "coords_lookup", "grant_edges",
    "company_collaborations", "people", "patents", "grants",
    "institutions", "infrastructure", "company_rtic", "companies",
    "rtic_sectors",
]


def db_is_empty(session: Session) -> bool:
    result = session.execute(select(Company.id).limit(1)).first()
    return result is None


def _normalize_name(name: str) -> str:
    s = name.upper().strip()
    for suffix in [" LIMITED", " LTD", " LTD.", " PLC", " INC", " INC.", " GMBH", " LLC"]:
        if s.endswith(suffix):
            s = s[: -len(suffix)]
    s = re.sub(r"\s*\(.*?\)\s*", " ", s)
    if s.startswith("THE "):
        s = s[4:]
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _dedup_by_key(rows: list[dict], key: str) -> list[dict]:
    """Remove duplicate entries by primary key, keeping the first occurrence."""
    seen = set()
    result = []
    for r in rows:
        k = r.get(key)
        if k not in seen:
            seen.add(k)
            result.append(r)
    return result


def _bulk_insert(session: Session, model, rows: list[dict], batch_size: int = 5000):
    for i in range(0, len(rows), batch_size):
        session.execute(insert(model), rows[i : i + batch_size])
    session.flush()


def _truncate_all(session: Session):
    """Truncate all data tables for a clean re-seed."""
    for table in _ALL_TABLES:
        session.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
    session.flush()
    print("  Truncated all tables for clean seed")


def seed_from_json(session: Session, data_dir: Path | None = None):
    src = data_dir or DATA_DIR
    print("Seeding database from JSON files...")

    # Truncate first to handle partial seeds from prior crashed attempts
    _truncate_all(session)

    # --- RTIC Sectors ---
    rtic_sectors = json.loads((src / "rtic_sectors.json").read_text())
    _bulk_insert(session, RticSector, rtic_sectors)
    print(f"  rtic_sectors: {len(rtic_sectors)}")

    # --- Companies + CompanyRtic ---
    companies = json.loads((src / "companies.json").read_text())
    companies = _dedup_by_key(companies, "id")
    company_rtic_rows = []
    for c in companies:
        for r in c.get("rtic", []):
            company_rtic_rows.append({"company_id": c["id"], "rtic_code": r["code"]})
    _bulk_insert(session, Company, companies)
    _bulk_insert(session, CompanyRtic, company_rtic_rows)
    print(f"  companies: {len(companies)}, company_rtic: {len(company_rtic_rows)}")

    # --- Infrastructure ---
    infra = json.loads((src / "infrastructure.json").read_text())
    _bulk_insert(session, Infrastructure, infra)
    print(f"  infrastructure: {len(infra)}")

    # --- Institutions ---
    institutions = json.loads((src / "institutions.json").read_text())
    _bulk_insert(session, Institution, institutions)
    print(f"  institutions: {len(institutions)}")

    # --- Grants ---
    grants = json.loads((src / "grants.json").read_text())
    _bulk_insert(session, Grant, grants)
    print(f"  grants: {len(grants)}")

    # --- Patents ---
    patents = json.loads((src / "patents.json").read_text())
    _bulk_insert(session, Patent, patents)
    print(f"  patents: {len(patents)}")

    # --- People ---
    try:
        people = json.loads((src / "talent_people.json").read_text())
    except FileNotFoundError:
        people = []
    _bulk_insert(session, Person, people)
    print(f"  people: {len(people)}")

    # --- Company Collaborations ---
    collabs = json.loads((src / "company_collaborations.json").read_text())
    _bulk_insert(session, CompanyCollaboration, collabs)
    print(f"  company_collaborations: {len(collabs)}")

    # --- Grant Edges ---
    edges = json.loads((src / "grant_collaboration_edges.json").read_text())
    _bulk_insert(session, GrantEdge, edges)
    print(f"  grant_edges: {len(edges)}")

    # --- Stats ---
    stats_obj = json.loads((src / "stats.json").read_text())
    stat_rows = [{"key": k, "value": str(v)} for k, v in stats_obj.items()]
    _bulk_insert(session, Stat, stat_rows)
    print(f"  stats: {len(stat_rows)}")

    # --- Coords Lookup ---
    _build_coords_lookup(session, companies, infra, institutions, grants, src)

    # --- Data Version ---
    version = _compute_data_version(src)
    session.execute(
        insert(DataVersion),
        [{"id": 1, "version": version, "seeded_at": datetime.now(timezone.utc).isoformat()}],
    )

    session.commit()
    print(f"Seeding complete. Data version: {version}")


def _build_coords_lookup(
    session: Session,
    companies: list[dict],
    infra: list[dict],
    institutions: list[dict],
    grants: list[dict],
    src: Path,
):
    lookup: dict[str, tuple[float, float]] = {}

    def add(name: str, lat, lng):
        if not name or not lat or not lng:
            return
        lat, lng = float(lat), float(lng)
        lookup[name] = (lat, lng)
        lookup[name.upper()] = (lat, lng)
        normalized = _normalize_name(name)
        if normalized:
            lookup[normalized] = (lat, lng)

    for c in companies:
        add(c["name"], c.get("lat"), c.get("lng"))
    for i in institutions:
        add(i["name"], i.get("lat"), i.get("lng"))
        clean = i["name"].replace(" (United Kingdom)", "")
        if clean != i["name"]:
            add(clean, i.get("lat"), i.get("lng"))
    for f in infra:
        add(f["name"], f.get("lat"), f.get("lng"))
        if f.get("host_org"):
            add(f["host_org"], f.get("lat"), f.get("lng"))
    for g in grants:
        if g.get("lat") and g.get("lng") and g.get("lead_org"):
            add(g["lead_org"], g["lat"], g["lng"])

    coords_file = src / "geocoded_coordinates.json"
    if coords_file.exists():
        all_coords = json.loads(coords_file.read_text())
        for name, coord in all_coords.get("grant_orgs", {}).items():
            add(name, coord[0], coord[1])

    rows = [{"name": n, "lat": ll[0], "lng": ll[1]} for n, ll in lookup.items()]
    _bulk_insert(session, CoordsLookup, rows)
    print(f"  coords_lookup: {len(rows)}")


def _compute_data_version(src: Path) -> str:
    h = hashlib.sha256()
    for f in sorted(src.glob("*.json")):
        h.update(f.name.encode())
        h.update(str(f.stat().st_mtime_ns).encode())
    return h.hexdigest()[:16]


def run_migrations():
    from alembic import command
    from alembic.config import Config

    # Resolve relative to project root (parent of server/)
    project_root = Path(__file__).resolve().parent.parent.parent
    alembic_cfg = Config(str(project_root / "alembic.ini"))
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        alembic_cfg.set_main_option("sqlalchemy.url", db_url)
    command.upgrade(alembic_cfg, "head")


def get_data_version(session: Session) -> str:
    row = session.execute(select(DataVersion.version).where(DataVersion.id == 1)).scalar()
    return row or "unknown"


if __name__ == "__main__":
    print("Running migrations...")
    run_migrations()
    print("Checking if seed is needed...")
    with SessionLocal() as session:
        if db_is_empty(session):
            seed_from_json(session)
        else:
            print("Database already seeded. To re-seed, truncate tables first.")
