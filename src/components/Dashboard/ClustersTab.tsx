import { useState } from 'react';
import { DashboardTable } from './DashboardTable';
import type { Column } from './DashboardTable';
import type { ClusterData, ClusterType } from '../../types/api';
import { useClusters } from '../../hooks/useApi';

interface Props {
  onSelectCluster: (clusterId: number, clusterType: ClusterType) => void;
}

const CLUSTER_TYPES: { type: ClusterType; label: string }[] = [
  { type: 'geographic', label: 'DSIT' },
  { type: 'ecipe', label: 'ECIPE' },
  { type: 'composite', label: 'Composite' },
  { type: 'research', label: 'Research' },
];

const BASE_COLUMNS: Column[] = [
  { key: 'label', label: 'Cluster', format: 'text', width: '200px' },
  { key: 'member_count', label: 'Companies', format: 'number' },
  { key: 'total_employees', label: 'Employees', format: 'number' },
  { key: 'total_patents', label: 'Patents', format: 'number' },
  { key: 'total_grants', label: 'Grants', format: 'number' },
  { key: 'total_funding_gbp', label: 'Funding', format: 'gbp' },
];

const EXTRA_COLUMNS: Record<string, Column[]> = {
  composite: [
    { key: 'composite_score', label: 'Score' },
    { key: 'research_score', label: 'Research/100' },
    { key: 'total_publications', label: 'Publications', format: 'number' },
  ],
  research: [
    { key: 'anchor_institution', label: 'Anchor', format: 'text', width: '180px' },
    { key: 'total_publications', label: 'Publications', format: 'number' },
  ],
  ecipe: [
    { key: 'qualifying_funding_usd_m', label: 'VC Funding ($M)', format: 'usd' },
    { key: 'institution_count', label: 'Institutions', format: 'number' },
  ],
  geographic: [],
};

const DEFAULT_SORT: Record<string, string> = {
  composite: 'composite_score',
  research: 'total_publications',
  ecipe: 'qualifying_funding_usd_m',
  geographic: 'member_count',
};

function flattenCluster(cluster: ClusterData['clusters'][0]): Record<string, unknown> {
  return {
    id: cluster.id,
    label: cluster.label,
    member_count: cluster.member_count,
    ...cluster.summary,
  };
}

export function ClustersTab({ onSelectCluster }: Props) {
  const [activeType, setActiveType] = useState<ClusterType>('composite');
  const { data: clusterData } = useClusters(activeType);

  const columns = [...BASE_COLUMNS, ...(EXTRA_COLUMNS[activeType] || [])];
  const data = clusterData?.clusters.map(flattenCluster) ?? [];

  return (
    <div>
      <div className="dash-sub-tabs">
        {CLUSTER_TYPES.map(ct => (
          <button
            key={ct.type}
            className={`dash-sub-tab ${activeType === ct.type ? 'active' : ''}`}
            onClick={() => setActiveType(ct.type)}
          >
            {ct.label}
          </button>
        ))}
      </div>
      {data.length > 0 ? (
        <DashboardTable
          columns={columns}
          data={data}
          defaultSortKey={DEFAULT_SORT[activeType] || 'member_count'}
          onRowClick={(row) => onSelectCluster(row.id as number, activeType)}
          searchField="label"
          searchPlaceholder="Search clusters..."
        />
      ) : (
        <div className="dash-empty">Loading cluster data...</div>
      )}
    </div>
  );
}
