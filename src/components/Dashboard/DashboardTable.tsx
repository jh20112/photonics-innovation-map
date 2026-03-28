import { useState, useMemo } from 'react';

export interface Column {
  key: string;
  label: string;
  format?: 'number' | 'gbp' | 'usd' | 'pct' | 'text';
  width?: string;
}

interface Props {
  columns: Column[];
  data: Record<string, unknown>[];
  defaultSortKey: string;
  defaultSortDir?: 'asc' | 'desc';
  onRowClick?: (row: Record<string, unknown>) => void;
  searchField?: string;
  searchPlaceholder?: string;
}

function formatCell(value: unknown, format?: string): string {
  if (value == null || value === '') return '—';
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  if (format === 'text' || isNaN(n)) return String(value);

  switch (format) {
    case 'gbp':
      if (n >= 1e9) return `£${(n / 1e9).toFixed(1)}B`;
      if (n >= 1e6) return `£${(n / 1e6).toFixed(1)}M`;
      if (n >= 1e3) return `£${(n / 1e3).toFixed(0)}K`;
      return `£${n.toFixed(0)}`;
    case 'usd':
      if (n >= 1000) return `$${n.toFixed(0)}M`;
      if (n > 0) return `$${n.toFixed(1)}M`;
      return '—';
    case 'pct':
      if (n > 0) return `+${n.toFixed(0)}%`;
      return `${n.toFixed(0)}%`;
    case 'number':
      return n.toLocaleString();
    default:
      if (Number.isInteger(n)) return n.toLocaleString();
      return n.toFixed(1);
  }
}

export function DashboardTable({
  columns, data, defaultSortKey, defaultSortDir = 'desc',
  onRowClick, searchField, searchPlaceholder,
}: Props) {
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDir);
  const [search, setSearch] = useState('');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    if (!search || !searchField) return data;
    const q = search.toLowerCase();
    return data.filter(row => String(row[searchField] ?? '').toLowerCase().includes(q));
  }, [data, search, searchField]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const an = typeof av === 'number' ? av : parseFloat(String(av ?? '0')) || 0;
      const bn = typeof bv === 'number' ? bv : parseFloat(String(bv ?? '0')) || 0;
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? an - bn : bn - an;
    });
  }, [filtered, sortKey, sortDir]);

  return (
    <div className="dash-table-wrap">
      {searchField && (
        <input
          className="dash-search"
          type="text"
          placeholder={searchPlaceholder || 'Search...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      )}
      <div className="dash-table-scroll">
        <table className="dash-table">
          <thead>
            <tr>
              <th className="dash-th rank-col">#</th>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`dash-th ${sortKey === col.key ? 'sorted' : ''}`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="sort-arrow">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={i}
                className={`dash-row ${onRowClick ? 'clickable' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                <td className="dash-td rank-col">{i + 1}</td>
                {columns.map(col => (
                  <td key={col.key} className="dash-td">
                    {formatCell(row[col.key], col.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="dash-empty">No data matches the current filters</div>
        )}
      </div>
      <div className="dash-count">{sorted.length} of {data.length} rows</div>
    </div>
  );
}
