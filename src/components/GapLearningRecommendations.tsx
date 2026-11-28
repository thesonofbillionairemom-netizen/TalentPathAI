import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckSquare,
  Compass,
  ExternalLink,
  Loader2,
  MapPin,
  RefreshCw,
  Square,
} from 'lucide-react';
import type {
  AppRoute,
  MicroLearningRecommendationResponse,
} from '../types';
import type { SectorGapSummary } from '../lib/sectorBenchmarks';
import { apiRequest } from '../lib/api';
import { TrustBadge } from './TrustBadge';

interface GapLearningRecommendationsProps {
  summary: SectorGapSummary;
  currentLocation: string;
  focusSkill: string | null;
  onSelectFocusSkill: (skillName: string | null) => void;
  onNavigate: (route: AppRoute) => void;
  onPlanChange?: (plan: MicroLearningRecommendationResponse | null) => void;
}

export function GapLearningRecommendations({
  summary,
  currentLocation,
  focusSkill,
  onSelectFocusSkill,
  onNavigate,
  onPlanChange,
}: GapLearningRecommendationsProps) {
  const [data, setData] = useState<MicroLearningRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const cacheRef = useRef<Record<string, MicroLearningRecommendationResponse>>({});

  const gapsPayload = useMemo(() => {
    const source = summary.topGaps.length > 0 ? summary.topGaps : summary.items.slice(0, 3);
    return source.map((item) => ({
      skillName: item.name,
      currentLevel: item.currentLevel,
      targetLevel: item.targetLevel,
      gapAmount: item.gapAmount,
      kenyaContext: item.kenyaContext,
    }));
  }, [summary.topGaps, summary.items]);

  const cacheKey = useMemo(() => {
    const gapSig = gapsPayload.map((g) => `${g.skillName}:${g.gapAmount}`).join('|');
    return `${summary.benchmark.id}::${focusSkill || 'all'}::${gapSig}`;
  }, [summary.benchmark.id, focusSkill, gapsPayload]);

  const fetchRecommendations = useCallback(
    async (bypassCache = false) => {
      if (!bypassCache && cacheRef.current[cacheKey]) {
        const cached = cacheRef.current[cacheKey];
        setData(cached);
        onPlanChange?.(cached);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await apiRequest<MicroLearningRecommendationResponse>(
          '/api/recommendations/micro-learning',
          {
            method: 'POST',
            body: JSON.stringify({
              sectorName: summary.benchmark.sectorName,
              focusSkill: focusSkill || undefined,
              gaps: gapsPayload,
            }),
          }
        );
        cacheRef.current[cacheKey] = res;
        setData(res);
        onPlanChange?.(res);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load micro-learning suggestions right now.'
        );
      } finally {
        setLoading(false);
      }
    },
    [cacheKey, summary.benchmark.sectorName, focusSkill, gapsPayload, onPlanChange]
  );

  useEffect(() => {
    void fetchRecommendations(false);
  }, [fetchRecommendations]);

  const toggleStep = (stepKey: string) => {
    setCheckedSteps((prev) => ({ ...prev, [stepKey]: !prev[stepKey] }));
  };

  const totalSteps = useMemo(() => {
    if (!data) return 0;
    return data.microLearningModules.reduce((acc, m) => acc + m.actionSteps.length, 0);
  }, [data]);

  const completedStepCount = useMemo(() => {
    if (!data) return 0;
    let count = 0;
    data.microLearningModules.forEach((mod) => {
      mod.actionSteps.forEach((_, idx) => {
        if (checkedSteps[`${cacheKey}::${mod.id}::${idx}`]) count += 1;
      });
    });
    return count;
  }, [data, checkedSteps, cacheKey]);

  return (
    <section
      aria-labelledby="gap-learning-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6"
    >
      {/* Header Row */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#475569]">
            <span className="font-semibold text-[#7C5CFC]">Gap-Based Learning Plan</span>
            <span aria-hidden="true">·</span>
            <span>{summary.benchmark.sectorName}</span>
            {data && (
              <>
                <span aria-hidden="true">·</span>
                <TrustBadge
                  variant={data.mode === 'gemini' ? 'ai_suggested' : 'demo_data'}
                  label={data.mode === 'gemini' ? 'AI-generated plan' : 'Demo Mode plan'}
                />
              </>
            )}
          </div>
          <h2
            id="gap-learning-heading"
            className="mt-1.5 font-display text-lg sm:text-xl font-bold text-[#0B1F3A] text-balance"
          >
            Micro-Learning Sprints &amp; Local Kenyan Training Resources
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[#475569]">
            {data?.summary ||
              `Tailored steps and Kenyan institutions mapped to the gaps identified above for ${
                currentLocation || 'Kenya'
              }.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {totalSteps > 0 && (
            <span className="font-mono-tabular text-xs font-semibold text-[#0B1F3A]">
              {completedStepCount} / {totalSteps} steps checked
            </span>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={() => void fetchRecommendations(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-[#0B1F3A] hover:bg-slate-50 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#7C5CFC]" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 text-[#7C5CFC]" />
            )}
            <span>{loading ? 'Generating Plan...' : 'Regenerate AI Plan'}</span>
          </button>
        </div>
      </div>

      {/* Gap Focus Selector Bar */}
      {summary.topGaps.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-y border-slate-100 py-3">
          <span className="mr-1 text-xs font-semibold text-[#475569]">Focus gap:</span>
          <button
            type="button"
            onClick={() => onSelectFocusSkill(null)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              focusSkill === null
                ? 'bg-[#0B1F3A] text-white'
                : 'bg-slate-100 text-[#475569] hover:text-[#0B1F3A]'
            }`}
          >
            All Identified Gaps ({summary.topGaps.length})
          </button>
          {summary.topGaps.map((gap) => {
            const active = focusSkill === gap.name;
            return (
              <button
                key={gap.id}
                type="button"
                onClick={() => onSelectFocusSkill(active ? null : gap.name)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#7C5CFC] text-white'
                    : 'bg-slate-100 text-[#475569] hover:text-[#0B1F3A]'
                }`}
              >
                {gap.shortLabel}{' '}
                <span className="font-mono-tabular opacity-85">−{gap.gapAmount}%</span>
              </button>
            );
          })}
        </div>
      )}

      {data?.demoNotice && (
        <p className="mt-4 rounded-xl bg-[#F5A524]/10 px-4 py-2.5 text-xs text-[#0B1F3A]">
          {data.demoNotice}
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void fetchRecommendations(true)}
            className="font-semibold underline whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data ? (
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12" aria-busy="true">
          <div className="lg:col-span-7 space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2 py-2">
                <div className="h-3 w-40 rounded bg-slate-200" />
                <div className="h-4 w-3/4 rounded bg-slate-200" />
                <div className="h-3 w-full rounded bg-slate-100" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-5 animate-pulse rounded-xl bg-[#F6F9FC] p-5 space-y-4">
            <div className="h-4 w-48 rounded bg-slate-200" />
            <div className="h-16 w-full rounded bg-slate-200/70" />
            <div className="h-16 w-full rounded bg-slate-200/70" />
          </div>
        </div>
      ) : data ? (
        <div className={`mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 ${loading ? 'opacity-65 transition-opacity' : ''}`}>
          {/* Left 7 Cols: Actionable Micro-Learning Modules */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between gap-2 pb-2">
              <h3 className="inline-flex items-center gap-2 font-display text-sm font-bold text-[#0B1F3A]">
                <BookOpen className="h-4 w-4 text-[#0FB5AE]" />
                <span>Actionable Micro-Learning Modules</span>
              </h3>
              <span className="text-xs text-[#475569]">Check off steps as you build evidence</span>
            </div>

            <div className="divide-y divide-slate-100">
              {data.microLearningModules.map((mod) => (
                <article key={mod.id} className="py-4 first:pt-2 last:pb-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#475569]">
                    <span className="font-semibold text-[#0B8A84]">{mod.targetSkill}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular font-medium text-[#0B1F3A]">
                      {mod.estimatedDuration}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{mod.format}</span>
                  </div>

                  <h4 className="mt-1 text-sm font-bold text-[#0B1F3A]">{mod.title}</h4>

                  <ul className="mt-2.5 space-y-2">
                    {mod.actionSteps.map((step, idx) => {
                      const stepKey = `${cacheKey}::${mod.id}::${idx}`;
                      const checked = Boolean(checkedSteps[stepKey]);
                      return (
                        <li key={stepKey}>
                          <button
                            type="button"
                            onClick={() => toggleStep(stepKey)}
                            className="group flex w-full items-start gap-2.5 text-left text-xs leading-relaxed text-[#475569] hover:text-[#0B1F3A] transition-colors"
                            aria-pressed={checked}
                          >
                            {checked ? (
                              <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" />
                            ) : (
                              <Square className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#0FB5AE]" />
                            )}
                            <span className={checked ? 'line-through text-slate-400' : ''}>
                              {step}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[#475569]">
                      <strong className="font-semibold text-[#0B1F3A]">Portfolio output:</strong>{' '}
                      {mod.outcomeArtifact}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate('documents')}
                      className="font-semibold text-[#0B8A84] hover:underline whitespace-nowrap shrink-0"
                    >
                      Save evidence →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Right 5 Cols: Specific Local Kenyan Training & Credential Resources */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-xl bg-[#F6F9FC] p-5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="inline-flex items-center gap-2 font-display text-sm font-bold text-[#0B1F3A]">
                  <MapPin className="h-4 w-4 text-[#7C5CFC]" />
                  <span>Local Kenyan Training &amp; RPL Centres</span>
                </h3>
              </div>
              <p className="mt-1 text-xs text-[#475569]">
                Verified public portals &amp; centres supporting {currentLocation || 'Kenya'} learners.
              </p>

              <div className="mt-4 divide-y divide-slate-200/80">
                {data.localTrainingResources.map((res) => (
                  <div key={res.id} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#475569]">
                      <span className="font-semibold text-[#0B1F3A]">{res.provider}</span>
                      <span aria-hidden="true">·</span>
                      <span>{res.location}</span>
                    </div>

                    <p className="mt-1 text-xs font-bold text-[#0B1F3A]">{res.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#475569]">{res.whyItHelps}</p>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#475569]">
                      <span>
                        <strong className="font-medium text-[#0B1F3A]">Bridges:</strong> {res.relevantGap}{' '}
                        <span aria-hidden="true">·</span> {res.costNote}
                      </span>
                    </div>

                    <a
                      href={res.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B8A84] hover:underline"
                    >
                      <span>Open official portal</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => onNavigate('recognition')}
                className="flex w-full items-center justify-between rounded-xl bg-[#0B1F3A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#12305A] transition-colors whitespace-nowrap"
              >
                <span className="inline-flex items-center gap-2">
                  <Compass className="h-3.5 w-3.5 text-[#5ED6CF]" />
                  <span>Open Kenyan Recognition Navigator</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('opportunities')}
                className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-[#0B1F3A] hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <span>Browse Training &amp; Mentorships</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
