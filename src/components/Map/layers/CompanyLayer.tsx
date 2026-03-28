import { useMemo } from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import type { Company, ClusterAssignment, CompanySizeMetric } from '../../../types/api';

const MIN_RADIUS = 4;
const MAX_RADIUS = 14;

interface Props {
  companies: Company[];
  onSelect: (company: Company) => void;
  clusterAssignments?: ClusterAssignment[];
  clusterColours?: Map<number, string>;
  sizeMetric?: CompanySizeMetric;
  growthPeriodMonths?: number | null;
}

const DEFAULT_COLOR = '#3b82f6';
const DEFAULT_BORDER = '#1d4ed8';
const NOISE_COLOR = '#9ca3af';
const NOISE_BORDER = '#6b7280';
const NO_DATA_COLOR = '#d1d5db';

/**
 * Compute growth % from timeseries for a given lookback period.
 * Returns null if insufficient data.
 */
function computeGrowthForPeriod(
  timeseries: { date: string; count: number }[] | null,
  months: number | null,
): number | null {
  if (!timeseries || timeseries.length < 2) return null;

  const latest = timeseries[timeseries.length - 1];

  if (months === null) {
    // All time: first vs last
    const earliest = timeseries[0];
    if (earliest.count === 0) return null;
    return ((latest.count - earliest.count) / earliest.count) * 100;
  }

  // Find the data point closest to N months ago
  const now = new Date(latest.date + '-01');
  const targetDate = new Date(now);
  targetDate.setMonth(targetDate.getMonth() - months);
  const targetStr = targetDate.toISOString().slice(0, 7); // YYYY-MM

  // Find closest point at or before target date
  let closest = timeseries[0];
  for (const point of timeseries) {
    if (point.date <= targetStr) {
      closest = point;
    } else {
      break;
    }
  }

  // If the closest point is the same as latest (no earlier data), return null
  if (closest.date === latest.date) return null;
  if (closest.count === 0) return null;

  return ((latest.count - closest.count) / closest.count) * 100;
}

function growthColor(pct: number | null): { fill: string; border: string } {
  if (pct == null) return { fill: NO_DATA_COLOR, border: '#9ca3af' };
  if (pct > 100) return { fill: '#059669', border: '#047857' };
  if (pct > 50) return { fill: '#10b981', border: '#059669' };
  if (pct > 10) return { fill: '#34d399', border: '#10b981' };
  if (pct >= 0) return { fill: '#6ee7b7', border: '#34d399' };
  if (pct > -20) return { fill: '#fca5a5', border: '#f87171' };
  return { fill: '#ef4444', border: '#dc2626' };
}

function growthLabel(pct: number | null, months: number | null): string {
  if (pct == null) return ' · no data';
  const period = months ? ` (${months}mo)` : '';
  if (pct > 0) return ` · +${pct.toFixed(0)}%${period}`;
  if (pct < 0) return ` · ${pct.toFixed(0)}%${period}`;
  return ` · stable${period}`;
}

export function CompanyLayer({
  companies, onSelect, clusterAssignments, clusterColours,
  sizeMetric = 'employees', growthPeriodMonths,
}: Props) {
  const isGrowthMode = sizeMetric === 'emp_growth_pct';

  // Precompute growth values for all companies when in growth mode
  const growthMap = useMemo(() => {
    if (!isGrowthMode) return null;
    const map = new Map<number, number | null>();
    for (const c of companies) {
      if (growthPeriodMonths !== null && growthPeriodMonths !== undefined) {
        map.set(c.id, computeGrowthForPeriod(c.emp_timeseries, growthPeriodMonths));
      } else {
        // Use precomputed all-time growth, fall back to timeseries calculation
        map.set(c.id, c.emp_growth_pct ?? computeGrowthForPeriod(c.emp_timeseries, null));
      }
    }
    return map;
  }, [companies, isGrowthMode, growthPeriodMonths]);

  // Build lookup: company_id -> cluster colour
  const colourMap = new Map<number, string>();
  if (clusterAssignments && clusterColours) {
    for (const a of clusterAssignments) {
      if (a.cluster_id === -1) {
        colourMap.set(a.company_id, NOISE_COLOR);
      } else {
        colourMap.set(a.company_id, clusterColours.get(a.cluster_id) || DEFAULT_COLOR);
      }
    }
  }

  const maxMetric = useMemo(() => {
    if (isGrowthMode && growthMap) {
      return Math.max(...Array.from(growthMap.values()).map(v => Math.abs(v ?? 0)), 1);
    }
    const values = companies.map(c => {
      switch (sizeMetric) {
        case 'employees': return c.employees || 0;
        case 'funding_usd_m': return c.funding_usd_m || 0;
        case 'total_grant_funding_gbp': return c.total_grant_funding_gbp || 0;
        case 'patent_count': return c.patent_count || 0;
        default: return 0;
      }
    });
    return Math.max(...values, 1);
  }, [companies, sizeMetric, isGrowthMode, growthMap]);

  return (
    <>
      {companies.map((c) => {
        let value: number;
        let growthPct: number | null = null;
        const isOff = sizeMetric === 'off';

        if (isOff) {
          value = 1;
        } else if (isGrowthMode && growthMap) {
          growthPct = growthMap.get(c.id) ?? null;
          value = Math.abs(growthPct ?? 0);
        } else {
          switch (sizeMetric) {
            case 'employees': value = c.employees || 0; break;
            case 'funding_usd_m': value = c.funding_usd_m || 0; break;
            case 'total_grant_funding_gbp': value = c.total_grant_funding_gbp || 0; break;
            case 'patent_count': value = c.patent_count || 0; break;
            default: value = 0;
          }
        }

        const radius = isOff ? 6 : MIN_RADIUS + Math.sqrt(value / maxMetric) * (MAX_RADIUS - MIN_RADIUS);

        let fillColor: string;
        let borderColor: string;

        if (isGrowthMode) {
          const gc = growthColor(growthPct);
          fillColor = gc.fill;
          borderColor = gc.border;
        } else if (colourMap.size > 0) {
          const clusterColor = colourMap.get(c.id);
          fillColor = clusterColor || DEFAULT_COLOR;
          borderColor = clusterColor
            ? (clusterColor === NOISE_COLOR ? NOISE_BORDER : clusterColor)
            : DEFAULT_BORDER;
        } else {
          fillColor = DEFAULT_COLOR;
          borderColor = DEFAULT_BORDER;
        }

        return (
          <CircleMarker
            key={c.id}
            center={[c.lat, c.lng]}
            radius={radius}
            pathOptions={{
              color: borderColor,
              fillColor,
              fillOpacity: 0.8,
              weight: 1.5,
            }}
            eventHandlers={{ click: () => onSelect(c) }}
          >
            <Tooltip sticky className="boundary-tooltip">
              <strong>{c.name}</strong>
              {c.employees && <span> · {c.employees} employees</span>}
              {isGrowthMode && <span>{growthLabel(growthPct, growthPeriodMonths ?? null)}</span>}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
