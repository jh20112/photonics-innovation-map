import type { Institution, Collaboration, EntityDetail } from '../../../types/api';
import { EntityHeader } from '../EntityHeader';
import { StatBlock } from '../StatBlock';
import { CollapsibleSection } from '../CollapsibleSection';
import { RelatedEntityCard } from '../RelatedEntityCard';

interface Props {
  institution: Institution;
  collaborations: Collaboration[] | null;
  collabLoading: boolean;
  onLoadCollaborations: (name: string) => void;
  onNavigate: (detail: EntityDetail) => void;
  onShowCollaborations: (name: string, coords: [number, number]) => void;
}

export function InstitutionPanel({
  institution: inst, collaborations, collabLoading,
  onLoadCollaborations, onNavigate: _onNavigate, onShowCollaborations,
}: Props) {
  return (
    <>
      <EntityHeader
        name={inst.name}
        subtitleParts={[inst.rank ? `#${inst.rank} in UK photonics` : null]}
      />

      <div className="stat-row">
        <StatBlock value={inst.photonics_works} label="Publications" />
        <StatBlock value={inst.n_grants} label="Grants" />
        <StatBlock value={inst.n_collaborators} label="Collaborators" />
      </div>

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
    </>
  );
}
