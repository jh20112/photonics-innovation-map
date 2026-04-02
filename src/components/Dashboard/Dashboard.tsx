import { useState, useEffect } from 'react';
import { OverviewTab } from './OverviewTab';
import { CompaniesTab } from './CompaniesTab';
import { InstitutionsTab } from './InstitutionsTab';
import { GrantsTab } from './GrantsTab';
import { ClustersTab } from './ClustersTab';
import type { Company, Institution, Grant, Patent, ClusterType, RticSector } from '../../types/api';
import type { GrantEdge } from '../../types/api';
import './Dashboard.css';

type DashTab = 'overview' | 'companies' | 'institutions' | 'grants' | 'clusters';

interface Props {
  companies: Company[] | null;
  institutions: Institution[] | null;
  grants: Grant[] | null;
  patents: Patent[] | null;
  grantEdges: GrantEdge[] | null;
  sectors: RticSector[] | null;
  onSelectCompany: (c: Company) => void;
  onSelectInstitution: (i: Institution) => void;
  onSelectGrant: (g: Grant) => void;
  onSelectCluster: (clusterId: number, clusterType: ClusterType) => void;
  initialTab?: DashTab;
}

const TABS: { key: DashTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'companies', label: 'Companies' },
  { key: 'institutions', label: 'Institutions' },
  { key: 'grants', label: 'Grants' },
  { key: 'clusters', label: 'Clusters' },
];

export function Dashboard({
  companies, institutions, grants, patents, grantEdges, sectors,
  onSelectCompany, onSelectInstitution, onSelectGrant, onSelectCluster, initialTab,
}: Props) {
  const [activeTab, setActiveTab] = useState<DashTab>(initialTab || 'overview');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="dashboard">
      <div className="dash-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`dash-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="dash-content">
        {activeTab === 'overview' && (
          <OverviewTab
            companies={companies}
            grants={grants}
            patents={patents}
            grantEdges={grantEdges}
            sectors={sectors}
          />
        )}
        {activeTab === 'companies' && (
          <CompaniesTab companies={companies} onSelect={onSelectCompany} />
        )}
        {activeTab === 'institutions' && (
          <InstitutionsTab institutions={institutions} onSelect={onSelectInstitution} />
        )}
        {activeTab === 'grants' && (
          <GrantsTab grants={grants} onSelect={onSelectGrant} />
        )}
        {activeTab === 'clusters' && (
          <ClustersTab onSelectCluster={onSelectCluster} />
        )}
      </div>
    </div>
  );
}
