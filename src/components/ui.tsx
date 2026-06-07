'use client';

import type { ReactNode } from 'react';
import type { Nudge, NudgeLevel } from '@/lib/health';

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`panel p-4 ${className}`}>{children}</div>;
}

export function SectionTitle({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <h2 className="font-display text-xl text-text">{children}</h2>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  accent = 'text-text',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="panel p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${accent}`}>{value}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-muted text-sm py-6 justify-center">
      <span className="inline-block h-4 w-4 rounded-full border-2 border-line border-t-accent animate-spin" />
      {label ?? 'Loading…'}
    </div>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  return (
    <div className="text-center py-8 px-4">
      <p className="text-text font-medium">{title}</p>
      {body && <p className="text-muted text-sm mt-1">{body}</p>}
    </div>
  );
}

const NUDGE_STYLES: Record<NudgeLevel, string> = {
  danger: 'border-danger/50 bg-danger/10 text-danger',
  warn: 'border-warn/50 bg-warn/10 text-warn',
  info: 'border-accent2/40 bg-accent2/10 text-accent2',
  ok: 'border-accent/40 bg-accent/10 text-accent',
};

export function NudgeBanner({ nudge }: { nudge: Nudge }) {
  return (
    <div className={`rounded-xl2 border p-3.5 ${NUDGE_STYLES[nudge.level]}`}>
      <p className="font-semibold text-sm">{nudge.title}</p>
      <p className="text-sm mt-0.5 text-text/80">{nudge.body}</p>
    </div>
  );
}

// Calorie progress ring.
export function Ring({
  value,
  max,
  size = 140,
  stroke = 12,
  label,
  sublabel,
  color = '#5fd6a6',
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  label: ReactNode;
  sublabel?: ReactNode;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const dash = c * pct;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#26352f"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold">{label}</span>
        {sublabel && <span className="text-xs text-muted">{sublabel}</span>}
      </div>
    </div>
  );
}

export function ProgressBar({
  value,
  max,
  min = 0,
  color = '#5fd6a6',
}: {
  value: number;
  max: number;
  min?: number;
  color?: string;
}) {
  const span = max - min;
  const pct = span !== 0 ? ((value - min) / span) * 100 : 0;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-3 w-full rounded-full bg-bg border border-line overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  );
}

export function Badge({
  children,
  color,
}: {
  children: ReactNode;
  color: string;
}) {
  return (
    <span
      className="chip"
      style={{ background: `${color}22`, color }}
    >
      {children}
    </span>
  );
}
