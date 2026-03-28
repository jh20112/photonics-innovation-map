#!/bin/bash
# Download UK boundary GeoJSON from ONS Open Geography Portal
# All queries use outSR=4326 (WGS84) for Leaflet compatibility

set -e

GEO_DIR="$(dirname "$0")/../public/geo"
mkdir -p "$GEO_DIR"

echo "Downloading UK countries (ultra-generalised, 4 features)..."
curl -sS -o "$GEO_DIR/countries-uk-buc.geojson" \
  "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Countries_December_2024_Boundaries_UK_BUC/FeatureServer/0/query?where=1%3D1&outFields=CTRY24CD,CTRY24NM&outSR=4326&f=geojson"

echo "Downloading English regions (ultra-generalised, 9 features)..."
curl -sS -o "$GEO_DIR/regions-en-buc.geojson" \
  "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Regions_December_2024_Boundaries_EN_BUC/FeatureServer/0/query?where=1%3D1&outFields=RGN24CD,RGN24NM&outSR=4326&f=geojson"

echo "Downloading Local Authority Districts (ultra-generalised, ~361 features)..."
curl -sS -o "$GEO_DIR/lad-uk-buc.geojson" \
  "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Local_Authority_Districts_December_2024_Boundaries_UK_BUC/FeatureServer/0/query?where=1%3D1&outFields=LAD24CD,LAD24NM&outSR=4326&f=geojson"

echo "Done! Files saved to $GEO_DIR"
ls -lh "$GEO_DIR"/*.geojson
