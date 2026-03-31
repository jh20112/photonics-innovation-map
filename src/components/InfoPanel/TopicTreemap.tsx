interface TopicItem {
  topic: string;
  count: number;
}

interface Props {
  topics: TopicItem[];
  totalPublications?: number;
}

const COLOURS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316',
  '#84cc16', '#a855f7', '#0ea5e9', '#22d3ee', '#f472b6',
];

export function TopicTreemap({ topics, totalPublications }: Props) {
  if (!topics || topics.length === 0) return null;

  const visibleTotal = topics.reduce((sum, t) => sum + t.count, 0);
  const grandTotal = totalPublications || visibleTotal;
  const otherCount = grandTotal - visibleTotal;

  return (
    <div className="treemap">
      {topics.map((t, i) => {
        const pct = (t.count / grandTotal) * 100;
        const flexGrow = Math.max(t.count, grandTotal * 0.02);
        const isLarge = pct > 15;
        const isMedium = pct > 5;

        return (
          <div
            key={i}
            className={`treemap-block ${isLarge ? 'large' : isMedium ? 'medium' : 'small'}`}
            style={{
              flexGrow,
              flexBasis: isLarge ? '100%' : isMedium ? '40%' : '20%',
              backgroundColor: COLOURS[i % COLOURS.length],
            }}
            title={`${t.topic}: ${t.count} publications (${pct.toFixed(1)}%)`}
          >
            <span className="treemap-label">{t.topic}</span>
            <span className="treemap-count">{t.count}</span>
          </div>
        );
      })}
      {otherCount > 0 && (
        <div
          className="treemap-block small"
          style={{
            flexGrow: Math.max(otherCount, grandTotal * 0.02),
            flexBasis: '20%',
            backgroundColor: '#94a3b8',
          }}
          title={`Other topics: ${otherCount} publications (${(otherCount / grandTotal * 100).toFixed(1)}%)`}
        >
          <span className="treemap-label">Other</span>
          <span className="treemap-count">{otherCount}</span>
        </div>
      )}
    </div>
  );
}
