import { DashboardTable } from './DashboardTable';
import type { Column } from './DashboardTable';
import type { Company } from '../../types/api';

interface Props {
  companies: Company[] | null;
  onSelect: (company: Company) => void;
}

const COLUMNS: Column[] = [
  { key: 'name', label: 'Name', format: 'text', width: '220px' },
  { key: 'employees', label: 'Employees', format: 'number' },
  { key: 'funding_usd_m', label: 'Funding ($M)', format: 'usd' },
  { key: 'total_grant_funding_gbp', label: 'Grant Funding', format: 'gbp' },
  { key: 'patent_count', label: 'Patents', format: 'number' },
  { key: 'grant_count', label: 'Grants', format: 'number' },
  { key: 'emp_growth_pct', label: 'Growth %', format: 'pct' },
];

export function CompaniesTab({ companies, onSelect }: Props) {
  if (!companies) return <div className="dash-empty">Enable Companies layer to see rankings</div>;

  const data = companies.map(c => ({ ...c } as Record<string, unknown>));

  return (
    <DashboardTable
      columns={COLUMNS}
      data={data}
      defaultSortKey="employees"
      onRowClick={(row) => onSelect(row as unknown as Company)}
      searchField="name"
      searchPlaceholder="Search companies..."
    />
  );
}
