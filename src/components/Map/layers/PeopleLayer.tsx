import { CircleMarker, Tooltip } from 'react-leaflet';
import type { Person } from '../../../types/api';

interface Props {
  people: Person[];
  onSelect: (person: Person) => void;
}

const PI_COLOR = '#f97316';
const PI_BORDER = '#ea580c';
const DIRECTOR_COLOR = '#06b6d4';
const DIRECTOR_BORDER = '#0891b2';

function roleLabel(role: string): string {
  switch (role) {
    case 'principal_investigator': return 'PI';
    case 'director': return 'Director';
    default: return role;
  }
}

export function PeopleLayer({ people, onSelect }: Props) {
  return (
    <>
      {people.map((p) => {
        if (p.lat == null || p.lng == null) return null;
        const isPI = p.role === 'principal_investigator';

        return (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={5}
            pathOptions={{
              color: isPI ? PI_BORDER : DIRECTOR_BORDER,
              fillColor: isPI ? PI_COLOR : DIRECTOR_COLOR,
              fillOpacity: 0.8,
              weight: 1.5,
            }}
            eventHandlers={{ click: () => onSelect(p) }}
          >
            <Tooltip sticky className="boundary-tooltip">
              <strong>{p.name}</strong>
              <span> · {roleLabel(p.role)}</span>
              <br />
              <span>{p.current_org}</span>
              {p.grant_count > 0 && <span> · {p.grant_count} grants</span>}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
