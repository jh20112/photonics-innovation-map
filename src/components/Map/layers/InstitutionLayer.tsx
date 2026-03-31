import { useMemo } from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import type { Institution, InstitutionSizeMetric } from '../../../types/api';

interface Props {
  institutions: Institution[];
  onSelect: (institution: Institution) => void;
  periodYears?: number | null;
  sizeMetric?: InstitutionSizeMetric;
}

const MIN_RADIUS = 4;
const MAX_RADIUS = 18;

function getWorksForPeriod(inst: Institution, periodYears: number | null): number {
  if (!periodYears || !inst.publications_by_year) {
    return inst.photonics_works ?? 0;
  }
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - periodYears;
  let total = 0;
  for (const [yearStr, count] of Object.entries(inst.publications_by_year)) {
    if (parseInt(yearStr, 10) > startYear) {
      total += count;
    }
  }
  return total;
}

function getMetricValue(inst: Institution, metric: InstitutionSizeMetric, periodWorks: number): number {
  switch (metric) {
    case 'publications': return periodWorks;
    case 'citations': return inst.total_citations ?? 0;
    case 'quality': return inst.pct_top10_cited ?? 0;
    case 'fwci': return inst.avg_fwci ?? 0;
  }
}

function qualityColor(pct: number): { fill: string; border: string } {
  // pct_top10_cited ranges roughly 9-40%
  if (pct >= 35) return { fill: '#059669', border: '#047857' }; // dark green
  if (pct >= 28) return { fill: '#10b981', border: '#059669' }; // green
  if (pct >= 22) return { fill: '#34d399', border: '#10b981' }; // light green
  if (pct >= 16) return { fill: '#fbbf24', border: '#d97706' }; // yellow
  return { fill: '#f87171', border: '#ef4444' };                  // red
}

function fwciColor(fwci: number): { fill: string; border: string } {
  if (fwci >= 5) return { fill: '#059669', border: '#047857' };
  if (fwci >= 3.5) return { fill: '#10b981', border: '#059669' };
  if (fwci >= 2.5) return { fill: '#34d399', border: '#10b981' };
  if (fwci >= 1.5) return { fill: '#fbbf24', border: '#d97706' };
  return { fill: '#f87171', border: '#ef4444' };
}

export function InstitutionLayer({ institutions, onSelect, periodYears, sizeMetric = 'publications' }: Props) {
  const isQualityMode = sizeMetric === 'quality' || sizeMetric === 'fwci';

  const worksMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const inst of institutions) {
      map.set(inst.id, getWorksForPeriod(inst, periodYears ?? null));
    }
    return map;
  }, [institutions, periodYears]);

  const maxMetric = useMemo(() => {
    return Math.max(
      ...institutions.map(i => getMetricValue(i, sizeMetric, worksMap.get(i.id) ?? 0)),
      1
    );
  }, [institutions, sizeMetric, worksMap]);

  return (
    <>
      {institutions.map((inst) => {
        const periodWorks = worksMap.get(inst.id) ?? 0;
        const value = getMetricValue(inst, sizeMetric, periodWorks);
        const ratio = Math.sqrt(value / maxMetric);
        const radius = MIN_RADIUS + ratio * (MAX_RADIUS - MIN_RADIUS);

        let fillColor = '#10b981';
        let borderColor = '#059669';

        if (sizeMetric === 'quality') {
          const qc = qualityColor(inst.pct_top10_cited ?? 0);
          fillColor = qc.fill;
          borderColor = qc.border;
        } else if (sizeMetric === 'fwci') {
          const fc = fwciColor(inst.avg_fwci ?? 0);
          fillColor = fc.fill;
          borderColor = fc.border;
        }

        const periodLabel = periodYears ? ` (last ${periodYears}yr)` : '';
        let metricLabel = `${periodWorks.toLocaleString()} publications${periodLabel}`;
        if (sizeMetric === 'citations') metricLabel = `${(inst.total_citations ?? 0).toLocaleString()} citations`;
        if (sizeMetric === 'quality') metricLabel = `${inst.pct_top10_cited ?? 0}% in top 10% cited`;
        if (sizeMetric === 'fwci') metricLabel = `FWCI: ${inst.avg_fwci ?? 0}`;

        return (
          <CircleMarker
            key={inst.id}
            center={[inst.lat, inst.lng]}
            radius={radius}
            pathOptions={{
              color: borderColor,
              fillColor,
              fillOpacity: 0.5,
              weight: 1,
            }}
            eventHandlers={{ click: () => onSelect(inst) }}
          >
            <Tooltip sticky className="boundary-tooltip">
              <strong>{inst.name}</strong>
              <br />
              {metricLabel}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
