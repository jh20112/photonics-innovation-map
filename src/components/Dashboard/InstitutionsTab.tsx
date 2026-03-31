import { DashboardTable } from './DashboardTable';
import type { Column } from './DashboardTable';
import type { Institution } from '../../types/api';

interface Props {
  institutions: Institution[] | null;
  onSelect: (inst: Institution) => void;
}

const COLUMNS: Column[] = [
  { key: 'name', label: 'Name', format: 'text', width: '220px' },
  { key: 'photonics_works', label: 'Publications', format: 'number' },
  { key: 'total_citations', label: 'Citations', format: 'number' },
  { key: 'avg_fwci', label: 'FWCI' },
  { key: 'pct_top10_cited', label: '% Top 10%', format: 'pct' },
  { key: 'citations_per_paper', label: 'Cites/Paper' },
  { key: 'n_grants', label: 'Grants', format: 'number' },
];

export function InstitutionsTab({ institutions, onSelect }: Props) {
  if (!institutions) return <div className="dash-empty">Enable Institutions layer to see rankings</div>;

  const data = institutions.map(i => ({ ...i } as Record<string, unknown>));

  return (
    <DashboardTable
      columns={COLUMNS}
      data={data}
      defaultSortKey="photonics_works"
      onRowClick={(row) => onSelect(row as unknown as Institution)}
      searchField="name"
      searchPlaceholder="Search institutions..."
    />
  );
}
