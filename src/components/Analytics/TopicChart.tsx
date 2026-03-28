import type { TopicCount } from '../../hooks/useApi';

interface Props {
  topics: TopicCount[];
  selectedTopic: string | null;
  onSelectTopic: (topic: string | null) => void;
  showAll?: boolean;
}

const BAR_HEIGHT = 22;
const GAP = 3;
const LABEL_WIDTH = 180;
const COUNT_WIDTH = 40;

export function TopicChart({ topics, selectedTopic, onSelectTopic, showAll = false }: Props) {
  const visible = showAll ? topics : topics.slice(0, 20);
  const maxCount = visible.length > 0 ? visible[0].count : 1;
  const chartWidth = 300;
  const barAreaWidth = chartWidth - LABEL_WIDTH - COUNT_WIDTH;

  return (
    <svg
      width={chartWidth}
      viewBox={`0 0 ${chartWidth} ${visible.length * (BAR_HEIGHT + GAP)}`}
      style={{ display: 'block', width: '100%' }}
    >
      {visible.map((t, i) => {
        const y = i * (BAR_HEIGHT + GAP);
        const barWidth = Math.max(2, (t.count / maxCount) * barAreaWidth);
        const isUnclassified = t.topic.toLowerCase() === 'unclassified';
        const isSelected = selectedTopic === t.topic;
        const fill = isSelected
          ? '#2563eb'
          : isUnclassified
            ? '#9ca3af'
            : '#3b82f6';
        const opacity = selectedTopic && !isSelected ? 0.3 : 1;

        return (
          <g
            key={t.topic}
            style={{ cursor: 'pointer', opacity }}
            onClick={() => onSelectTopic(isSelected ? null : t.topic)}
          >
            <text
              x={LABEL_WIDTH - 6}
              y={y + BAR_HEIGHT / 2}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={10}
              fill="#374151"
            >
              {t.topic.length > 28 ? t.topic.slice(0, 26) + '...' : t.topic}
            </text>
            <rect
              x={LABEL_WIDTH}
              y={y + 2}
              width={barWidth}
              height={BAR_HEIGHT - 4}
              rx={3}
              fill={fill}
            />
            <text
              x={LABEL_WIDTH + barWidth + 4}
              y={y + BAR_HEIGHT / 2}
              dominantBaseline="central"
              fontSize={10}
              fill="#6b7280"
            >
              {t.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
