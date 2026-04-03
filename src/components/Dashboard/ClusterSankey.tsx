import { useMemo, useState } from 'react';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import type { SankeyNode as D3SankeyNode } from 'd3-sankey';
import type { ClusterSankeyData, ClusterSummary } from '../../types/api';

interface Props {
  data: ClusterSankeyData;
  clusterLabel: string;
  summary: ClusterSummary | null;
  onBack: () => void;
}

const COLUMN_COLORS = ['#3b82f6', '#8b5cf6', '#14b8a6']; // blue, purple, teal
const COLUMN_HEADERS = ['Research Topics', 'Photonics Subsectors', 'End Markets'];

const WIDTH = 900;
const HEIGHT = 500;
const MARGIN = { top: 40, right: 180, bottom: 20, left: 180 };

type SNode = D3SankeyNode<{ id: string; name: string; column: number; value: number }, {}>;

// --- Bar Chart Component ---
function BarChart({ title, items, color }: { title: string; items: { name: string; value: number }[]; color: string }) {
  const maxVal = Math.max(...items.map(i => i.value), 1);
  return (
    <div className="comp-bar-chart">
      <h4 className="comp-bar-title">{title}</h4>
      {items.slice(0, 6).map(item => (
        <div key={item.name} className="comp-bar-row">
          <span className="comp-bar-label" title={item.name}>{item.name}</span>
          <div className="comp-bar-track">
            <div
              className="comp-bar-fill"
              style={{ width: `${(item.value / maxVal) * 100}%`, background: color }}
            />
          </div>
          <span className="comp-bar-value">{Math.round(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

// --- Radar Chart Component ---
function RadarChart({ summary }: { summary: ClusterSummary }) {
  const axes = [
    { label: 'Research', value: summary.research_score ?? 0 },
    { label: 'Companies', value: summary.company_score ?? 0 },
    { label: 'Funding', value: summary.funding_score ?? 0 },
    { label: 'Infrastructure', value: summary.infra_score ?? 0 },
    { label: 'Patents', value: Math.min((summary.total_patents / 50) * 100, 100) },
    { label: 'Grants', value: Math.min((summary.total_grants / 20) * 100, 100) },
  ];

  const cx = 120, cy = 120, r = 90;
  const n = axes.length;
  const angleStep = (2 * Math.PI) / n;

  const toXY = (i: number, val: number) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const dist = (val / 100) * r;
    return [cx + dist * Math.cos(angle), cy + dist * Math.sin(angle)];
  };

  const polygonPoints = axes.map((a, i) => toXY(i, a.value).join(',')).join(' ');
  const gridLevels = [25, 50, 75, 100];

  return (
    <div className="comp-radar">
      <h4 className="comp-bar-title">Cluster Profile</h4>
      <svg viewBox="0 0 240 240" className="comp-radar-svg">
        {/* Grid circles */}
        {gridLevels.map(level => (
          <polygon
            key={level}
            points={axes.map((_, i) => toXY(i, level).join(',')).join(' ')}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={0.5}
          />
        ))}
        {/* Axes */}
        {axes.map((_, i) => {
          const [x, y] = toXY(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e5e7eb" strokeWidth={0.5} />;
        })}
        {/* Data polygon */}
        <polygon points={polygonPoints} fill="#3b82f6" fillOpacity={0.2} stroke="#3b82f6" strokeWidth={1.5} />
        {/* Data points */}
        {axes.map((a, i) => {
          const [x, y] = toXY(i, a.value);
          return <circle key={i} cx={x} cy={y} r={3} fill="#3b82f6" />;
        })}
        {/* Labels */}
        {axes.map((a, i) => {
          const [x, y] = toXY(i, 120);
          return (
            <text key={i} x={x} y={y} textAnchor="middle" dy="0.35em" className="comp-radar-label">
              {a.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// --- Treemap Component ---
function SectorTreemap({ items }: { items: { name: string; value: number; color: string }[] }) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  return (
    <div className="comp-treemap">
      <h4 className="comp-bar-title">Sector Composition</h4>
      <div className="comp-treemap-grid">
        {items.filter(i => i.value > 0).map(item => {
          const pct = (item.value / total) * 100;
          return (
            <div
              key={item.name}
              className="comp-treemap-cell"
              style={{ flex: `${pct} 0 0`, background: item.color, minWidth: pct > 8 ? '60px' : '30px' }}
              title={`${item.name}: ${item.value} companies (${pct.toFixed(0)}%)`}
            >
              {pct > 12 && <span className="comp-treemap-label">{item.name}</span>}
              {pct > 8 && <span className="comp-treemap-value">{item.value}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Main Component ---
export function ClusterSankey({ data, clusterLabel, summary, onBack }: Props) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const layout = useMemo(() => {
    if (!data.nodes.length || !data.links.length) return null;

    const idToIdx = new Map(data.nodes.map((n, i) => [n.id, i]));
    const nodes = data.nodes.map(n => ({ ...n, _idx: idToIdx.get(n.id)! }));
    const links = data.links
      .filter(l => idToIdx.has(l.source) && idToIdx.has(l.target))
      .map(l => ({
        source: idToIdx.get(l.source)!,
        target: idToIdx.get(l.target)!,
        value: l.value,
      }));

    if (!links.length) return null;

    const generator = sankey<{ id: string; name: string; column: number; value: number; _idx: number }, {}>()
      .nodeId((d) => (d as unknown as { _idx: number })._idx)
      .nodeAlign((node) => (node as unknown as { column: number }).column)
      .nodeSort(null)
      .nodeWidth(16)
      .nodePadding(12)
      .iterations(32)
      .extent([[MARGIN.left, MARGIN.top], [WIDTH - MARGIN.right, HEIGHT - MARGIN.bottom]]);

    try {
      return generator({
        nodes: nodes.map(n => ({ ...n })),
        links: links.map(l => ({ ...l })),
      });
    } catch {
      return null;
    }
  }, [data]);

  // Extract bar chart data from Sankey nodes
  const barData = useMemo(() => {
    const byCol = [0, 1, 2].map(col =>
      data.nodes
        .filter(n => n.column === col && !n.name.startsWith('Other'))
        .sort((a, b) => b.value - a.value)
    );
    return byCol;
  }, [data]);

  // Treemap data from middle column
  const treemapItems = useMemo(() => {
    const subsectorColors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#6d28d9', '#5b21b6', '#ddd6fe', '#ede9fe'];
    return data.nodes
      .filter(n => n.column === 1)
      .sort((a, b) => b.value - a.value)
      .map((n, i) => ({ name: n.name, value: n.value, color: subsectorColors[i % subsectorColors.length] }));
  }, [data]);

  const header = (
    <div className="sankey-header">
      <button className="sankey-back" onClick={onBack}>← Back to clusters</button>
      <div>
        <h3>{clusterLabel} — Cluster Composition</h3>
        <p className="sankey-subtitle">Research activity, industry sectors, and market focus co-located in this cluster</p>
      </div>
    </div>
  );

  if (!layout || !layout.nodes.length) {
    return (
      <div className="sankey-container">
        {header}
        <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
          No composition data available for this cluster
        </div>
      </div>
    );
  }

  const hoveredLinks = new Set<number>();
  const hoveredNodes = new Set<string>();
  if (hoveredNode) {
    hoveredNodes.add(hoveredNode);
    layout.links.forEach((link, i) => {
      const src = (link.source as SNode);
      const tgt = (link.target as SNode);
      if (src.id === hoveredNode || tgt.id === hoveredNode) {
        hoveredLinks.add(i);
        hoveredNodes.add(src.id);
        hoveredNodes.add(tgt.id);
      }
    });
  }

  const linkPath = sankeyLinkHorizontal();

  return (
    <div className="sankey-container">
      {header}

      {/* Sankey Diagram */}
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="sankey-svg">
        {COLUMN_HEADERS.map((hdr, col) => {
          const xPositions = [MARGIN.left, WIDTH / 2, WIDTH - MARGIN.right];
          return (
            <text
              key={col}
              x={xPositions[col] + (col === 2 ? -8 : 8)}
              y={20}
              textAnchor={col === 0 ? 'start' : col === 2 ? 'end' : 'middle'}
              className="sankey-column-header"
            >
              {hdr}
            </text>
          );
        })}
        {layout.links.map((link, i) => {
          const isHighlighted = hoveredNode ? hoveredLinks.has(i) : true;
          return (
            <path
              key={i}
              d={linkPath(link as never) || ''}
              className="sankey-link"
              style={{
                fill: 'none',
                stroke: COLUMN_COLORS[(link.source as SNode).column],
                strokeWidth: Math.max((link as unknown as { width: number }).width, 1),
                strokeOpacity: isHighlighted ? 0.35 : 0.05,
              }}
            />
          );
        })}
        {layout.nodes.map((node) => {
          const n = node as SNode;
          const isHighlighted = hoveredNode ? hoveredNodes.has(n.id) : true;
          const x0 = n.x0 ?? 0;
          const x1 = n.x1 ?? 0;
          const y0 = n.y0 ?? 0;
          const y1 = n.y1 ?? 0;
          const col = n.column;
          const color = COLUMN_COLORS[col];
          return (
            <g key={n.id} onMouseEnter={() => setHoveredNode(n.id)} onMouseLeave={() => setHoveredNode(null)} style={{ cursor: 'pointer' }}>
              <rect x={x0} y={y0} width={x1 - x0} height={Math.max(y1 - y0, 2)} fill={color} opacity={isHighlighted ? 0.85 : 0.2} rx={2} />
              <text x={col === 2 ? x1 + 6 : x0 - 6} y={(y0 + y1) / 2} dy="0.35em" textAnchor={col === 2 ? 'start' : 'end'} className="sankey-label" style={{ opacity: isHighlighted ? 1 : 0.3 }}>
                {n.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Three Bar Charts */}
      <div className="comp-bar-row-container">
        <BarChart title="Research Strengths" items={barData[0]} color={COLUMN_COLORS[0]} />
        <BarChart title="Industry Sectors" items={barData[1]} color={COLUMN_COLORS[1]} />
        <BarChart title="Market Focus" items={barData[2]} color={COLUMN_COLORS[2]} />
      </div>

      {/* Radar + Treemap */}
      <div className="comp-bottom-row">
        {summary && <RadarChart summary={summary} />}
        {treemapItems.length > 0 && <SectorTreemap items={treemapItems} />}
      </div>
    </div>
  );
}
