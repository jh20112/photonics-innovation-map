import type { Grant, EntityDetail } from '../../../types/api';
import { EntityHeader } from '../EntityHeader';
import { StatBlock } from '../StatBlock';
import { TagList } from '../TagList';
import { CollapsibleSection } from '../CollapsibleSection';

interface Props {
  grant: Grant;
  onNavigate: (detail: EntityDetail) => void;
}

function calcDuration(start: string, end: string): string {
  if (!start || !end) return '';
  try {
    const s = new Date(start);
    const e = new Date(end);
    const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    if (months >= 12) {
      const years = Math.floor(months / 12);
      const rem = months % 12;
      return rem > 0 ? `${years}y ${rem}m` : `${years}y`;
    }
    return `${months}m`;
  } catch {
    return '';
  }
}

function formatDate(d: string): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
}

export function GrantPanel({ grant: g, onNavigate: _onNavigate }: Props) {
  const duration = calcDuration(g.start_date, g.end_date);
  const subjects = g.research_subjects ? g.research_subjects.split(';').map(s => s.trim()).filter(Boolean) : [];
  const topics = g.research_topics ? g.research_topics.split(';').map(s => s.trim()).filter(Boolean) : [];

  return (
    <>
      <EntityHeader
        name={g.title}
        subtitleParts={[g.reference]}
      />

      <div style={{ marginBottom: 12 }}>
        <span className={`status-pill ${g.status === 'Active' ? 'active' : g.status === 'Closed' ? 'closed' : 'pending'}`}>
          {g.status}
        </span>
      </div>

      <div className="stat-row">
        <StatBlock value={g.funding_gbp} label="Funding" format="gbp" />
        {duration && <StatBlock value={duration} label="Duration" format="plain" />}
      </div>

      <div className="detail-grid">
        <div className="detail-item">
          <span className="detail-label">Funder</span>
          <span className="detail-value">{g.lead_funder || '—'}</span>
        </div>
        {g.category && (
          <div className="detail-item">
            <span className="detail-label">Category</span>
            <span className="detail-value">{g.category}</span>
          </div>
        )}
        {g.lead_org && (
          <div className="detail-item full-width">
            <span className="detail-label">Lead Organisation</span>
            <span className="detail-value">{g.lead_org}</span>
          </div>
        )}
        {g.lead_department && (
          <div className="detail-item full-width">
            <span className="detail-label">Department</span>
            <span className="detail-value">{g.lead_department}</span>
          </div>
        )}
        {g.pi_name && (
          <div className="detail-item">
            <span className="detail-label">Principal Investigator</span>
            <span className="detail-value">{g.pi_name}</span>
          </div>
        )}
        {g.start_date && (
          <div className="detail-item">
            <span className="detail-label">Period</span>
            <span className="detail-value">{formatDate(g.start_date)} — {formatDate(g.end_date)}</span>
          </div>
        )}
      </div>

      {g.abstract && (
        <CollapsibleSection title="Abstract" resetKey={g.id}>
          <p style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{g.abstract}</p>
        </CollapsibleSection>
      )}

      {g.potential_impact && (
        <CollapsibleSection title="Potential Impact" resetKey={g.id}>
          <p style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{g.potential_impact}</p>
        </CollapsibleSection>
      )}

      {subjects.length > 0 && <TagList label="Research Subjects" tags={subjects} variant="primary" />}
      {topics.length > 0 && <TagList label="Research Topics" tags={topics} />}

      {g.gtr_url && (
        <div className="info-links">
          <a href={g.gtr_url} target="_blank" rel="noopener noreferrer" className="info-link">
            View on UKRI Gateway to Research &#8599;
          </a>
        </div>
      )}
    </>
  );
}
