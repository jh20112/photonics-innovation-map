import { useState } from 'react';
import type { Infrastructure } from '../../../types/api';
import { EntityHeader } from '../EntityHeader';
import { RticTags, TagList } from '../TagList';

interface Props {
  facility: Infrastructure;
}

function parseSemicolonList(val: string): string[] {
  return val.split(';').map(s => s.trim()).filter(Boolean);
}

export function InfrastructurePanel({ facility: f }: Props) {
  const [descExpanded, setDescExpanded] = useState(false);

  const desc = f.description || '';
  const truncatedDesc = desc.length > 200 && !descExpanded ? desc.slice(0, 200) + '...' : desc;

  const disciplines = parseSemicolonList(f.disciplines);
  const economicSectors = parseSemicolonList(f.economic_sectors);
  const keywords = parseSemicolonList(f.keywords);

  return (
    <>
      <EntityHeader
        name={f.name}
        subtitleParts={[f.host_org]}
      />

      <span className={`class-badge ${f.classification === 'Core Photonics' ? 'core' : 'supporting'}`}>
        {f.classification}
      </span>

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

      {f.address && (
        <div className="detail-grid">
          <div className="detail-item full-width">
            <span className="detail-label">Address</span>
            <span className="detail-value">{f.address}</span>
          </div>
        </div>
      )}

      <RticTags rtic={f.rtic} />

      {disciplines.length > 0 && (
        <TagList label="Disciplines" tags={disciplines} variant="secondary" />
      )}

      {economicSectors.length > 0 && (
        <TagList label="Economic Sectors" tags={economicSectors} variant="secondary" />
      )}

      {keywords.length > 0 && (
        <TagList label="Keywords" tags={keywords} />
      )}

      <div className="info-links">
        {f.website && (
          <a href={f.website} target="_blank" rel="noopener noreferrer" className="info-link">
            Website &#8599;
          </a>
        )}
        {f.infraportal_url && (
          <a href={f.infraportal_url} target="_blank" rel="noopener noreferrer" className="info-link">
            InfraPortal &#8599;
          </a>
        )}
      </div>
    </>
  );
}
