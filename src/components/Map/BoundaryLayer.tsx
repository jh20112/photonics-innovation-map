import { GeoJSON } from 'react-leaflet';
import type { FeatureCollection } from 'geojson';
import type { PathOptions } from 'leaflet';

interface BoundaryLayerProps {
  data: FeatureCollection;
  style: PathOptions;
  layerKey: string;
}

export function BoundaryLayer({ data, style, layerKey }: BoundaryLayerProps) {
  return (
    <GeoJSON
      key={layerKey}
      data={data}
      style={style}
      interactive={false}
    />
  );
}
