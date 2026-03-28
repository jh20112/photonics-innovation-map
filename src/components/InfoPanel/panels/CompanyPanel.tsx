import { useState } from 'react';
import type { Company, Collaboration, EntityDetail } from '../../../types/api';
import { EntityHeader } from '../EntityHeader';
import { StatBlock } from '../StatBlock';
import { RticTags } from '../TagList';
import { CollapsibleSection } from '../CollapsibleSection';
import { RelatedEntityCard } from '../RelatedEntityCard';

interface Props {
  company: Company;
  collaborations: Collaboration[] | null;
  collabLoading: boolean;
  onLoadCollaborations: (name: string) => void;
  onNavigate: (detail: EntityDetail) => void;
  onShowCollaborations: (name: string, coords: [number, number]) => void;
}

function formatGBP(amount: number | null): string {
  if (!amount) return '';
  if (amount >= 1_000_000) return `£${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `£${(amount / 1_000).toFixed(0)}K`;
  return `£${amount.toFixed(0)}`;
}

export function CompanyPanel({
  company: c, collaborations, collabLoading,
  onLoadCollaborations, onNavigate, onShowCollaborations,
}: Props) {
  const [descExpanded, setDescExpanded] = useState(false);
  const [showAllGrants, setShowAllGrants] = useState(false);

  const desc = c.description || '';
  const truncatedDesc = desc.length > 200 && !descExpanded ? desc.slice(0, 200) + '...' : desc;

  const sortedGrants = [...c.grants].sort((a, b) => (b.amount_gbp || 0) - (a.amount_gbp || 0));
  const visibleGrants = showAllGrants ? sortedGrants : sortedGrants.slice(0, 5);

  return (
    <>
      <EntityHeader
        name={c.name}
        subtitleParts={[c.city, c.year_founded ? `Founded ${c.year_founded}` : null, c.status]}
      />

      <div className="stat-row">
        <StatBlock value={c.employees} label="Employees" />
        <StatBlock value={c.revenue_gbp} label="Revenue" format="gbp" />
        <StatBlock value={c.funding_usd_m} label="Funding" format="usd" />
        <StatBlock value={c.total_grant_funding_gbp} label="Grant Funding" format="gbp" />
        <StatBlock value={c.patent_count} label="Patents" />
        <StatBlock value={c.grant_count} label="Grants" />
      </div>

      {/* Employee Growth */}
      {c.emp_growth_pct != null && (
        <div className="growth-section">
          <div className="growth-header">
            <span className={`growth-badge ${
              c.emp_growth_pct > 100 ? 'fast' :
              c.emp_growth_pct > 10 ? 'growing' :
              c.emp_growth_pct >= 0 ? 'stable' : 'shrinking'
            }`}>
              {c.emp_growth_pct > 100 ? 'Fast Growing' :
               c.emp_growth_pct > 10 ? 'Growing' :
               c.emp_growth_pct >= 0 ? 'Stable' : 'Shrinking'}
            </span>
            <span className="growth-pct">
              {c.emp_growth_pct > 0 ? '+' : ''}{c.emp_growth_pct.toFixed(0)}%
            </span>
          </div>
          <div className="growth-detail">
            {c.emp_earliest_count} → {c.emp_latest_count} employees
            {c.emp_earliest_date && c.emp_latest_date && (
              <span className="growth-period"> ({c.emp_earliest_date.slice(0, 7)} to {c.emp_latest_date.slice(0, 7)})</span>
            )}
          </div>
          {c.emp_timeseries && c.emp_timeseries.length > 2 && (
            <div className="sparkline">
              {(() => {
                const max = Math.max(...c.emp_timeseries.map(p => p.count), 1);
                return c.emp_timeseries.map((p, i) => (
                  <div
                    key={i}
                    className="sparkline-bar"
                    style={{ height: `${(p.count / max) * 100}%` }}
                    title={`${p.date}: ${p.count}`}
                  />
                ));
              })()}
            </div>
          )}
        </div>
      )}

      {desc && (
        <div className="info-desc">
          {truncatedDesc}
          {desc.length > 200 && (
            <button className="info-show-more" onClick={() => setDescExpanded(!descExpanded)}>
              {descExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      <RticTags rtic={c.rtic} />

      <div className="info-links">
        {c.website && (
          <a href={`https://${c.website}`} target="_blank" rel="noopener noreferrer" className="info-link">
            {c.website} &#8599;
          </a>
        )}
      </div>

      <div className="source-badges">
        <span className={`source-badge strength-${c.data_strength.toLowerCase()}`}>
          {c.data_strength} Data
        </span>
        {c.sources.map(s => <span key={s} className="source-badge">{s}</span>)}
        {c.source_type && <span className="source-badge">{c.source_type}</span>}
        {c.discovery_verdict && (
          <span className={`source-badge ${c.discovery_verdict === 'Y' ? 'verdict-y' : c.discovery_verdict === 'MAYBE' ? 'verdict-maybe' : ''}`}>
            {c.discovery_verdict === 'Y' ? 'Confirmed' : c.discovery_verdict === 'MAYBE' ? 'Possible' : c.discovery_verdict}
          </span>
        )}
      </div>

      {/* Grants section */}
      {c.grant_count > 0 && (
        <CollapsibleSection title="Grants" count={c.grant_count} defaultOpen={c.grants.length > 0}>
          {c.grants.length > 0 ? (
            <>
              {visibleGrants.map((g, i) => (
                <RelatedEntityCard
                  key={i}
                  title={g.title}
                  subtitle={`${g.funder} · ${formatGBP(g.amount_gbp)}`}
                  type="grant"
                  statusLabel={g.status}
                  statusColor={g.status === 'Active' ? 'active' : 'closed'}
                  onClick={() => onNavigate({
                    type: 'grant',
                    data: {
                      id: '', reference: g.reference, title: g.title,
                      status: g.status, category: '', lead_funder: g.funder,
                      lead_org: c.name, lead_department: '', pi_name: '',
                      funding_gbp: g.amount_gbp, start_date: '', end_date: '',
                      research_subjects: '', research_topics: '',
                      abstract: '', potential_impact: '', gtr_url: '',
                      lat: c.lat, lng: c.lng,
                    },
                  })}
                />
              ))}
              {sortedGrants.length > 5 && !showAllGrants && (
                <button className="expand-btn" onClick={() => setShowAllGrants(true)}>
                  Show all {sortedGrants.length} grants
                </button>
              )}
            </>
          ) : (
            <div className="info-loading">
              {c.grant_count} grant{c.grant_count !== 1 ? 's' : ''} identified
              {c.total_grant_funding_gbp ? ` · ${formatGBP(c.total_grant_funding_gbp)} total funding` : ''}
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* Collaborations section */}
      <CollapsibleSection
        title="Collaborations"
        count={collaborations ? collaborations.length : undefined}
        onExpand={() => onLoadCollaborations(c.name)}
        resetKey={c.name}
      >
        {collabLoading && <div className="info-loading">Loading collaborations...</div>}
        {collaborations && collaborations.length === 0 && (
          <div className="info-loading">No grant-based collaborations found.</div>
        )}
        {collaborations && collaborations.length > 0 && (
          <>
            {collaborations.slice(0, 15).map((col, i) => (
              <RelatedEntityCard
                key={i}
                title={col.collaborator}
                subtitle={`${col.shared_grants} shared grants · ${col.collaborator_roles.replace(/;/g, ', ')}`}
                type={col.collaborator_is_company ? 'company' : 'institution'}
              />
            ))}
            {collaborations.length > 15 && (
              <div className="info-loading">{collaborations.length - 15} more collaborators not shown</div>
            )}
            <button
              className="info-btn"
              onClick={() => onShowCollaborations(c.name, [c.lat, c.lng])}
            >
              Show collaborations on map
            </button>
          </>
        )}
      </CollapsibleSection>
    </>
  );
}
