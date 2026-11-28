import { useMemo, useState } from 'react';
import {
  Check,
  Loader2,
  MapPin,
  Send,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { AppRoute, MentorPeerRecord, SkillRecord } from '../types';
import type { SectorGapSummary } from '../lib/sectorBenchmarks';
import { TrustBadge } from './TrustBadge';

interface KenyanMentorsSectionProps {
  mentors: MentorPeerRecord[];
  loading: boolean;
  error: string | null;
  gapSummary: SectorGapSummary;
  skills: SkillRecord[];
  userLocation: string;
  shareWithMentors: boolean;
  onConnect: (mentorId: string, message: string, targetSector: string) => Promise<void>;
  onWithdraw: (mentorId: string) => Promise<void>;
  onNavigate: (route: AppRoute) => void;
}

function parseExpertise(json: string): string[] {
  try {
    const arr = JSON.parse(json || '[]');
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

function getInitials(name: string): string {
  const cleaned = name.replace(/\(SAMPLE.*?\)/gi, '').replace(/^(Eng\.|Dr\.)\s+/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'KE';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function KenyanMentorsSection({
  mentors,
  loading,
  error,
  gapSummary,
  skills,
  userLocation,
  shareWithMentors,
  onConnect,
  onWithdraw,
  onNavigate,
}: KenyanMentorsSectionProps) {
  const [roleFilter, setRoleFilter] = useState<'all' | 'mentor' | 'industry_peer'>('all');
  const [scopeMode, setScopeMode] = useState<'matched' | 'all_sectors'>('matched');
  const [composingMentorId, setComposingMentorId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const sectorName = gapSummary.benchmark.sectorName;
  const activeSectorId = gapSummary.benchmark.id;
  const topGapName = gapSummary.topGaps[0]?.shortLabel || gapSummary.topGaps[0]?.name || '';

  const rankedMentors = useMemo(() => {
    const skillText = skills.map((s) => s.name.toLowerCase()).join(' ');
    const gapWords = gapSummary.topGaps
      .flatMap((g) => g.name.toLowerCase().split(/[^a-z0-9]+/))
      .filter((w) => w.length > 3);
    const sectorWords = sectorName
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3);
    const locCity = userLocation.split(',')[0].trim().toLowerCase();

    return mentors
      .map((m) => {
        const expertise = parseExpertise(m.expertise_json);
        const haystack = `${m.sector_label} ${m.role_title} ${m.bio} ${expertise.join(' ')}`.toLowerCase();

        let score = 0;
        if (m.sector_id === activeSectorId) score += 10;
        for (const sw of sectorWords) {
          if (haystack.includes(sw)) score += 2;
        }
        for (const gw of gapWords) {
          if (haystack.includes(gw)) score += 2;
        }
        for (const exp of expertise) {
          const firstWord = exp.toLowerCase().split(/[^a-z0-9]+/).find((w) => w.length > 3);
          if (firstWord && skillText.includes(firstWord)) score += 1;
        }
        if (locCity && m.location.toLowerCase().includes(locCity)) score += 1;

        const isDirectSectorMatch =
          m.sector_id === activeSectorId || sectorWords.some((sw) => m.sector_label.toLowerCase().includes(sw));

        let matchReason = `Active in ${m.sector_label} across Kenya.`;
        if (isDirectSectorMatch && topGapName) {
          matchReason = `Aligned with ${sectorName} and helpful for bridging ${topGapName}.`;
        } else if (isDirectSectorMatch) {
          matchReason = `Aligned with your ${sectorName} career path.`;
        }

        return {
          mentor: m,
          expertise,
          score,
          isDirectSectorMatch,
          matchReason,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [mentors, activeSectorId, sectorName, gapSummary.topGaps, skills, userLocation, topGapName]);

  const filteredMentors = useMemo(() => {
    const byRole = rankedMentors.filter((entry) =>
      roleFilter === 'all' ? true : entry.mentor.peer_type === roleFilter
    );
    if (scopeMode === 'all_sectors') {
      return byRole;
    }
    const matched = byRole.filter((entry) => entry.isDirectSectorMatch || entry.score >= 3);
    return matched.length > 0 ? matched : byRole.slice(0, 4);
  }, [rankedMentors, roleFilter, scopeMode]);

  const requestedCount = mentors.filter((m) => m.connection_status === 'requested').length;

  const openComposer = (mentor: MentorPeerRecord) => {
    const focusClause = topGapName ? ` and closing my ${topGapName} gap` : '';
    const defaultNote = `Hello ${mentor.full_name.replace(/\s*\(SAMPLE\)/i, '')}, I am building my career path in ${sectorName} in Kenya${focusClause} and would appreciate a brief introduction.`;
    setActionError(null);
    setComposingMentorId(mentor.id);
    setDraftMessage(defaultNote);
  };

  const handleSendRequest = async (mentorId: string) => {
    setSubmittingId(mentorId);
    setActionError(null);
    try {
      await onConnect(mentorId, draftMessage.trim(), sectorName);
      setComposingMentorId(null);
      setDraftMessage('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to send connection request.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleWithdraw = async (mentorId: string) => {
    setSubmittingId(mentorId);
    setActionError(null);
    try {
      await onWithdraw(mentorId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to withdraw request.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <section
      aria-labelledby="kenyan-mentors-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6"
    >
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#475569]">
            <span className="font-semibold text-[#0B8A84]">Kenyan Mentorship & Peer Network</span>
            <span aria-hidden="true">·</span>
            <span>{sectorName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular font-semibold text-[#0B1F3A]">
              {requestedCount} request{requestedCount === 1 ? '' : 's'} sent
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <h2
              id="kenyan-mentors-heading"
              className="font-display text-lg sm:text-xl font-bold text-[#0B1F3A] text-balance"
            >
              Local Mentors & Industry Peers in Kenya
            </h2>
            <TrustBadge variant="demo_data" label="DEMO PROFILES" />
          </div>

          <p className="mt-1 text-xs leading-relaxed text-[#475569]">
            Suggested mentors and experienced peers in Kenya matched to your target career sector and KNQA/TVETA recognition goals. Initiate an interest request when you are ready to connect.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Role Filter Segmented Buttons */}
          <div
            role="group"
            aria-label="Filter by mentor or peer role"
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1"
          >
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'mentor', label: 'Mentors' },
                { id: 'industry_peer', label: 'Peers' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  roleFilter === tab.id
                    ? 'bg-white text-[#0B1F3A] shadow-sm'
                    : 'text-[#475569] hover:text-[#0B1F3A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scope Toggle Segmented Buttons */}
          <div
            role="group"
            aria-label="Filter by career sector scope"
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1"
          >
            <button
              type="button"
              onClick={() => setScopeMode('matched')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                scopeMode === 'matched'
                  ? 'bg-white text-[#0B1F3A] shadow-sm'
                  : 'text-[#475569] hover:text-[#0B1F3A]'
              }`}
            >
              Matched Path
            </button>
            <button
              type="button"
              onClick={() => setScopeMode('all_sectors')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                scopeMode === 'all_sectors'
                  ? 'bg-white text-[#0B1F3A] shadow-sm'
                  : 'text-[#475569] hover:text-[#0B1F3A]'
              }`}
            >
              All Kenya Sectors
            </button>
          </div>
        </div>
      </div>

      {/* Consent Notice Bar */}
      {!shareWithMentors && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-[#F6F9FC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 text-xs text-[#475569]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0B8A84]" aria-hidden="true" />
            <span>
              Mentor portfolio sharing is currently off in your privacy settings. You can still send connection requests now and enable sharing whenever you wish.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="shrink-0 text-xs font-semibold text-[#0B8A84] hover:underline whitespace-nowrap text-left sm:text-right"
          >
            Review Privacy Settings
          </button>
        </div>
      )}

      {/* Action / Load Errors */}
      {(error || actionError) && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-[#DC2626]"
        >
          {actionError || error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[0, 1].map((idx) => (
            <div
              key={idx}
              className="h-44 animate-pulse rounded-xl bg-[#F6F9FC] p-5"
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredMentors.length === 0 && (
        <div className="mt-6 rounded-xl bg-[#F6F9FC] p-6 text-center">
          <Users className="mx-auto h-6 w-6 text-[#475569]" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-[#0B1F3A]">
            No mentors or peers match this filter
          </p>
          <p className="mt-1 text-xs text-[#475569]">
            Switch to All Kenya Sectors or reset the role filter to view everyone in the network.
          </p>
          <button
            type="button"
            onClick={() => {
              setRoleFilter('all');
              setScopeMode('all_sectors');
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-[#0B1F3A] hover:bg-slate-50 transition-colors"
          >
            Show All Kenyan Mentors & Peers
          </button>
        </div>
      )}

      {/* Mentors & Peers Grid */}
      {!loading && filteredMentors.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredMentors.map(({ mentor, expertise, matchReason }) => {
            const isConnected = mentor.connection_status === 'requested';
            const isComposing = composingMentorId === mentor.id;
            const isBusy = submittingId === mentor.id;
            const isMentor = mentor.peer_type === 'mentor';

            return (
              <article
                key={mentor.id}
                className="flex flex-col justify-between rounded-xl bg-[#F6F9FC] p-5"
              >
                <div>
                  {/* Top Row: Avatar + Identity + Connect Button */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold ${
                          isMentor
                            ? 'bg-[#0B1F3A] text-white'
                            : 'bg-[#0FB5AE] text-[#0B1F3A]'
                        }`}
                        aria-hidden="true"
                      >
                        {getInitials(mentor.full_name)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#475569]">
                          <span className="font-semibold text-[#0B8A84]">
                            {isMentor ? 'Mentor' : 'Industry Peer'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-[#475569]" aria-hidden="true" />
                            <span>{mentor.location}</span>
                          </span>
                        </div>

                        <h3 className="mt-0.5 font-display text-sm font-bold text-[#0B1F3A] truncate">
                          {mentor.full_name}
                        </h3>

                        <p className="text-xs font-medium text-[#475569]">
                          {mentor.role_title} · {mentor.organization}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isConnected ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A] whitespace-nowrap">
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Interest Sent</span>
                          </span>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleWithdraw(mentor.id)}
                            className="text-xs font-medium text-[#475569] hover:text-[#DC2626] underline disabled:opacity-50 whitespace-nowrap"
                          >
                            {isBusy ? 'Updating...' : 'Withdraw'}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            isComposing ? setComposingMentorId(null) : openComposer(mentor)
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1F3A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#12305A] transition-colors whitespace-nowrap shrink-0"
                        >
                          {isComposing ? (
                            <>
                              <X className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Close</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-3.5 w-3.5 text-[#5ED6CF]" aria-hidden="true" />
                              <span>Connect</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bio & Match Reason */}
                  <p className="mt-3 text-xs leading-relaxed text-[#475569]">{mentor.bio}</p>

                  <div className="mt-3 space-y-1 text-xs">
                    <p className="text-[#0B1F3A]">
                      <span className="font-semibold">Why matched: </span>
                      <span className="text-[#475569]">{matchReason}</span>
                    </p>
                    {expertise.length > 0 && (
                      <p className="text-[#0B1F3A]">
                        <span className="font-semibold">Focus areas: </span>
                        <span className="text-[#475569]">{expertise.join(' · ')}</span>
                      </p>
                    )}
                    <p className="text-[#475569]">
                      <span className="font-semibold text-[#0B1F3A]">Availability: </span>
                      <span>{mentor.availability_note}</span>
                    </p>
                  </div>
                </div>

                {/* Sent Note Preview */}
                {isConnected && mentor.connection_message && (
                  <div className="mt-3 border-t border-slate-200/80 pt-3 text-xs text-[#475569]">
                    <span className="font-semibold text-[#0B1F3A]">Your note: </span>
                    <span>“{mentor.connection_message}”</span>
                  </div>
                )}

                {/* Inline Interest Request Composer */}
                {isComposing && !isConnected && (
                  <div className="mt-4 border-t border-slate-200/80 pt-4 space-y-3">
                    <div>
                      <label
                        htmlFor={`connect-note-${mentor.id}`}
                        className="block text-xs font-semibold text-[#0B1F3A]"
                      >
                        Short introduction note (optional, max 400 chars)
                      </label>
                      <textarea
                        id={`connect-note-${mentor.id}`}
                        rows={2}
                        maxLength={400}
                        value={draftMessage}
                        onChange={(e) => setDraftMessage(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-[#0B1F3A] focus:border-[#0FB5AE] focus:outline-none focus:ring-2 focus:ring-[#0FB5AE]/20"
                        placeholder="Share your career goal, RPL question, or sector background..."
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setComposingMentorId(null)}
                        className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-[#475569] hover:bg-slate-50 transition-colors whitespace-nowrap"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleSendRequest(mentor.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0FB5AE] px-4 py-2 text-xs font-semibold text-[#0B1F3A] hover:bg-[#5ED6CF] transition-colors disabled:opacity-60 whitespace-nowrap"
                      >
                        {isBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Send className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span>{isBusy ? 'Sending...' : 'Send Interest Request'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
