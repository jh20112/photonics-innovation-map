import { useState, useEffect, useCallback, useRef } from 'react';
import type { EntityDetail, Collaboration, ResearchEdge, Patent, Company } from '../../types/api';
import { CompanyPanel } from './panels/CompanyPanel';
import { InfrastructurePanel } from './panels/InfrastructurePanel';
import { InstitutionPanel } from './panels/InstitutionPanel';
import { GrantPanel } from './panels/GrantPanel';
import { PatentPanel } from './panels/PatentPanel';
import { ClusterPanel } from './panels/ClusterPanel';
import { PersonPanel } from './panels/PersonPanel';
import './InfoPanel.css';

interface Props {
  detail: EntityDetail | null;
  onClose: () => void;
  onShowCollaborations: (name: string, coords: [number, number]) => void;
  allPatents: Patent[] | null;
  companyByName: Map<string, Company>;
}

const API_BASE = '/api';

export function InfoPanel({ detail, onClose, onShowCollaborations, allPatents, companyByName }: Props) {
  const [stack, setStack] = useState<EntityDetail[]>([]);
  const [collabs, setCollabs] = useState<Collaboration[] | null>(null);
  const [collabLoading, setCollabLoading] = useState(false);
  const collabEntityRef = useRef<string | null>(null);
  const [researchCollabs, setResearchCollabs] = useState<ResearchEdge[] | null>(null);
  const [researchCollabLoading, setResearchCollabLoading] = useState(false);
  const researchCollabRef = useRef<string | null>(null);

  // When external detail changes (map click), reset stack
  useEffect(() => {
    if (detail) {
      setStack([detail]);
      setCollabs(null);
      collabEntityRef.current = null;
      setResearchCollabs(null);
      researchCollabRef.current = null;
    } else {
      setStack([]);
    }
  }, [detail]);

  const current = stack[stack.length - 1] ?? null;

  const navigate = useCallback((newDetail: EntityDetail) => {
    setStack(prev => [...prev.slice(0, 5), newDetail]);
    setCollabs(null);
    collabEntityRef.current = null;
    setResearchCollabs(null);
    researchCollabRef.current = null;
  }, []);

  const goBack = useCallback(() => {
    setStack(prev => prev.slice(0, -1));
    setCollabs(null);
    collabEntityRef.current = null;
    setResearchCollabs(null);
    researchCollabRef.current = null;
  }, []);

  const loadCollabs = useCallback((name: string) => {
    if (collabEntityRef.current === name) return;
    collabEntityRef.current = name;
    setCollabLoading(true);
    fetch(`${API_BASE}/collaborations?entity=${encodeURIComponent(name)}`)
      .then(r => r.json())
      .then(data => setCollabs(data))
      .catch(() => setCollabs([]))
      .finally(() => setCollabLoading(false));
  }, []);

  const loadResearchCollabs = useCallback((name: string) => {
    if (researchCollabRef.current === name) return;
    researchCollabRef.current = name;
    setResearchCollabLoading(true);
    fetch(`${API_BASE}/collaborations/research?inst_name=${encodeURIComponent(name)}`)
      .then(r => r.json())
      .then(data => setResearchCollabs(data))
      .catch(() => setResearchCollabs([]))
      .finally(() => setResearchCollabLoading(false));
  }, []);

  // Keyboard: Escape to close/go back
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (stack.length > 1) goBack();
        else onClose();
      }
    }
    if (current) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [current, stack.length, goBack, onClose]);

  if (!current) return null;

  const canGoBack = stack.length > 1;
  const prevName = canGoBack ? getEntityName(stack[stack.length - 2]) : null;

  // Compute patents for current company
  const companyPatents = current.type === 'company' && allPatents
    ? allPatents.filter(p => p.assignee?.toUpperCase() === current.data.name.toUpperCase())
    : [];

  // Compute matched company for current patent
  const matchedCompany = current.type === 'patent'
    ? companyByName.get(current.data.assignee?.toUpperCase()) ?? null
    : null;

  return (
    <div className="info-panel">
      <div className="info-topbar">
        {canGoBack && (
          <button className="info-back" onClick={goBack}>
            &#8249; {prevName && prevName.length > 20 ? prevName.slice(0, 20) + '...' : prevName}
          </button>
        )}
        <span className={`info-type-badge ${current.type}`}>{current.type}</span>
        <button className="info-close" onClick={onClose}>&times;</button>
      </div>

      <div className="info-body">
        {current.type === 'company' && (
          <CompanyPanel
            company={current.data}
            patents={companyPatents}
            collaborations={collabs}
            collabLoading={collabLoading}
            onLoadCollaborations={loadCollabs}
            onNavigate={navigate}
            onShowCollaborations={onShowCollaborations}
          />
        )}
        {current.type === 'infrastructure' && (
          <InfrastructurePanel facility={current.data} />
        )}
        {current.type === 'institution' && (
          <InstitutionPanel
            institution={current.data}
            collaborations={collabs}
            collabLoading={collabLoading}
            onLoadCollaborations={loadCollabs}
            researchCollabs={researchCollabs}
            researchCollabLoading={researchCollabLoading}
            onLoadResearchCollabs={loadResearchCollabs}
            onNavigate={navigate}
            onShowCollaborations={onShowCollaborations}
          />
        )}
        {current.type === 'grant' && (
          <GrantPanel grant={current.data} onNavigate={navigate} />
        )}
        {current.type === 'patent' && (
          <PatentPanel patent={current.data} matchedCompany={matchedCompany} onNavigate={navigate} />
        )}
        {current.type === 'cluster' && (
          <ClusterPanel cluster={current.data} members={current.members} onNavigate={navigate} />
        )}
        {current.type === 'person' && (
          <PersonPanel person={current.data} onNavigate={navigate} />
        )}
      </div>
    </div>
  );
}

function getEntityName(detail: EntityDetail): string {
  switch (detail.type) {
    case 'company': return detail.data.name;
    case 'infrastructure': return detail.data.name;
    case 'institution': return detail.data.name;
    case 'grant': return detail.data.title;
    case 'patent': return detail.data.publication_number;
    case 'cluster': return detail.data.label;
    case 'person': return detail.data.name;
  }
}
