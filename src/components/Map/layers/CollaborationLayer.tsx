import { Polyline, Tooltip } from 'react-leaflet';
import type { Collaboration } from '../../../types/api';

interface Props {
  collaborations: Collaboration[];
  entityCoords: [number, number];
  /** Map of collaborator name -> [lat, lng] */
  coordsLookup: Map<string, [number, number]>;
}

function normalizeName(name: string): string {
  let s = name.toUpperCase().trim();
  for (const suffix of [' LIMITED', ' LTD', ' LTD.', ' PLC', ' INC', ' INC.', ' GMBH', ' LLC']) {
    if (s.endsWith(suffix)) s = s.slice(0, -suffix.length);
  }
  s = s.replace(/\s*\(.*?\)\s*/g, ' ').replace(/^THE /, '').replace(/\s+/g, ' ').trim();
  return s;
}

export function CollaborationLayer({ collaborations, entityCoords, coordsLookup }: Props) {
  return (
    <>
      {collaborations.map((c, i) => {
        const target = coordsLookup.get(c.collaborator)
          ?? coordsLookup.get(c.collaborator.toUpperCase())
          ?? coordsLookup.get(normalizeName(c.collaborator));
        if (!target) return null;

        const maxGrants = Math.max(...collaborations.map((x) => x.shared_grants), 1);
        const weight = 1 + (c.shared_grants / maxGrants) * 4;

        return (
          <Polyline
            key={i}
            positions={[entityCoords, target]}
            pathOptions={{
              color: c.collaborator_is_company ? '#3b82f6' : '#10b981',
              weight,
              opacity: 0.6,
              dashArray: c.collaborator_is_company ? '8 4' : undefined,
            }}
          >
            <Tooltip sticky className="boundary-tooltip">
              <strong>{c.collaborator}</strong>
              <br />
              {c.shared_grants} shared grants · {c.collaborator_roles}
            </Tooltip>
          </Polyline>
        );
      })}
    </>
  );
}
