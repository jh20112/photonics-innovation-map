interface Props {
  value: number | string | null;
  label: string;
  format?: 'number' | 'gbp' | 'usd' | 'plain';
}

function formatValue(value: number | string | null, format: string): string {
  if (value == null) return '—';
  if (typeof value === 'string') return value;
  switch (format) {
    case 'gbp':
      if (value >= 1_000_000_000) return `£${(value / 1e9).toFixed(1)}B`;
      if (value >= 1_000_000) return `£${(value / 1e6).toFixed(1)}M`;
      if (value >= 1_000) return `£${(value / 1_000).toFixed(0)}K`;
      return `£${value.toFixed(0)}`;
    case 'usd':
      if (value >= 1_000) return `$${(value / 1).toFixed(0)}M`;
      if (value > 0) return `$${value.toFixed(1)}M`;
      return '—';
    case 'number':
      return value.toLocaleString();
    default:
      return String(value);
  }
}

export function StatBlock({ value, label, format = 'number' }: Props) {
  if (value == null || value === 0) return null;
  const display = formatValue(value, format);
  if (display === '—') return null;

  return (
    <div className="stat-block">
      <div className="stat-block-value">{display}</div>
      <div className="stat-block-label">{label}</div>
    </div>
  );
}
