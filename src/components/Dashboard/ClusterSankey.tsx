import { useMemo, useState } from 'react';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import type { SankeyNode as D3SankeyNode } from 'd3-sankey';
import type { ClusterSankeyData } from '../../types/api';

interface Props {
  data: ClusterSankeyData;
  clusterLabel: string;
  onBack: () => void;
}

const COLUMN_COLORS = ['#3b82f6', '#8b5cf6', '#14b8a6']; // blue, purple, teal
const COLUMN_HEADERS = ['Research Topics', 'Photonics Subsectors', 'End Markets'];

const WIDTH = 900;
const HEIGHT = 500;
const MARGIN = { top: 40, right: 180, bottom: 20, left: 180 };

type SNode = D3SankeyNode<{ id: string; name: string; column: number; value: number }, {}>;

export function ClusterSankey({ data, clusterLabel, onBack }: Props) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const layout = useMemo(() => {
    if (!data.nodes.length || !data.links.length) return null;

    // Map node id → index for link resolution
    const idToIdx = new Map(data.nodes.map((n, i) => [n.id, i]));

    // Build nodes and links with numeric indices
    const nodes = data.nodes.map(n => ({ ...n, _idx: idToIdx.get(n.id)! }));
    const links = data.links
      .filter(l => idToIdx.has(l.source) && idToIdx.has(l.target))
      .map(l => ({
        source: idToIdx.get(l.source)!,
        target: idToIdx.get(l.target)!,
        value: l.value,
      }));

    if (!links.length) return null;

    // d3-sankey nodeAlign: map column (0,1,2) to depth
    const generator = sankey<{ id: string; name: string; column: number; value: number; _idx: number }, {}>()
      .nodeId((d) => (d as unknown as { _idx: number })._idx)
      .nodeAlign((node) => {
        const col = (node as unknown as { column: number }).column;
        return col; // 0, 1, 2
      })
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

  if (!layout || !layout.nodes.length) {
    return (
      <div className="sankey-container">
        <div className="sankey-header">
          <button className="sankey-back" onClick={onBack}>← Back to clusters</button>
          <h3>{clusterLabel}</h3>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
          No specialization data available for this cluster
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
      <div className="sankey-header">
        <button className="sankey-back" onClick={onBack}>← Back to clusters</button>
        <h3>{clusterLabel} — Specialization Flow</h3>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="sankey-svg">
        {/* Column headers */}
        {COLUMN_HEADERS.map((header, col) => {
          const xPositions = [MARGIN.left, WIDTH / 2, WIDTH - MARGIN.right];
          return (
            <text
              key={col}
              x={xPositions[col] + (col === 2 ? -8 : 8)}
              y={20}
              textAnchor={col === 0 ? 'start' : col === 2 ? 'end' : 'middle'}
              className="sankey-column-header"
            >
              {header}
            </text>
          );
        })}

        {/* Links */}
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

        {/* Nodes */}
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
            <g
              key={n.id}
              onMouseEnter={() => setHoveredNode(n.id)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={x0}
                y={y0}
                width={x1 - x0}
                height={Math.max(y1 - y0, 2)}
                fill={color}
                opacity={isHighlighted ? 0.85 : 0.2}
                rx={2}
              />
              <text
                x={col === 2 ? x1 + 6 : x0 - 6}
                y={(y0 + y1) / 2}
                dy="0.35em"
                textAnchor={col === 2 ? 'start' : 'end'}
                className="sankey-label"
                style={{ opacity: isHighlighted ? 1 : 0.3 }}
              >
                {n.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
