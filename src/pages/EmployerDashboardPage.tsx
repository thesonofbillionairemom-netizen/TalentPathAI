import { useEffect, useState } from 'react';
import { Eye, Loader2, Lock, Users } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { TrustBadge } from '../components/TrustBadge';

interface ConsentedCandidateSummary {
  id: string;
  full_name: string;
  is_demo: number;
  headline: string;
  current_location: string;
  target_sector: string;
  years_experience: number;
  completeness_score: number;
}

interface CandidateDetailPayload {
  candidate: { id: string; full_name: string; is_demo: number };
  profile: {
    headline: string;
    bio: string;
    current_location: string;
    years_experience: number;
    target_sector: string;
    career_goals: string;
  };
  skills: Array<{ id: string; name: string; category: string; proficiency: string; source: string }>;
  qualifications: Array<{ id: string; title: string; institution: string; year_obtained: string; level: string; status: string }>;
  experience: Array<{ id: string; job_title: string; organization: string; start_year: string; end_year: string; description: string }>;
  portfolio: { title: string; summary: string; strengths_json: string; gaps_json: string; mode: string } | null;
  documentSummaries: Array<{ id: string; original_name: string; category: string; extracted_summary: string }>;
}

export function EmployerDashboardPage() {
  const [candidates, setCandidates] = useState<ConsentedCandidateSummary[]>([]);
  const [selected, setSelected] = useState<CandidateDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ candidates: ConsentedCandidateSummary[] }>('/api/employer/candidates')
      .then((res) => setCandidates(res.candidates))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load consented candidates.'))
      .finally(() => setLoading(false));
  }, []);

  const openCandidate = async (id: string) => {
    setDetailLoading(true);
    setError(null);
    try {
      const detail = await apiRequest<CandidateDetailPayload>(`/api/employer/candidates/${id}`);
      setSelected(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Access denied or unavailable.');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">
          Employer &amp; Mentor Talent Portal
        </h1>
        <p className="mt-1 text-sm text-[#475569]">
          Showing only candidates who have explicitly enabled sharing consent in their Privacy Settings.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#475569]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading consented candidate profiles...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-3">
            {candidates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-[#475569]">
                No candidates currently have sharing enabled.
              </div>
            ) : (
              candidates.map((c) => (
                <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#0FB5AE]" />
                      <h2 className="font-display text-base font-bold text-[#0B1F3A]">{c.full_name}</h2>
                    </div>
                    {c.is_demo === 1 && <TrustBadge variant="demo_data" label="SAMPLE DATA" />}
                  </div>
                  <p className="text-xs font-medium text-[#475569]">{c.headline || 'Displaced Professional'}</p>
                  <p className="text-xs text-[#475569]">
                    {c.current_location} · {c.years_experience} yrs exp · {c.target_sector}
                  </p>
                  <button
                    type="button"
                    onClick={() => openCandidate(c.id)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#0B1F3A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#12305A]"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Review Shared Portfolio</span>
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-7">
            {detailLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-[#475569]">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0FB5AE]" />
                <p className="mt-2">Loading consented portfolio...</p>
              </div>
            ) : !selected ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-[#475569]">
                <Lock className="mx-auto h-8 w-8 text-[#0FB5AE]" />
                <p className="mt-3 font-semibold text-[#0B1F3A]">Consent-Protected Candidate Review</p>
                <p className="mt-1">Select a consented candidate on the left to view their shared portfolio and skills.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-bold text-[#0B1F3A]">{selected.candidate.full_name}</h2>
                    {selected.candidate.is_demo === 1 && <TrustBadge variant="demo_data" label="SAMPLE DATA" />}
                  </div>
                  <p className="mt-1 text-sm text-[#0B8A84] font-medium">{selected.profile?.headline}</p>
                  <p className="mt-2 text-sm text-[#475569]">{selected.profile?.bio}</p>
                </div>

                {selected.portfolio && (
                  <div className="rounded-xl border border-slate-200 bg-[#F6F9FC] p-4 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#0B8A84]">Shared Portfolio Summary</p>
                    <p className="text-sm text-[#0B1F3A] leading-relaxed">{selected.portfolio.summary}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-display text-sm font-bold text-[#0B1F3A]">Skills &amp; Provenance</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selected.skills.map((s) => (
                      <div key={s.id} className="rounded-lg border border-slate-200 bg-[#F6F9FC] px-3 py-1.5 text-xs">
                        <span className="font-semibold text-[#0B1F3A]">{s.name}</span>{' '}
                        <span className="text-[#475569]">({s.source.replace(/_/g, ' ')})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selected.documentSummaries.length > 0 && (
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#0B1F3A]">
                      Document Summaries (Files remain private)
                    </h3>
                    <div className="mt-2 space-y-2">
                      {selected.documentSummaries.map((d) => (
                        <div key={d.id} className="rounded-xl border border-slate-200 p-3 text-xs">
                          <p className="font-semibold text-[#0B1F3A]">{d.original_name}</p>
                          <p className="mt-1 text-[#475569]">{d.extracted_summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
