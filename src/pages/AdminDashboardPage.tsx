import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, Plus, Shield, Trash2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OpportunityRecord } from '../types';
import { apiRequest } from '../lib/api';
import { TrustBadge } from '../components/TrustBadge';

interface AdminOverviewResponse {
  counts: {
    users: number;
    candidates: number;
    employers: number;
    documents: number;
    assessments: number;
    pathways: number;
    opportunities: number;
    portfolios: number;
  };
  opportunities: OpportunityRecord[];
  aiConfigured: boolean;
}

export function AdminDashboardPage({ onOpportunitiesChanged }: { onOpportunitiesChanged: () => Promise<void> }) {
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [category, setCategory] = useState('job');
  const [location, setLocation] = useState('Nairobi, Kenya');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const loadOverview = async () => {
    try {
      const res = await apiRequest<AdminOverviewResponse>('/api/admin/overview');
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const handleCreateOpp = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await apiRequest('/api/admin/opportunities', {
        method: 'POST',
        body: JSON.stringify({
          title,
          organization,
          category,
          location,
          workMode: 'Hybrid',
          requiredSkills,
          description,
          matchGuidance: 'Added via Administrator Console (DEMO DATA).',
        }),
      });
      setTitle('');
      setOrganization('');
      setRequiredSkills('');
      setDescription('');
      await loadOverview();
      await onOpportunitiesChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add opportunity.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#475569]">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading Administrator Console...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error || 'Administrator access required.'}
      </div>
    );
  }

  const chartData = [
    { metric: 'Candidates', count: data.counts.candidates },
    { metric: 'Employers', count: data.counts.employers },
    { metric: 'Documents', count: data.counts.documents },
    { metric: 'Assessments', count: data.counts.assessments },
    { metric: 'Pathways', count: data.counts.pathways },
    { metric: 'Portfolios', count: data.counts.portfolios },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#0FB5AE]" />
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">Administrator Dashboard</h1>
          </div>
          <p className="mt-1 text-sm text-[#475569]">
            Monitor aggregate platform metrics and manage demonstration opportunity listings.
          </p>
        </div>
        <span className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#0B1F3A]">
          Gemini AI Status: {data.aiConfigured ? 'Configured' : 'Demo Fallback Active'}
        </span>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Users', val: data.counts.users },
          { label: 'Stored Documents', val: data.counts.documents },
          { label: 'AI Assessments', val: data.counts.assessments },
          { label: 'Opportunities', val: data.counts.opportunities },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-[#475569]">{stat.label}</p>
            <p className="mt-2 font-mono-tabular text-3xl font-bold text-[#0B1F3A]">{stat.val}</p>
          </div>
        ))}
      </div>

      {/* Platform Activity Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Platform Activity Overview</h2>
        <div className="mt-5 h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="metric" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#12305A" radius={[8, 8, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Opportunity Management */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form onSubmit={handleCreateOpp} className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Add Demo Opportunity</h2>
            <TrustBadge variant="demo_data" label="DEMO DATA" />
          </div>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Opportunity Title *"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
          />
          <input
            type="text"
            required
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="Organization *"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="job">Job</option>
              <option value="mentorship">Mentorship</option>
              <option value="training">Training</option>
              <option value="fellowship">Fellowship</option>
              <option value="returnship">Returnship</option>
              <option value="development">Development</option>
            </select>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <input
            type="text"
            value={requiredSkills}
            onChange={(e) => setRequiredSkills(e.target.value)}
            placeholder="Required skills (comma-separated)"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
          />
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opportunity description..."
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={creating}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0FB5AE] px-4 py-2.5 text-sm font-semibold text-[#0B1F3A] hover:bg-[#5ED6CF]"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span>Publish Demo Listing</span>
          </button>
        </form>

        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#0B1F3A]">
            Managed Opportunity Listings ({data.opportunities.length})
          </h2>
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {data.opportunities.map((opp) => (
              <div key={opp.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-[#F6F9FC] p-3.5">
                <div>
                  <p className="text-sm font-bold text-[#0B1F3A]">{opp.title}</p>
                  <p className="text-xs text-[#475569]">
                    {opp.organization} · {opp.location} · <span className="capitalize">{opp.category}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await apiRequest(`/api/admin/opportunities/${opp.id}`, { method: 'DELETE' });
                    await loadOverview();
                    await onOpportunitiesChanged();
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete opportunity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
