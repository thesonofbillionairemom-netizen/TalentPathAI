import { useState } from 'react';
import { CheckSquare, ExternalLink, Info, Scale, Square } from 'lucide-react';
import type { ProfileRecord } from '../types';
import { apiRequest } from '../lib/api';
import { READINESS_CHECKLIST_ITEMS } from '../lib/kenyaResources';
import { TrustBadge } from '../components/TrustBadge';

interface ReadinessPageProps {
  profile: ProfileRecord | null;
  onRefresh: () => Promise<void>;
}

export function ReadinessPage({ profile, onRefresh }: ReadinessPageProps) {
  const initialState: Record<string, boolean> = (() => {
    try {
      return JSON.parse(profile?.legal_readiness_json || '{}');
    } catch {
      return {};
    }
  })();

  const [checks, setChecks] = useState<Record<string, boolean>>(initialState);
  const [saving, setSaving] = useState(false);

  const toggleItem = async (id: string) => {
    const next = { ...checks, [id]: !checks[id] };
    setChecks(next);
    setSaving(true);
    try {
      await apiRequest('/api/profile/legal-readiness', {
        method: 'PUT',
        body: JSON.stringify({ checklist: next }),
      });
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const completedCount = READINESS_CHECKLIST_ITEMS.filter((i) => checks[i.id]).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">
            Legal &amp; Financial Readiness (Kenya)
          </h1>
          <p className="mt-1 text-sm text-[#475569]">
            General onboarding checklists covering Kenyan employment documentation, work authorization, banking access, and statutory registration.
          </p>
        </div>
        <span className="font-mono-tabular text-sm font-bold text-[#0B8A84]">
          {completedCount} / {READINESS_CHECKLIST_ITEMS.length} Prepared {saving ? '(Saving...)' : ''}
        </span>
      </div>

      {/* Mandatory Legal Disclaimer */}
      <div className="rounded-2xl border border-[#F5A524]/40 bg-[#F5A524]/10 p-5 flex gap-3">
        <Info className="h-5 w-5 text-[#B45309] shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-[#0B1F3A]">
          <p className="font-bold">General Information Only — Not Legal Advice</p>
          <p className="mt-1 text-[#475569]">
            Legal work eligibility, refugee permits, and tax rules depend on your individual immigration status and applicable Kenyan laws. TalentPath AI does not make definitive legal determinations—always confirm specific requirements with the Department of Refugee Services (DRS), qualified legal aid organizations, or your employer.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {READINESS_CHECKLIST_ITEMS.map((item) => {
          const checked = Boolean(checks[item.id]);
          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-5 transition-colors ${
                checked ? 'border-[#16A34A]/35 bg-[#16A34A]/5' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="flex items-start gap-3.5 text-left"
                >
                  {checked ? (
                    <CheckSquare className="h-5 w-5 text-[#16A34A] shrink-0 mt-0.5" />
                  ) : (
                    <Square className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-[#0B8A84]">{item.category}</span>
                    </div>
                    <h2 className="mt-1 font-display text-base font-bold text-[#0B1F3A]">{item.title}</h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#475569]">{item.guidance}</p>
                  </div>
                </button>

                <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                  <TrustBadge variant="official_source" label="Official reference" />
                  <a
                    href={item.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B1F3A] hover:text-[#0FB5AE]"
                  >
                    <Scale className="h-3.5 w-3.5" />
                    <span>{item.officialLabel}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
