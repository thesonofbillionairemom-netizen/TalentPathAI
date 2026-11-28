import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AlertCircle, ArrowRight, CheckCircle2, Compass, Sparkles, Target } from 'lucide-react';
import type {
  AppRoute,
  AssessmentRecord,
  DocumentRecord,
  OpportunityRecord,
  ProfileRecord,
  RecognitionPathwayRecord,
  SkillRecord,
} from '../types';
import {
  SECTOR_BENCHMARKS,
  computeSectorSkillComparison,
  resolveSectorBenchmark,
  type CompetencyComparisonItem,
} from '../lib/sectorBenchmarks';
import { SectorComparisonChart } from './SectorComparisonChart';

interface SectorSkillGapChartProps {
  profile: ProfileRecord | null;
  skills: SkillRecord[];
  documents: DocumentRecord[];
  latestAssessment: AssessmentRecord | null;
  pathways: RecognitionPathwayRecord[];
  opportunities: OpportunityRecord[];
  onNavigate: (route: AppRoute) => void;
  controlledSectorId?: string;
  onSectorChange?: (sectorId: string) => void;
  skillScope?: 'all' | 'self_assessed';
  onSkillScopeChange?: (scope: 'all' | 'self_assessed') => void;
  onFocusGap?: (skillName: string) => void;
}

export function SectorSkillGapChart({
  profile,
  skills,
  documents,
  latestAssessment,
  pathways,
  opportunities,
  onNavigate,
  controlledSectorId,
  onSectorChange,
  skillScope = 'all',
  onSkillScopeChange,
  onFocusGap,
}: SectorSkillGapChartProps) {
  const reduced = useReducedMotion();
  const savedTargetSector = (profile?.target_sector || '').trim();

  const resolvedSavedBenchmark = useMemo(
    () => resolveSectorBenchmark(savedTargetSector, opportunities),
    [savedTargetSector, opportunities]
  );

  const [internalSectorId, setInternalSectorId] = useState<string>(resolvedSavedBenchmark.id);
  const [internalScope, setInternalScope] = useState<'all' | 'self_assessed'>(skillScope);

  useEffect(() => {
    setInternalSectorId(resolvedSavedBenchmark.id);
  }, [resolvedSavedBenchmark.id]);

  const selectedSectorId = controlledSectorId ?? internalSectorId;
  const activeScope = onSkillScopeChange ? skillScope : internalScope;

  const handleSelectSector = (nextId: string) => {
    setInternalSectorId(nextId);
    onSectorChange?.(nextId);
  };

  const handleSelectScope = (nextScope: 'all' | 'self_assessed') => {
    setInternalScope(nextScope);
    onSkillScopeChange?.(nextScope);
  };

  const scopedSkills = useMemo(
    () => (activeScope === 'self_assessed' ? skills.filter((s) => s.source === 'user_provided') : skills),
    [skills, activeScope]
  );

  const scopedDocs = activeScope === 'self_assessed' ? [] : documents;
  const scopedAssessment = activeScope === 'self_assessed' ? null : latestAssessment;

  const activeBenchmark = useMemo(() => {
    if (selectedSectorId === resolvedSavedBenchmark.id) {
      return resolvedSavedBenchmark;
    }
    return SECTOR_BENCHMARKS.find((b) => b.id === selectedSectorId) || resolvedSavedBenchmark;
  }, [selectedSectorId, resolvedSavedBenchmark]);

  const summary = useMemo(
    () =>
      computeSectorSkillComparison(
        activeBenchmark,
        scopedSkills,
        scopedDocs,
        scopedAssessment,
        pathways
      ),
    [activeBenchmark, scopedSkills, scopedDocs, scopedAssessment, pathways]
  );

  const isUsingSavedSector = selectedSectorId === resolvedSavedBenchmark.id;

  const statusMeta = (status: CompetencyComparisonItem['status']) => {
    if (status === 'aligned') {
      return {
        label: 'Meets Avg',
        textClass: 'text-[#16A34A]',
        barClass: 'bg-[#0FB5AE]',
        Icon: CheckCircle2,
      };
    }
    if (status === 'partial') {
      return {
        label: 'Near Target',
        textClass: 'text-[#7C5CFC]',
        barClass: 'bg-[#7C5CFC]',
        Icon: Target,
      };
    }
    return {
      label: 'Skill Gap',
      textClass: 'text-[#D97706]',
      barClass: 'bg-[#F5A524]',
      Icon: AlertCircle,
    };
  };

  return (
    <section
      aria-labelledby="sector-gap-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6"
    >
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#475569]">
            <span className="font-semibold text-[#0B8A84]">Sector Alignment</span>
            <span aria-hidden="true">·</span>
            <span>
              {savedTargetSector
                ? isUsingSavedSector
                  ? `Saved Target: ${savedTargetSector}`
                  : `Previewing Sector (Saved: ${savedTargetSector})`
                : 'No target sector saved yet — previewing benchmark'}
            </span>
          </div>
          <h2
            id="sector-gap-heading"
            className="mt-1 font-display text-lg sm:text-xl font-bold text-[#0B1F3A] text-balance"
          >
            Skills vs. Target Sector Requirements
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[#475569]">
            {activeBenchmark.regulatoryContext}. Compare your self-assessed and documented skills against Kenyan average sector requirements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <label htmlFor="sector-benchmark-select" className="sr-only">
              Select Target Sector Benchmark
            </label>
            <select
              id="sector-benchmark-select"
              value={selectedSectorId}
              onChange={(e) => handleSelectSector(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#0B1F3A] focus:border-[#0FB5AE] focus:outline-none"
            >
              {resolvedSavedBenchmark.id === 'custom-sector' && (
                <option value="custom-sector">{resolvedSavedBenchmark.sectorName} (Your Target)</option>
              )}
              {SECTOR_BENCHMARKS.map((bench) => (
                <option key={bench.id} value={bench.id}>
                  {bench.sectorName}
                  {savedTargetSector && bench.id === resolvedSavedBenchmark.id ? ' (Your Target)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div
            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1"
            role="group"
            aria-label="Skill source filter"
          >
            <button
              type="button"
              onClick={() => handleSelectScope('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeScope === 'all'
                  ? 'bg-white text-[#0B1F3A] shadow-sm'
                  : 'text-[#475569] hover:text-[#0B1F3A]'
              }`}
            >
              All Skills
            </button>
            <button
              type="button"
              onClick={() => handleSelectScope('self_assessed')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeScope === 'self_assessed'
                  ? 'bg-white text-[#0B1F3A] shadow-sm'
                  : 'text-[#475569] hover:text-[#0B1F3A]'
              }`}
            >
              Self-Assessed Only
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="mt-5 grid grid-cols-2 gap-4 border-y border-slate-100 py-4 sm:grid-cols-4">
        <div>
          <p className="text-xs font-medium text-[#475569]">Overall Sector Match</p>
          <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#0B1F3A]">
            {summary.overallReadiness}%
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-[#475569]">Targets Met</p>
          <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#16A34A]">
            {summary.alignedCount}
            <span className="text-sm font-normal text-[#475569]"> / {summary.items.length}</span>
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-[#475569]">Near Target</p>
          <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#7C5CFC]">
            {summary.partialCount}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-[#475569]">Priority Gaps</p>
          <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#D97706]">
            {summary.gapCount}
          </p>
        </div>
      </div>

      {/* Empty Skills Notice */}
      {scopedSkills.length === 0 && (
        <div className="mt-5 flex flex-col gap-3 rounded-xl bg-[#F6F9FC] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#0B1F3A]">
              {activeScope === 'self_assessed'
                ? 'No self-assessed skills added yet'
                : 'No documented skills found yet for comparison'}
            </p>
            <p className="mt-0.5 text-xs text-[#475569]">
              Add self-assessed skills and proficiency ratings in My Profile so TalentPath can chart your current profile against the sector average.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0FB5AE] px-4 py-2 text-xs font-semibold text-[#0B1F3A] hover:bg-[#5ED6CF] transition-colors whitespace-nowrap shrink-0"
          >
            <span>Add Skills</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Split Layout: RadarChart / BarChart (Left 6) + Progress Chart Breakdown (Right 6) */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <SectorComparisonChart
            items={summary.items}
            sectorName={activeBenchmark.sectorName}
            skillScope={activeScope}
          />
        </div>

        <div className="lg:col-span-6 flex flex-col justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-sm font-bold text-[#0B1F3A]">
                Skill-by-Skill Progress &amp; Gap Breakdown
              </h3>
              <span className="text-[11px] text-[#475569]">
                Bar fill = your level · Marker = sector avg
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {summary.items.map((item) => {
                const meta = statusMeta(item.status);
                const StatusIcon = meta.Icon;
                const diffText =
                  item.delta >= 0
                    ? item.delta === 0
                      ? 'Target met'
                      : `+${item.delta}% ahead`
                    : `−${item.gapAmount}% gap`;

                return (
                  <div key={item.id} className="py-3 first:pt-1 last:pb-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-[#0B1F3A]">{item.name}</span>
                        <span className="mx-1.5 text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-[11px] capitalize text-[#475569]">{item.category}</span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${meta.textClass}`}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{meta.label}</span>
                        </span>
                        <span className="font-mono-tabular text-xs font-semibold text-[#0B1F3A]">
                          {item.currentLevel}% <span className="font-normal text-[#475569]">/ {item.targetLevel}%</span>
                        </span>
                        <span
                          className={`font-mono-tabular text-[11px] font-semibold ${
                            item.delta >= 0 ? 'text-[#16A34A]' : 'text-[#D97706]'
                          }`}
                        >
                          ({diffText})
                        </span>
                      </div>
                    </div>

                    {/* Layered Target vs. Current Progress Bar */}
                    <div
                      className="relative mt-2 h-2.5 w-full rounded-full bg-slate-100"
                      role="progressbar"
                      aria-label={`${item.name}: current ${item.currentLevel} percent, sector average ${item.targetLevel} percent`}
                      aria-valuenow={item.currentLevel}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-slate-200/80"
                        style={{ width: `${item.targetLevel}%` }}
                      />
                      <motion.div
                        className={`relative z-10 h-full origin-left rounded-full ${meta.barClass}`}
                        style={{ width: `${item.currentLevel}%` }}
                        initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                      />
                      <div
                        className="absolute -top-0.5 -bottom-0.5 z-20 w-0.5 bg-[#0B1F3A]"
                        style={{ left: `${item.targetLevel}%` }}
                        title={`Sector average requirement: ${item.targetLevel}%`}
                      />
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#475569]">
                      <span className="truncate max-w-md">{item.evidenceNote}</span>
                      {item.gapAmount > 0 && onFocusGap && (
                        <button
                          type="button"
                          onClick={() => onFocusGap(item.name)}
                          className="font-semibold text-[#7C5CFC] hover:underline whitespace-nowrap shrink-0"
                        >
                          Focus micro-learning →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Quick Navigation Row */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('assessment')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1F3A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#12305A] transition-colors whitespace-nowrap"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#5ED6CF]" />
                <span>Run Gap Assessment</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('recognition')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-[#0B1F3A] hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <Compass className="h-3.5 w-3.5 text-[#0FB5AE]" />
                <span>Map Recognition Steps</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="text-xs font-semibold text-[#0B8A84] hover:underline whitespace-nowrap"
            >
              {savedTargetSector ? 'Update skills / target →' : 'Set target sector in Profile →'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
