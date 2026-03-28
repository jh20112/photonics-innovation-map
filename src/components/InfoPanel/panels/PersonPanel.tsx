import type { Person, EntityDetail, Grant } from '../../../types/api';
import { EntityHeader } from '../EntityHeader';
import { StatBlock } from '../StatBlock';
import { TagList } from '../TagList';
import { CollapsibleSection } from '../CollapsibleSection';
import { RelatedEntityCard } from '../RelatedEntityCard';
import { useState, useEffect } from 'react';

interface Props {
  person: Person;
  onNavigate: (detail: EntityDetail) => void;
}

const API_BASE = 'http://localhost:8000/api';

function roleLabel(role: string): string {
  switch (role) {
    case 'principal_investigator': return 'Principal Investigator';
    case 'director': return 'Company Director';
    default: return role;
  }
}

function formatFunding(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toFixed(0);
}

export function PersonPanel({ person: p, onNavigate }: Props) {
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [grantsLoading, setGrantsLoading] = useState(false);

  // Load linked grants on expand
  useEffect(() => {
    setGrants(null);
  }, [p.id]);

  const loadGrants = () => {
    if (grants !== null || p.grant_refs.length === 0) return;
    setGrantsLoading(true);
    // Fetch all grants and filter to this person's refs
    fetch(`${API_BASE}/grants?geocoded_only=false`)
      .then(r => r.json())
      .then((allGrants: Grant[]) => {
        const refSet = new Set(p.grant_refs);
        setGrants(allGrants.filter(g => refSet.has(g.reference)));
      })
      .catch(() => setGrants([]))
      .finally(() => setGrantsLoading(false));
  };

  const subtitleParts = [roleLabel(p.role)];
  if (p.department) subtitleParts.push(p.department);

  return (
    <>
      <EntityHeader
        name={p.name}
        subtitleParts={subtitleParts}
      />

      <div className="detail-grid">
        <div className="detail-item full-width">
          <span className="detail-label">Organisation</span>
          <span className="detail-value">{p.current_org}</span>
        </div>
        {p.company_org && (
          <div className="detail-item full-width">
            <span className="detail-label">Also Director at</span>
            <span className="detail-value">{p.company_org}</span>
          </div>
        )}
        <div className="detail-item">
          <span className="detail-label">Type</span>
          <span className="detail-value">{p.current_org_type === 'institution' ? 'Academic' : 'Industry'}</span>
        </div>
      </div>

      {(p.grant_count > 0 || p.total_grant_funding_gbp > 0) && (
        <div className="stat-row">
          {p.grant_count > 0 && <StatBlock value={p.grant_count} label="Grants as PI" format="plain" />}
          {p.total_grant_funding_gbp > 0 && (
            <StatBlock value={`\u00A3${formatFunding(p.total_grant_funding_gbp)}`} label="Total Funding" format="plain" />
          )}
        </div>
      )}

      <TagList label="Data Sources" tags={p.sources.map(s => s.replace('_', ' '))} />

      {p.orcid && (
        <div className="info-links">
          <a href={`https://orcid.org/${p.orcid}`} target="_blank" rel="noopener noreferrer" className="info-link">
            ORCID Profile &#8599;
          </a>
        </div>
      )}

      {p.grant_refs.length > 0 && (
        <CollapsibleSection
          title={`Grants (${p.grant_count})`}
          resetKey={String(p.id)}
          onExpand={loadGrants}
        >
          {grantsLoading && <p style={{ fontSize: 13, color: '#6b7280' }}>Loading grants...</p>}
          {grants && grants.length === 0 && <p style={{ fontSize: 13, color: '#6b7280' }}>No grant details available</p>}
          {grants && grants.map(g => (
            <RelatedEntityCard
              key={g.id}
              title={g.title}
              subtitle={`${g.lead_funder} · ${g.reference}${g.funding_gbp ? ` · \u00A3${formatFunding(g.funding_gbp)}` : ''}`}
              type="grant"
              onClick={() => onNavigate({ type: 'grant', data: g })}
            />
          ))}
        </CollapsibleSection>
      )}
    </>
  );
}
