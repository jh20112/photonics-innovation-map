import type { Institution, Collaboration, ResearchEdge, EntityDetail } from '../../../types/api';
import { EntityHeader } from '../EntityHeader';
import { StatBlock } from '../StatBlock';
import { CollapsibleSection } from '../CollapsibleSection';
import { TopicTreemap } from '../TopicTreemap';
import { RelatedEntityCard } from '../RelatedEntityCard';

interface Props {
  institution: Institution;
  collaborations: Collaboration[] | null;
  collabLoading: boolean;
  onLoadCollaborations: (name: string) => void;
  researchCollabs: ResearchEdge[] | null;
  researchCollabLoading: boolean;
  onLoadResearchCollabs: (name: string) => void;
  onNavigate: (detail: EntityDetail) => void;
  onShowCollaborations: (name: string, coords: [number, number]) => void;
}

export function InstitutionPanel({
  institution: inst, collaborations, collabLoading,
  onLoadCollaborations, researchCollabs, researchCollabLoading, onLoadResearchCollabs,
  onNavigate: _onNavigate, onShowCollaborations,
}: Props) {
  return (
    <>
      <EntityHeader
        name={inst.name}
        subtitleParts={[
          inst.inst_type ? inst.inst_type.charAt(0).toUpperCase() + inst.inst_type.slice(1) : null,
          inst.rank ? `#${inst.rank} in UK photonics` : null,
        ]}
      />

      <div className="stat-row">
        <StatBlock value={inst.photonics_works} label="Publications" />
        <StatBlock value={inst.total_citations} label="Citations" />
        <StatBlock value={inst.avg_fwci} label="Avg FWCI" format="plain" />
        <StatBlock value={inst.pct_top10_cited != null ? `${inst.pct_top10_cited}%` : null} label="Top 10% Cited" format="plain" />
        <StatBlock value={inst.citations_per_paper} label="Cites/Paper" format="plain" />
        <StatBlock value={inst.n_grants} label="Grants" />
      </div>

      {inst.topic_breakdown && inst.topic_breakdown.length > 0 && (
        <CollapsibleSection title="Research Focus" count={inst.topic_breakdown.length} defaultOpen resetKey={inst.id}>
          <TopicTreemap topics={inst.topic_breakdown} totalPublications={inst.photonics_works ?? undefined} />
        </CollapsibleSection>
      )}

      {inst.cluster_id != null && (
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Cluster</span>
            <span className="detail-value">Group {inst.cluster_id}</span>
          </div>
        </div>
      )}

      {/* Collaborations */}
      <CollapsibleSection
        title="Collaborations"
        count={collaborations ? collaborations.length : undefined}
        onExpand={() => onLoadCollaborations(inst.name)}
        resetKey={inst.name}
      >
        {collabLoading && <div className="info-loading">Loading collaborations...</div>}
        {collaborations && collaborations.length === 0 && (
          <div className="info-loading">No grant-based collaborations found for this institution.</div>
        )}
        {collaborations?.slice(0, 15).map((col, i) => (
          <RelatedEntityCard
            key={i}
            title={col.collaborator !== inst.name ? col.collaborator : col.company}
            subtitle={`${col.shared_grants} shared grants · ${col.collaborator_roles.replace(/;/g, ', ')}`}
            type={col.collaborator_is_company ? 'company' : 'institution'}
          />
        ))}
        {collaborations && collaborations.length > 0 && (
          <button
            className="info-btn"
            onClick={() => onShowCollaborations(inst.name, [inst.lat, inst.lng])}
          >
            Show collaborations on map
          </button>
        )}
      </CollapsibleSection>

      {/* Research Collaborators (co-publications) */}
      <CollapsibleSection
        title="Research Collaborators"
        count={researchCollabs ? researchCollabs.length : undefined}
        onExpand={() => onLoadResearchCollabs(inst.name)}
        resetKey={inst.name}
      >
        {researchCollabLoading && <div className="info-loading">Loading research collaborators...</div>}
        {researchCollabs && researchCollabs.length === 0 && (
          <div className="info-loading">No co-publication collaborations found.</div>
        )}
        {researchCollabs
          ?.sort((a, b) => b.shared_publications - a.shared_publications)
          .slice(0, 15)
          .map((edge, i) => (
            <RelatedEntityCard
              key={i}
              title={edge.inst_a.toLowerCase() !== inst.name.toLowerCase() ? edge.inst_a : edge.inst_b}
              subtitle={`${edge.shared_publications} shared publications`}
              type="institution"
            />
          ))}
      </CollapsibleSection>
    </>
  );
}
