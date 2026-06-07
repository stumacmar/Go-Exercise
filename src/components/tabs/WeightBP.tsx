'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { useSettings } from '@/components/SettingsContext';
import {
  Card,
  SectionTitle,
  Spinner,
  EmptyState,
  Badge,
} from '@/components/ui';
import { categorizeBp } from '@/lib/health';
import { todayISO, prettyDate, fromISO } from '@/lib/dates';
import type { WeightEntry, BpEntry } from '@/lib/types';

export function WeightBP() {
  const { settings } = useSettings();
  const supabase = getSupabaseBrowser();
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [bps, setBps] = useState<BpEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [w, b] = await Promise.all([
      supabase.from('weight_log').select('*').order('date', { ascending: true }),
      supabase.from('bp_log').select('*').order('date', { ascending: false }),
    ]);
    setWeights((w.data as WeightEntry[]) ?? []);
    setBps((b.data as BpEntry[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <WeightForm onSaved={load} />
      <WeightChart weights={weights} goalKg={settings?.goal_kg ?? 100} />
      <WeightHistory weights={weights} onChange={load} />
      <BpForm onSaved={load} />
      <BpHistory bps={bps} onChange={load} />
    </div>
  );
}

// ---------------------------------------------------------------------------
function WeightForm({ onSaved }: { onSaved: () => void }) {
  const supabase = getSupabaseBrowser();
  const [date, setDate] = useState(todayISO());
  const [kg, setKg] = useState('');
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(kg);
    if (!Number.isFinite(value)) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // One row per date — upsert on (user_id, date).
      await supabase
        .from('weight_log')
        .upsert(
          { user_id: user.id, date, kg: value },
          { onConflict: 'user_id,date' },
        );
    }
    setKg('');
    setSaving(false);
    onSaved();
  }

  return (
    <Card>
      <SectionTitle hint="one per day · upserts">Log weight</SectionTitle>
      <form onSubmit={save} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            className="input"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            className="input"
            placeholder="118.4"
            value={kg}
            onChange={(e) => setKg(e.target.value)}
            required
          />
        </div>
        <button className="btn-primary" disabled={saving}>
          {saving ? '…' : 'Save'}
        </button>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
function WeightChart({
  weights,
  goalKg,
}: {
  weights: WeightEntry[];
  goalKg: number;
}) {
  const data = useMemo(
    () =>
      weights.map((w) => ({
        date: w.date,
        kg: Number(w.kg),
        label: fromISO(w.date).toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
        }),
      })),
    [weights],
  );

  if (data.length === 0) {
    return (
      <Card>
        <SectionTitle>Weight trend</SectionTitle>
        <EmptyState
          title="No weigh-ins yet"
          body="Log your weight above to start the trend line."
        />
      </Card>
    );
  }

  const values = data.map((d) => d.kg).concat(goalKg);
  const min = Math.floor(Math.min(...values) - 1);
  const max = Math.ceil(Math.max(...values) + 1);

  return (
    <Card>
      <SectionTitle hint={`goal ${goalKg}kg`}>Weight trend</SectionTitle>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#26352f" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#8aa19a', fontSize: 11 }}
              stroke="#26352f"
            />
            <YAxis
              domain={[min, max]}
              tick={{ fill: '#8aa19a', fontSize: 11 }}
              stroke="#26352f"
              width={40}
            />
            <Tooltip
              contentStyle={{ background: '#16211e', border: '1px solid #26352f' }}
              labelStyle={{ color: '#e7f0ec' }}
              formatter={(v: number) => [`${v} kg`, 'Weight']}
            />
            <ReferenceLine
              y={goalKg}
              stroke="#5fd6a6"
              strokeDasharray="6 6"
              label={{ value: 'Goal', fill: '#5fd6a6', fontSize: 11, position: 'insideTopRight' }}
            />
            <Line
              type="monotone"
              dataKey="kg"
              stroke="#7fb8ff"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#7fb8ff' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
function WeightHistory({
  weights,
  onChange,
}: {
  weights: WeightEntry[];
  onChange: () => void;
}) {
  const supabase = getSupabaseBrowser();
  const rows = useMemo(() => [...weights].reverse(), [weights]);

  async function remove(id: string) {
    await supabase.from('weight_log').delete().eq('id', id);
    onChange();
  }

  if (rows.length === 0) return null;

  return (
    <Card>
      <SectionTitle>Weight history</SectionTitle>
      <div className="divide-y divide-line">
        {rows.map((w, i) => {
          const prev = rows[i + 1];
          const delta = prev ? Number(w.kg) - Number(prev.kg) : null;
          return (
            <div key={w.id} className="flex items-center justify-between py-2.5">
              <div>
                <div className="text-sm">{prettyDate(w.date)}</div>
                {delta !== null && (
                  <div
                    className={`text-xs ${
                      delta <= 0 ? 'text-accent' : 'text-warn'
                    }`}
                  >
                    {delta > 0 ? '+' : ''}
                    {delta.toFixed(1)} kg
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold tabular-nums">
                  {Number(w.kg).toFixed(1)} kg
                </span>
                <button
                  onClick={() => remove(w.id)}
                  className="text-muted hover:text-danger text-sm"
                  aria-label="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
function BpForm({ onSaved }: { onSaved: () => void }) {
  const supabase = getSupabaseBrowser();
  const [date, setDate] = useState(todayISO());
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [pulse, setPulse] = useState('');
  const [saving, setSaving] = useState(false);

  const preview =
    sys && dia ? categorizeBp(parseInt(sys, 10), parseInt(dia, 10)) : null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const s = parseInt(sys, 10);
    const d = parseInt(dia, 10);
    if (!Number.isFinite(s) || !Number.isFinite(d)) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('bp_log').insert({
        user_id: user.id,
        date,
        systolic: s,
        diastolic: d,
        pulse: pulse ? parseInt(pulse, 10) : null,
      });
    }
    setSys('');
    setDia('');
    setPulse('');
    setSaving(false);
    onSaved();
  }

  return (
    <Card>
      <SectionTitle hint="auto-categorised">Log blood pressure</SectionTitle>
      <form onSubmit={save} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Pulse (bpm)</label>
            <input
              type="number"
              inputMode="numeric"
              className="input"
              placeholder="optional"
              value={pulse}
              onChange={(e) => setPulse(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Systolic</label>
            <input
              type="number"
              inputMode="numeric"
              className="input"
              placeholder="128"
              value={sys}
              onChange={(e) => setSys(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Diastolic</label>
            <input
              type="number"
              inputMode="numeric"
              className="input"
              placeholder="82"
              value={dia}
              onChange={(e) => setDia(e.target.value)}
              required
            />
          </div>
        </div>
        {preview && (
          <div className="flex items-center gap-2">
            <Badge color={preview.color}>{preview.category}</Badge>
            <span className="text-xs text-muted">{preview.note}</span>
          </div>
        )}
        <button className="btn-primary w-full" disabled={saving}>
          {saving ? 'Saving…' : 'Save reading'}
        </button>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
function BpHistory({
  bps,
  onChange,
}: {
  bps: BpEntry[];
  onChange: () => void;
}) {
  const supabase = getSupabaseBrowser();

  async function remove(id: string) {
    await supabase.from('bp_log').delete().eq('id', id);
    onChange();
  }

  return (
    <Card>
      <SectionTitle>BP history</SectionTitle>
      {bps.length === 0 ? (
        <EmptyState title="No readings yet" body="Log a BP reading above." />
      ) : (
        <div className="divide-y divide-line">
          {bps.map((b) => {
            const cat = categorizeBp(b.systolic, b.diastolic);
            return (
              <div
                key={b.id}
                className="flex items-center justify-between py-2.5"
              >
                <div>
                  <div className="text-sm font-semibold tabular-nums">
                    {b.systolic}/{b.diastolic}
                    {b.pulse ? (
                      <span className="text-muted font-normal">
                        {' '}
                        · {b.pulse} bpm
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted">{prettyDate(b.date)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge color={cat.color}>{cat.category}</Badge>
                  <button
                    onClick={() => remove(b.id)}
                    className="text-muted hover:text-danger text-sm"
                    aria-label="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
