import { type ReactNode, useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { FileSearch, ShieldCheck } from 'lucide-react';

export function RevealSection({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCounter({
  value,
  suffix = '',
  fallbackText,
}: {
  value: number;
  suffix?: string;
  fallbackText: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || reduced) {
      setDisplay(value);
      return;
    }
    const duration = 900;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, value]);

  if (reduced) {
    return (
      <span ref={ref} className="font-mono-tabular tabular-nums">
        {fallbackText}
      </span>
    );
  }

  return (
    <span ref={ref} className="font-mono-tabular tabular-nums">
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

export function CompletenessRing({
  score,
  label,
  color = '#0FB5AE',
  size = 116,
}: {
  score: number;
  label: string;
  color?: string;
  size?: number;
}) {
  const reduced = useReducedMotion();
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-label={`${label}: ${clamped}%`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduced ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono-tabular text-2xl font-bold text-[#0B1F3A]">{clamped}%</span>
        <span className="text-[11px] font-medium text-[#475569]">{label}</span>
      </div>
    </div>
  );
}

export function DocumentScanner({ active, label }: { active: boolean; label: string }) {
  const reduced = useReducedMotion();
  if (!active) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#7C5CFC]/30 bg-[#0B1F3A] p-6 text-white">
      {!reduced && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#0FB5AE] to-transparent opacity-80"
          initial={{ top: '0%' }}
          animate={{ top: ['0%', '96%', '0%'] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <div className="relative flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C5CFC]/20 text-[#5ED6CF]">
          <FileSearch className="h-6 w-6" />
        </div>
        <div>
          <p className="font-display text-base font-semibold">{label}</p>
          <p className="mt-0.5 text-xs text-slate-300">
            Reviewing uploaded evidence, identifying transferable competencies, and checking documentation gaps...
          </p>
        </div>
        <ShieldCheck className="ml-auto hidden h-5 w-5 text-[#5ED6CF] sm:block" />
      </div>
    </div>
  );
}

const CONFETTI_COLORS = ['#0FB5AE', '#5ED6CF', '#7C5CFC', '#F5A524', '#16A34A'];

export function ConfettiBurst({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  if (!active || reduced) return null;

  const pieces = Array.from({ length: 24 }, (_, idx) => {
    const angle = (idx / 24) * Math.PI * 2;
    const distance = 65 + (idx % 4) * 28;
    return {
      id: idx,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 20,
      rotate: (idx * 47) % 360,
      color: CONFETTI_COLORS[idx % CONFETTI_COLORS.length],
    };
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0.6, rotate: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y + 80, scale: 1, rotate: p.rotate }}
          transition={{ duration: 1.15, ease: 'easeOut' }}
          className="absolute h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}
