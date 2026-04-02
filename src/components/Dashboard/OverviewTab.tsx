import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Company, Grant, Patent, RticSector, GrantEdge, ResearchEdge } from '../../types/api';
import './OverviewTab.css';

interface Props {
  companies: Company[] | null;
  grants: Grant[] | null;
  patents: Patent[] | null;
  grantEdges: GrantEdge[] | null;
  researchEdges: ResearchEdge[] | null;
  sectors: RticSector[] | null;
}

function formatFunding(value: number): string {
  if (value >= 1e9) return `£${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `£${(value / 1e6).toFixed(0)}M`;
  if (value >= 1e3) return `£${(value / 1e3).toFixed(0)}K`;
  return `£${value}`;
}

export function OverviewTab({ companies, grants, patents, grantEdges, researchEdges }: Props) {
  // Chart 1: Funding by year
  const fundingByYear = useMemo(() => {
    if (!grants) return [];
    const map = new Map<number, number>();
    for (const g of grants) {
      const year = g.start_date ? parseInt(g.start_date.slice(0, 4)) : null;
      if (year && year >= 2000 && g.funding_gbp) {
        map.set(year, (map.get(year) || 0) + g.funding_gbp);
      }
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([year, total]) => ({ year, total }));
  }, [grants]);

  // Chart 2: Patent filing trends
  const patentsByYear = useMemo(() => {
    if (!patents) return [];
    const map = new Map<number, number>();
    for (const p of patents) {
      const year = p.earliest_filing ? parseInt(p.earliest_filing.slice(0, 4)) : null;
      if (year && year >= 2000) {
        map.set(year, (map.get(year) || 0) + 1);
      }
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([year, count]) => ({ year, count }));
  }, [patents]);

  // Chart 3: Company formation
  const companyFormation = useMemo(() => {
    if (!companies) return [];
    const map = new Map<number, number>();
    for (const c of companies) {
      if (c.year_founded && c.year_founded >= 1980) {
        map.set(c.year_founded, (map.get(c.year_founded) || 0) + 1);
      }
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([year, count]) => ({ year, count }));
  }, [companies]);

  // Chart 4: Sector distribution (top 10)
  const sectorDist = useMemo(() => {
    if (!companies) return [];
    const map = new Map<string, number>();
    for (const c of companies) {
      for (const r of c.rtic || []) {
        if (r.type === 'sector') {
          map.set(r.name, (map.get(r.name) || 0) + 1);
        }
      }
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name: name.length > 20 ? name.slice(0, 20) + '…' : name, count }));
  }, [companies]);

  // Chart 5: Top grant collaborating pairs
  const topCollabs = useMemo(() => {
    if (!grantEdges) return [];
    return [...grantEdges]
      .sort((a, b) => b.shared_grants - a.shared_grants)
      .slice(0, 12)
      .map(e => ({
        pair: `${e.org_a_name.slice(0, 18)}${e.org_a_name.length > 18 ? '…' : ''} ↔ ${e.org_b_name.slice(0, 18)}${e.org_b_name.length > 18 ? '…' : ''}`,
        shared: e.shared_grants,
      }));
  }, [grantEdges]);

  // Chart 6: Top research collaborating pairs
  const topResearchCollabs = useMemo(() => {
    if (!researchEdges) return [];
    return [...researchEdges]
      .sort((a, b) => b.shared_publications - a.shared_publications)
      .slice(0, 12)
      .map(e => ({
        pair: `${e.inst_a.slice(0, 18)}${e.inst_a.length > 18 ? '…' : ''} ↔ ${e.inst_b.slice(0, 18)}${e.inst_b.length > 18 ? '…' : ''}`,
        shared: e.shared_publications,
      }));
  }, [researchEdges]);

  if (!grants && !patents && !companies) {
    return <div className="overview-loading">Loading data...</div>;
  }

  return (
    <div className="overview-grid">
      {/* Funding by Year */}
      <div className="overview-card full-width">
        <h3 className="overview-card-title">Grant Funding by Year</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={fundingByYear}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={formatFunding} tick={{ fontSize: 11 }} width={65} />
            <Tooltip formatter={(value) => formatFunding(Number(value))} />
            <Area type="monotone" dataKey="total" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Patent Filing Trends */}
      <div className="overview-card">
        <h3 className="overview-card-title">Patent Filing Trends</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={patentsByYear}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={35} />
            <Tooltip />
            <Bar dataKey="count" fill="#f59e0b" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Company Formation */}
      <div className="overview-card">
        <h3 className="overview-card-title">Company Formation</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={companyFormation}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={35} />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sector Distribution */}
      <div className="overview-card">
        <h3 className="overview-card-title">Top Sectors by Company Count</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={sectorDist} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
            <Tooltip />
            <Bar dataKey="count" fill="#8b5cf6" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Grant Collaborating Pairs */}
      <div className="overview-card">
        <h3 className="overview-card-title">Top Grant Collaborations</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={topCollabs} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="pair" tick={{ fontSize: 9 }} width={180} />
            <Tooltip />
            <Bar dataKey="shared" fill="#06b6d4" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Research Collaborating Pairs */}
      <div className="overview-card">
        <h3 className="overview-card-title">Top Research Collaborations</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={topResearchCollabs} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="pair" tick={{ fontSize: 9 }} width={180} />
            <Tooltip />
            <Bar dataKey="shared" fill="#a855f7" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
