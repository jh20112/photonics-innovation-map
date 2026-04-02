import { useMemo } from 'react';
import type { Company } from '../../types/api';

interface Props {
  companies: Company[];
  onFilterSources: (sources: string[]) => void;
}

interface VennRegion {
  label: string;
  count: number;
  sources: string[];  // raw source keys to filter by
  cx: number;
  cy: number;
}

function categorize(sources: string[]): Set<string> {
  const cats = new Set<string>();
  for (const s of sources) {
    if (s === 'datacity') cats.add('DC');
    else if (s === 'dealroom') cats.add('DR');
    else if (s === 'pitchbook') cats.add('PB');
    else if (s === 'grant_collabs' || s === 'grant_leads') cats.add('GR');
    else if (s === 'patents') cats.add('PT');
  }
  return cats;
}

function hasExact(cats: Set<string>, include: string[], exclude: string[]): boolean {
  return include.every(c => cats.has(c)) && exclude.every(c => !cats.has(c));
}

export function SourceVenn({ companies, onFilterSources }: Props) {
  const { commercial, discovery } = useMemo(() => {
    let dcOnly = 0, drOnly = 0, pbOnly = 0;
    let dcDr = 0, dcPb = 0, drPb = 0, dcDrPb = 0;
    let grOnly = 0, ptOnly = 0, grPt = 0;

    for (const c of companies) {
      const cats = categorize(c.sources);
      if (hasExact(cats, ['DC'], ['DR', 'PB'])) dcOnly++;
      if (hasExact(cats, ['DR'], ['DC', 'PB'])) drOnly++;
      if (hasExact(cats, ['PB'], ['DC', 'DR'])) pbOnly++;
      if (hasExact(cats, ['DC', 'DR'], ['PB'])) dcDr++;
      if (hasExact(cats, ['DC', 'PB'], ['DR'])) dcPb++;
      if (hasExact(cats, ['DR', 'PB'], ['DC'])) drPb++;
      if (hasExact(cats, ['DC', 'DR', 'PB'], [])) dcDrPb++;
      if (cats.has('GR') && !cats.has('PT')) grOnly++;
      if (cats.has('PT') && !cats.has('GR')) ptOnly++;
      if (cats.has('GR') && cats.has('PT')) grPt++;
    }

    return {
      commercial: { dcOnly, drOnly, pbOnly, dcDr, dcPb, drPb, dcDrPb },
      discovery: { grOnly, ptOnly, grPt },
    };
  }, [companies]);

  const commRegions: VennRegion[] = [
    { label: 'DataCity', count: commercial.dcOnly, sources: ['datacity'], cx: 105, cy: 110 },
    { label: 'Dealroom', count: commercial.drOnly, sources: ['dealroom'], cx: 195, cy: 110 },
    { label: 'PitchBook', count: commercial.pbOnly, sources: ['pitchbook'], cx: 150, cy: 195 },
    { label: 'DataCity ∩ Dealroom', count: commercial.dcDr, sources: ['datacity', 'dealroom'], cx: 150, cy: 100 },
    { label: 'DataCity ∩ PitchBook', count: commercial.dcPb, sources: ['datacity', 'pitchbook'], cx: 120, cy: 165 },
    { label: 'Dealroom ∩ PitchBook', count: commercial.drPb, sources: ['dealroom', 'pitchbook'], cx: 180, cy: 165 },
    { label: 'All three', count: commercial.dcDrPb, sources: ['datacity', 'dealroom', 'pitchbook'], cx: 150, cy: 140 },
  ];

  const discRegions: VennRegion[] = [
    { label: 'Grants', count: discovery.grOnly, sources: ['grant_collabs', 'grant_leads'], cx: 105, cy: 130 },
    { label: 'Patents', count: discovery.ptOnly, sources: ['patents'], cx: 195, cy: 130 },
    { label: 'Grants ∩ Patents', count: discovery.grPt, sources: ['grant_collabs', 'grant_leads', 'patents'], cx: 150, cy: 130 },
  ];

  const handleClick = (region: VennRegion) => {
    if (region.count === 0) return;
    onFilterSources(region.sources);
  };

  return (
    <div className="data-section">
      <h3 className="data-section-title">Source Overlap</h3>
      <p className="data-section-desc">Click a region to filter the dashboard by those sources.</p>

      <div className="venn-container">
        {/* Commercial 3-circle Venn */}
        <div className="venn-diagram">
          <div className="venn-diagram-title">Commercial Sources</div>
          <svg viewBox="0 0 300 260" className="venn-svg">
            <circle cx="125" cy="120" r="75" className="venn-circle" style={{ fill: '#3b82f6' }} />
            <circle cx="175" cy="120" r="75" className="venn-circle" style={{ fill: '#8b5cf6' }} />
            <circle cx="150" cy="175" r="75" className="venn-circle" style={{ fill: '#06b6d4' }} />
            <text x="55" y="65" className="venn-source-label">DataCity</text>
            <text x="195" y="65" className="venn-source-label">Dealroom</text>
            <text x="150" y="235" className="venn-source-label" textAnchor="middle">PitchBook</text>
            {commRegions.map(r => r.count > 0 && (
              <g key={r.label} onClick={() => handleClick(r)} className="venn-region">
                <circle cx={r.cx} cy={r.cy} r={16} className="venn-hit" />
                <text x={r.cx} y={r.cy + 5} textAnchor="middle" className="venn-count">{r.count}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* Discovery 2-circle Venn */}
        <div className="venn-diagram">
          <div className="venn-diagram-title">Discovery Sources</div>
          <svg viewBox="0 0 300 260" className="venn-svg">
            <circle cx="125" cy="130" r="90" className="venn-circle" style={{ fill: '#10b981' }} />
            <circle cx="175" cy="130" r="90" className="venn-circle" style={{ fill: '#f59e0b' }} />
            <text x="75" y="100" className="venn-source-label">Grants</text>
            <text x="200" y="100" className="venn-source-label">Patents</text>
            {discRegions.map(r => r.count > 0 && (
              <g key={r.label} onClick={() => handleClick(r)} className="venn-region">
                <circle cx={r.cx} cy={r.cy} r={20} className="venn-hit" />
                <text x={r.cx} y={r.cy + 5} textAnchor="middle" className="venn-count">{r.count}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
