import { useMemo } from 'react';
import { Polyline, Tooltip } from 'react-leaflet';
import type { GrantEdge } from '../../../types/api';

interface Props {
  edges: GrantEdge[];
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

export function GrantCollaborationLayer({ edges, coordsLookup }: Props) {
  const maxShared = useMemo(
    () => Math.max(...edges.map(e => e.shared_grants), 1),
    [edges]
  );

  return (
    <>
      {edges.map((edge, i) => {
        const coordsA = resolveCoords(edge.org_a_name, coordsLookup);
        const coordsB = resolveCoords(edge.org_b_name, coordsLookup);
        if (!coordsA || !coordsB) return null;

        const weight = 1 + (edge.shared_grants / maxShared) * 4;

        return (
          <Polyline
            key={`${edge.org_a_id}-${edge.org_b_id}-${i}`}
            positions={[coordsA, coordsB]}
            pathOptions={{
              color: '#06b6d4',
              weight,
              opacity: 0.3,
              dashArray: edge.same_cluster ? undefined : '6 4',
            }}
          >
            <Tooltip sticky className="boundary-tooltip">
              <strong>{edge.org_a_name}</strong>
              <br />
              &harr; <strong>{edge.org_b_name}</strong>
              <br />
              {edge.shared_grants} shared grants
            </Tooltip>
          </Polyline>
        );
      })}
    </>
  );
}
