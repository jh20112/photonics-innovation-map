export interface Company {
  id: number;
  name: string;
  lat: number;
  lng: number;
  website: string;
  city: string;
  postcode: string;
  employees: number | null;
  revenue_gbp: number | null;
  funding_usd_m: number | null;
  year_founded: number | null;
  description: string;
  rtic: RticEntry[];
  growth_stage: string;
  status: string;
  patent_count: number;
  grant_count: number;
  total_grant_funding_gbp: number | null;
  grants: CompanyGrant[];
  sources: string[];
  source_type: string;
  photonics_score: number | null;
  photonics_rationale: string;
  last_funding_date: string | null;
  last_funding_round: string | null;
  pitchbook_deals: { date: string; size: string; type: string; class: string; investors: string; synopsis: string }[] | null;
  latest_deal_date: string | null;
  ceo_name: string | null;
  ceo_biography: string | null;
  is_non_uk_subsidiary: boolean;
  parent_company: string | null;
  parent_country: string | null;
  is_startup: string;
  emp_growth_pct: number | null;
  emp_growth_abs: number | null;
  emp_earliest_count: number | null;
  emp_latest_count: number | null;
  emp_earliest_date: string | null;
  emp_latest_date: string | null;
  emp_timeseries: { date: string; count: number }[] | null;
  data_strength: 'Strong' | 'Moderate' | 'Limited';
  data_strength_score: number;
}

export interface CompanyGrant {
  reference: string;
  title: string;
  funder: string;
  amount_gbp: number | null;
  status: string;
}

export interface Infrastructure {
  id: number;
  name: string;
  lat: number;
  lng: number;
  classification: string;
  host_org: string;
  address: string;
  description: string;
  disciplines: string;
  economic_sectors: string;
  keywords: string;
  website: string;
  rtic: RticEntry[];
  infraportal_url: string;
}

export interface Institution {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rank: number | null;
  photonics_works: number | null;
  total_citations: number | null;
  avg_fwci: number | null;
  pct_top10_cited: number | null;
  citations_per_paper: number | null;
  top_topics: string[];
  publications_by_year: Record<string, number> | null;
  topic_breakdown: { topic: string; count: number }[] | null;
  cluster_id: number | null;
  n_grants: number | null;
  n_collaborators: number | null;
}

export interface Grant {
  id: string;
  reference: string;
  title: string;
  status: string;
  category: string;
  lead_funder: string;
  lead_org: string;
  lead_department: string;
  pi_name: string;
  funding_gbp: number | null;
  start_date: string;
  end_date: string;
  research_subjects: string;
  research_topics: string;
  abstract: string;
  potential_impact: string;
  gtr_url: string;
  lat: number | null;
  lng: number | null;
}

export interface Patent {
  id: number;
  publication_number: string;
  assignee: string;
  lat: number;
  lng: number;
  cpc_codes: string;
  earliest_filing: string;
  latest_filing: string;
}

export interface PersonPosition {
  org_name: string | null;
  city: string | null;
  country: string | null;
  role_title: string | null;
  department: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface PersonEducation {
  institution: string | null;
  city: string | null;
  country: string | null;
  degree: string | null;
  field: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface Person {
  id: number;
  name: string;
  orcid: string | null;
  current_org: string;
  current_org_type: 'company' | 'institution';
  department: string | null;
  role: 'principal_investigator' | 'director';
  lat: number | null;
  lng: number | null;
  grant_refs: string[];
  grant_count: number;
  total_grant_funding_gbp: number;
  publication_count: number | null;
  company_org: string | null;
  sources: string[];
  positions: PersonPosition[] | null;
  education: PersonEducation[] | null;
}

export interface GrantEdge {
  org_a_id: string;
  org_a_name: string;
  org_b_id: string;
  org_b_name: string;
  shared_grants: number;
  same_cluster: boolean;
}

export interface Collaboration {
  company: string;
  company_grant_org: string;
  collaborator: string;
  collaborator_is_company: boolean;
  shared_grants: number;
  collaborator_roles: string;
  company_total_grants: number;
}

export interface RticEntry {
  code: string;
  name: string;
  type: 'sector' | 'subsector';
  parent_code?: string;
  parent_name?: string;
}

export interface RticSector {
  code: string;
  name: string;
  subsectors: { code: string; name: string }[];
}

export interface Stats {
  companies: number;
  infrastructure: number;
  institutions: number;
  grants: number;
  grants_geocoded: number;
  patents: number;
  company_collaborations: number;
  grant_edges: number;
  clusters: number;
  total_funding_gbp: number;
  people: number;
}

export interface SearchResult {
  type: 'company' | 'infrastructure' | 'institution' | 'person';
  id: number | string;
  name: string;
  lat: number;
  lng: number;
}

export type LayerType = 'companies' | 'infrastructure' | 'institutions' | 'grants' | 'patents' | 'collaborations' | 'people';

export type InstitutionSizeMetric = 'publications' | 'citations' | 'quality' | 'fwci';

export type CompanySizeMetric = 'off' | 'employees' | 'funding_usd_m' | 'total_grant_funding_gbp' | 'patent_count' | 'emp_growth_pct';

export type ClusterType = 'geographic' | 'collaboration' | 'technology' | 'ecipe' | 'composite' | 'research';

export interface ClusterSummary {
  dominant_sector: string;
  region: string;
  total_employees: number;
  total_patents: number;
  total_grants: number;
  total_funding_gbp: number;
  top_companies: string[];
}

export interface Cluster {
  id: number;
  label: string;
  colour: string;
  member_count: number;
  boundary: [number, number][] | null;
  centroid: [number, number];
  summary: ClusterSummary;
}

export interface ClusterAssignment {
  company_id: number;
  company_name: string;
  cluster_id: number;
}

export interface ClusterData {
  clusters: Cluster[];
  assignments: ClusterAssignment[];
}

export type EntityDetail =
  | { type: 'company'; data: Company }
  | { type: 'infrastructure'; data: Infrastructure }
  | { type: 'institution'; data: Institution }
  | { type: 'grant'; data: Grant }
  | { type: 'patent'; data: Patent }
  | { type: 'cluster'; data: Cluster; members: Company[] }
  | { type: 'person'; data: Person };
