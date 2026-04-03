import { useState, useCallback, useRef } from 'react';
import type { LayerType, ClusterType, CollabFilter, CompanySizeMetric, InstitutionSizeMetric, RticSector, Stats, SearchResult } from '../../types/api';
import { useSearch } from '../../hooks/useApi';
import { SidebarSection } from './SidebarSection';
import { SubSection } from './SubSection';
import { YearRangeSlider } from './YearRangeSlider';

interface Props {
  layers: Record<LayerType, boolean>;
  onToggleLayer: (layer: LayerType) => void;
  sectors: RticSector[] | null;
  selectedSectors: string[];
  onSectorsChange: (codes: string[]) => void;
  selectedSources: string[];
  onSourcesChange: (sources: string[]) => void;
  selectedStrengths: string[];
  onStrengthsChange: (strengths: string[]) => void;
  companySizeMetric: CompanySizeMetric;
  onCompanySizeMetricChange: (metric: CompanySizeMetric) => void;
  growthPeriodMonths: number | null;
  onGrowthPeriodChange: (months: number | null) => void;
  activeCluster: ClusterType | null;
  onClusterChange: (type: ClusterType | null) => void;
  stats: Stats | null;
  onSearchSelect: (result: SearchResult) => void;
  onToggleTopics: () => void;
  showTopics: boolean;
  heatmapSubsector: string | null;
  onHeatmapSubsectorChange: (code: string | null) => void;
  collabMinShared: number;
  onCollabMinSharedChange: (value: number) => void;
  collabEdgeCount: number | null;
  collabFilter: CollabFilter;
  onCollabFilterChange: (filter: CollabFilter) => void;
  grantNetworkEnabled: boolean;
  onToggleGrantNetwork: () => void;
  grantNetworkMinShared: number;
  onGrantNetworkMinSharedChange: (value: number) => void;
  grantEdgeCount: number | null;
  researchNetworkEnabled: boolean;
  onToggleResearchNetwork: () => void;
  researchNetworkMinShared: number;
  onResearchNetworkMinSharedChange: (value: number) => void;
  researchEdgeCount: number | null;
  minPatents: number;
  onMinPatentsChange: (value: number) => void;
  minGrants: number;
  onMinGrantsChange: (value: number) => void;
  institutionPeriodYears: number | null;
  onInstitutionPeriodChange: (years: number | null) => void;
  maxqLevel: 0 | 1 | 2 | 3;
  onMaxqLevelChange: (level: 0 | 1 | 2 | 3) => void;
  hideSubsidiaries: boolean;
  onHideSubsidiariesChange: (hide: boolean) => void;
  institutionSizeMetric: InstitutionSizeMetric;
  onInstitutionSizeMetricChange: (metric: InstitutionSizeMetric) => void;
  selectedInstTypes: string[];
  onInstTypesChange: (types: string[]) => void;
  yearRange: [number, number] | null;
  onYearRangeChange: (range: [number, number] | null) => void;
}

const CLUSTER_OPTIONS: { value: ClusterType; label: string; description: string }[] = [
  { value: 'geographic', label: 'Geographic', description: 'Location-based density clustering' },
];

const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'datacity', label: 'DataCity' },
  { value: 'dealroom', label: 'Dealroom' },
  { value: 'pitchbook', label: 'PitchBook' },
  { value: 'grant_leads', label: 'Grant Leads' },
  { value: 'grant_collabs', label: 'Grant Collaborators' },
  { value: 'patents', label: 'Patents' },
  { value: 'company_collabs', label: 'Company Collaborators' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'manual', label: 'Manual' },
];


export function Sidebar({
  layers, onToggleLayer, sectors, selectedSectors, onSectorsChange,
  selectedSources, onSourcesChange, selectedStrengths, onStrengthsChange,
  companySizeMetric, onCompanySizeMetricChange, growthPeriodMonths, onGrowthPeriodChange,
  activeCluster, onClusterChange, stats, onSearchSelect,
  heatmapSubsector, onHeatmapSubsectorChange,
  onToggleTopics, showTopics,
  collabMinShared, onCollabMinSharedChange, collabEdgeCount, collabFilter, onCollabFilterChange,
  grantNetworkEnabled, onToggleGrantNetwork, grantNetworkMinShared, onGrantNetworkMinSharedChange, grantEdgeCount,
  researchNetworkEnabled, onToggleResearchNetwork, researchNetworkMinShared, onResearchNetworkMinSharedChange, researchEdgeCount,
  minPatents, onMinPatentsChange, minGrants, onMinGrantsChange,
  institutionPeriodYears, onInstitutionPeriodChange, maxqLevel, onMaxqLevelChange,
  hideSubsidiaries, onHideSubsidiariesChange,
  institutionSizeMetric, onInstitutionSizeMetricChange, selectedInstTypes, onInstTypesChange,
  yearRange, onYearRangeChange,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { results: searchResults, search } = useSearch();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  }, [search]);

  // Badge counts
  const filterCount = selectedSectors.length + selectedSources.length + selectedStrengths.length;
  const analysisCount = (activeCluster ? 1 : 0) + (grantNetworkEnabled ? 1 : 0) + (researchNetworkEnabled ? 1 : 0) + (heatmapSubsector ? 1 : 0) + (showTopics ? 1 : 0);

  if (collapsed) {
    return (
      <div className="sidebar sidebar-collapsed" onClick={() => setCollapsed(false)}>
        <span className="sidebar-expand">&#9776;</span>
      </div>
    );
  }

  const photonics = sectors?.find(s => s.code === 'RTIC0027');

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>UK Photonics</h2>
        <button className="sidebar-close" onClick={() => setCollapsed(true)}>&times;</button>
      </div>

      {/* Stats — always visible */}
      {stats && (
        <div className="sidebar-stats">
          <div className="stat">{stats.companies} <span>companies</span></div>
          <div className="stat">{stats.infrastructure} <span>facilities</span></div>
          <div className="stat">{stats.institutions} <span>institutions</span></div>
          <div className="stat">{stats.grants.toLocaleString()} <span>grants</span></div>
          <div className="stat">{stats.patents.toLocaleString()} <span>patents</span></div>
          <div className="stat">£{(stats.total_funding_gbp / 1e9).toFixed(1)}B <span>funding</span></div>
        </div>
      )}

      {/* Search — always visible */}
      <div className="sidebar-section">
        <input
          type="text"
          placeholder="Search entities..."
          className="sidebar-search"
          value={searchQuery}
          onChange={(e) => handleSearchInput(e.target.value)}
        />
        {searchResults.length > 0 && searchQuery.length >= 2 && (
          <div className="search-results">
            {searchResults.slice(0, 8).map((r, i) => (
              <div
                key={i}
                className="search-result"
                onClick={() => { onSearchSelect(r); setSearchQuery(''); }}
              >
                <span className={`search-badge badge-${r.type}`}>{r.type}</span>
                {r.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === LAYERS (default open) === */}
      <SidebarSection title="Layers" defaultOpen>
        {/* Companies */}
        <label className="layer-toggle">
          <input type="checkbox" checked={layers.companies} onChange={() => onToggleLayer('companies')} />
          <span className="layer-dot" style={{ background: '#3b82f6' }} />
          Companies
        </label>
        {layers.companies && (
          <div className="layer-sub-control">
            <label className="size-metric-label">
              Size by{' '}
              <select
                value={companySizeMetric}
                onChange={(e) => onCompanySizeMetricChange(e.target.value as CompanySizeMetric)}
                className="size-metric-select"
              >
                <option value="off">Off</option>
                <option value="employees">Employees</option>
                <option value="funding_usd_m">Funding (USD M)</option>
                <option value="total_grant_funding_gbp">Grant Funding</option>
                <option value="patent_count">Patents</option>
                <option value="emp_growth_pct">Employee Growth</option>
              </select>
            </label>
            {companySizeMetric === 'emp_growth_pct' && (
              <div className="growth-period-control">
                <span className="growth-period-label">
                  Period: {growthPeriodMonths ? `${growthPeriodMonths}mo` : 'All time'}
                </span>
                <div className="growth-period-stops">
                  {[3, 6, 12, 24, 36].map(m => (
                    <button
                      key={m}
                      className={`growth-period-stop ${growthPeriodMonths === m ? 'active' : ''}`}
                      onClick={() => onGrowthPeriodChange(growthPeriodMonths === m ? null : m)}
                    >
                      {m}mo
                    </button>
                  ))}
                  <button
                    className={`growth-period-stop ${growthPeriodMonths === null ? 'active' : ''}`}
                    onClick={() => onGrowthPeriodChange(null)}
                  >
                    All
                  </button>
                </div>
              </div>
            )}
            <label className="size-metric-label" style={{ marginTop: 8 }}>
              Min Patents: {minPatents}
              <input
                type="range"
                min={0}
                max={50}
                value={minPatents}
                onChange={(e) => onMinPatentsChange(Number(e.target.value))}
                style={{ width: '100%', marginTop: 2 }}
              />
            </label>
            <label className="size-metric-label" style={{ marginTop: 4 }}>
              Min Grants: {minGrants}
              <input
                type="range"
                min={0}
                max={50}
                value={minGrants}
                onChange={(e) => onMinGrantsChange(Number(e.target.value))}
                style={{ width: '100%', marginTop: 2 }}
              />
            </label>
            <label className="layer-toggle" style={{ marginTop: 6 }}>
              <input
                type="checkbox"
                checked={hideSubsidiaries}
                onChange={(e) => onHideSubsidiariesChange(e.target.checked)}
              />
              Hide non-UK subsidiaries
            </label>
          </div>
        )}

        {/* Infrastructure */}
        <label className="layer-toggle">
          <input type="checkbox" checked={layers.infrastructure} onChange={() => onToggleLayer('infrastructure')} />
          <span className="layer-dot" style={{ background: '#8b5cf6' }} />
          Infrastructure
        </label>

        {/* Research Institutions */}
        <label className="layer-toggle">
          <input type="checkbox" checked={layers.institutions} onChange={() => onToggleLayer('institutions')} />
          <span className="layer-dot" style={{ background: '#10b981' }} />
          Research Institutions
        </label>
        {layers.institutions && (
          <div className="layer-sub-control">
            <label className="size-metric-label">
              Size by{' '}
              <select
                value={institutionSizeMetric}
                onChange={(e) => onInstitutionSizeMetricChange(e.target.value as InstitutionSizeMetric)}
                className="size-metric-select"
              >
                <option value="publications">Publications</option>
                <option value="citations">Citations</option>
                <option value="quality">% Top 10% Cited</option>
                <option value="fwci">FWCI</option>
              </select>
            </label>
            <span className="growth-period-label">
              Publications: {institutionPeriodYears ? `Last ${institutionPeriodYears}yr` : 'All time'}
            </span>
            <div className="growth-period-stops">
              {[1, 3, 5, 10].map(y => (
                <button
                  key={y}
                  className={`growth-period-stop ${institutionPeriodYears === y ? 'active' : ''}`}
                  onClick={() => onInstitutionPeriodChange(institutionPeriodYears === y ? null : y)}
                >
                  {y}yr
                </button>
              ))}
              <button
                className={`growth-period-stop ${institutionPeriodYears === null ? 'active' : ''}`}
                onClick={() => onInstitutionPeriodChange(null)}
              >
                All
              </button>
            </div>
            <span className="growth-period-label" style={{ marginTop: 6 }}>Type</span>
            <div className="sector-list">
              {[
                { value: 'education', label: 'Education' },
                { value: 'company', label: 'Company' },
                { value: 'facility', label: 'Facility' },
                { value: 'government', label: 'Government' },
                { value: 'nonprofit', label: 'Nonprofit' },
                { value: 'healthcare', label: 'Healthcare' },
                { value: 'international', label: 'International' },
              ].map(({ value, label }) => (
                <label key={value} className="sector-toggle">
                  <input
                    type="checkbox"
                    checked={selectedInstTypes.includes(value)}
                    onChange={() => {
                      onInstTypesChange(
                        selectedInstTypes.includes(value)
                          ? selectedInstTypes.filter(t => t !== value)
                          : [...selectedInstTypes, value]
                      );
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
            {selectedInstTypes.length > 0 && (
              <button className="filter-clear" onClick={() => onInstTypesChange([])}>Clear type filter</button>
            )}
          </div>
        )}

        {/* People / Talent */}
        <label className="layer-toggle">
          <input type="checkbox" checked={layers.people} onChange={() => onToggleLayer('people')} />
          <span className="layer-dot" style={{ background: '#f97316' }} />
          People / Talent
        </label>

        {/* Year range slider — visible when grants or patents layer is on */}
        {(layers.grants || layers.patents) && (
          <YearRangeSlider range={yearRange} onChange={onYearRangeChange} />
        )}
      </SidebarSection>

      {/* === FILTERS (default collapsed) === */}
      <SidebarSection title="Filters" badge={filterCount || null}>
        {/* RTIC Filter */}
        {photonics && (
          <SubSection title="RTIC Filter" badge={selectedSectors.length > 0 ? selectedSectors.length : null}>
            {selectedSectors.length > 0 && (
              <button className="filter-clear" onClick={() => onSectorsChange([])}>Clear all</button>
            )}
            <label className="sector-toggle sector-parent">
              <input
                type="checkbox"
                checked={selectedSectors.includes(photonics.code)}
                onChange={() => {
                  onSectorsChange(
                    selectedSectors.includes(photonics.code)
                      ? selectedSectors.filter(c => c !== photonics.code)
                      : [...selectedSectors, photonics.code]
                  );
                }}
              />
              <span className="rtic-filter-label">
                {photonics.name} <span className="rtic-filter-code">{photonics.code}</span>
              </span>
            </label>
            <div className="sector-list rtic-subsector-indent">
              {photonics.subsectors.map((sub) => (
                <label key={sub.code} className="sector-toggle">
                  <input
                    type="checkbox"
                    checked={selectedSectors.includes(sub.code)}
                    onChange={() => {
                      onSectorsChange(
                        selectedSectors.includes(sub.code)
                          ? selectedSectors.filter(c => c !== sub.code)
                          : [...selectedSectors, sub.code]
                      );
                    }}
                  />
                  <span className="rtic-filter-label">
                    {sub.name} <span className="rtic-filter-code">{sub.code}</span>
                  </span>
                </label>
              ))}
            </div>
          </SubSection>
        )}

        {/* Data Source Filter */}
        <SubSection title="Data Source" badge={selectedSources.length > 0 ? selectedSources.length : null}>
          {selectedSources.length > 0 && (
            <button className="filter-clear" onClick={() => onSourcesChange([])}>Clear all</button>
          )}
          <div className="sector-list">
            {SOURCE_OPTIONS.map((opt) => (
              <label key={opt.value} className="sector-toggle">
                <input
                  type="checkbox"
                  checked={selectedSources.includes(opt.value)}
                  onChange={() => {
                    onSourcesChange(
                      selectedSources.includes(opt.value)
                        ? selectedSources.filter(s => s !== opt.value)
                        : [...selectedSources, opt.value]
                    );
                  }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </SubSection>

        {/* Data Strength Filter */}
        <SubSection title="Data Strength" badge={selectedStrengths.length > 0 ? selectedStrengths.length : null}>
          {selectedStrengths.length > 0 && (
            <button className="filter-clear" onClick={() => onStrengthsChange([])}>Clear all</button>
          )}
          <div className="sector-list">
            {(['Strong', 'Moderate', 'Limited'] as const).map((level) => (
              <label key={level} className="sector-toggle">
                <input
                  type="checkbox"
                  checked={selectedStrengths.includes(level)}
                  onChange={() => {
                    onStrengthsChange(
                      selectedStrengths.includes(level)
                        ? selectedStrengths.filter(s => s !== level)
                        : [...selectedStrengths, level]
                    );
                  }}
                />
                {level}
              </label>
            ))}
          </div>
        </SubSection>
      </SidebarSection>

      {/* === ANALYSIS (default collapsed) === */}
      <SidebarSection title="Analysis" badge={analysisCount || null}>
        {/* Clustering */}
        <SubSection title="Clustering" badge={activeCluster ? 'on' : null}>
          <div className="cluster-group-label">DSIT</div>
          <div className="sector-list">
            {CLUSTER_OPTIONS.map((opt) => (
              <label key={opt.value} className="sector-toggle">
                <input
                  type="checkbox"
                  checked={activeCluster === opt.value}
                  onChange={() => onClusterChange(activeCluster === opt.value ? null : opt.value)}
                />
                <span>
                  {opt.label}
                  <span className="cluster-desc">{opt.description}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="cluster-group-label">ECIPE</div>
          <div className="sector-list">
            <label className="sector-toggle">
              <input
                type="checkbox"
                checked={activeCluster === 'ecipe'}
                onChange={() => onClusterChange(activeCluster === 'ecipe' ? null : 'ecipe')}
              />
              <span>
                Ecosystem Clusters
                <span className="cluster-desc">Funding ($10M+) + institutional presence (5+) within 30km</span>
              </span>
            </label>
          </div>
          <div className="cluster-group-label">Custom</div>
          <div className="sector-list">
            <label className="sector-toggle">
              <input
                type="checkbox"
                checked={activeCluster === 'composite'}
                onChange={() => onClusterChange(activeCluster === 'composite' ? null : 'composite')}
              />
              <span>
                Composite Score
                <span className="cluster-desc">Research + companies + funding + infrastructure</span>
              </span>
            </label>
            <label className="sector-toggle">
              <input
                type="checkbox"
                checked={activeCluster === 'research'}
                onChange={() => onClusterChange(activeCluster === 'research' ? null : 'research')}
              />
              <span>
                Research-Anchored
                <span className="cluster-desc">Seeded from top publication institutions</span>
              </span>
            </label>
          </div>
        </SubSection>

        {/* MaxQ Companies */}
        <SubSection title="MaxQ Companies" badge={maxqLevel > 0 ? `L${maxqLevel}` : null}>
          <div className="sector-list">
            {([
              { level: 1 as const, label: 'Level 1', desc: '≥$5M funding + Active + Score ≥60 + Round in last 5yr' },
              { level: 2 as const, label: 'Level 2', desc: 'Level 1 + Has patents' },
              { level: 3 as const, label: 'Level 3', desc: 'Level 1+2 + Has grant funding' },
            ]).map(({ level, label, desc }) => (
              <label key={level} className="sector-toggle">
                <input
                  type="checkbox"
                  checked={maxqLevel === level}
                  onChange={() => onMaxqLevelChange(maxqLevel === level ? 0 : level)}
                />
                <span>
                  {label}
                  <span className="cluster-desc">{desc}</span>
                </span>
              </label>
            ))}
          </div>
        </SubSection>

        {/* Collaborations */}
        <SubSection title="Collaborations">
          <label className="layer-toggle">
            <input
              type="checkbox"
              checked={layers.collaborations}
              onChange={() => onToggleLayer('collaborations')}
            />
            <span className="layer-dot" style={{ background: '#6366f1' }} />
            Company Collaborations
          </label>
          {layers.collaborations && (
            <div className="layer-sub-control">
              <label className="size-metric-label">
                Show{' '}
                <select
                  value={collabFilter}
                  onChange={(e) => onCollabFilterChange(e.target.value as CollabFilter)}
                  className="size-metric-select"
                >
                  <option value="all">All</option>
                  <option value="company">Company ↔ Company</option>
                  <option value="institution">Company ↔ Institution</option>
                </select>
              </label>
              <label className="size-metric-label" style={{ marginTop: 6 }}>
                Min shared grants: {collabMinShared}
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={collabMinShared}
                  onChange={(e) => onCollabMinSharedChange(Number(e.target.value))}
                  style={{ width: '100%', marginTop: 4 }}
                />
              </label>
              {collabEdgeCount != null && (
                <span className="size-metric-label">{collabEdgeCount.toLocaleString()} edges</span>
              )}
            </div>
          )}
          <label className="layer-toggle">
            <input
              type="checkbox"
              checked={grantNetworkEnabled}
              onChange={onToggleGrantNetwork}
            />
            <span className="layer-dot" style={{ background: '#06b6d4' }} />
            Grant Network
          </label>
          {grantNetworkEnabled && (
            <div className="layer-sub-control">
              <label className="size-metric-label">
                Min shared grants: {grantNetworkMinShared}
                <input
                  type="range"
                  min={2}
                  max={20}
                  value={grantNetworkMinShared}
                  onChange={(e) => onGrantNetworkMinSharedChange(Number(e.target.value))}
                  style={{ width: '100%', marginTop: 4 }}
                />
              </label>
              {grantEdgeCount != null && (
                <span className="size-metric-label">{grantEdgeCount.toLocaleString()} edges</span>
              )}
            </div>
          )}
          <label className="layer-toggle">
            <input
              type="checkbox"
              checked={researchNetworkEnabled}
              onChange={onToggleResearchNetwork}
            />
            <span className="layer-dot" style={{ background: '#a855f7' }} />
            Research Network
          </label>
          {researchNetworkEnabled && (
            <div className="layer-sub-control">
              <label className="size-metric-label">
                Min shared publications: {researchNetworkMinShared}
                <input
                  type="range"
                  min={2}
                  max={50}
                  value={researchNetworkMinShared}
                  onChange={(e) => onResearchNetworkMinSharedChange(Number(e.target.value))}
                  style={{ width: '100%', marginTop: 4 }}
                />
              </label>
              {researchEdgeCount != null && (
                <span className="size-metric-label">{researchEdgeCount.toLocaleString()} edges</span>
              )}
            </div>
          )}
        </SubSection>

        {/* Subsector Heatmap */}
        {photonics && (
          <SubSection title="Subsector Heatmap" badge={heatmapSubsector ? 'on' : null}>
            <select
              className="size-metric-select"
              style={{ width: '100%', padding: '6px 8px', fontSize: '12px' }}
              value={heatmapSubsector || ''}
              onChange={e => onHeatmapSubsectorChange(e.target.value || null)}
            >
              <option value="">Off</option>
              {photonics.subsectors.map(sub => (
                <option key={sub.code} value={sub.code}>{sub.name}</option>
              ))}
            </select>
          </SubSection>
        )}

        {/* Research Topics */}
        <div className="sidebar-section">
          <button
            className={`sidebar-topics-btn ${showTopics ? 'active' : ''}`}
            onClick={onToggleTopics}
          >
            Research Topics
          </button>
        </div>
      </SidebarSection>

      <div className="sidebar-footer">
        <p>Innovation Map · UK Photonics Ecosystem</p>
      </div>
    </div>
  );
}
