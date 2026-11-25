import { useState } from 'react';
import { Download, Edit3, FileCheck2, Loader2, Save, Sparkles } from 'lucide-react';
import type {
  DocumentRecord,
  PortfolioRecord,
  ProfileRecord,
  QualificationRecord,
  RecognitionPathwayRecord,
  SkillRecord,
  WorkExperienceRecord,
} from '../types';
import { apiRequest } from '../lib/api';
import { exportPortfolioToPdf } from '../lib/pdfExport';
import { ConfettiBurst } from '../components/MotionPrimitives';
import { TrustBadge } from '../components/TrustBadge';

interface PortfolioPageProps {
  fullName: string;
  profile: ProfileRecord | null;
  qualifications: QualificationRecord[];
  experience: WorkExperienceRecord[];
  skills: SkillRecord[];
  documents: DocumentRecord[];
  pathways: RecognitionPathwayRecord[];
  portfolios: PortfolioRecord[];
  onRefresh: () => Promise<void>;
}

export function PortfolioPage({
  fullName,
  profile,
  qualifications,
  experience,
  skills,
  documents,
  pathways,
  portfolios,
  onRefresh,
}: PortfolioPageProps) {
  const latest = portfolios[0] || null;

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState(latest?.title || '');
  const [editSummary, setEditSummary] = useState(latest?.summary || '');
  const [editStrengths, setEditStrengths] = useState(() => {
    try {
      return (JSON.parse(latest?.strengths_json || '[]') as string[]).join('\n');
    } catch {
      return '';
    }
  });
  const [editGaps, setEditGaps] = useState(() => {
    try {
      return (JSON.parse(latest?.gaps_json || '[]') as string[]).join('\n');
    } catch {
      return '';
    }
  });
  const [editNextSteps, setEditNextSteps] = useState(() => {
    try {
      return (JSON.parse(latest?.next_steps_json || '[]') as string[]).join('\n');
    } catch {
      return '';
    }
  });

  const syncEditFields = (p: PortfolioRecord) => {
    setEditTitle(p.title);
    setEditSummary(p.summary);
    setEditStrengths((JSON.parse(p.strengths_json || '[]') as string[]).join('\n'));
    setEditGaps((JSON.parse(p.gaps_json || '[]') as string[]).join('\n'));
    setEditNextSteps((JSON.parse(p.next_steps_json || '[]') as string[]).join('\n'));
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1400);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setNotice(null);
    try {
      const res = await apiRequest<{ portfolio: PortfolioRecord; demoNotice?: string }>('/api/portfolios/generate', {
        method: 'POST',
      });
      await onRefresh();
      syncEditFields(res.portfolio);
      setEditing(false);
      triggerConfetti();
      if (res.demoNotice) setNotice(res.demoNotice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate portfolio.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!latest) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/api/portfolios/${latest.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle,
          summary: editSummary,
          strengths: editStrengths.split('\n').map((s) => s.trim()).filter(Boolean),
          gaps: editGaps.split('\n').map((s) => s.trim()).filter(Boolean),
          nextSteps: editNextSteps.split('\n').map((s) => s.trim()).filter(Boolean),
        }),
      });
      await onRefresh();
      setEditing(false);
      setNotice('Portfolio edits saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save portfolio edits.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!latest) return;
    exportPortfolioToPdf({
      fullName,
      portfolio: latest,
      profile,
      qualifications,
      experience,
      skills,
      documents,
      pathways,
    });
    triggerConfetti();
  };

  const strengths = latest ? (JSON.parse(latest.strengths_json || '[]') as string[]) : [];
  const gaps = latest ? (JSON.parse(latest.gaps_json || '[]') as string[]) : [];
  const nextSteps = latest ? (JSON.parse(latest.next_steps_json || '[]') as string[]) : [];

  return (
    <div className="space-y-8">
      <ConfettiBurst active={showConfetti} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">Professional Portfolio</h1>
          <p className="mt-1 text-sm text-[#475569]">
            Compile your verified history, supporting evidence, strengths, and Kenyan recognition plan into a downloadable PDF report.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={generating}
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0FB5AE] px-4 py-2.5 text-sm font-semibold text-[#0B1F3A] hover:bg-[#5ED6CF] disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>{latest ? 'Regenerate Portfolio' : 'Generate Portfolio'}</span>
          </button>

          {latest && (
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F3A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#12305A] transition-colors whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-[#0FB5AE]/30 bg-[#0FB5AE]/10 px-4 py-3 text-sm text-[#0B1F3A]">
          {notice}
        </div>
      )}

      {!latest ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileCheck2 className="mx-auto h-10 w-10 text-[#0FB5AE]" />
          <h2 className="mt-4 font-display text-lg font-bold text-[#0B1F3A]">No Portfolio Generated Yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#475569]">
            Click &ldquo;Generate Portfolio&rdquo; above to organize your profile, evidence, and recognition progress into an employer-ready document.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          {/* Portfolio Header Banner */}
          <div className="bg-hero-gradient px-6 py-8 text-white sm:px-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {latest.mode === 'demo' ? (
                  <TrustBadge variant="demo_data" label="DEMO MODE PORTFOLIO" />
                ) : (
                  <TrustBadge variant="ai_suggested" label="AI-Structured Portfolio" />
                )}
              </div>
              <h2 className="font-display text-2xl font-bold">{latest.title}</h2>
              <p className="mt-1 text-sm text-[#5ED6CF]">
                {profile?.current_location || 'Kenya'} · {profile?.target_sector || 'Professional Services'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                syncEditFields(latest);
                setEditing((prev) => !prev);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20 shrink-0"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{editing ? 'Cancel Edit' : 'Edit Portfolio Text'}</span>
            </button>
          </div>

          {editing ? (
            <div className="p-6 sm:p-8 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B1F3A]">Portfolio Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0B1F3A]">Professional Summary</label>
                <textarea
                  rows={4}
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F3A]">Identified Strengths (1 per line)</label>
                  <textarea
                    rows={4}
                    value={editStrengths}
                    onChange={(e) => setEditStrengths(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F3A]">Evidence Gaps (1 per line)</label>
                  <textarea
                    rows={4}
                    value={editGaps}
                    onChange={(e) => setEditGaps(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F3A]">Recommended Next Steps (1 per line)</label>
                  <textarea
                    rows={4}
                    value={editNextSteps}
                    onChange={(e) => setEditNextSteps(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveEdits}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F3A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#12305A]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Save Portfolio Updates</span>
              </button>
            </div>
          ) : (
            <div className="p-6 sm:p-8 space-y-8">
              {/* Summary */}
              <section>
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#0B8A84]">
                  Professional Summary
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#475569]">{latest.summary}</p>
              </section>

              {/* Education & Work */}
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <section>
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#0B8A84]">
                    Education &amp; Qualifications
                  </h3>
                  <div className="mt-3 space-y-3">
                    {qualifications.map((q) => (
                      <div key={q.id} className="rounded-xl border border-slate-200 bg-[#F6F9FC] p-3.5 text-xs">
                        <p className="font-bold text-[#0B1F3A]">{q.title}</p>
                        <p className="text-[#475569]">{q.institution} ({q.year_obtained || 'N/A'})</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#0B8A84]">
                    Employment History
                  </h3>
                  <div className="mt-3 space-y-3">
                    {experience.map((w) => (
                      <div key={w.id} className="rounded-xl border border-slate-200 bg-[#F6F9FC] p-3.5 text-xs">
                        <p className="font-bold text-[#0B1F3A]">{w.job_title}</p>
                        <p className="text-[#475569]">{w.organization} · {w.start_year}–{w.end_year || 'Present'}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Skills & Evidence */}
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <section>
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#0B8A84]">
                    Technical &amp; Transferable Skills
                  </h3>
                  <ul className="mt-3 space-y-1.5 text-xs text-[#475569]">
                    {skills.map((s) => (
                      <li key={s.id} className="flex items-center justify-between border-b border-slate-100 py-1.5">
                        <span className="font-medium text-[#0B1F3A]">{s.name}</span>
                        <span className="capitalize">{s.source.replace(/_/g, ' ')}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#0B8A84]">
                    Supporting Evidence Attached
                  </h3>
                  <ul className="mt-3 space-y-1.5 text-xs text-[#475569]">
                    {documents.map((d) => (
                      <li key={d.id} className="border-b border-slate-100 py-1.5">
                        <span className="font-medium text-[#0B1F3A]">{d.original_name}</span> ({d.category.replace(/_/g, ' ')})
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Strengths, Gaps, Next Steps */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-[#F6F9FC] p-4">
                  <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#16A34A]">
                    Identified Strengths
                  </h4>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#475569]">
                    {strengths.map((s) => <li key={s}>• {s}</li>)}
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 bg-[#F6F9FC] p-4">
                  <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#B45309]">
                    Evidence Gaps
                  </h4>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#475569]">
                    {gaps.map((g) => <li key={g}>• {g}</li>)}
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 bg-[#F6F9FC] p-4">
                  <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#0B8A84]">
                    Recommended Next Steps
                  </h4>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#475569]">
                    {nextSteps.map((n) => <li key={n}>• {n}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
