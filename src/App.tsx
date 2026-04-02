import { useState, useCallback, useMemo } from 'react';
import { InnovationMap } from './components/Map/InnovationMap';
import { Sidebar } from './components/Sidebar/Sidebar';
import { InfoPanel } from './components/InfoPanel/InfoPanel';
import { AnalyticsPanel } from './components/Analytics/AnalyticsPanel';
import { Dashboard } from './components/Dashboard/Dashboard';
import { DataTab } from './components/DataTab/DataTab';
import {
  useCompanies, useInfrastructure, useInstitutions,
  useGrants, usePatents, useCollaborations, useAllCollaborations, usePeople,
  useClusters, useCoordsLookup, useRticSectors, useStats, useGrantTopics, useGrantEdges,
  useResearchEdges,
} from './hooks/useApi';
import type { LayerType, ClusterType, CollabFilter, CompanySizeMetric, InstitutionSizeMetric, Cluster, Grant, EntityDetail, SearchResult, Company, Institution, Person } from './types/api';

type ViewMode = 'map' | 'dashboard' | 'data';

/** Ray-casting point-in-polygon: returns true if (lat, lng) is inside any cluster boundary. */
function isInsideAnyCluster(lat: number, lng: number, boundaries: ([number, number][] | null)[]): boolean {
  for (const boundary of boundaries) {
    if (!boundary || boundary.length < 3) continue;
    let inside = false;
    for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
      const [yi, xi] = boundary[i];
      const [yj, xj] = boundary[j];
      if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    if (inside) return true;
  }
  return false;
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'companies' | 'institutions' | 'grants' | 'clusters'>('overview');

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

  // Score range filter (set from Data tab histogram click)
  const [scoreRange, setScoreRange] = useState<[number, number] | null>(null);

  // Subsidiary filter
  const [hideSubsidiaries, setHideSubsidiaries] = useState(false);

  // Company size metric
  const [companySizeMetric, setCompanySizeMetric] = useState<CompanySizeMetric>('off');
  const [growthPeriodMonths, setGrowthPeriodMonths] = useState<number | null>(null);
  const [minPatents, setMinPatents] = useState(0);
  const [minGrants, setMinGrants] = useState(0);

  // Institution sizing
  const [institutionSizeMetric, setInstitutionSizeMetric] = useState<InstitutionSizeMetric>('publications');

  // Institution publication period
  const [institutionPeriodYears, setInstitutionPeriodYears] = useState<number | null>(null);

  // Subsector heatmap
  const [heatmapSubsector, setHeatmapSubsector] = useState<string | null>(null);

  // Analytics / Topics
  const [showTopics, setShowTopics] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Grant collaboration network
  const [grantNetworkEnabled, setGrantNetworkEnabled] = useState(false);
  const [grantNetworkMinShared, setGrantNetworkMinShared] = useState(5);

  // Research collaboration network
  const [researchNetworkEnabled, setResearchNetworkEnabled] = useState(false);
  const [researchNetworkMinShared, setResearchNetworkMinShared] = useState(10);

  // MaxQ filter
  const [maxqLevel, setMaxqLevel] = useState<0 | 1 | 2 | 3>(0);

  // Clustering
  const [activeCluster, setActiveCluster] = useState<ClusterType | null>(null);

  // Year range filter (Feature 1)
  const [yearRange, setYearRange] = useState<[number, number] | null>(null);

  // Detail panel
  const [detail, setDetail] = useState<EntityDetail | null>(null);

  // Collaboration state
  const [collabEntity, setCollabEntity] = useState<string | null>(null);
  const [collabCoords, setCollabCoords] = useState<[number, number] | null>(null);
  const [collabMinShared, setCollabMinShared] = useState(2);
  const [collabFilter, setCollabFilter] = useState<CollabFilter>('all');

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
  const { data: allCollaborations } = useAllCollaborations(layers.collaborations && !collabEntity, collabMinShared);
  const { data: clusterData } = useClusters(activeCluster);
  const { data: sectors } = useRticSectors();
  const { data: stats } = useStats();
  const { data: grantTopics } = useGrantTopics(yearRange?.[0], yearRange?.[1]);
  const { data: grantEdges } = useGrantEdges(grantNetworkEnabled, grantNetworkMinShared);
  const { data: researchEdges } = useResearchEdges(researchNetworkEnabled, researchNetworkMinShared);

  // Precompute cluster boundaries for filtering all entity layers
  const clusterBoundaries = useMemo(() => {
    if (!activeCluster || !clusterData) return null;
    return clusterData.clusters.map(c => c.boundary);
  }, [activeCluster, clusterData]);

  // Filter any entity array by cluster boundaries (when clustering is active)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterByCluster = useCallback(<T extends { lat: any; lng: any }>(
    data: T[] | null,
  ): T[] | null => {
    if (!data || !clusterBoundaries) return data;
    return data.filter(e => {
      const lat = e.lat as number | null;
      const lng = e.lng as number | null;
      return lat != null && lng != null && isInsideAnyCluster(lat, lng, clusterBoundaries);
    });
  }, [clusterBoundaries]);

  // Filter collaborations by type
  const filteredCollaborations = useMemo(() => {
    if (!allCollaborations || collabFilter === 'all') return allCollaborations;
    return allCollaborations.filter(c =>
      collabFilter === 'company' ? c.collaborator_is_company : !c.collaborator_is_company
    );
  }, [allCollaborations, collabFilter]);

  // Dashboard edges — always loaded for overview charts
  const { data: dashboardEdges } = useGrantEdges(true, 3);
  const { data: dashboardResearchEdges } = useResearchEdges(true, 5);

  // Filter companies by min patent/grant thresholds
  const filteredByThresholds = useMemo(() => {
    if (!companies) return companies;
    if (minPatents === 0 && minGrants === 0) return companies;
    return companies.filter(c =>
      (c.patent_count || 0) >= minPatents && (c.grant_count || 0) >= minGrants
    );
  }, [companies, minPatents, minGrants]);

  // Hide non-clustered companies when clustering is active
  // Apply MaxQ filter to a company array
  const applyMaxQ = useCallback((list: Company[]) => {
    const ACTIVE = ['active', 'operational', 'early stage', 'breakout stage'];
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    let result = list;
    if (maxqLevel >= 1) {
      // Exclude non-UK subsidiaries from all MaxQ levels
      result = result.filter(c => !c.is_non_uk_subsidiary);
      result = result.filter(c => {
        if ((c.funding_usd_m ?? 0) < 5) return false;
        if (!ACTIVE.includes((c.status || '').toLowerCase())) return false;
        if ((c.photonics_score ?? 0) < 60) return false;
        // Round in last 5 years — check last_funding_date OR latest_deal_date
        const fd = c.latest_deal_date || c.last_funding_date;
        if (!fd) return false;
        try {
          const dt = new Date(fd + '-01');
          if (isNaN(dt.getTime()) || dt < fiveYearsAgo) return false;
        } catch { return false; }
        return true;
      });
    }
    if (maxqLevel >= 2) {
      result = result.filter(c => (c.patent_count || 0) > 0);
    }
    if (maxqLevel >= 3) {
      result = result.filter(c => (c.grant_count || 0) > 0);
    }
    return result;
  }, [maxqLevel]);

  const clusterFilteredCompanies = useMemo(() => {
    let result = filteredByThresholds;
    if (!result) return result;
    if (activeCluster && clusterData) {
      const clusteredIds = new Set(
        clusterData.assignments.filter(a => a.cluster_id !== -1).map(a => a.company_id)
      );
      result = result.filter(c => clusteredIds.has(c.id));
    }
    if (maxqLevel > 0) result = applyMaxQ(result);
    if (hideSubsidiaries) result = result.filter(c => !c.is_non_uk_subsidiary);
    return result;
  }, [activeCluster, clusterData, filteredByThresholds, maxqLevel, applyMaxQ, hideSubsidiaries]);

  const dashboardCompanies = useMemo(() => {
    if (!allCompanies) return allCompanies;
    let result = allCompanies;
    if (selectedSectors.length > 0) {
      result = result.filter(c => c.rtic.some(r => selectedSectors.includes(r.code)));
    }
    if (selectedSources.length > 0) {
      result = result.filter(c => c.sources.some(s => selectedSources.includes(s)));
    }
    if (selectedStrengths.length > 0) {
      result = result.filter(c => selectedStrengths.includes(c.data_strength));
    }
    if (minPatents > 0) {
      result = result.filter(c => (c.patent_count || 0) >= minPatents);
    }
    if (minGrants > 0) {
      result = result.filter(c => (c.grant_count || 0) >= minGrants);
    }
    if (activeCluster && clusterData) {
      const clusteredIds = new Set(
        clusterData.assignments.filter(a => a.cluster_id !== -1).map(a => a.company_id)
      );
      result = result.filter(c => clusteredIds.has(c.id));
    }
    if (maxqLevel > 0) result = applyMaxQ(result);
    if (hideSubsidiaries) result = result.filter(c => !c.is_non_uk_subsidiary);
    if (scoreRange) {
      result = result.filter(c => (c.photonics_score ?? 0) >= scoreRange[0] && (c.photonics_score ?? 0) <= scoreRange[1]);
    }
    return result;
  }, [allCompanies, selectedSectors, selectedSources, selectedStrengths, minPatents, minGrants, activeCluster, clusterData, maxqLevel, applyMaxQ, hideSubsidiaries, scoreRange]);

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
        collabMinShared={collabMinShared}
        onCollabMinSharedChange={setCollabMinShared}
        collabEdgeCount={filteredCollaborations?.length ?? null}
        collabFilter={collabFilter}
        onCollabFilterChange={setCollabFilter}
        grantNetworkEnabled={grantNetworkEnabled}
        onToggleGrantNetwork={() => setGrantNetworkEnabled(e => !e)}
        grantNetworkMinShared={grantNetworkMinShared}
        onGrantNetworkMinSharedChange={setGrantNetworkMinShared}
        grantEdgeCount={grantEdges?.length ?? null}
        researchNetworkEnabled={researchNetworkEnabled}
        onToggleResearchNetwork={() => setResearchNetworkEnabled(e => !e)}
        researchNetworkMinShared={researchNetworkMinShared}
        onResearchNetworkMinSharedChange={setResearchNetworkMinShared}
        researchEdgeCount={researchEdges?.length ?? null}
        maxqLevel={maxqLevel}
        onMaxqLevelChange={setMaxqLevel}
        hideSubsidiaries={hideSubsidiaries}
        onHideSubsidiariesChange={setHideSubsidiaries}
        minPatents={minPatents}
        onMinPatentsChange={setMinPatents}
        minGrants={minGrants}
        onMinGrantsChange={setMinGrants}
        institutionPeriodYears={institutionPeriodYears}
        onInstitutionPeriodChange={setInstitutionPeriodYears}
        institutionSizeMetric={institutionSizeMetric}
        onInstitutionSizeMetricChange={setInstitutionSizeMetric}
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
          <button className={`view-toggle ${viewMode === 'data' ? 'active' : ''}`} onClick={() => setViewMode('data')}>Data</button>
        </div>

        {/* Map view */}
        {viewMode === 'map' && (
          <>
            <InnovationMap
              companies={layers.companies ? clusterFilteredCompanies : null}
              infrastructure={layers.infrastructure ? filterByCluster(infrastructure) : null}
              institutions={layers.institutions ? filterByCluster(institutions) : null}
              grants={layers.grants ? filterByCluster(filteredGrants) : null}
              patents={layers.patents ? filterByCluster(patents) : null}
              people={layers.people ? filterByCluster(people) : null}
              collaborations={layers.collaborations ? collaborations : null}
              allCollaborations={layers.collaborations && !collabEntity ? filteredCollaborations : null}
              collabCoords={collabCoords}
              coordsLookup={coordsLookup}
              clusterData={activeCluster ? clusterData : null}
              companySizeMetric={companySizeMetric}
              growthPeriodMonths={growthPeriodMonths}
              grantEdges={grantNetworkEnabled ? grantEdges : null}
              researchEdges={researchNetworkEnabled ? researchEdges : null}
              heatmapSubsector={heatmapSubsector}
              allCompanies={allCompanies}
              institutionPeriodYears={institutionPeriodYears}
              institutionSizeMetric={institutionSizeMetric}
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
            companies={dashboardCompanies}
            institutions={allInstitutions}
            grants={allGrants}
            patents={allPatents}
            grantEdges={dashboardEdges}
            researchEdges={dashboardResearchEdges}
            sectors={sectors}
            onSelectCompany={dashSelectCompany}
            onSelectInstitution={dashSelectInstitution}
            onSelectGrant={dashSelectGrant}
            onSelectCluster={dashSelectCluster}
            initialTab={dashboardTab}
          />
        )}

        {/* Data view */}
        {viewMode === 'data' && (
          <DataTab companies={allCompanies} onFilterSources={(sources) => {
            setSelectedSources(sources);
            setScoreRange(null);
            setDashboardTab('companies');
            setViewMode('dashboard');
          }} onFilterSourcesAndScore={(sources, min, max) => {
            setSelectedSources(sources);
            setScoreRange([min, max]);
            setDashboardTab('companies');
            setViewMode('dashboard');
          }} />
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
