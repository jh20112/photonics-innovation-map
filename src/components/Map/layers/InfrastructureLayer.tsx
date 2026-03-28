import { CircleMarker, Tooltip } from 'react-leaflet';
import type { Infrastructure } from '../../../types/api';

interface Props {
  facilities: Infrastructure[];
  onSelect: (facility: Infrastructure) => void;
}

export function InfrastructureLayer({ facilities, onSelect }: Props) {
  return (
    <>
      {facilities.map((f) => (
        <CircleMarker
          key={f.id}
          center={[f.lat, f.lng]}
          radius={7}
          pathOptions={{
            color: f.classification === 'Core Photonics' ? '#7c3aed' : '#a78bfa',
            fillColor: f.classification === 'Core Photonics' ? '#8b5cf6' : '#c4b5fd',
            fillOpacity: 0.8,
            weight: 1.5,
          }}
          eventHandlers={{ click: () => onSelect(f) }}
        >
          <Tooltip sticky className="boundary-tooltip">
            <strong>{f.name}</strong>
            <br />
            {f.host_org}
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
}
