import { ArrowRight, Briefcase, Compass, FileCheck2, FolderOpen, Sparkles } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type {
  AppRoute,
  AssessmentRecord,
  DocumentRecord,
  EvidenceSummary,
  OpportunityRecord,
  ProfileRecord,
  RecognitionPathwayRecord,
  SkillRecord,
} from '../types';
import { CompletenessRing } from '../components/MotionPrimitives';
import { TrustBadge } from '../components/TrustBadge';

interface DashboardPageProps {
  fullName: string;
  profile: ProfileRecord | null;
  documents: DocumentRecord[];
  skills: SkillRecord[];
  evidence: EvidenceSummary;
  latestAssessment: AssessmentRecord | null;
  pathways: RecognitionPathwayRecord[];
  opportunities: OpportunityRecord[];
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
  onNavigate,
}: DashboardPageProps) {
  const completeness = profile?.completeness_score ?? 0;

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
