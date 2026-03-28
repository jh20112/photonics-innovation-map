import { CircleMarker, Tooltip } from 'react-leaflet';
import type { Institution } from '../../../types/api';

interface Props {
  institutions: Institution[];
  onSelect: (institution: Institution) => void;
}

const MIN_RADIUS = 4;
const MAX_RADIUS = 18;

export function InstitutionLayer({ institutions, onSelect }: Props) {
  const maxWorks = Math.max(...institutions.map((i) => i.photonics_works ?? 0), 1);

  return (
    <>
      {institutions.map((inst) => {
        const works = inst.photonics_works ?? 0;
        const ratio = Math.sqrt(works / maxWorks);
        const radius = MIN_RADIUS + ratio * (MAX_RADIUS - MIN_RADIUS);

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
              {works.toLocaleString()} publications
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
