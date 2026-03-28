import type { Cluster, Company, EntityDetail } from '../../../types/api';
import { EntityHeader } from '../EntityHeader';
import { StatBlock } from '../StatBlock';
import { CollapsibleSection } from '../CollapsibleSection';
import { RelatedEntityCard } from '../RelatedEntityCard';

interface Props {
  cluster: Cluster;
  members: Company[];
  onNavigate: (detail: EntityDetail) => void;
}

// Access extra summary fields that may or may not exist depending on cluster type
type ExtraSummary = Record<string, unknown>;

export function ClusterPanel({ cluster, members, onNavigate }: Props) {
  const sorted = [...members].sort((a, b) => (b.employees || 0) - (a.employees || 0));
  const extra = cluster.summary as unknown as ExtraSummary;

  const compositeScore = extra.composite_score as number | undefined;
  const researchScore = extra.research_score as number | undefined;
  const companyScore = extra.company_score as number | undefined;
  const fundingScore = extra.funding_score as number | undefined;
  const infraScore = extra.infra_score as number | undefined;
  const totalPubs = extra.total_publications as number | undefined;
  const anchorInstitution = extra.anchor_institution as string | undefined;
  const anchorPubs = extra.anchor_publications as number | undefined;
  const institutionCount = extra.institution_count as number | undefined;
  const topInstitutions = extra.top_institutions as string[] | undefined;
  const totalVc = extra.total_vc_funding_usd_m as number | undefined;

  return (
    <>
      <EntityHeader
        name={cluster.label}
        subtitleParts={[
          `${cluster.member_count} companies`,
          cluster.summary.region,
        ]}
      />

      <div style={{ marginBottom: 12 }}>
        <span
          style={{
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: cluster.colour,
            marginRight: 6,
            verticalAlign: 'middle',
          }}
        />
        <span className="tag primary">{cluster.summary.dominant_sector}</span>
        {compositeScore != null && (
          <span className="tag primary" style={{ marginLeft: 4 }}>Score: {compositeScore}</span>
        )}
      </div>

      {/* Composite score breakdown */}
      {compositeScore != null && (
        <div className="detail-grid" style={{ marginBottom: 14 }}>
          <div className="detail-item">
            <span className="detail-label">Research</span>
            <span className="detail-value">{researchScore?.toFixed(0)}/100</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Companies</span>
            <span className="detail-value">{companyScore?.toFixed(0)}/100</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Funding</span>
            <span className="detail-value">{fundingScore?.toFixed(0)}/100</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Infrastructure</span>
            <span className="detail-value">{infraScore?.toFixed(0)}/100</span>
          </div>
        </div>
      )}

      {/* Research-anchored info */}
      {anchorInstitution && (
        <div className="detail-grid" style={{ marginBottom: 14 }}>
          <div className="detail-item full-width">
            <span className="detail-label">Anchor Institution</span>
            <span className="detail-value">{anchorInstitution}</span>
          </div>
          {anchorPubs != null && (
            <div className="detail-item">
              <span className="detail-label">Anchor Publications</span>
              <span className="detail-value">{anchorPubs.toLocaleString()}</span>
            </div>
          )}
          {totalVc != null && totalVc > 0 && (
            <div className="detail-item">
              <span className="detail-label">VC Funding</span>
              <span className="detail-value">${totalVc}M</span>
            </div>
          )}
        </div>
      )}

      <div className="stat-row">
        <StatBlock value={cluster.summary.total_employees} label="Employees" />
        <StatBlock value={cluster.summary.total_patents} label="Patents" />
        <StatBlock value={cluster.summary.total_grants} label="Grants" />
        <StatBlock value={cluster.summary.total_funding_gbp} label="Grant Funding" format="gbp" />
        {totalPubs != null && totalPubs > 0 && <StatBlock value={totalPubs} label="Publications" />}
        {institutionCount != null && institutionCount > 0 && <StatBlock value={institutionCount} label="Institutions" />}
      </div>

      {/* Top institutions */}
      {topInstitutions && topInstitutions.length > 0 && (
        <CollapsibleSection title="Top Institutions" count={topInstitutions.length} defaultOpen>
          {topInstitutions.map((name, i) => (
            <RelatedEntityCard
              key={i}
              title={name}
              subtitle="Research institution"
              type="institution"
            />
          ))}
        </CollapsibleSection>
      )}

      {/* Member companies */}
      <CollapsibleSection title="Companies" count={sorted.length} defaultOpen>
        {sorted.map((c) => {
          const subtitle = [
            c.employees ? `${c.employees} employees` : null,
            c.patent_count ? `${c.patent_count} patents` : null,
            c.grant_count ? `${c.grant_count} grants` : null,
          ].filter(Boolean).join(' · ') || c.city || '';

          return (
            <RelatedEntityCard
              key={c.id}
              title={c.name}
              subtitle={subtitle}
              type="company"
              onClick={() => onNavigate({ type: 'company', data: c })}
            />
          );
        })}
      </CollapsibleSection>
    </>
  );
}
