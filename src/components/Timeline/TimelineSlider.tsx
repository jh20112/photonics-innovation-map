import { useEffect, useRef } from 'react';
import './TimelineSlider.css';

const MIN_YEAR = 2000;
const MAX_YEAR = 2025;

interface Props {
  year: number;
  onChange: (year: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export function TimelineSlider({ year, onChange, isPlaying, onTogglePlay }: Props) {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const yearRef = useRef(year);
  yearRef.current = year;

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        const next = yearRef.current + 1;
        onChange(next > MAX_YEAR ? MIN_YEAR : next);
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, onChange]);

  const isMax = year === MAX_YEAR;

  return (
    <div className="timeline-bar">
      <button
        className="timeline-play-btn"
        onClick={onTogglePlay}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '\u23F8' : '\u25B6'}
      </button>

      <span className="timeline-year-label">
        Up to <strong>{year}</strong>
      </span>

      <div className="timeline-slider-track">
        <input
          type="range"
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={year}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>

      {!isMax && (
        <button
          className="timeline-reset-btn"
          onClick={() => onChange(MAX_YEAR)}
          title="Show all years"
        >
          All
        </button>
      )}
    </div>
  );
}
