import { useMemo } from 'react';
import { Polyline, Tooltip } from 'react-leaflet';
import type { Collaboration } from '../../../types/api';

interface Props {
  collaborations: Collaboration[];
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

export function CompanyCollaborationLayer({ collaborations, coordsLookup }: Props) {
  const maxShared = useMemo(
    () => Math.max(...collaborations.map(c => c.shared_grants), 1),
    [collaborations]
  );

  return (
    <>
      {collaborations.map((c, i) => {
        const coordsA = resolveCoords(c.company, coordsLookup);
        const coordsB = resolveCoords(c.collaborator, coordsLookup);
        if (!coordsA || !coordsB) return null;

        const weight = 1 + (c.shared_grants / maxShared) * 4;

        return (
          <Polyline
            key={`${c.company}-${c.collaborator}-${i}`}
            positions={[coordsA, coordsB]}
            pathOptions={{
              color: c.collaborator_is_company ? '#f59e0b' : '#10b981',
              weight,
              opacity: 0.35,
              dashArray: c.collaborator_is_company ? '8 4' : undefined,
            }}
          >
            <Tooltip sticky className="boundary-tooltip">
              <strong>{c.company}</strong>
              <br />
              &harr; <strong>{c.collaborator}</strong>
              <br />
              {c.shared_grants} shared grants
              {c.collaborator_is_company ? ' (company)' : ' (institution)'}
            </Tooltip>
          </Polyline>
        );
      })}
    </>
  );
}
