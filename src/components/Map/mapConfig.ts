import type { PathOptions } from 'leaflet';

export const MAP_CONFIG = {
  center: [54.5, -2.5] as [number, number],
  defaultZoom: 6,
  minZoom: 5,
  maxZoom: 15,
  zoomThreshold: 8,
  maxBounds: [
    [49.5, -8.5],
    [61.0, 2.5],
  ] as [[number, number], [number, number]],
  maxBoundsViscosity: 1.0,
  tileUrl: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  tileAttribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
};

export const BOUNDARY_STYLES: Record<string, PathOptions> = {
  region: {
    color: '#d1d5db',
    weight: 0.8,
    fillColor: 'transparent',
    fillOpacity: 0,
  },
  lad: {
    color: '#d1d5db',
    weight: 0.5,
    fillColor: 'transparent',
    fillOpacity: 0,
  },
};

export const HOVER_STYLE: PathOptions = {
  fillOpacity: 0.2,
  weight: 2.5,
  color: '#1d4ed8',
  fillColor: '#3b82f6',
};
