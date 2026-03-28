import { useMemo } from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import type { Grant } from '../../../types/api';

const MIN_RADIUS = 3;
const MAX_RADIUS = 12;

interface Props {
  grants: Grant[];
  onSelect: (grant: Grant) => void;
}

const FUNDER_COLORS: Record<string, string> = {
  'EPSRC': '#dc2626',
  'Innovate UK': '#ea580c',
  'UKRI FLF': '#ca8a04',
  'STFC': '#0284c7',
  'BBSRC': '#16a34a',
  'NERC': '#059669',
  'AHRC': '#9333ea',
  'MRC': '#db2777',
};

function funderColor(funder: string): string {
  for (const [key, color] of Object.entries(FUNDER_COLORS)) {
    if (funder.includes(key)) return color;
  }
  return '#6b7280';
}

function formatGBP(amount: number | null): string {
  if (!amount) return '';
  if (amount >= 1_000_000) return `£${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `£${(amount / 1_000).toFixed(0)}K`;
  return `£${amount.toFixed(0)}`;
}

export function GrantLayer({ grants, onSelect }: Props) {
  const maxFunding = useMemo(
    () => Math.max(...grants.map(g => g.funding_gbp || 0), 1),
    [grants]
  );

  return (
    <>
      {grants.map((g) => {
        if (g.lat == null || g.lng == null) return null;
        const color = funderColor(g.lead_funder);
        const radius = MIN_RADIUS + Math.sqrt((g.funding_gbp || 0) / maxFunding) * (MAX_RADIUS - MIN_RADIUS);

        return (
          <CircleMarker
            key={g.id}
            center={[g.lat, g.lng]}
            radius={radius}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.6,
              weight: 1,
            }}
            eventHandlers={{ click: () => onSelect(g) }}
          >
            <Tooltip sticky className="boundary-tooltip">
              <strong>{g.title.slice(0, 80)}{g.title.length > 80 ? '...' : ''}</strong>
              <br />
              {g.lead_funder} · {formatGBP(g.funding_gbp)}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
