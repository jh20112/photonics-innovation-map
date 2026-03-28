"""
FastAPI backend for UK Photonics Innovation Map.

Serves preprocessed JSON data with filtering capabilities.
"""

import json
import re
from pathlib import Path
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="UK Photonics Innovation Map API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:4173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Data directory (output from pipeline)
DATA_DIR = Path(__file__).resolve().parent / "data"

# In-memory data store
data: dict[str, list | dict] = {}


def load_json(filename: str) -> list | dict:
    path = DATA_DIR / filename
    with open(path) as f:
        return json.load(f)


@app.on_event("startup")
def load_data():
    data["companies"] = load_json("companies.json")
    data["infrastructure"] = load_json("infrastructure.json")
    data["institutions"] = load_json("institutions.json")
    data["grants"] = load_json("grants.json")
    data["patents"] = load_json("patents.json")
    data["company_collaborations"] = load_json("company_collaborations.json")
    data["grant_edges"] = load_json("grant_collaboration_edges.json")
    data["clusters"] = load_json("collaboration_clusters.json")
    data["rtic_sectors"] = load_json("rtic_sectors.json")
    data["stats"] = load_json("stats.json")
    # Load HDBSCAN clustering results
    for ctype in ["geographic", "collaboration", "technology", "ecipe", "composite", "research"]:
        fname = f"clusters_{ctype}.json"
        try:
            data[f"clusters_{ctype}"] = load_json(fname)
        except FileNotFoundError:
            data[f"clusters_{ctype}"] = {"clusters": [], "assignments": []}
    # Load talent/people data
    try:
        data["people"] = load_json("talent_people.json")
    except FileNotFoundError:
        data["people"] = []
    # Build comprehensive name -> coords lookup for collaboration resolution
    _build_coords_lookup()
    summary = ", ".join(f"{k}: {len(v) if isinstance(v, list) else 'obj'}" for k, v in data.items())
    print(f"Loaded data: {summary}")


def _normalize_name(name: str) -> str:
    """Normalize an org name for fuzzy matching."""
    s = name.upper().strip()
    # Remove common suffixes
    for suffix in [" LIMITED", " LTD", " LTD.", " PLC", " INC", " INC.", " GMBH", " LLC"]:
        if s.endswith(suffix):
            s = s[:-len(suffix)]
    # Remove parenthetical
    s = re.sub(r"\s*\(.*?\)\s*", " ", s)
    # Remove "THE " prefix
    if s.startswith("THE "):
        s = s[4:]
    # Collapse whitespace
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _build_coords_lookup():
    """Build a name -> [lat, lng] lookup from all geocoded entities."""
    lookup: dict[str, list[float]] = {}

    def add(name: str, lat: float, lng: float):
        if not name or not lat or not lng:
            return
        lookup[name] = [lat, lng]
        lookup[name.upper()] = [lat, lng]
        normalized = _normalize_name(name)
        if normalized:
            lookup[normalized] = [lat, lng]

    for c in data["companies"]:
        add(c["name"], c["lat"], c["lng"])
    for i in data["institutions"]:
        add(i["name"], i["lat"], i["lng"])
        # Also without "(United Kingdom)"
        clean = i["name"].replace(" (United Kingdom)", "")
        if clean != i["name"]:
            add(clean, i["lat"], i["lng"])
    for f in data["infrastructure"]:
        add(f["name"], f["lat"], f["lng"])
        if f.get("host_org"):
            add(f["host_org"], f["lat"], f["lng"])
    # Grant lead orgs with coords
    for g in data["grants"]:
        if g.get("lat") and g.get("lng") and g.get("lead_org"):
            add(g["lead_org"], g["lat"], g["lng"])

    # Also load raw geocoded coordinates file for grant orgs
    coords_file = DATA_DIR / "geocoded_coordinates.json"
    if coords_file.exists():
        with open(coords_file) as f:
            all_coords = json.load(f)
        for name, coord in all_coords.get("grant_orgs", {}).items():
            add(name, coord[0], coord[1])

    data["coords_lookup"] = lookup
    print(f"  Coords lookup: {len(lookup)} entries")


# --- Companies ---

@app.get("/api/companies")
def get_companies(
    sectors: str | None = Query(None, description="Comma-separated RTIC sector codes"),
    sources: str | None = Query(None, description="Comma-separated data sources"),
    strength: str | None = Query(None, description="Comma-separated data strength tiers (Strong,Moderate,Limited)"),
    min_employees: int | None = Query(None),
    min_funding: float | None = Query(None, description="Min funding in USD millions"),
    search: str | None = Query(None, description="Search by name"),
):
    results = data["companies"]
    if sectors:
        codes = [s.strip() for s in sectors.split(",")]
        results = [c for c in results if any(r["code"] in codes for r in c.get("rtic", []))]
    if sources:
        src_list = [s.strip() for s in sources.split(",")]
        results = [c for c in results if any(s in src_list for s in c.get("sources", []))]
    if strength:
        str_list = [s.strip() for s in strength.split(",")]
        results = [c for c in results if c.get("data_strength") in str_list]
    if min_employees:
        results = [c for c in results if (c.get("employees") or 0) >= min_employees]
    if min_funding:
        results = [c for c in results if (c.get("funding_usd_m") or 0) >= min_funding]
    if search:
        q = search.lower()
        results = [c for c in results if q in c["name"].lower()]
    return results


@app.get("/api/companies/{company_id}")
def get_company(company_id: int):
    for c in data["companies"]:
        if c["id"] == company_id:
            return c
    return {"error": "Not found"}


# --- Infrastructure ---

@app.get("/api/infrastructure")
def get_infrastructure(
    classification: str | None = Query(None, description="Core Photonics or Supporting Photonics"),
    sectors: str | None = Query(None, description="Comma-separated RTIC sector codes"),
    search: str | None = Query(None),
):
    # Exclude non-photonics facilities
    results = [f for f in data["infrastructure"] if f.get("classification") != "Not Photonics"]
    if classification:
        results = [f for f in results if f.get("classification", "").lower() == classification.lower()]
    if sectors:
        codes = [s.strip() for s in sectors.split(",")]
        results = [f for f in results if any(r["code"] in codes for r in f.get("rtic", []))]
    if search:
        q = search.lower()
        results = [f for f in results if q in f["name"].lower() or q in f.get("host_org", "").lower()]
    return results


# --- Institutions ---

@app.get("/api/institutions")
def get_institutions(
    min_works: int | None = Query(None),
    limit: int = Query(200),
    search: str | None = Query(None),
):
    results = data["institutions"]
    if min_works:
        results = [i for i in results if (i.get("photonics_works") or 0) >= min_works]
    if search:
        q = search.lower()
        results = [i for i in results if q in i["name"].lower()]
    return results[:limit]


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
):
    results = data["grants"]
    if geocoded_only:
        results = [g for g in results if g.get("lat") is not None]
    if funder:
        results = [g for g in results if funder.lower() in (g.get("lead_funder") or "").lower()]
    if min_amount:
        results = [g for g in results if (g.get("funding_gbp") or 0) >= min_amount]
    if year_from:
        results = [g for g in results if _year(g.get("start_date")) and _year(g["start_date"]) >= year_from]
    if year_to:
        results = [g for g in results if _year(g.get("start_date")) and _year(g["start_date"]) <= year_to]
    if status:
        results = [g for g in results if (g.get("status") or "").lower() == status.lower()]
    if search:
        q = search.lower()
        results = [g for g in results if q in g.get("title", "").lower() or q in g.get("lead_org", "").lower()]
    return results


@app.get("/api/grants/topics")
def get_grant_topics(
    year_from: int | None = Query(None),
    year_to: int | None = Query(None),
):
    """Aggregate research topics across grants."""
    grants_list = data["grants"]
    if year_from or year_to:
        grants_list = [
            g for g in grants_list
            if (not year_from or (_year(g.get("start_date")) and _year(g["start_date"]) >= year_from))
            and (not year_to or (_year(g.get("start_date")) and _year(g["start_date"]) <= year_to))
        ]

    topic_counts: dict[str, int] = {}
    for g in grants_list:
        topics_str = g.get("research_topics", "")
        if not topics_str:
            continue
        for topic in topics_str.split(";"):
            topic = topic.strip()
            if topic:
                topic_counts[topic] = topic_counts.get(topic, 0) + 1

    result = [{"topic": t, "count": c} for t, c in topic_counts.items()]
    result.sort(key=lambda x: x["count"], reverse=True)
    return result


def _year(date_str: str | None) -> int | None:
    if not date_str:
        return None
    try:
        return int(date_str[:4])
    except (ValueError, IndexError):
        return None


# --- Patents ---

@app.get("/api/patents")
def get_patents(
    cpc_code: str | None = Query(None),
    year_from: int | None = Query(None),
    year_to: int | None = Query(None),
    search: str | None = Query(None),
):
    results = data["patents"]
    if cpc_code:
        results = [p for p in results if cpc_code in (p.get("cpc_codes") or "")]
    if year_from:
        results = [p for p in results if _year(p.get("earliest_filing")) and _year(p["earliest_filing"]) >= year_from]
    if year_to:
        results = [p for p in results if _year(p.get("latest_filing")) and _year(p["latest_filing"]) <= year_to]
    if search:
        q = search.lower()
        results = [p for p in results if q in p.get("assignee", "").lower()]
    return results


# --- People / Talent ---

@app.get("/api/people")
def get_people(
    role: str | None = Query(None, description="Filter by role: principal_investigator, director"),
    org: str | None = Query(None, description="Filter by organisation name"),
    org_type: str | None = Query(None, description="Filter by org type: company, institution"),
    search: str | None = Query(None),
    geocoded_only: bool = Query(False),
):
    results = data["people"]
    if geocoded_only:
        results = [p for p in results if p.get("lat") is not None]
    if role:
        results = [p for p in results if p.get("role") == role]
    if org:
        q = org.lower()
        results = [p for p in results if q in p.get("current_org", "").lower()]
    if org_type:
        results = [p for p in results if p.get("current_org_type") == org_type]
    if search:
        q = search.lower()
        results = [p for p in results if q in p.get("name", "").lower() or q in p.get("current_org", "").lower()]
    return results


@app.get("/api/people/{person_id}")
def get_person(person_id: int):
    for p in data["people"]:
        if p["id"] == person_id:
            return p
    return {"error": "Not found"}


# --- Collaborations ---

@app.get("/api/collaborations")
def get_collaborations(
    entity: str | None = Query(None, description="Company or institution name"),
    min_shared: int = Query(1, description="Minimum shared grants"),
    company_only: bool = Query(False, description="Only company-company collaborations"),
):
    """Get company-institution collaboration edges for a specific entity."""
    results = data["company_collaborations"]
    if entity:
        q = entity.lower()
        results = [c for c in results if c["company"].lower() == q or c["collaborator"].lower() == q]
    if min_shared > 1:
        results = [c for c in results if c["shared_grants"] >= min_shared]
    if company_only:
        results = [c for c in results if c["collaborator_is_company"]]
    return results


@app.get("/api/collaborations/clusters")
def get_clusters():
    return data["clusters"]


@app.get("/api/collaborations/grants")
def get_grant_edges(
    org_name: str | None = Query(None),
    min_shared: int = Query(1),
):
    """Get grant-level collaboration edges (supplementary)."""
    results = data["grant_edges"]
    if org_name:
        q = org_name.lower()
        results = [e for e in results if e["org_a_name"].lower() == q or e["org_b_name"].lower() == q]
    if min_shared > 1:
        results = [e for e in results if e["shared_grants"] >= min_shared]
    return results


@app.get("/api/clusters")
def get_hdbscan_clusters(
    type: str = Query(..., description="geographic, collaboration, or technology"),
):
    key = f"clusters_{type}"
    if key not in data:
        return {"clusters": [], "assignments": []}
    return data[key]


@app.get("/api/coords")
def get_coords():
    """Return the full name -> [lat, lng] lookup for collaboration rendering."""
    return data.get("coords_lookup", {})


# --- RTIC Sectors ---

@app.get("/api/rtic-sectors")
def get_rtic_sectors():
    return data["rtic_sectors"]


# --- Stats ---

@app.get("/api/stats")
def get_stats():
    stats = dict(data["stats"])
    stats["infrastructure"] = sum(1 for f in data["infrastructure"] if f.get("classification") != "Not Photonics")
    stats["people"] = len(data.get("people", []))
    return stats


# --- Search across all entities ---

@app.get("/api/search")
def search_all(q: str = Query(..., min_length=1)):
    """Search across all entity types by name."""
    query = q.lower()
    results = []

    for c in data["companies"]:
        if query in c["name"].lower():
            results.append({"type": "company", "id": c["id"], "name": c["name"], "lat": c["lat"], "lng": c["lng"]})
    for f in data["infrastructure"]:
        if query in f["name"].lower():
            results.append({"type": "infrastructure", "id": f["id"], "name": f["name"], "lat": f["lat"], "lng": f["lng"]})
    for i in data["institutions"]:
        if query in i["name"].lower():
            results.append({"type": "institution", "id": i["id"], "name": i["name"], "lat": i["lat"], "lng": i["lng"]})
    for p in data["people"]:
        if query in p["name"].lower() or query in p.get("current_org", "").lower():
            if p.get("lat") and p.get("lng"):
                results.append({"type": "person", "id": p["id"], "name": p["name"], "lat": p["lat"], "lng": p["lng"]})

    return results[:50]
