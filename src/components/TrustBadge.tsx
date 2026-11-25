import { AlertTriangle, CheckCircle2, FileText, Info, Sparkles, UserCheck } from 'lucide-react';

export type TrustVariant =
  | 'officially_verified'
  | 'official_source'
  | 'ai_suggested'
  | 'demo_data'
  | 'user_provided'
  | 'extracted'
  | 'missing_evidence';

interface TrustBadgeProps {
  variant: TrustVariant;
  label?: string;
}

const CONFIG: Record<
  TrustVariant,
  { text: string; colorClass: string; icon: typeof CheckCircle2 }
> = {
  officially_verified: {
    text: 'Officially verified',
    colorClass: 'text-[#16A34A] bg-[#16A34A]/10 border-[#16A34A]/25',
    icon: CheckCircle2,
  },
  official_source: {
    text: 'Official resource',
    colorClass: 'text-[#16A34A] bg-[#16A34A]/10 border-[#16A34A]/25',
    icon: CheckCircle2,
  },
  ai_suggested: {
    text: 'AI-generated suggestion',
    colorClass: 'text-[#7C5CFC] bg-[#7C5CFC]/10 border-[#7C5CFC]/25',
    icon: Sparkles,
  },
  demo_data: {
    text: 'DEMO DATA',
    colorClass: 'text-[#B45309] bg-[#F5A524]/15 border-[#F5A524]/35',
    icon: Info,
  },
  user_provided: {
    text: 'User provided',
    colorClass: 'text-[#12305A] bg-[#12305A]/8 border-[#12305A]/20',
    icon: UserCheck,
  },
  extracted: {
    text: 'Extracted from evidence',
    colorClass: 'text-[#0B8A84] bg-[#0FB5AE]/12 border-[#0FB5AE]/30',
    icon: FileText,
  },
  missing_evidence: {
    text: 'Missing evidence',
    colorClass: 'text-[#B45309] bg-[#F5A524]/15 border-[#F5A524]/35',
    icon: AlertTriangle,
  },
};

export function TrustBadge({ variant, label }: TrustBadgeProps) {
  const cfg = CONFIG[variant] || CONFIG.user_provided;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 ${cfg.colorClass}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{label || cfg.text}</span>
    </span>
  );
}
