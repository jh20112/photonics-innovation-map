import { useState, useEffect, useCallback } from 'react';
import type {
  Company, Infrastructure, Institution, Grant, Patent, Person,
  Collaboration, ClusterData, ClusterType, RticSector, Stats, SearchResult,
} from '../types/api';

const API_BASE = '/api';

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function useApiData<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!path) { setData(null); setLoading(false); return; }

    let cancelled = false;
    setLoading(true);

    fetchApi<T>(path)
      .then(result => { if (!cancelled) setData(result); })
      .catch(err => { if (!cancelled) console.error(err); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [path]);

  return { data, loading };
}

export function useCompanies(enabled: boolean, sectors?: string[], sources?: string[], strengths?: string[]) {
  const params = new URLSearchParams();
  if (sectors && sectors.length > 0) params.set('sectors', sectors.join(','));
  if (sources && sources.length > 0) params.set('sources', sources.join(','));
  if (strengths && strengths.length > 0) params.set('strength', strengths.join(','));
  const qs = params.toString();
  return useApiData<Company[]>(enabled ? `/companies${qs ? `?${qs}` : ''}` : null);
}

export function useInfrastructure(enabled: boolean, sectors?: string[]) {
  const params = sectors && sectors.length > 0 ? `?sectors=${sectors.join(',')}` : '';
  return useApiData<Infrastructure[]>(enabled ? `/infrastructure${params}` : null);
}

export function useInstitutions(enabled: boolean, minWorks?: number) {
  const params = minWorks ? `?min_works=${minWorks}` : '';
  return useApiData<Institution[]>(enabled ? `/institutions${params}` : null);
}

export function useGrants(enabled: boolean, geocodedOnly = true) {
  return useApiData<Grant[]>(enabled ? `/grants?geocoded_only=${geocodedOnly}` : null);
}

export function usePatents(enabled: boolean) {
  return useApiData<Patent[]>(enabled ? '/patents' : null);
}

export function usePeople(enabled: boolean, geocodedOnly = true) {
  return useApiData<Person[]>(enabled ? `/people?geocoded_only=${geocodedOnly}` : null);
}

export function useCollaborations(entity: string | null) {
  return useApiData<Collaboration[]>(entity ? `/collaborations?entity=${encodeURIComponent(entity)}` : null);
}

export function useClusters(type: ClusterType | null) {
  return useApiData<ClusterData>(type ? `/clusters?type=${type}` : null);
}

export function useCoordsLookup() {
  return useApiData<Record<string, [number, number]>>('/coords');
}

export function useRticSectors() {
  return useApiData<RticSector[]>('/rtic-sectors');
}

export function useStats() {
  return useApiData<Stats>('/stats');
}

export interface TopicCount {
  topic: string;
  count: number;
}

export function useGrantTopics() {
  return useApiData<TopicCount[]>('/grants/topics');
}

export function useGrantEdges(enabled: boolean, minShared: number) {
  return useApiData<import('../types/api').GrantEdge[]>(
    enabled ? `/collaborations/grants?min_shared=${minShared}` : null
  );
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await fetchApi<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, search };
}
