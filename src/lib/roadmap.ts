import type {
  AppRoute,
  DocumentRecord,
  EvidenceSummary,
  OpportunityRecord,
  ProfileRecord,
  RecognitionPathwayRecord,
  SkillRecord,
} from '../types';
import type { SectorGapSummary } from './sectorBenchmarks';

export type PhaseStatus = 'completed' | 'active' | 'upcoming';

export interface RoadmapMilestone {
  label: string;
  done: boolean;
}

export interface RoadmapPhaseData {
  id: string;
  stepNumber: string;
  timeframe: string;
  title: string;
  subtitle: string;
  status: PhaseStatus;
  progressPercent: number;
  summaryText: string;
  milestones: RoadmapMilestone[];
  primaryCtaLabel: string;
  primaryRoute: AppRoute;
  secondaryCtaLabel?: string;
  secondaryRoute?: AppRoute;
  focusGapName?: string;
}

export function buildCareerRoadmapPhases(params: {
  profile: ProfileRecord | null;
  skills: SkillRecord[];
  documents: DocumentRecord[];
  evidence: EvidenceSummary;
  pathways: RecognitionPathwayRecord[];
  opportunities: OpportunityRecord[];
  gapSummary: SectorGapSummary;
  skillScope: 'all' | 'self_assessed';
}): { phases: RoadmapPhaseData[]; overallTimelineProgress: number; completedPhaseCount: number } {
  const {
    profile,
    skills,
    documents,
    evidence,
    pathways,
    opportunities,
    gapSummary,
    skillScope,
  } = params;

  const completeness = profile?.completeness_score ?? 0;
  const allSteps = pathways.flatMap((p) => p.steps || []);
  const completedSteps = allSteps.filter((s) => s.status === 'completed').length;
  const pathwayPct = allSteps.length > 0 ? Math.round((completedSteps / allSteps.length) * 100) : 0;

  let legalChecked = 0;
  let legalTotal = 6;
  try {
    const parsed = JSON.parse(profile?.legal_readiness_json || '{}') as Record<string, boolean>;
    const values = Object.values(parsed);
    if (values.length > 0) {
      legalTotal = Math.max(6, values.length);
      legalChecked = values.filter(Boolean).length;
    }
  } catch {
    // keep defaults
  }

  const sectorWords = gapSummary.benchmark.sectorName
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);
  const matchingOpportunities = opportunities.filter((opp) => {
    const text = `${opp.title} ${opp.description} ${opp.required_skills_json}`.toLowerCase();
    return sectorWords.some((w) => text.includes(w));
  });

  // Phase 1: Current Skills & Profile Foundation
  const p1Milestones: RoadmapMilestone[] = [
    { label: `Profile completeness at ${completeness}% (target 70%+)`, done: completeness >= 70 },
    {
      label:
        skillScope === 'self_assessed'
          ? `${skills.filter((s) => s.source === 'user_provided').length} self-assessed skills recorded`
          : `${skills.length} documented skills mapped to sector`,
      done: skills.length >= 3,
    },
    { label: `${documents.length} evidence file(s) stored (${evidence.score}% strength)`, done: evidence.score >= 50 },
  ];
  const p1DoneCount = p1Milestones.filter((m) => m.done).length;
  const p1Pct = Math.round((p1DoneCount / p1Milestones.length) * 100);
  const p1Status: PhaseStatus = p1DoneCount === p1Milestones.length ? 'completed' : 'active';

  // Phase 2: Bridge Target Sector Skill Gaps
  const topGaps = gapSummary.topGaps;
  const alignedItems = gapSummary.items.filter((i) => i.status === 'aligned');
  const p2Milestones: RoadmapMilestone[] =
    topGaps.length > 0
      ? topGaps.slice(0, 3).map((g) => ({
          label: `Bridge ${g.shortLabel} (${g.currentLevel}% -> ${g.targetLevel}% sector avg)`,
          done: false,
        }))
      : [
          {
            label: `All ${gapSummary.items.length} core ${gapSummary.benchmark.sectorName} benchmarks met`,
            done: true,
          },
          {
            label: 'Document project work samples to maintain employer readiness',
            done: documents.length >= 2,
          },
        ];
  const p2Status: PhaseStatus =
    topGaps.length === 0 ? 'completed' : p1Status === 'completed' ? 'active' : 'upcoming';

  // Phase 3: Kenyan Qualification Recognition (KNQA RPL / TVETA / UQP)
  const p3Milestones: RoadmapMilestone[] = [
    {
      label:
        pathways.length > 0
          ? `Active pathway: ${pathways[0].target_occupation}`
          : `Generate KNQA RPL / TVETA checklist for ${gapSummary.benchmark.sectorName}`,
      done: pathways.length > 0,
    },
    {
      label:
        allSteps.length > 0
          ? `${completedSteps} of ${allSteps.length} official recognition steps completed`
          : 'Complete practical assessment & evidence portfolio steps',
      done: allSteps.length > 0 && completedSteps === allSteps.length,
    },
    {
      label: `Kenyan legal & workplace onboarding checklist (${legalChecked}/${legalTotal} reviewed)`,
      done: legalChecked >= 4,
    },
  ];
  const p3DoneCount = p3Milestones.filter((m) => m.done).length;
  const p3Pct = allSteps.length > 0 ? pathwayPct : Math.round((p3DoneCount / p3Milestones.length) * 100);
  const p3Status: PhaseStatus =
    allSteps.length > 0 && completedSteps === allSteps.length && legalChecked >= 4
      ? 'completed'
      : p2Status === 'completed' || pathways.length > 0
      ? 'active'
      : 'upcoming';

  // Phase 4: Target Sector Placement & Portfolio Export
  const p4Milestones: RoadmapMilestone[] = [
    {
      label: `${gapSummary.overallReadiness}% overall alignment with ${gapSummary.benchmark.sectorName}`,
      done: gapSummary.overallReadiness >= 85,
    },
    {
      label: `${matchingOpportunities.length || opportunities.length} relevant Kenyan opportunities matched`,
      done: matchingOpportunities.length > 0,
    },
    {
      label: 'Export verified A4 PDF portfolio & share with consenting employers',
      done: p3Status === 'completed' && gapSummary.overallReadiness >= 85,
    },
  ];
  const p4DoneCount = p4Milestones.filter((m) => m.done).length;
  const p4Pct = Math.round((p4DoneCount / p4Milestones.length) * 100);
  const p4Status: PhaseStatus =
    p3Status === 'completed' && gapSummary.overallReadiness >= 85
      ? 'completed'
      : p2Status === 'completed' && p3Status !== 'upcoming'
      ? 'active'
      : 'upcoming';

  const phases: RoadmapPhaseData[] = [
    {
      id: 'phase-baseline',
      stepNumber: '01',
      timeframe: p1Status === 'completed' ? 'Completed' : 'Week 1',
      title: 'Current Skills Baseline',
      subtitle: `${alignedItems.length} of ${gapSummary.items.length} benchmarks met`,
      status: p1Status,
      progressPercent: p1Pct,
      summaryText:
        alignedItems.length > 0
          ? `Strong foundation in ${alignedItems
              .slice(0, 2)
              .map((i) => i.shortLabel)
              .join(' & ')}. Keep your profile and supporting documents up to date.`
          : 'Start by recording your current skills, work history, and any available certificates or reference letters.',
      milestones: p1Milestones,
      primaryCtaLabel: 'Update Profile & Skills',
      primaryRoute: 'profile',
      secondaryCtaLabel: 'Document Centre',
      secondaryRoute: 'documents',
    },
    {
      id: 'phase-gaps',
      stepNumber: '02',
      timeframe: topGaps.length === 0 ? 'Completed' : 'Weeks 1–3',
      title: 'Bridge Sector Skill Gaps',
      subtitle:
        topGaps.length > 0
          ? `${topGaps.length} skill gap${topGaps.length === 1 ? '' : 's'} to close`
          : 'All target thresholds met',
      status: p2Status,
      progressPercent: gapSummary.overallReadiness,
      summaryText:
        topGaps.length > 0
          ? `Priority focus on ${topGaps[0].name} (-${topGaps[0].gapAmount}% vs. ${gapSummary.benchmark.sectorName} average). Use short micro-learning sprints to build evidence.`
          : `Your skills already meet the target averages for ${gapSummary.benchmark.sectorName}. Run a fresh AI assessment anytime you add new work.`,
      milestones: p2Milestones,
      primaryCtaLabel: topGaps.length > 0 ? 'Open Micro-Learning Plan' : 'Run AI Assessment',
      primaryRoute: 'assessment',
      secondaryCtaLabel: topGaps.length > 0 ? 'Run AI Assessment' : undefined,
      focusGapName: topGaps[0]?.name,
    },
    {
      id: 'phase-recognition',
      stepNumber: '03',
      timeframe: p3Status === 'completed' ? 'Completed' : 'Weeks 4–8',
      title: 'Kenyan Recognition & Readiness',
      subtitle:
        allSteps.length > 0
          ? `${completedSteps}/${allSteps.length} pathway steps done`
          : 'KNQA RPL · TVETA · DRS',
      status: p3Status,
      progressPercent: p3Pct,
      summaryText:
        'Translate prior experience into Kenyan credentials through KNQA Recognition of Prior Learning, TVETA centres, or UNESCO Qualifications Passport, alongside DRS/KRA readiness.',
      milestones: p3Milestones,
      primaryCtaLabel: 'Open Recognition Navigator',
      primaryRoute: 'recognition',
      secondaryCtaLabel: 'Legal & Financial Readiness',
      secondaryRoute: 'readiness',
    },
    {
      id: 'phase-placement',
      stepNumber: '04',
      timeframe: p4Status === 'completed' ? 'Ready Now' : 'Weeks 8–12',
      title: 'Target Sector Placement',
      subtitle: `${gapSummary.benchmark.sectorName}`,
      status: p4Status,
      progressPercent: p4Pct,
      summaryText: `Compile your A4 PDF portfolio and apply to matched fellowships, returnships, and roles in ${gapSummary.benchmark.sectorName}.`,
      milestones: p4Milestones,
      primaryCtaLabel: 'Export PDF Portfolio',
      primaryRoute: 'portfolio',
      secondaryCtaLabel: 'Browse Opportunities',
      secondaryRoute: 'opportunities',
    },
  ];

  const completedPhaseCount = phases.filter((p) => p.status === 'completed').length;
  const activePhaseIdx = phases.findIndex((p) => p.status === 'active');
  let overallTimelineProgress = 100;
  if (completedPhaseCount < phases.length) {
    const base = completedPhaseCount * 25;
    const activePartial =
      activePhaseIdx >= 0 ? Math.round((phases[activePhaseIdx].progressPercent / 100) * 25) : 0;
    overallTimelineProgress = Math.min(100, base + activePartial);
  }

  return { phases, overallTimelineProgress, completedPhaseCount };
}
