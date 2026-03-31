import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import { MAP_CONFIG, BOUNDARY_STYLES } from './mapConfig';
import { BoundaryLayer } from './BoundaryLayer';
import { ZoomHandler } from './ZoomHandler';
import { useBoundaryData } from '../../hooks/useBoundaryData';
import { CompanyLayer } from './layers/CompanyLayer';
import { InfrastructureLayer } from './layers/InfrastructureLayer';
import { InstitutionLayer } from './layers/InstitutionLayer';
import { GrantLayer } from './layers/GrantLayer';
import { PatentLayer } from './layers/PatentLayer';
import { CollaborationLayer } from './layers/CollaborationLayer';
import { ClusterLayer } from './layers/ClusterLayer';
import { SubsectorHeatmap } from './layers/SubsectorHeatmap';
import { GrantCollaborationLayer } from './layers/GrantCollaborationLayer';
import { PeopleLayer } from './layers/PeopleLayer';
import type {
  Company, Infrastructure, Institution, Grant, Patent, Collaboration, Person,
  Cluster, ClusterData, CompanySizeMetric, InstitutionSizeMetric, GrantEdge,
} from '../../types/api';

interface Props {
  companies: Company[] | null;
  infrastructure: Infrastructure[] | null;
  institutions: Institution[] | null;
  grants: Grant[] | null;
  patents: Patent[] | null;
  people: Person[] | null;
  collaborations: Collaboration[] | null;
  collabCoords: [number, number] | null;
  coordsLookup: Map<string, [number, number]>;
  clusterData: ClusterData | null;
  companySizeMetric: CompanySizeMetric;
  growthPeriodMonths: number | null;
  grantEdges: GrantEdge[] | null;
  onSelectCompany: (c: Company) => void;
  onSelectInfrastructure: (f: Infrastructure) => void;
  onSelectInstitution: (i: Institution) => void;
  onSelectGrant: (g: Grant) => void;
  onSelectPatent: (p: Patent) => void;
  onSelectPerson: (p: Person) => void;
  onSelectCluster: (cluster: Cluster) => void;
  heatmapSubsector: string | null;
  allCompanies: Company[] | null;
  institutionPeriodYears: number | null;
  institutionSizeMetric: InstitutionSizeMetric;
  selectedEntity: { type: string; id: string | number; lat: number; lng: number } | null;
  flyTo: [number, number] | null;
  onFlyToDone: () => void;
}

function FlyToHandler({ target, onDone }: { target: [number, number] | null; onDone: () => void }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 10, { duration: 1 });
      onDone();
    }
  }, [target, map, onDone]);
  return null;
}

export function InnovationMap({
  companies, infrastructure, institutions, grants, patents, people,
  collaborations, collabCoords, coordsLookup,
  clusterData, companySizeMetric, growthPeriodMonths, grantEdges,
  onSelectCompany, onSelectInfrastructure, onSelectInstitution,
  onSelectGrant, onSelectPatent, onSelectPerson, onSelectCluster,
  heatmapSubsector, allCompanies, institutionPeriodYears, institutionSizeMetric,
  selectedEntity, flyTo, onFlyToDone,
}: Props) {
  const [zoom, setZoom] = useState(MAP_CONFIG.defaultZoom);
  const { regions, lads, ladLoading, loadLads } = useBoundaryData();

  const showDetailed = zoom >= MAP_CONFIG.zoomThreshold;

  useEffect(() => {
    if (showDetailed) loadLads();
  }, [showDetailed, loadLads]);

  // Build cluster colour map for CompanyLayer
  const clusterColours = clusterData
    ? new Map(clusterData.clusters.map(c => [c.id, c.colour]))
    : undefined;

  return (
    <div className="map-container">
      <MapContainer
        center={MAP_CONFIG.center}
        zoom={MAP_CONFIG.defaultZoom}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
        maxBounds={MAP_CONFIG.maxBounds}
        maxBoundsViscosity={MAP_CONFIG.maxBoundsViscosity}
        zoomControl={true}
        preferCanvas={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url={MAP_CONFIG.tileUrl} attribution={MAP_CONFIG.tileAttribution} />
        <ZoomHandler onZoomChange={setZoom} />
        <FlyToHandler target={flyTo} onDone={onFlyToDone} />

        {!showDetailed && regions && (
          <BoundaryLayer data={regions} style={BOUNDARY_STYLES.region} layerKey="regions" />
        )}
        {showDetailed && lads && (
          <BoundaryLayer data={lads} style={BOUNDARY_STYLES.lad} layerKey="lads" />
        )}

        {/* Subsector heatmap (render behind everything) */}
        {heatmapSubsector && allCompanies && (
          <SubsectorHeatmap companies={allCompanies} subsectorCode={heatmapSubsector} />
        )}

        {/* Cluster boundaries (render behind markers) */}
        {clusterData && <ClusterLayer clusters={clusterData.clusters} onSelectCluster={onSelectCluster} />}

        {/* Grant collaboration network (below data markers) */}
        {grantEdges && grantEdges.length > 0 && (
          <GrantCollaborationLayer edges={grantEdges} coordsLookup={coordsLookup} />
        )}

        {/* Data layers — keys force remount on data change for Canvas cleanup */}
        {grants && <GrantLayer key={`grants-${grants.length}`} grants={grants} onSelect={onSelectGrant} />}
        {patents && <PatentLayer key={`patents-${patents.length}`} patents={patents} onSelect={onSelectPatent} />}
        {institutions && <InstitutionLayer key={`inst-${institutions.length}`} institutions={institutions} onSelect={onSelectInstitution} periodYears={institutionPeriodYears} sizeMetric={institutionSizeMetric} />}
        {infrastructure && <InfrastructureLayer key={`infra-${infrastructure.length}`} facilities={infrastructure} onSelect={onSelectInfrastructure} />}
        {people && <PeopleLayer key={`people-${people.length}`} people={people} onSelect={onSelectPerson} />}
        {companies && (
          <CompanyLayer
            key={`companies-${companies.length}`}
            companies={companies}
            onSelect={onSelectCompany}
            clusterAssignments={clusterData?.assignments}
            clusterColours={clusterColours}
            sizeMetric={companySizeMetric}
            growthPeriodMonths={growthPeriodMonths}
          />
        )}

        {collaborations && collabCoords && (
          <CollaborationLayer
            collaborations={collaborations}
            entityCoords={collabCoords}
            coordsLookup={coordsLookup}
          />
        )}

        {/* Selection highlight ring */}
        {selectedEntity && (
          <CircleMarker
            center={[selectedEntity.lat, selectedEntity.lng]}
            radius={14}
            pathOptions={{
              color: '#f59e0b',
              fillColor: '#f59e0b',
              fillOpacity: 0.15,
              weight: 3,
              dashArray: '4 3',
            }}
            interactive={false}
          />
        )}
      </MapContainer>

      {ladLoading && (
        <div className="loading-indicator">Loading boundaries...</div>
      )}
    </div>
  );
}
