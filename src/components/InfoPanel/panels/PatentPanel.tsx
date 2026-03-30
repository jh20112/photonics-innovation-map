import type { Patent, Company, EntityDetail } from '../../../types/api';
import { EntityHeader } from '../EntityHeader';
import { TagList } from '../TagList';
import { RelatedEntityCard } from '../RelatedEntityCard';

interface Props {
  patent: Patent;
  matchedCompany: Company | null;
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
  return raw.split('|').map(s => s.trim()).filter(Boolean);
}

export function PatentPanel({ patent: p, matchedCompany, onNavigate }: Props) {
  const cpcCodes = parseCpcCodes(p.cpc_codes);
  const cpcClasses = [...new Set(cpcCodes.map(c => c.slice(0, 4)))];

  return (
    <>
      <EntityHeader
        name={`Patent: ${p.publication_number}`}
        subtitleParts={[p.assignee]}
      />

      {matchedCompany && (
        <RelatedEntityCard
          title={matchedCompany.name}
          subtitle="Assignee Company"
          type="company"
          onClick={() => onNavigate({ type: 'company', data: matchedCompany })}
        />
      )}

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
