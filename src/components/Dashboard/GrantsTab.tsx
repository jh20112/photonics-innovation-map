import { DashboardTable } from './DashboardTable';
import type { Column } from './DashboardTable';
import type { Grant } from '../../types/api';

interface Props {
  grants: Grant[] | null;
  onSelect: (grant: Grant) => void;
}

const COLUMNS: Column[] = [
  { key: 'title', label: 'Title', format: 'text', width: '260px' },
  { key: 'lead_org', label: 'Lead Org', format: 'text', width: '160px' },
  { key: 'lead_funder', label: 'Funder', format: 'text' },
  { key: 'funding_gbp', label: 'Funding (£)', format: 'gbp' },
  { key: 'status', label: 'Status', format: 'text' },
  { key: 'start_date', label: 'Start', format: 'text' },
];

export function GrantsTab({ grants, onSelect }: Props) {
  if (!grants) return <div className="dash-empty">Enable Grants layer to see rankings</div>;

  const data = grants.map(g => ({ ...g } as Record<string, unknown>));

  return (
    <DashboardTable
      columns={COLUMNS}
      data={data}
      defaultSortKey="funding_gbp"
      onRowClick={(row) => onSelect(row as unknown as Grant)}
      searchField="title"
      searchPlaceholder="Search grants..."
    />
  );
}
