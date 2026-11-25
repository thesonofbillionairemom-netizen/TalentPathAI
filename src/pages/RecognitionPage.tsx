import { useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CheckCircle2, Circle, Clock, Compass, ExternalLink, Loader2, Plus } from 'lucide-react';
import type { RecognitionPathwayRecord } from '../types';
import { apiRequest } from '../lib/api';
import { KENYAN_INSTITUTIONS } from '../lib/kenyaResources';
import { TrustBadge } from '../components/TrustBadge';

interface RecognitionPageProps {
  pathways: RecognitionPathwayRecord[];
  defaultOccupation: string;
  onRefresh: () => Promise<void>;
}

export function RecognitionPage({ pathways, defaultOccupation, onRefresh }: RecognitionPageProps) {
  const reduced = useReducedMotion();
  const [occupation, setOccupation] = useState(defaultOccupation || 'Solar & Civil Engineering Technician');
  const [pathwayType, setPathwayType] = useState<'rpl' | 'foreign_qualification' | 'competency' | 'bridging' | 'licensing'>('rpl');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    setNotice(null);
    try {
      const res = await apiRequest<{ demoNotice?: string }>('/api/pathways/generate', {
        method: 'POST',
        body: JSON.stringify({ targetOccupation: occupation, pathwayType }),
      });
      await onRefresh();
      if (res.demoNotice) setNotice(res.demoNotice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate recognition pathway.');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStep = async (stepId: string, status: 'pending' | 'in_progress' | 'completed') => {
    try {
      await apiRequest(`/api/pathways/steps/${stepId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update step status.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">
          Recognition Pathway Navigator
        </h1>
        <p className="mt-1 text-sm text-[#475569]">
          Step-by-step Kenyan preparation checklists for Recognition of Prior Learning (RPL), foreign qualification equation, and competency testing. TalentPath AI does not issue official certifications or licences.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-[#F5A524]/40 bg-[#F5A524]/10 px-4 py-3 text-sm text-[#0B1F3A]">
          {notice}
        </div>
      )}

      {/* Generator Form */}
      <form onSubmit={handleGenerate} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Generate Personalized Recognition Checklist</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#0B1F3A]">Target Occupation or Trade in Kenya</label>
            <input
              type="text"
              required
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="e.g., Civil Engineering Technician, Electrician, Nurse, Accountant"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0B1F3A]">Pathway Type</label>
            <select
              value={pathwayType}
              onChange={(e) => setPathwayType(e.target.value as typeof pathwayType)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none"
            >
              <option value="rpl">Recognition of Prior Learning (RPL)</option>
              <option value="foreign_qualification">Foreign Qualification Evaluation</option>
              <option value="competency">TVET / NITA Competency Assessment</option>
              <option value="bridging">Bridging Programme</option>
              <option value="licensing">Professional Body Licensing</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0FB5AE] px-5 py-2.5 text-sm font-semibold text-[#0B1F3A] hover:bg-[#5ED6CF] disabled:opacity-60 transition-colors"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span>Create Recognition Timeline</span>
        </button>
      </form>

      {/* Active Pathway Timelines */}
      {pathways.map((pathway) => (
        <div key={pathway.id} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Compass className="h-5 w-5 text-[#0FB5AE]" />
                <h2 className="font-display text-xl font-bold text-[#0B1F3A]">{pathway.target_occupation}</h2>
                <TrustBadge variant="ai_suggested" label="Preparation Guide" />
              </div>
              <p className="mt-1.5 text-sm text-[#475569]">{pathway.summary}</p>
            </div>
            <a
              href={pathway.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-[#0B1F3A] hover:border-[#0FB5AE] shrink-0"
            >
              <span>{pathway.institution_name}</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#0FB5AE]" />
            </a>
          </div>

          <div className="relative space-y-4 pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {pathway.steps.map((step, idx) => (
              <motion.div
                key={step.id}
                initial={reduced ? undefined : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                className="relative rounded-xl border border-slate-200 bg-[#F6F9FC] p-4"
              >
                <span className="absolute -left-[25px] top-4 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-[#0FB5AE]">
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                  ) : step.status === 'in_progress' ? (
                    <Clock className="h-3.5 w-3.5 text-[#F5A524]" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </span>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-[#0B8A84]">Step {step.step_order}</p>
                    <h3 className="font-display text-base font-bold text-[#0B1F3A]">{step.title}</h3>
                    <p className="text-sm text-[#475569]">{step.action_required}</p>
                    <p className="text-xs text-[#0B1F3A]">
                      <strong>Required documents:</strong> {step.required_documents}
                    </p>
                    <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                      <span className="text-[#475569]">Authority: {step.authority_name}</span>
                      <a
                        href={step.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#0B8A84] hover:underline"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {(['pending', 'in_progress', 'completed'] as const).map((statusVal) => (
                      <button
                        key={statusVal}
                        type="button"
                        onClick={() => handleUpdateStep(step.id, statusVal)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                          step.status === statusVal
                            ? statusVal === 'completed'
                              ? 'bg-[#16A34A] text-white'
                              : statusVal === 'in_progress'
                              ? 'bg-[#F5A524] text-[#0B1F3A]'
                              : 'bg-[#0B1F3A] text-white'
                            : 'bg-white border border-slate-200 text-[#475569] hover:bg-slate-100'
                        }`}
                      >
                        {statusVal.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* Curated Kenyan Institutions Directory */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-[#0B1F3A]">
              Official Kenyan Recognition &amp; Regulatory Directory
            </h2>
            <p className="text-xs text-[#475569]">
              Verified statutory portals for qualification recognition, trade testing, and refugee documentation in Kenya.
            </p>
          </div>
          <TrustBadge variant="official_source" label="Official links" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {KENYAN_INSTITUTIONS.map((inst) => (
            <div key={inst.id} className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-tabular text-xs font-bold text-[#0B8A84]">{inst.acronym}</span>
                  <TrustBadge variant="official_source" label="Official body" />
                </div>
                <h3 className="mt-2 font-display text-base font-bold text-[#0B1F3A]">{inst.name}</h3>
                <p className="mt-0.5 text-xs font-medium text-[#475569]">{inst.pathwayFocus}</p>
                <p className="mt-2 text-xs leading-relaxed text-[#475569]">{inst.description}</p>
              </div>
              <a
                href={inst.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B1F3A] hover:text-[#0FB5AE]"
              >
                <span>Visit {inst.acronym} Official Website</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
