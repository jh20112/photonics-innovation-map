"""Backfill institution enriched data from JSON to avoid full re-seed.

Revision ID: 006
Revises: 005
"""
import json
from pathlib import Path
from alembic import op
import sqlalchemy as sa

revision = "006"
down_revision = "005"

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


def upgrade():
    """Update existing institution rows with enriched data from JSON."""
    json_path = DATA_DIR / "institutions.json"
    if not json_path.exists():
        print("  institutions.json not found, skipping backfill")
        return

    institutions = json.loads(json_path.read_text())
    conn = op.get_bind()

    # First, truncate and re-insert just institutions (much faster than full re-seed)
    conn.execute(sa.text("DELETE FROM institutions"))

    for inst in institutions:
        conn.execute(
            sa.text("""
                INSERT INTO institutions (
                    id, name, lat, lng, rank, photonics_works,
                    total_citations, avg_fwci, pct_top10_cited, citations_per_paper,
                    top_topics, publications_by_year, topic_breakdown,
                    cluster_id, n_grants, n_collaborators
                ) VALUES (
                    :id, :name, :lat, :lng, :rank, :photonics_works,
                    :total_citations, :avg_fwci, :pct_top10_cited, :citations_per_paper,
                    :top_topics, :publications_by_year, :topic_breakdown,
                    :cluster_id, :n_grants, :n_collaborators
                )
            """),
            {
                "id": inst["id"],
                "name": inst["name"],
                "lat": inst.get("lat"),
                "lng": inst.get("lng"),
                "rank": inst.get("rank"),
                "photonics_works": inst.get("photonics_works"),
                "total_citations": inst.get("total_citations"),
                "avg_fwci": inst.get("avg_fwci"),
                "pct_top10_cited": inst.get("pct_top10_cited"),
                "citations_per_paper": inst.get("citations_per_paper"),
                "top_topics": json.dumps(inst.get("top_topics")) if inst.get("top_topics") else None,
                "publications_by_year": json.dumps(inst.get("publications_by_year")) if inst.get("publications_by_year") else None,
                "topic_breakdown": json.dumps(inst.get("topic_breakdown")) if inst.get("topic_breakdown") else None,
                "cluster_id": inst.get("cluster_id"),
                "n_grants": inst.get("n_grants"),
                "n_collaborators": inst.get("n_collaborators"),
            },
        )

    # Update the data_version to match current files so re-seed isn't triggered
    from server.database.seed import _compute_data_version
    version = _compute_data_version(DATA_DIR)
    conn.execute(sa.text("DELETE FROM data_version"))
    conn.execute(sa.text("INSERT INTO data_version (version) VALUES (:v)"), {"v": version})

    print(f"  Backfilled {len(institutions)} institutions + updated data version")


def downgrade():
    pass  # No structural change to undo
