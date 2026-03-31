import { useMemo } from 'react';
import type { Company } from '../../types/api';

interface Props {
  companies: Company[];
}

interface FieldCheck {
  label: string;
  check: (c: Company) => boolean;
}

const FIELDS: FieldCheck[] = [
  { label: 'Photonics Score', check: c => c.photonics_score != null },
  { label: 'Website', check: c => !!c.website },
  { label: 'Year Founded', check: c => c.year_founded != null && c.year_founded > 0 },
  { label: 'Grants', check: c => (c.grant_count || 0) > 0 },
  { label: 'Description', check: c => !!c.description },
  { label: 'Employees', check: c => c.employees != null && c.employees > 0 },
  { label: 'Employee Growth', check: c => c.emp_growth_pct != null },
  { label: 'Patents', check: c => (c.patent_count || 0) > 0 },
  { label: 'Funding (USD)', check: c => c.funding_usd_m != null && c.funding_usd_m > 0 },
  { label: 'Revenue (GBP)', check: c => c.revenue_gbp != null && c.revenue_gbp > 0 },
  { label: 'Grant Funding', check: c => c.total_grant_funding_gbp != null && c.total_grant_funding_gbp > 0 },
];

export function DataCompleteness({ companies }: Props) {
  const fieldStats = useMemo(() => {
    const total = companies.length;
    return FIELDS.map(f => {
      const filled = companies.filter(f.check).length;
      return {
        label: f.label,
        filled,
        total,
        pct: total > 0 ? Math.round((filled / total) * 100) : 0,
      };
    }).sort((a, b) => b.pct - a.pct);
  }, [companies]);

  return (
    <div className="data-section">
      <h3 className="data-section-title">Data Completeness</h3>
      <p className="data-section-desc">
        Percentage of {companies.length} companies with each field populated.
      </p>
      <div className="completeness-chart">
        {fieldStats.map((f) => (
          <div key={f.label} className="completeness-row">
            <span className="completeness-label">{f.label}</span>
            <div className="completeness-track">
              <div
                className="completeness-fill"
                style={{ width: `${f.pct}%` }}
              />
              <div
                className="completeness-empty"
                style={{ width: `${100 - f.pct}%` }}
              />
            </div>
            <span className="completeness-value">
              {f.pct}%
              <span className="completeness-count">{f.filled}/{f.total}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
