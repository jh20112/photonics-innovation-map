import { useCallback } from 'react';
import './YearRangeSlider.css';

interface Props {
  range: [number, number] | null;
  onChange: (range: [number, number] | null) => void;
  min?: number;
  max?: number;
}

export function YearRangeSlider({ range, onChange, min = 2000, max = 2025 }: Props) {
  const low = range ? range[0] : min;
  const high = range ? range[1] : max;

  const handleLow = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), high);
    onChange([val, high]);
  }, [high, onChange]);

  const handleHigh = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), low);
    onChange([low, val]);
  }, [low, onChange]);

  const pctLow = ((low - min) / (max - min)) * 100;
  const pctHigh = ((high - min) / (max - min)) * 100;

  return (
    <div className="year-range-slider">
      <div className="year-range-header">
        <span className="year-range-label">
          {range ? `${low} – ${high}` : 'All years'}
        </span>
        {range && (
          <button className="year-range-clear" onClick={() => onChange(null)}>
            Clear
          </button>
        )}
      </div>
      <div className="year-range-track-container">
        <div
          className="year-range-active-track"
          style={{ left: `${pctLow}%`, width: `${pctHigh - pctLow}%` }}
        />
        <input
          type="range"
          className="year-range-input year-range-low"
          min={min}
          max={max}
          value={low}
          onChange={handleLow}
        />
        <input
          type="range"
          className="year-range-input year-range-high"
          min={min}
          max={max}
          value={high}
          onChange={handleHigh}
        />
      </div>
      <div className="year-range-labels">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
