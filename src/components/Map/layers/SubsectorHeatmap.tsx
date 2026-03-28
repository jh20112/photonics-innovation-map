import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import type { Company } from '../../../types/api';

// Extend Leaflet types for heat layer
declare module 'leaflet' {
  function heatLayer(
    latlngs: [number, number, number][],
    options?: {
      radius?: number;
      blur?: number;
      maxZoom?: number;
      max?: number;
      minOpacity?: number;
      gradient?: Record<number, string>;
    }
  ): L.Layer;
}

interface Props {
  companies: Company[];
  subsectorCode: string;
}

const SUBSECTOR_COLOURS: Record<string, Record<number, string>> = {
  default: { 0.2: '#c6dbef', 0.4: '#6baed6', 0.6: '#2171b5', 0.8: '#08519c', 1.0: '#08306b' },
  RTIC002701: { 0.2: '#fde0dd', 0.4: '#fa9fb5', 0.6: '#f768a1', 0.8: '#c51b8a', 1.0: '#7a0177' }, // Industry 4.0 - pink
  RTIC002702: { 0.2: '#d4b9da', 0.4: '#c994c7', 0.6: '#df65b0', 0.8: '#dd1c77', 1.0: '#980043' }, // Microelectronics - magenta
  RTIC002703: { 0.2: '#c6dbef', 0.4: '#6baed6', 0.6: '#2171b5', 0.8: '#08519c', 1.0: '#08306b' }, // Optics - blue
  RTIC002704: { 0.2: '#feedde', 0.4: '#fdbe85', 0.6: '#fd8d3c', 0.8: '#e6550d', 1.0: '#a63603' }, // Photovoltaics - orange
  RTIC002705: { 0.2: '#fef08a', 0.4: '#fde047', 0.6: '#facc15', 0.8: '#eab308', 1.0: '#ca8a04' }, // Quantum Tech - gold/yellow
  RTIC002706: { 0.2: '#c7e9c0', 0.4: '#74c476', 0.6: '#31a354', 0.8: '#006d2c', 1.0: '#00441b' }, // Smart Sensors - green
  RTIC002707: { 0.2: '#fdd0a2', 0.4: '#fdae6b', 0.6: '#f16913', 0.8: '#d94801', 1.0: '#8c2d04' }, // Telecommunications - deep orange
};

export function SubsectorHeatmap({ companies, subsectorCode }: Props) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    // Remove previous layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    // Filter companies to those with the selected subsector
    const filtered = companies.filter(c =>
      c.rtic.some(r => r.code === subsectorCode)
    );

    if (filtered.length === 0) return;

    // Build heat points [lat, lng, intensity]
    const points: [number, number, number][] = filtered.map(c => [
      c.lat,
      c.lng,
      1.0,
    ]);

    const gradient = SUBSECTOR_COLOURS[subsectorCode] || SUBSECTOR_COLOURS.default;

    const heatLayer = L.heatLayer(points, {
      radius: 30,
      blur: 20,
      maxZoom: 12,
      max: 3,
      minOpacity: 0.3,
      gradient,
    });

    heatLayer.addTo(map);
    layerRef.current = heatLayer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, companies, subsectorCode]);

  return null;
}
