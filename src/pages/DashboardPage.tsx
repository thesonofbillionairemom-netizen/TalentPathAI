import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  Check,
  Compass,
  FileCheck2,
  FileDown,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type {
  AppRoute,
  AssessmentRecord,
  DocumentRecord,
  EvidenceSummary,
  MentorPeerRecord,
  MicroLearningRecommendationResponse,
  OpportunityRecord,
  ProfileRecord,
  RecognitionPathwayRecord,
  SkillRecord,
} from '../types';
import { CareerRoadmapTimeline } from '../components/CareerRoadmapTimeline';
import { CompletenessRing } from '../components/MotionPrimitives';
import { GapLearningRecommendations } from '../components/GapLearningRecommendations';
import { KenyanMentorsSection } from '../components/KenyanMentorsSection';
import { SectorSkillGapChart } from '../components/SectorSkillGapChart';
import { TrustBadge } from '../components/TrustBadge';
import { apiRequest } from '../lib/api';
import { exportSkillsGapAndRoadmapPdf } from '../lib/pdfExport';
import { buildCareerRoadmapPhases } from '../lib/roadmap';
import {
  SECTOR_BENCHMARKS,
  computeSectorSkillComparison,
  resolveSectorBenchmark,
} from '../lib/sectorBenchmarks';

interface DashboardPageProps {
  fullName: string;
  profile: ProfileRecord | null;
  documents: DocumentRecord[];
  skills: SkillRecord[];
  evidence: EvidenceSummary;
  latestAssessment: AssessmentRecord | null;
  pathways: RecognitionPathwayRecord[];
  opportunities: OpportunityRecord[];
  mentors: MentorPeerRecord[];
  shareWithMentors: boolean;
  onRefreshWorkspace: () => Promise<void>;
  onNavigate: (route: AppRoute) => void;
}

export function DashboardPage({
  fullName,
  profile,
  documents,
  skills,
  evidence,
  latestAssessment,
  pathways,
  opportunities,
  mentors,
  shareWithMentors,
  onRefreshWorkspace,
  onNavigate,
}: DashboardPageProps) {
  const completeness = profile?.completeness_score ?? 0;

  const resolvedSavedBenchmark = useMemo(
    () => resolveSectorBenchmark((profile?.target_sector || '').trim(), opportunities),
    [profile?.target_sector, opportunities]
  );
  const [selectedSectorId, setSelectedSectorId] = useState<string>(resolvedSavedBenchmark.id);
  const [skillScope, setSkillScope] = useState<'all' | 'self_assessed'>('all');
  const [focusGapSkill, setFocusGapSkill] = useState<string | null>(null);
  const [learningPlan, setLearningPlan] = useState<MicroLearningRecommendationResponse | null>(null);
  const [pdfExported, setPdfExported] = useState(false);
  const pdfTimerRef = useRef<number | null>(null);
  const learningSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedSectorId(resolvedSavedBenchmark.id);
    setFocusGapSkill(null);
  }, [resolvedSavedBenchmark.id]);

  useEffect(() => {
    return () => {
      if (pdfTimerRef.current !== null) {
        window.clearTimeout(pdfTimerRef.current);
      }
    };
  }, []);

  const activeBenchmark = useMemo(() => {
    if (selectedSectorId === resolvedSavedBenchmark.id) return resolvedSavedBenchmark;
    return SECTOR_BENCHMARKS.find((b) => b.id === selectedSectorId) || resolvedSavedBenchmark;
  }, [selectedSectorId, resolvedSavedBenchmark]);

  const scopedSkills = useMemo(
    () => (skillScope === 'self_assessed' ? skills.filter((s) => s.source === 'user_provided') : skills),
    [skills, skillScope]
  );

  const gapSummary = useMemo(
    () =>
      computeSectorSkillComparison(
        activeBenchmark,
        scopedSkills,
        skillScope === 'self_assessed' ? [] : documents,
        skillScope === 'self_assessed' ? null : latestAssessment,
        pathways
      ),
    [activeBenchmark, scopedSkills, skillScope, documents, latestAssessment, pathways]
  );

  const roadmapData = useMemo(
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

  const handleSectorChange = (nextId: string) => {
    setSelectedSectorId(nextId);
    setFocusGapSkill(null);
  };

  const handleSkillScopeChange = (nextScope: 'all' | 'self_assessed') => {
    setSkillScope(nextScope);
    setFocusGapSkill(null);
  };

  const handleFocusGap = (skillName: string) => {
    setFocusGapSkill(skillName);
    learningSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleExportGapRoadmapPdf = () => {
    exportSkillsGapAndRoadmapPdf({
      fullName,
      profile,
      gapSummary,
      skillScope,
      phases: roadmapData.phases,
      overallTimelineProgress: roadmapData.overallTimelineProgress,
      learningPlan,
    });
    setPdfExported(true);
    if (pdfTimerRef.current !== null) {
      window.clearTimeout(pdfTimerRef.current);
    }
    pdfTimerRef.current = window.setTimeout(() => {
      setPdfExported(false);
    }, 2500);
  };

  const handleConnectMentor = async (mentorId: string, message: string, targetSector: string) => {
    await apiRequest(`/api/mentors/${encodeURIComponent(mentorId)}/connect`, {
      method: 'POST',
      body: JSON.stringify({ message, targetSector }),
    });
    await onRefreshWorkspace();
  };

  const handleWithdrawMentor = async (mentorId: string) => {
    await apiRequest(`/api/mentors/${encodeURIComponent(mentorId)}/connect`, {
      method: 'DELETE',
    });
    await onRefreshWorkspace();
  };

  const allSteps = pathways.flatMap((p) => p.steps || []);
  const completedSteps = allSteps.filter((s) => s.status === 'completed').length;
  const pathwayProgress = allSteps.length > 0 ? Math.round((completedSteps / allSteps.length) * 100) : 0;

  const skillCounts = [
    { category: 'Technical', count: skills.filter((s) => s.category === 'technical').length },
    { category: 'Transferable', count: skills.filter((s) => s.category === 'transferable').length },
    { category: 'Tools', count: skills.filter((s) => s.category === 'tool').length },
    { category: 'Languages', count: skills.filter((s) => s.category === 'language').length },
  ];

  const nextActions: Array<{ title: string; desc: string; route: AppRoute; cta: string }> = [];
  if (completeness < 70) {
    nextActions.push({
      title: 'Complete your professional profile',
      desc: 'Add your work history, education, and career goals to improve assessment accuracy.',
      route: 'profile',
      cta: 'Update Profile',
    });
  }
  if (evidence.missingCategories.length > 0) {
    nextActions.push({
      title: `Upload missing evidence (${evidence.missingCategories[0].replace(/_/g, ' ')})`,
      desc: 'Strengthen your portfolio readiness by attaching supporting records in the Document Centre.',
      route: 'documents',
      cta: 'Upload Evidence',
    });
  }
  if (!latestAssessment) {
    nextActions.push({
      title: 'Run your AI Skills Assessment',
      desc: 'Identify transferable competencies and personalized gap recommendations.',
      route: 'assessment',
      cta: 'Run Assessment',
    });
  }
  if (pathways.length === 0) {
    nextActions.push({
      title: 'Generate your Kenyan Recognition Checklist',
      desc: 'Map your occupation to KNQA RPL, TVETA, or UNESCO Qualifications Passport steps.',
      route: 'recognition',
      cta: 'Open Navigator',
    });
  }
  if (nextActions.length === 0) {
    nextActions.push({
      title: 'Generate & export your PDF Portfolio',
      desc: 'Your profile, evidence, and recognition checklist are ready to compile into a clean report.',
      route: 'portfolio',
      cta: 'Open Portfolio',
    });
  }

  return (
    <div className="space-y-8">
      {/* Header Welcome */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">
            Welcome back, {fullName}
          </h1>
          <p className="mt-1 text-sm text-[#475569]">
            {profile?.headline || 'Set your professional headline and target sector in My Profile.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('assessment')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0FB5AE] px-4 py-2.5 text-sm font-semibold text-[#0B1F3A] hover:bg-[#5ED6CF] transition-colors whitespace-nowrap"
          >
            <Sparkles className="h-4 w-4" />
            <span>Run AI Assessment</span>
          </button>
          <button
            type="button"
            onClick={handleExportGapRoadmapPdf}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B1F3A] hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            {pdfExported ? (
              <>
                <Check className="h-4 w-4 text-[#16A34A]" />
                <span>PDF Downloaded</span>
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 text-[#0FB5AE]" />
                <span>Export Gap & Roadmap PDF</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('portfolio')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B1F3A] hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <FileCheck2 className="h-4 w-4" />
            <span>Portfolio PDF</span>
          </button>
        </div>
      </div>

      {/* Top KPI Rings & Counters */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex items-center gap-5">
          <CompletenessRing score={completeness} label="Profile" color="#0FB5AE" />
          <div>
            <p className="text-xs font-semibold text-[#475569]">Profile Completeness</p>
            <p className="mt-1 text-sm font-bold text-[#0B1F3A]">{completeness}% Complete</p>
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="mt-2 text-xs font-semibold text-[#0B8A84] hover:underline"
            >
              Edit profile →
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex items-center gap-5">
          <CompletenessRing score={evidence.score} label="Evidence" color="#7C5CFC" />
          <div>
            <p className="text-xs font-semibold text-[#475569]">Evidence Strength</p>
            <p className="mt-1 text-sm font-bold text-[#0B1F3A]">{documents.length} Uploaded Files</p>
            <button
              type="button"
              onClick={() => onNavigate('documents')}
              className="mt-2 text-xs font-semibold text-[#0B8A84] hover:underline"
            >
              Manage documents →
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#475569]">Identified Skills</span>
            <Sparkles className="h-4 w-4 text-[#7C5CFC]" />
          </div>
          <p className="mt-3 font-mono-tabular text-3xl font-bold text-[#0B1F3A]">{skills.length}</p>
          <p className="mt-1 text-xs text-[#475569]">
            {skills.filter((s) => s.source === 'ai_suggested').length} AI-suggested ·{' '}
            {skills.filter((s) => s.source === 'extracted').length} extracted
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#475569]">Recognition Progress</span>
            <Compass className="h-4 w-4 text-[#0FB5AE]" />
          </div>
          <p className="mt-3 font-mono-tabular text-3xl font-bold text-[#0B1F3A]">{pathwayProgress}%</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-[#0FB5AE] transition-all" style={{ width: `${pathwayProgress}%` }} />
          </div>
          <p className="mt-2 text-xs text-[#475569]">
            {completedSteps} of {allSteps.length} checklist steps completed
          </p>
        </div>
      </div>

      {/* Target Sector Skill Gap Radar/Bar & Progress Chart */}
      <SectorSkillGapChart
        profile={profile}
        skills={skills}
        documents={documents}
        latestAssessment={latestAssessment}
        pathways={pathways}
        opportunities={opportunities}
        onNavigate={onNavigate}
        controlledSectorId={selectedSectorId}
        onSectorChange={handleSectorChange}
        skillScope={skillScope}
        onSkillScopeChange={handleSkillScopeChange}
        onFocusGap={handleFocusGap}
      />

      {/* AI Micro-Learning & Local Kenyan Training Suggestions */}
      <div ref={learningSectionRef}>
        <GapLearningRecommendations
          summary={gapSummary}
          currentLocation={profile?.current_location || 'Nairobi, Kenya'}
          focusSkill={focusGapSkill}
          onSelectFocusSkill={setFocusGapSkill}
          onNavigate={onNavigate}
          onPlanChange={setLearningPlan}
        />
      </div>

      {/* Career Progression Visual Timeline Roadmap */}
      <CareerRoadmapTimeline
        profile={profile}
        skills={skills}
        documents={documents}
        evidence={evidence}
        pathways={pathways}
        opportunities={opportunities}
        gapSummary={gapSummary}
        skillScope={skillScope}
        onFocusGap={handleFocusGap}
        onNavigate={onNavigate}
        onExportPdf={handleExportGapRoadmapPdf}
        exportSuccess={pdfExported}
      />

      {/* Local Mentors & Industry Peers in Kenya */}
      <KenyanMentorsSection
        mentors={mentors}
        loading={false}
        error={null}
        gapSummary={gapSummary}
        skills={skills}
        userLocation={profile?.current_location || 'Nairobi, Kenya'}
        shareWithMentors={shareWithMentors}
        onConnect={handleConnectMentor}
        onWithdraw={handleWithdrawMentor}
        onNavigate={onNavigate}
      />

      {/* Main Split: Skills Chart + Recommended Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Skills Profile Distribution</h2>
              <p className="text-xs text-[#475569]">Breakdown across technical, transferable, tools, and languages</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="text-xs font-semibold text-[#0B8A84] hover:underline"
            >
              View all skills
            </button>
          </div>

          <div className="mt-6 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillCounts} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="category" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0', fontSize: 12 }}
                />
                <Bar dataKey="count" fill="#0FB5AE" radius={[8, 8, 0, 0]} barSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Recommended Next Actions</h2>
          <div className="space-y-3">
            {nextActions.map((act) => (
              <div key={act.title} className="rounded-xl border border-slate-200 bg-[#F6F9FC] p-4">
                <p className="text-sm font-semibold text-[#0B1F3A]">{act.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#475569]">{act.desc}</p>
                <button
                  type="button"
                  onClick={() => onNavigate(act.route)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B8A84] hover:underline"
                >
                  <span>{act.cta}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Skills & Relevant Opportunities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Identified Skills & Provenance</h2>
            <FolderOpen className="h-4 w-4 text-[#475569]" />
          </div>

          {skills.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-[#475569]">
              No skills recorded yet. Add skills in My Profile or run an AI Assessment.
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              {skills.slice(0, 6).map((skill) => (
                <div key={skill.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-[#F6F9FC] px-4 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-[#0B1F3A]">{skill.name}</p>
                    <p className="text-xs text-[#475569] capitalize">
                      {skill.category} · {skill.proficiency}
                    </p>
                  </div>
                  <TrustBadge
                    variant={
                      skill.source === 'officially_verified'
                        ? 'officially_verified'
                        : skill.source === 'ai_suggested'
                        ? 'ai_suggested'
                        : skill.source === 'extracted'
                        ? 'extracted'
                        : 'user_provided'
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Relevant Opportunities</h2>
              <TrustBadge variant="demo_data" label="DEMO DATA" />
            </div>
            <button
              type="button"
              onClick={() => onNavigate('opportunities')}
              className="text-xs font-semibold text-[#0B8A84] hover:underline"
            >
              Browse all →
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {opportunities.slice(0, 3).map((opp) => (
              <div key={opp.id} className="rounded-xl border border-slate-200 p-4 hover:border-[#0FB5AE] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0B1F3A]">{opp.title}</p>
                    <p className="mt-0.5 text-xs text-[#475569]">
                      {opp.organization} · {opp.location} · <span className="capitalize">{opp.category}</span>
                    </p>
                  </div>
                  <Briefcase className="h-4 w-4 text-[#0FB5AE] shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
