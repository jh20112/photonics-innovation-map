import { CircleMarker, Tooltip } from 'react-leaflet';
import type { Patent } from '../../../types/api';

interface Props {
  patents: Patent[];
  onSelect: (patent: Patent) => void;
}

export function PatentLayer({ patents, onSelect }: Props) {
  return (
    <>
      {patents.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={3}
          pathOptions={{
            color: '#b45309',
            fillColor: '#f59e0b',
            fillOpacity: 0.6,
            weight: 1,
          }}
          eventHandlers={{ click: () => onSelect(p) }}
        >
          <Tooltip sticky className="boundary-tooltip">
            <strong>{p.publication_number}</strong>
            <br />
            {p.assignee}
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
}
