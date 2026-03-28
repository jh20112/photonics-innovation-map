import type { Patent, EntityDetail } from '../../../types/api';
import { EntityHeader } from '../EntityHeader';
import { TagList } from '../TagList';

interface Props {
  patent: Patent;
  onNavigate: (detail: EntityDetail) => void;
}

function formatDate(d: string): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
}

function parseCpcCodes(raw: string): string[] {
  if (!raw) return [];
  // CPC codes are pipe-separated like "G02B6/12019|G02B6/125|..."
  return raw.split('|').map(s => s.trim()).filter(Boolean);
}

export function PatentPanel({ patent: p, onNavigate: _onNavigate }: Props) {
  const cpcCodes = parseCpcCodes(p.cpc_codes);
  // Extract unique top-level CPC classes (e.g., "G02B", "G02F")
  const cpcClasses = [...new Set(cpcCodes.map(c => c.slice(0, 4)))];

  return (
    <>
      <EntityHeader
        name={`Patent: ${p.publication_number}`}
        subtitleParts={[p.assignee]}
      />

      <div className="detail-grid">
        <div className="detail-item">
          <span className="detail-label">Assignee</span>
          <span className="detail-value">{p.assignee}</span>
        </div>
        {p.earliest_filing && (
          <div className="detail-item">
            <span className="detail-label">Filing Date</span>
            <span className="detail-value">{formatDate(p.earliest_filing)}</span>
          </div>
        )}
        {p.latest_filing && p.latest_filing !== p.earliest_filing && (
          <div className="detail-item">
            <span className="detail-label">Latest Filing</span>
            <span className="detail-value">{formatDate(p.latest_filing)}</span>
          </div>
        )}
      </div>

      {cpcClasses.length > 0 && (
        <TagList label="CPC Classes" tags={cpcClasses} variant="primary" />
      )}

      {cpcCodes.length > 0 && (
        <TagList label="CPC Codes" tags={cpcCodes} variant="secondary" />
      )}
    </>
  );
}
