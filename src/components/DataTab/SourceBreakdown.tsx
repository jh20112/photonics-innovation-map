import { useMemo } from 'react';
import type { Company } from '../../types/api';

interface Props {
  companies: Company[];
}

const SOURCE_LABELS: Record<string, string> = {
  datacity: 'DataCity',
  dealroom: 'Dealroom',
  pitchbook: 'PitchBook',
  grant_leads: 'Grant Leads',
  grant_collabs: 'Grant Collaborators',
  patents: 'Patents',
  company_collabs: 'Company Collaborators',
  pipeline: 'Pipeline',
  manual: 'Manual',
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  original: 'Original',
  discovery: 'Discovery',
  pipeline: 'Pipeline',
  manual: 'Manual',
};

const BAR_COLOURS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

export function SourceBreakdown({ companies }: Props) {
  const { sourceCounts, sourceTypeCounts } = useMemo(() => {
    const sc: Record<string, number> = {};
    const stc: Record<string, number> = {};
    for (const c of companies) {
      for (const s of c.sources) {
        sc[s] = (sc[s] || 0) + 1;
      }
      const st = c.source_type || 'unknown';
      stc[st] = (stc[st] || 0) + 1;
    }
    return { sourceCounts: sc, sourceTypeCounts: stc };
  }, [companies]);

  const sortedSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  const sortedTypes = Object.entries(sourceTypeCounts).sort((a, b) => b[1] - a[1]);
  const maxSource = Math.max(...sortedSources.map(([, c]) => c), 1);
  const maxType = Math.max(...sortedTypes.map(([, c]) => c), 1);

  return (
    <div>
      <div className="data-section">
        <h3 className="data-section-title">Data Sources</h3>
        <p className="data-section-desc">
          Companies can appear in multiple sources. {companies.length} companies total.
        </p>
        <div className="bar-chart">
          {sortedSources.map(([source, count], i) => (
            <div key={source} className="bar-row">
              <span className="bar-label">{SOURCE_LABELS[source] || source}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(count / maxSource) * 100}%`,
                    backgroundColor: BAR_COLOURS[i % BAR_COLOURS.length],
                  }}
                />
              </div>
              <span className="bar-value">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="data-section">
        <h3 className="data-section-title">Source Type</h3>
        <p className="data-section-desc">
          How companies were identified.
        </p>
        <div className="bar-chart">
          {sortedTypes.map(([type, count], i) => (
            <div key={type} className="bar-row">
              <span className="bar-label">{SOURCE_TYPE_LABELS[type] || type}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(count / maxType) * 100}%`,
                    backgroundColor: BAR_COLOURS[i % BAR_COLOURS.length],
                  }}
                />
              </div>
              <span className="bar-value">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
