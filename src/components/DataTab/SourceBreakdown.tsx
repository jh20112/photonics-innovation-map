import { useState, useMemo } from 'react';
import type { Company } from '../../types/api';

interface Props {
  companies: Company[];
  onFilterSourcesAndScore?: (sources: string[], scoreMin: number, scoreMax: number) => void;
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

const SCORE_BUCKETS = [
  { label: '0-19', min: 0, max: 19, color: '#ef4444' },
  { label: '20-39', min: 20, max: 39, color: '#f97316' },
  { label: '40-59', min: 40, max: 59, color: '#eab308' },
  { label: '60-79', min: 60, max: 79, color: '#22c55e' },
  { label: '80-100', min: 80, max: 100, color: '#059669' },
];

const STRENGTH_CONFIG = [
  { key: 'Strong', color: '#059669' },
  { key: 'Moderate', color: '#3b82f6' },
  { key: 'Limited', color: '#ef4444' },
];

export function SourceBreakdown({ companies, onFilterSourcesAndScore }: Props) {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

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

  // Compute drill-down data for selected source
  const drillDown = useMemo(() => {
    if (!selectedSource) return null;
    const sourceCompanies = companies.filter(c => c.sources.includes(selectedSource));
    const total = sourceCompanies.length;

    // Data strength breakdown
    const strength: Record<string, number> = { Strong: 0, Moderate: 0, Limited: 0 };
    for (const c of sourceCompanies) {
      const s = c.data_strength || 'Limited';
      strength[s] = (strength[s] || 0) + 1;
    }

    // Photonics score histogram
    const scoreBuckets = SCORE_BUCKETS.map(b => ({
      ...b,
      count: sourceCompanies.filter(c =>
        c.photonics_score != null && c.photonics_score >= b.min && c.photonics_score <= b.max
      ).length,
    }));
    const maxBucket = Math.max(...scoreBuckets.map(b => b.count), 1);

    // Avg score
    const scores = sourceCompanies.filter(c => c.photonics_score != null).map(c => c.photonics_score!);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return { total, strength, scoreBuckets, maxBucket, avgScore };
  }, [selectedSource, companies]);

  const sortedSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  const sortedTypes = Object.entries(sourceTypeCounts).sort((a, b) => b[1] - a[1]);
  const maxSource = Math.max(...sortedSources.map(([, c]) => c), 1);
  const maxType = Math.max(...sortedTypes.map(([, c]) => c), 1);

  return (
    <div>
      <div className="data-section">
        <h3 className="data-section-title">Data Sources</h3>
        <p className="data-section-desc">
          Click a source to see enrichment quality and photonics score distribution.
        </p>
        <div className="bar-chart">
          {sortedSources.map(([source, count], i) => (
            <div key={source}>
              <div
                className={`bar-row bar-row-clickable ${selectedSource === source ? 'bar-row-selected' : ''}`}
                onClick={() => setSelectedSource(selectedSource === source ? null : source)}
              >
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

              {/* Drill-down detail */}
              {selectedSource === source && drillDown && (
                <div className="source-detail">
                  <div className="source-detail-section">
                    <h4>Data Strength ({drillDown.total} companies)</h4>
                    <div className="strength-bars">
                      {STRENGTH_CONFIG.map(({ key, color }) => {
                        const count = drillDown.strength[key] || 0;
                        const pct = drillDown.total > 0 ? Math.round((count / drillDown.total) * 100) : 0;
                        return (
                          <div key={key} className="strength-row">
                            <span className="strength-label">{key}</span>
                            <div className="strength-track">
                              <div className="strength-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
                            </div>
                            <span className="strength-value">{count} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="source-detail-section">
                    <h4>Photonics Score (avg: {drillDown.avgScore})</h4>
                    <div className="score-histogram">
                      {drillDown.scoreBuckets.map(b => (
                        <div
                          key={b.label}
                          className={`histogram-col ${b.count > 0 && onFilterSourcesAndScore ? 'histogram-clickable' : ''}`}
                          onClick={() => b.count > 0 && selectedSource && onFilterSourcesAndScore?.(
                            selectedSource === 'datacity' ? ['datacity'] :
                            selectedSource === 'dealroom' ? ['dealroom'] :
                            selectedSource === 'pitchbook' ? ['pitchbook'] :
                            selectedSource === 'grant_collabs' ? ['grant_collabs', 'grant_leads'] :
                            selectedSource === 'patents' ? ['patents'] :
                            [selectedSource],
                            b.min, b.max
                          )}
                        >
                          <div className="histogram-bar-wrap">
                            <div
                              className="histogram-bar"
                              style={{
                                height: `${(b.count / drillDown.maxBucket) * 100}%`,
                                backgroundColor: b.color,
                              }}
                            />
                          </div>
                          <span className="histogram-count">{b.count}</span>
                          <span className="histogram-label">{b.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
