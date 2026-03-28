import { useState } from 'react';
import { TopicChart } from './TopicChart';
import type { TopicCount } from '../../hooks/useApi';
import './AnalyticsPanel.css';

interface Props {
  topics: TopicCount[] | null;
  selectedTopic: string | null;
  onSelectTopic: (topic: string | null) => void;
  onClose: () => void;
}

export function AnalyticsPanel({ topics, selectedTopic, onSelectTopic, onClose }: Props) {
  const [showAll, setShowAll] = useState(false);

  if (!topics) return null;

  return (
    <div className="analytics-panel">
      <div className="analytics-header">
        <h3>Research Topics</h3>
        <button className="analytics-close" onClick={onClose}>&times;</button>
      </div>
      <p className="analytics-subtitle">
        {topics.length} topics across grants
        {selectedTopic && (
          <>
            {' '}&middot;{' '}
            <button className="analytics-clear-filter" onClick={() => onSelectTopic(null)}>
              Clear filter
            </button>
          </>
        )}
      </p>
      <div className="analytics-chart-container">
        <TopicChart
          topics={topics}
          selectedTopic={selectedTopic}
          onSelectTopic={onSelectTopic}
          showAll={showAll}
        />
      </div>
      {topics.length > 20 && (
        <button className="analytics-toggle" onClick={() => setShowAll(s => !s)}>
          {showAll ? 'Show top 20' : `Show all ${topics.length}`}
        </button>
      )}
    </div>
  );
}
