import { useMemo, useState } from 'react';
import type { Company } from '../../types/api';

interface Props {
  companies: Company[];
  onSelectCompany?: (company: Company) => void;
}

interface VennRegion {
  label: string;
  count: number;
  companies: Company[];
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

export function SourceVenn({ companies, onSelectCompany }: Props) {
  const [selectedRegion, setSelectedRegion] = useState<VennRegion | null>(null);

  const { commercial, discovery } = useMemo(() => {
    const dcOnly: Company[] = [], drOnly: Company[] = [], pbOnly: Company[] = [];
    const dcDr: Company[] = [], dcPb: Company[] = [], drPb: Company[] = [];
    const dcDrPb: Company[] = [];
    const grOnly: Company[] = [], ptOnly: Company[] = [], grPt: Company[] = [];

    for (const c of companies) {
      const cats = categorize(c.sources);
      // Commercial
      if (hasExact(cats, ['DC'], ['DR', 'PB'])) dcOnly.push(c);
      if (hasExact(cats, ['DR'], ['DC', 'PB'])) drOnly.push(c);
      if (hasExact(cats, ['PB'], ['DC', 'DR'])) pbOnly.push(c);
      if (hasExact(cats, ['DC', 'DR'], ['PB'])) dcDr.push(c);
      if (hasExact(cats, ['DC', 'PB'], ['DR'])) dcPb.push(c);
      if (hasExact(cats, ['DR', 'PB'], ['DC'])) drPb.push(c);
      if (hasExact(cats, ['DC', 'DR', 'PB'], [])) dcDrPb.push(c);
      // Discovery
      if (cats.has('GR') && !cats.has('PT')) grOnly.push(c);
      if (cats.has('PT') && !cats.has('GR')) ptOnly.push(c);
      if (cats.has('GR') && cats.has('PT')) grPt.push(c);
    }

    return {
      commercial: { dcOnly, drOnly, pbOnly, dcDr, dcPb, drPb, dcDrPb },
      discovery: { grOnly, ptOnly, grPt },
    };
  }, [companies]);

  // 3-circle Venn positions (in SVG coords 0-300)
  const commRegions: VennRegion[] = [
    { label: 'DataCity only', count: commercial.dcOnly.length, companies: commercial.dcOnly, cx: 105, cy: 110 },
    { label: 'Dealroom only', count: commercial.drOnly.length, companies: commercial.drOnly, cx: 195, cy: 110 },
    { label: 'PitchBook only', count: commercial.pbOnly.length, companies: commercial.pbOnly, cx: 150, cy: 195 },
    { label: 'DataCity ∩ Dealroom', count: commercial.dcDr.length, companies: commercial.dcDr, cx: 150, cy: 100 },
    { label: 'DataCity ∩ PitchBook', count: commercial.dcPb.length, companies: commercial.dcPb, cx: 120, cy: 165 },
    { label: 'Dealroom ∩ PitchBook', count: commercial.drPb.length, companies: commercial.drPb, cx: 180, cy: 165 },
    { label: 'All three', count: commercial.dcDrPb.length, companies: commercial.dcDrPb, cx: 150, cy: 140 },
  ];

  const discRegions: VennRegion[] = [
    { label: 'Grants only', count: discovery.grOnly.length, companies: discovery.grOnly, cx: 105, cy: 130 },
    { label: 'Patents only', count: discovery.ptOnly.length, companies: discovery.ptOnly, cx: 195, cy: 130 },
    { label: 'Grants ∩ Patents', count: discovery.grPt.length, companies: discovery.grPt, cx: 150, cy: 130 },
  ];

  const handleClick = (region: VennRegion) => {
    if (region.count === 0) return;
    setSelectedRegion(selectedRegion?.label === region.label ? null : region);
  };

  return (
    <div className="data-section">
      <h3 className="data-section-title">Source Overlap</h3>
      <p className="data-section-desc">Click a region to see companies in that overlap.</p>

      <div className="venn-container">
        {/* Commercial 3-circle Venn */}
        <div className="venn-diagram">
          <div className="venn-diagram-title">Commercial Sources</div>
          <svg viewBox="0 0 300 260" className="venn-svg">
            {/* Circles */}
            <circle cx="125" cy="120" r="75" className="venn-circle" style={{ fill: '#3b82f6' }} />
            <circle cx="175" cy="120" r="75" className="venn-circle" style={{ fill: '#8b5cf6' }} />
            <circle cx="150" cy="175" r="75" className="venn-circle" style={{ fill: '#06b6d4' }} />
            {/* Labels */}
            <text x="80" cy="90" className="venn-source-label">DataCity</text>
            <text x="195" y="90" className="venn-source-label">Dealroom</text>
            <text x="150" y="235" className="venn-source-label" textAnchor="middle">PitchBook</text>
            {/* Clickable regions with counts */}
            {commRegions.map(r => r.count > 0 && (
              <g key={r.label} onClick={() => handleClick(r)} className="venn-region">
                <circle cx={r.cx} cy={r.cy} r={16} className={`venn-hit ${selectedRegion?.label === r.label ? 'selected' : ''}`} />
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
                <circle cx={r.cx} cy={r.cy} r={20} className={`venn-hit ${selectedRegion?.label === r.label ? 'selected' : ''}`} />
                <text x={r.cx} y={r.cy + 5} textAnchor="middle" className="venn-count">{r.count}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Company list popup */}
      {selectedRegion && (
        <div className="venn-popup">
          <div className="venn-popup-header">
            <strong>{selectedRegion.label}</strong> — {selectedRegion.count} companies
            <button className="info-show-more" onClick={() => setSelectedRegion(null)}>Close</button>
          </div>
          <div className="venn-popup-list">
            {selectedRegion.companies.map(c => (
              <div
                key={c.id}
                className="venn-popup-item"
                onClick={() => onSelectCompany?.(c)}
              >
                {c.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
