import { useMemo } from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import type { Institution } from '../../../types/api';

interface Props {
  institutions: Institution[];
  onSelect: (institution: Institution) => void;
  periodYears?: number | null;
}

const MIN_RADIUS = 4;
const MAX_RADIUS = 18;

function getWorksForPeriod(inst: Institution, periodYears: number | null): number {
  if (!periodYears || !inst.publications_by_year) {
    return inst.photonics_works ?? 0;
  }
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - periodYears;
  let total = 0;
  for (const [yearStr, count] of Object.entries(inst.publications_by_year)) {
    if (parseInt(yearStr, 10) > startYear) {
      total += count;
    }
  }
  return total;
}

export function InstitutionLayer({ institutions, onSelect, periodYears }: Props) {
  const worksMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const inst of institutions) {
      map.set(inst.id, getWorksForPeriod(inst, periodYears ?? null));
    }
    return map;
  }, [institutions, periodYears]);

  const maxWorks = useMemo(
    () => Math.max(...Array.from(worksMap.values()), 1),
    [worksMap]
  );

  return (
    <>
      {institutions.map((inst) => {
        const works = worksMap.get(inst.id) ?? 0;
        const ratio = Math.sqrt(works / maxWorks);
        const radius = MIN_RADIUS + ratio * (MAX_RADIUS - MIN_RADIUS);

        const periodLabel = periodYears ? ` (last ${periodYears}yr)` : '';

        return (
          <CircleMarker
            key={inst.id}
            center={[inst.lat, inst.lng]}
            radius={radius}
            pathOptions={{
              color: '#059669',
              fillColor: '#10b981',
              fillOpacity: 0.5,
              weight: 1,
            }}
            eventHandlers={{ click: () => onSelect(inst) }}
          >
            <Tooltip sticky className="boundary-tooltip">
              <strong>{inst.name}</strong>
              <br />
              {works.toLocaleString()} publications{periodLabel}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
