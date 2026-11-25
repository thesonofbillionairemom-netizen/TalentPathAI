import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, Loader2, Sparkles } from 'lucide-react';
import type { AssessmentRecord, SkillRecord } from '../types';
import { apiRequest } from '../lib/api';
import { CompletenessRing, DocumentScanner } from '../components/MotionPrimitives';
import { TrustBadge } from '../components/TrustBadge';

interface AssessmentPageProps {
  assessments: AssessmentRecord[];
  skills: SkillRecord[];
  aiConfigured: boolean;
  onRefresh: () => Promise<void>;
}

export function AssessmentPage({ assessments, skills, aiConfigured, onRefresh }: AssessmentPageProps) {
  const reduced = useReducedMotion();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const latest = assessments[0] || null;
  const careerDirections = latest ? (JSON.parse(latest.career_directions_json || '[]') as string[]) : [];

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setDemoNotice(null);
    try {
      const res = await apiRequest<{ demoNotice?: string }>('/api/assessments/run', { method: 'POST' });
      await onRefresh();
      if (res.demoNotice) setDemoNotice(res.demoNotice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run assessment.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">AI Skills Assessment</h1>
          <p className="mt-1 text-sm text-[#475569]">
            Analyzes your experience, skills, and uploaded documents to uncover transferable strengths and evidence gaps.
          </p>
        </div>

        <button
          type="button"
          disabled={running}
          onClick={handleRun}
          className="inline-flex items-center gap-2 rounded-xl bg-[#7C5CFC] px-5 py-3 text-sm font-semibold text-white hover:bg-[#6A48F5] disabled:opacity-60 transition-colors whitespace-nowrap"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          <span>{running ? 'Analyzing Evidence...' : 'Run New Skills Assessment'}</span>
        </button>
      </div>

      {/* Transparency Notice */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#475569]">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-[#7C5CFC] shrink-0" />
          <span>
            AI assessments provide career and preparation guidance only—never an official qualification verification.
          </span>
        </div>
        {!aiConfigured && <TrustBadge variant="demo_data" label="Demo AI Mode Active" />}
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {demoNotice && (
        <div className="rounded-xl border border-[#F5A524]/40 bg-[#F5A524]/10 px-4 py-3 text-sm text-[#0B1F3A]">
          {demoNotice}
        </div>
      )}

      <DocumentScanner active={running} label="Running TalentPath AI Assessment" />

      {!latest ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-[#7C5CFC]" />
          <h2 className="mt-4 font-display text-lg font-bold text-[#0B1F3A]">No Assessment Generated Yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#475569]">
            Click &ldquo;Run New Skills Assessment&rdquo; above to analyze your profile, uploaded evidence, and missing documentation.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary + Score */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 flex flex-col items-center justify-center text-center">
              <CompletenessRing score={latest.evidence_strength_score} label="Evidence" color="#7C5CFC" size={132} />
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {latest.mode === 'demo' ? (
                  <TrustBadge variant="demo_data" label="DEMO MODE OUTPUT" />
                ) : (
                  <TrustBadge variant="ai_suggested" label="Gemini AI Assessment" />
                )}
              </div>
              <p className="mt-2 text-xs text-[#475569]">{latest.disclaimer}</p>
            </div>

            <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Assessment Executive Summary</h2>
              <p className="text-sm leading-relaxed text-[#475569]">{latest.summary}</p>

              {careerDirections.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-[#0B1F3A]">Suggested Career Directions in Kenya</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-[#475569]">
                    {careerDirections.map((dir) => (
                      <li key={dir} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#0FB5AE] shrink-0" />
                        <span>{dir}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Staggered Skills Tags */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Recognized &amp; Transferable Skills</h2>
            <p className="mt-1 text-xs text-[#475569]">
              Every skill displays its origin so employers and assessors know what is user-provided, extracted, or AI-suggested.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {skills.map((s, idx) => (
                <motion.div
                  key={s.id}
                  initial={reduced ? undefined : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.05, 0.5) }}
                  className="rounded-xl border border-slate-200 bg-[#F6F9FC] p-3.5"
                >
                  <p className="text-sm font-semibold text-[#0B1F3A]">{s.name}</p>
                  <p className="mt-0.5 text-xs text-[#475569] capitalize">{s.category} · {s.proficiency}</p>
                  <div className="mt-2">
                    <TrustBadge
                      variant={
                        s.source === 'officially_verified'
                          ? 'officially_verified'
                          : s.source === 'ai_suggested'
                          ? 'ai_suggested'
                          : s.source === 'extracted'
                          ? 'extracted'
                          : 'user_provided'
                      }
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Detailed Findings & Rationale */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#0B1F3A]">
              Evidence Findings, Gaps &amp; Recommended Next Steps
            </h2>
            <div className="space-y-3">
              {latest.results.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-[#F6F9FC] p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {item.result_type === 'missing_evidence' ? (
                        <AlertTriangle className="h-4 w-4 text-[#F5A524] shrink-0" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-[#7C5CFC] shrink-0" />
                      )}
                      <h3 className="text-sm font-bold text-[#0B1F3A]">{item.title}</h3>
                    </div>
                    <TrustBadge
                      variant={
                        item.result_type === 'missing_evidence'
                          ? 'missing_evidence'
                          : item.source_badge === 'extracted'
                          ? 'extracted'
                          : 'ai_suggested'
                      }
                    />
                  </div>
                  <p className="text-sm text-[#475569]">{item.detail}</p>
                  {item.rationale && (
                    <p className="text-xs text-[#0B1F3A]/80 bg-white rounded-lg border border-slate-200 px-3 py-2">
                      <strong>Why recommended:</strong> {item.rationale}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
