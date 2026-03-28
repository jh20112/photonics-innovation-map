import { useState } from 'react';
import { CompaniesTab } from './CompaniesTab';
import { InstitutionsTab } from './InstitutionsTab';
import { GrantsTab } from './GrantsTab';
import { ClustersTab } from './ClustersTab';
import type { Company, Institution, Grant, ClusterType } from '../../types/api';
import './Dashboard.css';

type DashTab = 'companies' | 'institutions' | 'grants' | 'clusters';

interface Props {
  companies: Company[] | null;
  institutions: Institution[] | null;
  grants: Grant[] | null;
  onSelectCompany: (c: Company) => void;
  onSelectInstitution: (i: Institution) => void;
  onSelectGrant: (g: Grant) => void;
  onSelectCluster: (clusterId: number, clusterType: ClusterType) => void;
}

const TABS: { key: DashTab; label: string }[] = [
  { key: 'companies', label: 'Companies' },
  { key: 'institutions', label: 'Institutions' },
  { key: 'grants', label: 'Grants' },
  { key: 'clusters', label: 'Clusters' },
];

export function Dashboard({
  companies, institutions, grants,
  onSelectCompany, onSelectInstitution, onSelectGrant, onSelectCluster,
}: Props) {
  const [activeTab, setActiveTab] = useState<DashTab>('companies');

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
