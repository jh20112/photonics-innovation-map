import { Polygon, Tooltip } from 'react-leaflet';
import type { Cluster } from '../../../types/api';

interface Props {
  clusters: Cluster[];
  onSelectCluster?: (cluster: Cluster) => void;
}

function formatGBP(amount: number): string {
  if (amount >= 1_000_000) return `£${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `£${(amount / 1_000).toFixed(0)}K`;
  if (amount > 0) return `£${amount.toFixed(0)}`;
  return '';
}

export function ClusterLayer({ clusters, onSelectCluster }: Props) {
  return (
    <>
      {clusters.map((cluster) => {
        if (!cluster.boundary || cluster.boundary.length < 3) return null;

        const positions = cluster.boundary.map(
          (p) => [p[0], p[1]] as [number, number]
        );

        return (
          <Polygon
            key={cluster.id}
            positions={positions}
            pathOptions={{
              color: cluster.colour,
              fillColor: cluster.colour,
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '6 3',
            }}
            eventHandlers={{
              click: () => onSelectCluster?.(cluster),
            }}
          >
            <Tooltip sticky className="boundary-tooltip">
              <strong>{cluster.label}</strong>
              <br />
              {cluster.member_count} companies
              {cluster.summary.total_employees > 0 && (
                <> · {cluster.summary.total_employees.toLocaleString()} employees</>
              )}
              {cluster.summary.total_patents > 0 && (
                <> · {cluster.summary.total_patents} patents</>
              )}
              {cluster.summary.total_funding_gbp > 0 && (
                <> · {formatGBP(cluster.summary.total_funding_gbp)} grant funding</>
              )}
              <br />
              <em>{cluster.summary.top_companies.slice(0, 3).join(', ')}</em>
            </Tooltip>
          </Polygon>
        );
      })}
    </>
  );
}
