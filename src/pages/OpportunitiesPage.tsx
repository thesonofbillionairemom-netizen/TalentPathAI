import { useState } from 'react';
import { Bookmark, BookmarkCheck, Briefcase, Loader2, MapPin, Search, Sparkles, X } from 'lucide-react';
import type { OpportunityMatch, OpportunityRecord } from '../types';
import { apiRequest } from '../lib/api';
import { TrustBadge } from '../components/TrustBadge';

interface OpportunitiesPageProps {
  mode: 'all' | 'saved';
  opportunities: OpportunityRecord[];
  savedMap: Record<string, string>;
  onRefresh: () => Promise<void>;
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'job', label: 'Jobs' },
  { id: 'mentorship', label: 'Mentorship' },
  { id: 'training', label: 'Training' },
  { id: 'fellowship', label: 'Fellowships' },
  { id: 'returnship', label: 'Returnships' },
  { id: 'development', label: 'Development' },
];

export function OpportunitiesPage({ mode, opportunities, savedMap, onRefresh }: OpportunitiesPageProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [skillFilter, setSkillFilter] = useState('');
  const [selectedOpp, setSelectedOpp] = useState<OpportunityRecord | null>(null);
  const [matches, setMatches] = useState<Record<string, OpportunityMatch>>({});
  const [matching, setMatching] = useState(false);
  const [matchNotice, setMatchNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const baseList =
    mode === 'saved' ? opportunities.filter((o) => Object.prototype.hasOwnProperty.call(savedMap, o.id)) : opportunities;

  const filtered = baseList.filter((o) => {
    if (category !== 'all' && o.category !== category) return false;
    const reqSkills = (JSON.parse(o.required_skills_json || '[]') as string[]).join(' ').toLowerCase();
    if (skillFilter.trim() && !reqSkills.includes(skillFilter.trim().toLowerCase())) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        o.title.toLowerCase().includes(q) ||
        o.organization.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        reqSkills.includes(q)
      );
    }
    return true;
  });

  const handleToggleSave = async (oppId: string) => {
    setBusyId(oppId);
    try {
      const isSaved = Object.prototype.hasOwnProperty.call(savedMap, oppId);
      if (isSaved) {
        await apiRequest(`/api/opportunities/${oppId}/save`, { method: 'DELETE' });
      } else {
        await apiRequest(`/api/opportunities/${oppId}/save`, {
          method: 'POST',
          body: JSON.stringify({ notes: '' }),
        });
      }
      await onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleRunMatch = async () => {
    setMatching(true);
    setMatchNotice(null);
    try {
      const res = await apiRequest<{
        mode: string;
        demoNotice?: string;
        matches: OpportunityMatch[];
      }>('/api/opportunities/match', { method: 'POST' });
      const map: Record<string, OpportunityMatch> = {};
      for (const m of res.matches) {
        map[m.opportunityId] = m;
      }
      setMatches(map);
      if (res.demoNotice) setMatchNotice(res.demoNotice);
    } finally {
      setMatching(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">
              {mode === 'saved' ? 'Saved Opportunities' : 'Opportunities & Mentorship'}
            </h1>
            <TrustBadge variant="demo_data" label="DEMO DATA" />
          </div>
          <p className="mt-1 text-sm text-[#475569]">
            {mode === 'saved'
              ? 'Review opportunities, mentorships, and training tracks you have bookmarked.'
              : 'Sample roles, mentorship programmes, fellowships, and returnships labeled DEMO DATA for demonstration.'}
          </p>
        </div>

        <button
          type="button"
          disabled={matching}
          onClick={handleRunMatch}
          className="inline-flex items-center gap-2 rounded-xl bg-[#7C5CFC] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6A48F5] disabled:opacity-60 transition-colors whitespace-nowrap"
        >
          {matching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          <span>Explain My Skill Matches</span>
        </button>
      </div>

      {matchNotice && (
        <div className="rounded-xl border border-[#F5A524]/40 bg-[#F5A524]/10 px-4 py-3 text-xs text-[#0B1F3A]">
          {matchNotice}
        </div>
      )}

      {/* Search & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2 relative">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs, mentorships, fellowships, or organizations..."
              className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none"
            />
          </div>
          <input
            type="text"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            placeholder="Filter by skill (e.g. Solar, CAD)"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                category === c.id
                  ? 'bg-[#0B1F3A] text-white'
                  : 'bg-[#F6F9FC] text-[#475569] hover:text-[#0B1F3A]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-[#475569]">
          {mode === 'saved'
            ? 'You have not saved any opportunities yet. Browse Opportunities & Mentorship to bookmark listings.'
            : 'No opportunities matched your current filters.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((opp) => {
            const isSaved = Object.prototype.hasOwnProperty.call(savedMap, opp.id);
            const reqSkills = JSON.parse(opp.required_skills_json || '[]') as string[];
            const match = matches[opp.id];
            return (
              <div
                key={opp.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#0FB5AE]/10"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#0B8A84]">{opp.category}</p>
                      <h2 className="mt-1 font-display text-lg font-bold text-[#0B1F3A]">{opp.title}</h2>
                      <p className="text-xs text-[#475569]">
                        {opp.organization} · {opp.work_mode}
                      </p>
                    </div>
                    <TrustBadge variant="demo_data" label="DEMO DATA" />
                  </div>

                  <p className="inline-flex items-center gap-1.5 text-xs text-[#475569]">
                    <MapPin className="h-3.5 w-3.5 text-[#0FB5AE]" />
                    <span>{opp.location}</span>
                  </p>

                  <p className="text-sm leading-relaxed text-[#475569]">{opp.description}</p>

                  {reqSkills.length > 0 && (
                    <p className="text-xs text-[#0B1F3A]">
                      <strong>Key skills:</strong> {reqSkills.join(' · ')}
                    </p>
                  )}

                  {(match || opp.match_guidance) && (
                    <div className="rounded-xl border border-[#7C5CFC]/25 bg-[#7C5CFC]/5 p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#7C5CFC]">Match Explanation</span>
                        {match && (
                          <span className="font-mono-tabular font-bold text-[#0B1F3A]">{match.matchScore}% Fit</span>
                        )}
                      </div>
                      <p className="text-[#475569]">{match ? match.reason : opp.match_guidance}</p>
                      {match && match.skillsGaps.length > 0 && (
                        <p className="text-[#B45309]">Gap to strengthen: {match.skillsGaps.join(', ')}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedOpp(opp)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B1F3A] hover:text-[#0FB5AE]"
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>View Details</span>
                  </button>

                  <button
                    type="button"
                    disabled={busyId === opp.id}
                    onClick={() => handleToggleSave(opp.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                      isSaved
                        ? 'bg-[#0FB5AE]/15 text-[#0B8A84] hover:bg-red-50 hover:text-red-600'
                        : 'border border-slate-200 text-[#0B1F3A] hover:bg-slate-50'
                    }`}
                  >
                    {isSaved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                    <span>{isSaved ? 'Saved (Remove)' : 'Save Opportunity'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F3A]/65 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <TrustBadge variant="demo_data" label="DEMO DATA" />
                <h2 className="mt-2 font-display text-xl font-bold text-[#0B1F3A]">{selectedOpp.title}</h2>
                <p className="text-xs text-[#475569]">
                  {selectedOpp.organization} · {selectedOpp.location} · {selectedOpp.work_mode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOpp(null)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Close opportunity details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm leading-relaxed text-[#475569]">{selectedOpp.description}</p>

            <div className="rounded-xl bg-[#F6F9FC] p-4 text-xs text-[#475569] space-y-1.5">
              <p className="font-semibold text-[#0B1F3A]">Demonstration Disclosure</p>
              <p>
                This listing is illustrative DEMO DATA showing how TalentPath AI matches displaced talent with Kenyan opportunities and mentorships. No placement guarantee or real external vacancy is implied.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleToggleSave(selectedOpp.id)}
                className="rounded-xl bg-[#0FB5AE] px-4 py-2 text-xs font-semibold text-[#0B1F3A] hover:bg-[#5ED6CF]"
              >
                {Object.prototype.hasOwnProperty.call(savedMap, selectedOpp.id)
                  ? 'Remove from Saved'
                  : 'Save Opportunity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
