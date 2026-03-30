"""
FastAPI backend for UK Photonics Innovation Map.

Serves data from PostgreSQL with filtering and caching.
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, Query, Request, Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from server.database.engine import SessionLocal, get_db
from server.database import queries
from server.database.seed import db_is_empty, get_data_version, run_migrations, seed_from_json

# Serve built frontend in production
STATIC_DIR = Path(__file__).resolve().parent.parent / "dist"

# Data directory — still used for cluster JSON files and seeding
DATA_DIR = Path(__file__).resolve().parent / "data"

# ETag value loaded at startup
_data_version: str = "unknown"


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _data_version
    # Run Alembic migrations
    run_migrations()
    # Auto-seed if database is empty
    with SessionLocal() as session:
        if db_is_empty(session):
            seed_from_json(session, DATA_DIR)
        _data_version = get_data_version(session)
    print(f"Data version: {_data_version}")
    yield


app = FastAPI(title="UK Photonics Innovation Map API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:4173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.middleware("http")
async def cache_middleware(request: Request, call_next):
    """Add Cache-Control and ETag headers to all API responses."""
    if request.url.path.startswith("/api/"):
        # Check ETag — return 304 if client has current data
        if_none_match = request.headers.get("if-none-match")
        if if_none_match and if_none_match.strip('"') == _data_version:
            return Response(status_code=304)
        response = await call_next(request)
        response.headers["Cache-Control"] = "public, max-age=3600, stale-while-revalidate=86400"
        response.headers["ETag"] = f'"{_data_version}"'
        return response
    return await call_next(request)


# --- Companies ---

@app.get("/api/companies")
def get_companies(
    sectors: str | None = Query(None, description="Comma-separated RTIC sector codes"),
    sources: str | None = Query(None, description="Comma-separated data sources"),
    strength: str | None = Query(None, description="Comma-separated data strength tiers (Strong,Moderate,Limited)"),
    min_employees: int | None = Query(None),
    min_funding: float | None = Query(None, description="Min funding in USD millions"),
    search: str | None = Query(None, description="Search by name"),
    db: Session = Depends(get_db),
):
    return queries.get_companies(
        db,
        sectors=[s.strip() for s in sectors.split(",")] if sectors else None,
        sources=[s.strip() for s in sources.split(",")] if sources else None,
        strengths=[s.strip() for s in strength.split(",")] if strength else None,
        min_employees=min_employees,
        min_funding=min_funding,
        search=search,
    )


@app.get("/api/companies/{company_id}")
def get_company(company_id: int, db: Session = Depends(get_db)):
    result = queries.get_company_by_id(db, company_id)
    if result is None:
        return {"error": "Not found"}
    return result


# --- Infrastructure ---

@app.get("/api/infrastructure")
def get_infrastructure(
    classification: str | None = Query(None, description="Core Photonics or Supporting Photonics"),
    sectors: str | None = Query(None, description="Comma-separated RTIC sector codes"),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return queries.get_infrastructure(
        db,
        classification=classification,
        sectors=[s.strip() for s in sectors.split(",")] if sectors else None,
        search=search,
    )


# --- Institutions ---

@app.get("/api/institutions")
def get_institutions(
    min_works: int | None = Query(None),
    limit: int = Query(200),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return queries.get_institutions(db, min_works=min_works, limit=limit, search=search)


# --- Grants ---

@app.get("/api/grants")
def get_grants(
    funder: str | None = Query(None),
    min_amount: float | None = Query(None),
    year_from: int | None = Query(None),
    year_to: int | None = Query(None),
    status: str | None = Query(None),
    search: str | None = Query(None),
    geocoded_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    return queries.get_grants(
        db,
        funder=funder,
        min_amount=min_amount,
        year_from=year_from,
        year_to=year_to,
        status=status,
        search=search,
        geocoded_only=geocoded_only,
    )


@app.get("/api/grants/topics")
def get_grant_topics(
    year_from: int | None = Query(None),
    year_to: int | None = Query(None),
    db: Session = Depends(get_db),
):
    return queries.get_grant_topics(db, year_from=year_from, year_to=year_to)


# --- Patents ---

@app.get("/api/patents")
def get_patents(
    cpc_code: str | None = Query(None),
    year_from: int | None = Query(None),
    year_to: int | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return queries.get_patents(db, cpc_code=cpc_code, year_from=year_from, year_to=year_to, search=search)


# --- People / Talent ---

@app.get("/api/people")
def get_people(
    role: str | None = Query(None, description="Filter by role: principal_investigator, director"),
    org: str | None = Query(None, description="Filter by organisation name"),
    org_type: str | None = Query(None, description="Filter by org type: company, institution"),
    search: str | None = Query(None),
    geocoded_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    return queries.get_people(db, role=role, org=org, org_type=org_type, search=search, geocoded_only=geocoded_only)


@app.get("/api/people/{person_id}")
def get_person(person_id: int, db: Session = Depends(get_db)):
    result = queries.get_person_by_id(db, person_id)
    if result is None:
        return {"error": "Not found"}
    return result


# --- Collaborations ---

@app.get("/api/collaborations")
def get_collaborations(
    entity: str | None = Query(None, description="Company or institution name"),
    min_shared: int = Query(1, description="Minimum shared grants"),
    company_only: bool = Query(False, description="Only company-company collaborations"),
    db: Session = Depends(get_db),
):
    return queries.get_collaborations(db, entity=entity, min_shared=min_shared, company_only=company_only)


@app.get("/api/collaborations/clusters")
def get_collab_clusters():
    path = DATA_DIR / "collaboration_clusters.json"
    if path.exists():
        return FileResponse(path, media_type="application/json")
    return []


@app.get("/api/collaborations/grants")
def get_grant_edges(
    org_name: str | None = Query(None),
    min_shared: int = Query(1),
    db: Session = Depends(get_db),
):
    return queries.get_grant_edges(db, org_name=org_name, min_shared=min_shared)


# --- Clusters (kept as FileResponse — complex nested structures) ---

@app.get("/api/clusters")
def get_hdbscan_clusters(
    type: str = Query(..., description="geographic, collaboration, or technology"),
):
    fname = f"clusters_{type}.json"
    fpath = DATA_DIR / fname
    if fpath.exists():
        return FileResponse(fpath, media_type="application/json")
    return {"clusters": [], "assignments": []}


# --- Coords ---

@app.get("/api/coords")
def get_coords(db: Session = Depends(get_db)):
    return queries.get_coords_lookup(db)


# --- RTIC Sectors ---

@app.get("/api/rtic-sectors")
def get_rtic_sectors(db: Session = Depends(get_db)):
    return queries.get_rtic_sectors(db)


# --- Stats ---

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    return queries.get_stats(db)


# --- Search across all entities ---

@app.get("/api/search")
def search_all(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    return queries.search_all(db, q)


# --- Serve frontend static files in production ---
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")
    app.mount("/geo", StaticFiles(directory=STATIC_DIR / "geo"), name="geo")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        """Serve index.html for all non-API routes (SPA fallback)."""
        file_path = STATIC_DIR / full_path
        if full_path and file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")
