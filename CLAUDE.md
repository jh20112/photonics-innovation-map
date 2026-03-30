# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
# Frontend (Vite + React)
npm run dev          # Dev server at localhost:5173
npm run build        # tsc -b && vite build
npm run lint         # ESLint
npm run preview      # Preview production build

# Backend API (FastAPI) — must be running for the frontend to work
# Requires PostgreSQL. Set DATABASE_URL or default is postgresql://localhost:5432/photonics_map
python3 -m uvicorn server.main:app --port 8000
# On first run, Alembic migrations run automatically and the DB is seeded from server/data/*.json

# Database management
alembic upgrade head                     # Run migrations manually
python -m server.database.seed           # Re-seed database manually

# Data pipeline (run from innovation-mapping-data/UK/pipeline/)
python3 geocode.py   # Geocode entities → geocode_cache.json + output/geocoded_coordinates.json
python3 normalize.py # Normalize all data → output/*.json (consumed by the API)
```

Both servers must run simultaneously: API on port 8000, Vite on port 5173.
After a pipeline run, restart the backend to auto-detect new data and re-seed.

## Architecture

**Three-layer system:**

1. **Data pipeline** (`../innovation-mapping-data/UK/pipeline/`) — Python scripts that geocode and normalize raw CSV/JSON datasets into API-ready JSON files in `pipeline/output/`. Uses postcodes.io for UK postcodes and Nominatim for name-based geocoding with a persistent cache.

2. **FastAPI backend** (`server/`) — PostgreSQL-backed via SQLAlchemy 2.0. Alembic manages migrations (`server/alembic/`). On startup, runs migrations and auto-seeds from JSON files if the database is empty. API responses include `Cache-Control` (1h max-age, 24h stale-while-revalidate) and `ETag` headers based on a data version hash. Cluster JSON files are still served via FileResponse. CORS configured for localhost:5173.

3. **React frontend** (`src/`) — Leaflet map with 6 toggleable data layers, a sidebar for controls/search/stats, and a detail panel with cross-entity navigation.

**Frontend data flow:**
- `App.tsx` owns all state: layer visibility, selected sector filter, detail panel entity, collaboration state, fly-to target
- `useApi.ts` hooks conditionally fetch from the API based on layer toggle state
- `InnovationMap.tsx` renders boundary layers (non-interactive GeoJSON) and data layers (interactive markers)
- `InfoPanel.tsx` manages an internal navigation stack (max depth 5) — clicking a related entity (e.g., a grant within a company) pushes to the stack; map clicks reset it
- Collaborations are lazy-loaded: fetched only when the user expands the collaborations section in a detail panel

**Map behavior:**
- Zoom 5-7: English region boundaries; zoom 8+: Local Authority District boundaries (lazy-loaded)
- Boundary layers are `interactive={false}` so clicks pass through to data markers
- Center: [54.5, -2.5], bounds constrained to UK

**Entity types:** Company, Infrastructure, Institution, Grant, Patent, Collaboration. All typed in `src/types/api.ts`. The `EntityDetail` discriminated union drives the detail panel dispatch.

**Infrastructure filtering:** The API excludes facilities classified as "Not Photonics" — only "Core Photonics" and "Photonics-Adjacent" are served.

## Key Files

- `src/App.tsx` — Root state management, wires sidebar ↔ map ↔ detail panel
- `src/hooks/useApi.ts` — All API fetch hooks, conditional on layer visibility
- `src/types/api.ts` — TypeScript interfaces for every entity and API response
- `src/components/Map/mapConfig.ts` — Map center, zoom bounds, tile URL, boundary styles
- `src/components/InfoPanel/InfoPanel.tsx` — Detail panel shell with navigation stack
- `src/components/InfoPanel/panels/` — Per-entity detail views (CompanyPanel, GrantPanel, etc.)
- `server/main.py` — FastAPI app with endpoints, caching middleware, and lifespan handler
- `server/database/models.py` — SQLAlchemy models for all entity tables
- `server/database/queries.py` — Query functions (one per endpoint)
- `server/database/seed.py` — Auto-seed from JSON, migration runner, data version
- `server/database/engine.py` — Database engine and session configuration
- `alembic.ini` + `server/alembic/` — Alembic migration config and versions
