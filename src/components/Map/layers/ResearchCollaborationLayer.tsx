import { useMemo } from 'react';
import { Polyline, Tooltip } from 'react-leaflet';
import type { ResearchEdge } from '../../../types/api';

interface Props {
  edges: ResearchEdge[];
  coordsLookup: Map<string, [number, number]>;
}

function normalizeName(name: string): string {
  let s = name.toUpperCase().trim();
  for (const suffix of [' LIMITED', ' LTD', ' LTD.', ' PLC', ' INC', ' INC.', ' GMBH', ' LLC']) {
    if (s.endsWith(suffix)) s = s.slice(0, -suffix.length);
  }
  s = s.replace(/\s*\(.*?\)\s*/g, ' ');
  if (s.startsWith('THE ')) s = s.slice(4);
  return s.replace(/\s+/g, ' ').trim();
}

function resolveCoords(name: string, lookup: Map<string, [number, number]>): [number, number] | null {
  return lookup.get(name) || lookup.get(name.toUpperCase()) || lookup.get(normalizeName(name)) || null;
}

export function ResearchCollaborationLayer({ edges, coordsLookup }: Props) {
  const maxShared = useMemo(
    () => Math.max(...edges.map(e => e.shared_publications), 1),
    [edges]
  );

  return (
    <>
      {edges.map((edge, i) => {
        const coordsA = resolveCoords(edge.inst_a, coordsLookup);
        const coordsB = resolveCoords(edge.inst_b, coordsLookup);
        if (!coordsA || !coordsB) return null;

        const weight = 1 + (edge.shared_publications / maxShared) * 4;

        return (
          <Polyline
            key={`${edge.inst_a}-${edge.inst_b}-${i}`}
            positions={[coordsA, coordsB]}
            pathOptions={{
              color: '#a855f7',
              weight,
              opacity: 0.4,
            }}
          >
            <Tooltip sticky className="boundary-tooltip">
              <strong>{edge.inst_a}</strong>
              <br />
              &harr; <strong>{edge.inst_b}</strong>
              <br />
              {edge.shared_publications} shared publications
            </Tooltip>
          </Polyline>
        );
      })}
    </>
  );
}
