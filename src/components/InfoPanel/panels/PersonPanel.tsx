import type { Person, PersonPosition, PersonEducation, EntityDetail, Grant } from '../../../types/api';
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

const API_BASE = '/api';

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

function formatDateRange(start: string | null, end: string | null): string {
  const s = start || '?';
  const e = end || 'Present';
  return `${s} — ${e}`;
}

function PositionTimeline({ positions }: { positions: PersonPosition[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {positions.map((pos, i) => (
        <div key={i} style={{
          borderLeft: '2px solid #d1d5db',
          paddingLeft: 12,
          paddingBottom: 4,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
            {pos.org_name || 'Unknown organisation'}
          </div>
          {pos.role_title && (
            <div style={{ fontSize: 12, color: '#4b5563' }}>{pos.role_title}</div>
          )}
          {pos.department && (
            <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>{pos.department}</div>
          )}
          <div style={{ fontSize: 11, color: '#9ca3af' }}>
            {formatDateRange(pos.start_date, pos.end_date)}
            {pos.city && ` · ${pos.city}`}
            {pos.country && pos.country !== 'GB' && ` (${pos.country})`}
          </div>
        </div>
      ))}
    </div>
  );
}

function EducationList({ education }: { education: PersonEducation[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {education.map((edu, i) => (
        <div key={i} style={{
          borderLeft: '2px solid #d1d5db',
          paddingLeft: 12,
          paddingBottom: 4,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
            {edu.institution || 'Unknown institution'}
          </div>
          {(edu.degree || edu.field) && (
            <div style={{ fontSize: 12, color: '#4b5563' }}>
              {[edu.degree, edu.field].filter(Boolean).join(' — ')}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#9ca3af' }}>
            {formatDateRange(edu.start_date, edu.end_date)}
            {edu.city && ` · ${edu.city}`}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PersonPanel({ person: p, onNavigate }: Props) {
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [grantsLoading, setGrantsLoading] = useState(false);

  useEffect(() => {
    setGrants(null);
  }, [p.id]);

  const loadGrants = () => {
    if (grants !== null || p.grant_refs.length === 0) return;
    setGrantsLoading(true);
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

  const hasPositions = p.positions && p.positions.length > 0;
  const hasEducation = p.education && p.education.length > 0;

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

      <div className="stat-row">
        {p.grant_count > 0 && <StatBlock value={p.grant_count} label="Grants as PI" format="plain" />}
        {p.total_grant_funding_gbp > 0 && (
          <StatBlock value={`\u00A3${formatFunding(p.total_grant_funding_gbp)}`} label="Total Funding" format="plain" />
        )}
        {p.publication_count != null && p.publication_count > 0 && (
          <StatBlock value={p.publication_count.toLocaleString()} label="Publications" format="plain" />
        )}
      </div>

      <TagList label="Data Sources" tags={p.sources.map(s => s.replace('_', ' '))} />

      {p.orcid && (
        <div className="info-links">
          <a
            href={p.orcid.startsWith('http') ? p.orcid : `https://orcid.org/${p.orcid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="info-link"
          >
            ORCID Profile &#8599;
          </a>
        </div>
      )}

      {hasPositions && (
        <CollapsibleSection
          title={`Career History (${p.positions!.length})`}
          resetKey={String(p.id)}
          defaultOpen
        >
          <PositionTimeline positions={p.positions!} />
        </CollapsibleSection>
      )}

      {hasEducation && (
        <CollapsibleSection
          title={`Education (${p.education!.length})`}
          resetKey={String(p.id)}
        >
          <EducationList education={p.education!} />
        </CollapsibleSection>
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
