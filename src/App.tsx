import { useState, useCallback, useMemo } from 'react';
import { InnovationMap } from './components/Map/InnovationMap';
import { Sidebar } from './components/Sidebar/Sidebar';
import { InfoPanel } from './components/InfoPanel/InfoPanel';
import { AnalyticsPanel } from './components/Analytics/AnalyticsPanel';
import { Dashboard } from './components/Dashboard/Dashboard';
import {
  useCompanies, useInfrastructure, useInstitutions,
  useGrants, usePatents, useCollaborations, usePeople,
  useClusters, useCoordsLookup, useRticSectors, useStats, useGrantTopics, useGrantEdges,
} from './hooks/useApi';
import type { LayerType, ClusterType, CompanySizeMetric, Cluster, Grant, EntityDetail, SearchResult, Company, Institution, Person } from './types/api';

type ViewMode = 'map' | 'dashboard';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('map');

  // Layer visibility
  const [layers, setLayers] = useState<Record<LayerType, boolean>>({
    companies: true,
    infrastructure: false,
    institutions: false,
    grants: false,
    patents: false,
    collaborations: false,
    people: false,
  });

  // Filters
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);

  // Company size metric
  const [companySizeMetric, setCompanySizeMetric] = useState<CompanySizeMetric>('off');
  const [growthPeriodMonths, setGrowthPeriodMonths] = useState<number | null>(null);

  // Subsector heatmap
  const [heatmapSubsector, setHeatmapSubsector] = useState<string | null>(null);

  // Analytics / Topics
  const [showTopics, setShowTopics] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Grant collaboration network
  const [grantNetworkEnabled, setGrantNetworkEnabled] = useState(false);
  const [grantNetworkMinShared, setGrantNetworkMinShared] = useState(5);

  // Clustering
  const [activeCluster, setActiveCluster] = useState<ClusterType | null>(null);

  // Year range filter (Feature 1)
  const [yearRange, setYearRange] = useState<[number, number] | null>(null);

  // Detail panel
  const [detail, setDetail] = useState<EntityDetail | null>(null);

  // Collaboration state
  const [collabEntity, setCollabEntity] = useState<string | null>(null);
  const [collabCoords, setCollabCoords] = useState<[number, number] | null>(null);

  // Fly-to target
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);

  // Data fetching — map layers (filtered by year range)
  const { data: companies } = useCompanies(layers.companies, selectedSectors.length > 0 ? selectedSectors : undefined, selectedSources.length > 0 ? selectedSources : undefined, selectedStrengths.length > 0 ? selectedStrengths : undefined);
  const { data: infrastructure } = useInfrastructure(layers.infrastructure, selectedSectors.length > 0 ? selectedSectors : undefined);
  const { data: institutions } = useInstitutions(layers.institutions);
  const { data: grants } = useGrants(layers.grants, true, yearRange?.[0], yearRange?.[1]);
  const { data: patents } = usePatents(layers.patents, yearRange?.[0], yearRange?.[1]);
  const { data: people } = usePeople(layers.people);

  // Always-loaded data for search, detail panels, and dashboard
  const { data: allCompanies } = useCompanies(true);
  const { data: allInfrastructure } = useInfrastructure(true);
  const { data: allInstitutions } = useInstitutions(true);
  const { data: allGrants } = useGrants(true);
  const { data: allPatents } = usePatents(true);
  const { data: allPeople } = usePeople(true);

  // Server-side coords lookup for collaboration arc rendering
  const { data: serverCoords } = useCoordsLookup();
  const { data: collaborations } = useCollaborations(collabEntity);
  const { data: clusterData } = useClusters(activeCluster);
  const { data: sectors } = useRticSectors();
  const { data: stats } = useStats();
  const { data: grantTopics } = useGrantTopics(yearRange?.[0], yearRange?.[1]);
  const { data: grantEdges } = useGrantEdges(grantNetworkEnabled, grantNetworkMinShared);

  // Dashboard edges — always loaded for overview charts
  const { data: dashboardEdges } = useGrantEdges(true, 3);

  // Company name lookup for patent-company linking (Feature 2)
  const companyByName = useMemo(() => {
    if (!allCompanies) return new Map<string, Company>();
    return new Map(allCompanies.map(c => [c.name.toUpperCase(), c]));
  }, [allCompanies]);

  // Build coords lookup from server-side normalized data
  const coordsLookup = useMemo(() => {
    const map = new Map<string, [number, number]>();
    if (serverCoords) {
      for (const [name, coords] of Object.entries(serverCoords)) {
        map.set(name, coords as [number, number]);
      }
    }
    return map;
  }, [serverCoords]);

  // Topic-filtered grants
  const filteredGrants = useMemo(() => {
    if (!grants) return grants;
    if (!selectedTopic) return grants;
    return grants.filter(g =>
      g.research_topics?.split(';').some(t => t.trim() === selectedTopic)
    );
  }, [grants, selectedTopic]);

  const toggleLayer = useCallback((layer: LayerType) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
    if (layer === 'collaborations') {
      setCollabEntity(null);
      setCollabCoords(null);
    }
  }, []);

  const showCollaborations = useCallback((name: string, coords: [number, number]) => {
    setLayers(prev => ({ ...prev, collaborations: true }));
    setCollabEntity(name);
    setCollabCoords(coords);
  }, []);

  const handleSearchSelect = useCallback((result: SearchResult) => {
    setFlyTo([result.lat, result.lng]);

    if (result.type === 'company') {
      const company = allCompanies?.find(c => c.id === result.id);
      if (company) setDetail({ type: 'company', data: company });
    } else if (result.type === 'infrastructure') {
      const facility = allInfrastructure?.find(f => f.id === result.id);
      if (facility) setDetail({ type: 'infrastructure', data: facility });
    } else if (result.type === 'institution') {
      const inst = allInstitutions?.find(i => i.id === result.id);
      if (inst) setDetail({ type: 'institution', data: inst });
    } else if (result.type === 'person') {
      const person = allPeople?.find(p => p.id === result.id);
      if (person) setDetail({ type: 'person', data: person });
    }
  }, [allCompanies, allInfrastructure, allInstitutions, allPeople]);

  const handleSelectCluster = useCallback((cluster: Cluster) => {
    if (!clusterData || !allCompanies) return;
    const memberIds = new Set(
      clusterData.assignments
        .filter(a => a.cluster_id === cluster.id)
        .map(a => a.company_id)
    );
    const members = allCompanies.filter(c => memberIds.has(c.id));
    setDetail({ type: 'cluster', data: cluster, members });
  }, [clusterData, allCompanies]);

  // Derive selected entity location for map highlight
  const selectedEntity = useMemo(() => {
    if (!detail) return null;
    switch (detail.type) {
      case 'company': return { type: 'company' as const, id: detail.data.id, lat: detail.data.lat, lng: detail.data.lng };
      case 'infrastructure': return { type: 'infrastructure' as const, id: detail.data.id, lat: detail.data.lat, lng: detail.data.lng };
      case 'institution': return { type: 'institution' as const, id: detail.data.id, lat: detail.data.lat, lng: detail.data.lng };
      case 'grant': return detail.data.lat ? { type: 'grant' as const, id: detail.data.id, lat: detail.data.lat, lng: detail.data.lng! } : null;
      case 'patent': return { type: 'patent' as const, id: detail.data.id, lat: detail.data.lat, lng: detail.data.lng };
      case 'person': return detail.data.lat ? { type: 'person' as const, id: detail.data.id, lat: detail.data.lat, lng: detail.data.lng! } : null;
      default: return null;
    }
  }, [detail]);

  const handleClusterChange = useCallback((type: ClusterType | null) => {
    setActiveCluster(type);
  }, []);

  // Dashboard row click handlers
  const dashSelectCompany = useCallback((c: Company) => {
    setViewMode('map');
    setLayers(prev => ({ ...prev, companies: true }));
    setFlyTo([c.lat, c.lng]);
    setDetail({ type: 'company', data: c });
  }, []);

  const dashSelectInstitution = useCallback((i: Institution) => {
    setViewMode('map');
    setLayers(prev => ({ ...prev, institutions: true }));
    setFlyTo([i.lat, i.lng]);
    setDetail({ type: 'institution', data: i });
  }, []);

  const dashSelectGrant = useCallback((g: Grant) => {
    setViewMode('map');
    if (g.lat && g.lng) {
      setLayers(prev => ({ ...prev, grants: true }));
      setFlyTo([g.lat, g.lng]);
    }
    setDetail({ type: 'grant', data: g });
  }, []);

  const dashSelectCluster = useCallback((_clusterId: number, clusterType: ClusterType) => {
    setViewMode('map');
    setActiveCluster(clusterType);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar
        layers={layers}
        onToggleLayer={toggleLayer}
        sectors={sectors}
        selectedSectors={selectedSectors}
        onSectorsChange={setSelectedSectors}
        selectedSources={selectedSources}
        onSourcesChange={setSelectedSources}
        selectedStrengths={selectedStrengths}
        onStrengthsChange={setSelectedStrengths}
        companySizeMetric={companySizeMetric}
        onCompanySizeMetricChange={setCompanySizeMetric}
        growthPeriodMonths={growthPeriodMonths}
        onGrowthPeriodChange={setGrowthPeriodMonths}
        activeCluster={activeCluster}
        onClusterChange={handleClusterChange}
        stats={stats}
        onSearchSelect={handleSearchSelect}
        onToggleTopics={() => setShowTopics(s => !s)}
        showTopics={showTopics}
        grantNetworkEnabled={grantNetworkEnabled}
        onToggleGrantNetwork={() => setGrantNetworkEnabled(e => !e)}
        grantNetworkMinShared={grantNetworkMinShared}
        onGrantNetworkMinSharedChange={setGrantNetworkMinShared}
        grantEdgeCount={grantEdges?.length ?? null}
        heatmapSubsector={heatmapSubsector}
        onHeatmapSubsectorChange={setHeatmapSubsector}
        yearRange={yearRange}
        onYearRangeChange={setYearRange}
      />
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* View toggle */}
        <div className="view-toggle-bar">
          <button className={`view-toggle ${viewMode === 'map' ? 'active' : ''}`} onClick={() => setViewMode('map')}>Map</button>
          <button className={`view-toggle ${viewMode === 'dashboard' ? 'active' : ''}`} onClick={() => setViewMode('dashboard')}>Dashboard</button>
        </div>

        {/* Map view */}
        {viewMode === 'map' && (
          <>
            <InnovationMap
              companies={layers.companies ? companies : null}
              infrastructure={layers.infrastructure ? infrastructure : null}
              institutions={layers.institutions ? institutions : null}
              grants={layers.grants ? filteredGrants : null}
              patents={layers.patents ? patents : null}
              people={layers.people ? people : null}
              collaborations={layers.collaborations ? collaborations : null}
              collabCoords={collabCoords}
              coordsLookup={coordsLookup}
              clusterData={activeCluster ? clusterData : null}
              companySizeMetric={companySizeMetric}
              growthPeriodMonths={growthPeriodMonths}
              grantEdges={grantNetworkEnabled ? grantEdges : null}
              heatmapSubsector={heatmapSubsector}
              allCompanies={allCompanies}
              onSelectCompany={(c: Company) => setDetail({ type: 'company', data: c })}
              onSelectInfrastructure={(f) => setDetail({ type: 'infrastructure', data: f })}
              onSelectInstitution={(i: Institution) => setDetail({ type: 'institution', data: i })}
              onSelectGrant={(g) => setDetail({ type: 'grant', data: g })}
              onSelectPatent={(p) => setDetail({ type: 'patent', data: p })}
              onSelectPerson={(p: Person) => setDetail({ type: 'person', data: p })}
              onSelectCluster={handleSelectCluster}
              selectedEntity={selectedEntity}
              flyTo={flyTo}
              onFlyToDone={() => setFlyTo(null)}
            />
            <InfoPanel
              detail={detail}
              onClose={() => setDetail(null)}
              onShowCollaborations={showCollaborations}
              allPatents={allPatents}
              companyByName={companyByName}
            />
          </>
        )}

        {/* Dashboard view */}
        {viewMode === 'dashboard' && (
          <Dashboard
            companies={allCompanies}
            institutions={allInstitutions}
            grants={allGrants}
            patents={allPatents}
            grantEdges={dashboardEdges}
            sectors={sectors}
            onSelectCompany={dashSelectCompany}
            onSelectInstitution={dashSelectInstitution}
            onSelectGrant={dashSelectGrant}
            onSelectCluster={dashSelectCluster}
          />
        )}
      </div>
      {showTopics && (
        <AnalyticsPanel
          topics={grantTopics}
          selectedTopic={selectedTopic}
          onSelectTopic={setSelectedTopic}
          onClose={() => setShowTopics(false)}
        />
      )}
    </div>
  );
}

export default App;
