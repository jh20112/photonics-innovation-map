# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
# Frontend (Vite + React)
npm run dev          # Dev server at localhost:5173
npm run build        # tsc -b && vite build
npm run lint         # ESLint

# Backend API (FastAPI) — requires PostgreSQL
# Set DATABASE_URL or default is postgresql://localhost:5432/photonics_map
python3 -m uvicorn server.main:app --port 8000
# On startup: runs Alembic migrations, auto-seeds from server/data/*.json if data changed

# Data pipeline (run from ../innovation-mapping-data/UK/pipeline/)
python3 process_openalex.py  # Aggregate OpenAlex publications → institution summaries + collab edges
python3 geocode.py           # Geocode entities → geocode_cache.json + output/geocoded_coordinates.json
python3 normalize.py         # Normalize all data → output/*.json (+ generates CEO people entries)
python3 cluster.py           # DSIT HDBSCAN clustering (geographic)
python3 cluster_ecipe.py     # ECIPE ecosystem clustering
python3 cluster_custom.py    # Custom clustering (composite score + research-anchored)

# After pipeline: copy output to server and push
cp ../innovation-mapping-data/UK/pipeline/output/*.json server/data/
# Then commit + push to trigger Railway deploy
```

## Architecture

**Three-layer system:**

1. **Data pipeline** (`../innovation-mapping-data/UK/pipeline/`) — Python scripts that geocode and normalize raw CSV/JSON datasets into API-ready JSON files. Key source: `photonics_companies_combined.csv` (392 companies with RTIC, funding, deals, CEO, subsidiary info, photonics scores). Uses postcodes.io for UK postcodes and Nominatim for name-based geocoding with a persistent cache. `cluster_utils.py` has shared helpers (haversine, circle polygons, nearest-major-city naming).

2. **FastAPI backend** (`server/`) — PostgreSQL-backed via SQLAlchemy 2.0. Alembic manages migrations (`server/alembic/`). On startup, runs migrations and auto-seeds from `server/data/*.json` if data version hash changed. Seed hash only includes DB-seeded files (not cluster JSONs). Cluster/collaboration files served via FileResponse from disk. ETag includes all file timestamps for cache busting. CORS configured for localhost:5173.

3. **React frontend** (`src/`) — Three views (Map, Dashboard, Data) with shared sidebar filters.

## Frontend Views

**Map** — Leaflet map with toggleable layers:
- Companies (with size-by metric, growth period, min patent/grant sliders, hide subsidiaries toggle)
- Infrastructure (Core/Adjacent photonics facilities)
- Research Institutions (with size-by quality metric, publication period filter)
- People/Talent (PIs, directors, CEOs)
- Collaborations (company-level arcs, grant network edges)

**Dashboard** — Sortable/filterable ranking tables: Overview, Companies, Institutions, Grants, Clusters (with sub-tabs per cluster type). All sidebar filters sync to dashboard.

**Data** — Data transparency: source breakdown with drill-down (data strength + photonics score histogram per source), source overlap Venn diagrams (Commercial 3-way + Discovery 2-way), data completeness bars per field.

## Frontend State (App.tsx)

App.tsx owns all state and passes filtered data to views:
- **Layer toggles**: companies, infrastructure, institutions, people, collaborations
- **Filters**: RTIC sectors, data sources, data strength, min patents/grants, hide subsidiaries
- **Analysis**: clustering (DSIT/ECIPE/Composite/Research), MaxQ levels (1-3), subsector heatmap
- **Sizing**: company size metric (off/employees/funding/patents/growth), institution size metric (publications/citations/quality/FWCI)
- **Detail panel**: navigation stack (max 5 deep), lazy-loaded collaborations
- **Score range**: set from Data tab histogram clicks, filters dashboard

Key filtering chain for companies:
`useCompanies(API filters)` → `filteredByThresholds(minPatents/minGrants)` → `clusterFilteredCompanies(cluster assignment)` → `applyMaxQ(level criteria)` → `hideSubsidiaries` → map

Dashboard gets same chain applied to `allCompanies` (always-loaded, unfiltered) + `scoreRange`.

## Clustering

Four clustering systems, all producing same JSON shape (`{clusters, assignments}`):
- **DSIT** (`cluster.py`): HDBSCAN on pure lat/lng, `min_cluster_size=10, min_samples=6`
- **ECIPE** (`cluster_ecipe.py`): 30km radius, requires $10M+ funding + 5+ institutions
- **Composite** (`cluster_custom.py`): Multi-dimensional scoring (40% research + 25% companies + 25% funding + 10% infrastructure)
- **Research-Anchored** (`cluster_custom.py`): Seeded from institutions with 500+ publications

Cluster names: nearest major UK city (from `cluster_utils.py` lookup table). Duplicates use postcodes.io for district-level specificity (e.g., "London — Ealing").

When clustering is active, non-clustered companies (cluster_id = -1) are hidden from both map and dashboard.

## MaxQ Analysis

Progressive company quality filter (all levels exclude non-UK subsidiaries):
- **Level 1**: ≥$5M funding + active status + photonics score ≥60 + funding round in last 5 years
- **Level 2**: Level 1 + has patents
- **Level 3**: Level 1+2 + has grant funding

Uses `latest_deal_date` (from PitchBook deals) OR `last_funding_date`, whichever is more recent.

## Key Data Fields (Company)

- `photonics_score` (0-100) + `photonics_rationale` — scoring with 5 dimensions (Core Identity 0-35, Tech Usage 0-25, Adjacent Tech 0-15, Evidence 0-15, Industry Alignment 0-10)
- `pitchbook_deals` — JSON array of deal objects (date, size, type, investors, synopsis)
- `ceo_name` + `ceo_biography` — shown in company panel + added to People layer
- `is_non_uk_subsidiary` + `parent_company` + `parent_country`
- `emp_growth_pct` + `emp_timeseries` — monthly employee counts for growth visualization
- `data_strength` (Strong/Moderate/Limited) + `data_strength_score` (0-100)

## Key Files

- `src/App.tsx` — Root state, all filters, data flow to views
- `src/hooks/useApi.ts` — All API fetch hooks with cancellation
- `src/types/api.ts` — TypeScript interfaces for all entities
- `src/components/Map/InnovationMap.tsx` — Leaflet map with all layer rendering
- `src/components/Map/layers/` — Per-layer components (CompanyLayer, InstitutionLayer, ClusterLayer, SubsectorHeatmap, etc.)
- `src/components/Sidebar/Sidebar.tsx` — All filters/analysis controls using collapsible SubSection components
- `src/components/InfoPanel/InfoPanel.tsx` — Detail panel shell with navigation stack
- `src/components/InfoPanel/panels/` — Per-entity detail views (CompanyPanel, InstitutionPanel, ClusterPanel, PersonPanel, etc.)
- `src/components/InfoPanel/TopicTreemap.tsx` — CSS flexbox treemap for institution research topics
- `src/components/Dashboard/` — Dashboard with DashboardTable (sortable, filterable, gradient support)
- `src/components/DataTab/` — Data transparency visualizations (SourceBreakdown, SourceVenn, DataCompleteness)
- `server/main.py` — FastAPI app with endpoints, caching middleware, lifespan handler
- `server/database/models.py` — SQLAlchemy models
- `server/database/seed.py` — Auto-seed from JSON, data version hash (excludes cluster files)
- `pipeline/cluster_utils.py` — Shared clustering helpers (haversine, nearest city naming)

## Deployment (Railway)

- Docker build: frontend compiled to `dist/`, served by FastAPI as static files
- PostgreSQL addon for database
- Health check: `/api/stats` with 120s timeout
- Migrations run on startup; seed only triggers if DB data version differs from JSON files
- Cluster files served from disk (not DB) — updating them doesn't trigger re-seed
- ETag computed from DB version + all JSON file timestamps for proper cache busting
