import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Award,
  Briefcase,
  Check,
  Compass,
  FileCheck2,
  FileDown,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import type {
  AppRoute,
  DocumentRecord,
  EvidenceSummary,
  OpportunityRecord,
  ProfileRecord,
  RecognitionPathwayRecord,
  SkillRecord,
} from '../types';
import type { SectorGapSummary } from '../lib/sectorBenchmarks';
import {
  buildCareerRoadmapPhases,
  type PhaseStatus,
  type RoadmapPhaseData,
} from '../lib/roadmap';

interface CareerRoadmapTimelineProps {
  profile: ProfileRecord | null;
  skills: SkillRecord[];
  documents: DocumentRecord[];
  evidence: EvidenceSummary;
  pathways: RecognitionPathwayRecord[];
  opportunities: OpportunityRecord[];
  gapSummary: SectorGapSummary;
  skillScope: 'all' | 'self_assessed';
  onFocusGap: (skillName: string) => void;
  onNavigate: (route: AppRoute) => void;
  onExportPdf?: () => void;
  exportSuccess?: boolean;
}

const PHASE_ICON_MAP: Record<string, typeof FolderOpen> = {
  'phase-baseline': FolderOpen,
  'phase-gaps': Sparkles,
  'phase-recognition': Compass,
  'phase-placement': Award,
};

export function CareerRoadmapTimeline({
  profile,
  skills,
  documents,
  evidence,
  pathways,
  opportunities,
  gapSummary,
  skillScope,
  onFocusGap,
  onNavigate,
  onExportPdf,
  exportSuccess = false,
}: CareerRoadmapTimelineProps) {
  const reduced = useReducedMotion();

  const { phases, overallTimelineProgress, completedPhaseCount } = useMemo(
    () =>
      buildCareerRoadmapPhases({
        profile,
        skills,
        documents,
        evidence,
        pathways,
        opportunities,
        gapSummary,
        skillScope,
      }),
    [profile, skills, documents, evidence, pathways, opportunities, gapSummary, skillScope]
  );

  const defaultSelectedId = useMemo(() => {
    const active = phases.find((p) => p.status === 'active');
    return active?.id || phases[phases.length - 1].id;
  }, [phases]);

  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(defaultSelectedId);

  useEffect(() => {
    setSelectedPhaseId(defaultSelectedId);
  }, [defaultSelectedId]);

  const selectedPhase: RoadmapPhaseData = phases.find((p) => p.id === selectedPhaseId) || phases[0];

  const statusMeta = (status: PhaseStatus) => {
    if (status === 'completed') {
      return {
        label: 'Completed',
        nodeBg: 'bg-[#16A34A] text-white border-[#16A34A]',
        textClass: 'text-[#16A34A]',
      };
    }
    if (status === 'active') {
      return {
        label: 'Current Focus',
        nodeBg: 'bg-[#7C5CFC] text-white border-[#7C5CFC]',
        textClass: 'text-[#7C5CFC]',
      };
    }
    return {
      label: 'Upcoming',
      nodeBg: 'bg-white text-[#475569] border-slate-300',
      textClass: 'text-[#475569]',
    };
  };

  return (
    <section
      aria-labelledby="career-roadmap-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#475569]">
            <span className="font-semibold text-[#0B8A84]">Career Progression Roadmap</span>
            <span aria-hidden="true">·</span>
            <span>{gapSummary.benchmark.sectorName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular font-semibold text-[#0B1F3A]">
              {completedPhaseCount} / {phases.length} phases complete
            </span>
          </div>
          <h2
            id="career-roadmap-heading"
            className="mt-1 font-display text-lg sm:text-xl font-bold text-[#0B1F3A] text-balance"
          >
            Visual Pathway from Current Skills to Target Sector
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[#475569]">
            Select any stage along your timeline to inspect milestones, remaining skill gaps, and Kenyan recognition steps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-[#0B1F3A] hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              {exportSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#16A34A]" aria-hidden="true" />
                  <span>PDF Downloaded</span>
                </>
              ) : (
                <>
                  <FileDown className="h-3.5 w-3.5 text-[#0FB5AE]" aria-hidden="true" />
                  <span>Export Report PDF</span>
                </>
              )}
            </button>
          )}
          <div className="text-right">
            <p className="text-[11px] font-medium text-[#475569]">Roadmap Progress</p>
            <p className="font-mono-tabular text-xl font-bold text-[#0B1F3A]">
              {overallTimelineProgress}%
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal Connected Visual Timeline (Desktop) + Vertical Timeline (Mobile) */}
      <div className="mt-8 relative">
        {/* Horizontal connector bar on lg+ screens */}
        <div
          className="hidden lg:block absolute top-5 left-[12.5%] right-[12.5%] h-1 rounded-full bg-slate-100"
          aria-hidden="true"
        >
          <motion.div
            className="h-full origin-left rounded-full bg-[#0FB5AE]"
            style={{ width: `${overallTimelineProgress}%` }}
            initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {phases.map((phase) => {
            const meta = statusMeta(phase.status);
            const isSelected = phase.id === selectedPhase.id;
            const PhaseIcon = PHASE_ICON_MAP[phase.id] || FolderOpen;

            return (
              <button
                key={phase.id}
                type="button"
                onClick={() => setSelectedPhaseId(phase.id)}
                aria-current={isSelected ? 'step' : undefined}
                className={`group relative flex flex-row lg:flex-col items-start lg:items-center gap-4 lg:gap-3 rounded-xl p-4 text-left lg:text-center transition-colors ${
                  isSelected ? 'bg-[#F6F9FC]' : 'hover:bg-slate-50/80'
                }`}
              >
                {/* Node Circle */}
                <div
                  className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-mono-tabular text-xs font-bold transition-transform ${
                    meta.nodeBg
                  } ${isSelected ? 'ring-4 ring-[#0FB5AE]/20 scale-105' : ''}`}
                >
                  {phase.status === 'completed' ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <span>{phase.stepNumber}</span>
                  )}
                </div>

                {/* Phase Summary */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center lg:justify-center gap-x-1.5 gap-y-0.5 text-[11px]">
                    <span className={`font-semibold ${meta.textClass}`}>{meta.label}</span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="font-mono-tabular text-[#475569]">{phase.timeframe}</span>
                  </div>

                  <p className="mt-1 flex items-center lg:justify-center gap-1.5 font-display text-sm font-bold text-[#0B1F3A]">
                    <PhaseIcon className="h-3.5 w-3.5 shrink-0 text-[#0FB5AE]" aria-hidden="true" />
                    <span>{phase.title}</span>
                  </p>

                  <p className="mt-1 text-xs text-[#475569] line-clamp-2">{phase.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Phase Interactive Detail Panel */}
      <div className="mt-6 border-t border-slate-100 pt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#475569]">
            <span className="font-mono-tabular font-bold text-[#0B1F3A]">
              Phase {selectedPhase.stepNumber}
            </span>
            <span aria-hidden="true">·</span>
            <span className={`font-semibold ${statusMeta(selectedPhase.status).textClass}`}>
              {statusMeta(selectedPhase.status).label}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">{selectedPhase.timeframe}</span>
          </div>

          <h3 className="mt-1 font-display text-base font-bold text-[#0B1F3A]">
            {selectedPhase.title}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
            {selectedPhase.summaryText}
          </p>

          <ul className="mt-4 divide-y divide-slate-100">
            {selectedPhase.milestones.map((m) => (
              <li key={m.label} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0 text-xs">
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    m.done ? 'bg-[#16A34A] text-white' : 'bg-slate-200 text-[#475569]'
                  }`}
                  aria-hidden="true"
                >
                  {m.done ? <Check className="h-2.5 w-2.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />}
                </span>
                <span className={m.done ? 'font-medium text-[#0B1F3A]' : 'text-[#475569]'}>
                  {m.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl bg-[#F6F9FC] p-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#475569]">Stage Completion</span>
              <span className="font-mono-tabular text-sm font-bold text-[#0B1F3A]">
                {selectedPhase.progressPercent}%
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#0FB5AE] transition-all"
                style={{ width: `${selectedPhase.progressPercent}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#475569]">
              Next recommended action for <strong className="text-[#0B1F3A]">{selectedPhase.title}</strong>:
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {selectedPhase.id === 'phase-gaps' && selectedPhase.focusGapName ? (
              <button
                type="button"
                onClick={() => onFocusGap(selectedPhase.focusGapName!)}
                className="flex w-full items-center justify-between rounded-xl bg-[#0B1F3A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#12305A] transition-colors whitespace-nowrap"
              >
                <span>{selectedPhase.primaryCtaLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(selectedPhase.primaryRoute)}
                className="flex w-full items-center justify-between rounded-xl bg-[#0B1F3A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#12305A] transition-colors whitespace-nowrap"
              >
                <span>{selectedPhase.primaryCtaLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}

            {selectedPhase.secondaryCtaLabel && (
              <button
                type="button"
                onClick={() =>
                  selectedPhase.id === 'phase-gaps'
                    ? onNavigate(selectedPhase.primaryRoute)
                    : selectedPhase.secondaryRoute && onNavigate(selectedPhase.secondaryRoute)
                }
                className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-[#0B1F3A] hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <span className="inline-flex items-center gap-2">
                  {selectedPhase.id === 'phase-placement' ? (
                    <Briefcase className="h-3.5 w-3.5 text-[#0FB5AE]" />
                  ) : (
                    <FileCheck2 className="h-3.5 w-3.5 text-[#0FB5AE]" />
                  )}
                  <span>{selectedPhase.secondaryCtaLabel}</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
