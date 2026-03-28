import { useState, useEffect, useCallback } from 'react';
import type { FeatureCollection } from 'geojson';

interface BoundaryData {
  regions: FeatureCollection | null;
  lads: FeatureCollection | null;
  ladLoading: boolean;
  loadLads: () => void;
}

async function fetchGeoJSON(path: string): Promise<FeatureCollection> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
}

export function useBoundaryData(): BoundaryData {
  const [regions, setRegions] = useState<FeatureCollection | null>(null);
  const [lads, setLads] = useState<FeatureCollection | null>(null);
  const [ladLoading, setLadLoading] = useState(false);

  useEffect(() => {
    fetchGeoJSON('/geo/regions-en-buc.geojson').then(setRegions);
  }, []);

  const loadLads = useCallback(() => {
    if (lads || ladLoading) return;
    setLadLoading(true);
    fetchGeoJSON('/geo/lad-uk-buc.geojson')
      .then(setLads)
      .finally(() => setLadLoading(false));
  }, [lads, ladLoading]);

  return { regions, lads, ladLoading, loadLads };
}
