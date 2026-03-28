import { useMapEvents } from 'react-leaflet';

interface ZoomHandlerProps {
  onZoomChange: (zoom: number) => void;
}

export function ZoomHandler({ onZoomChange }: ZoomHandlerProps) {
  useMapEvents({
    zoomend: (e) => {
      onZoomChange(e.target.getZoom());
    },
  });
  return null;
}
