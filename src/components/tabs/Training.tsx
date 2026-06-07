'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import {
  Card,
  SectionTitle,
  Spinner,
  EmptyState,
  StatTile,
} from '@/components/ui';
import { TRAINING_TYPES, TRAINING_KCAL_PER_MIN } from '@/lib/constants';
import { todayISO, prettyDate, lastNDates, dayLabel } from '@/lib/dates';
import type { TrainingEntry, TrainingType } from '@/lib/types';

export function Training() {
  const supabase = getSupabaseBrowser();
  const [entries, setEntries] = useState<TrainingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('training_log')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    setEntries((data as TrainingEntry[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const last7 = useMemo(() => lastNDates(7), []);
  const last7Set = useMemo(() => new Set(last7), [last7]);

  const weekEntries = useMemo(
    () => entries.filter((e) => last7Set.has(e.date)),
    [entries, last7Set],
  );

  const summary = useMemo(() => {
    const totalMin = weekEntries.reduce((a, e) => a + (e.duration_min || 0), 0);
    const totalKcal = weekEntries.reduce((a, e) => a + (e.calories || 0), 0);
    const rpes = weekEntries.filter((e) => e.rpe != null).map((e) => e.rpe!);
    const avgRpe =
      rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0;
    return {
      sessions: weekEntries.length,
      totalMin,
      totalKcal,
      avgRpe,
    };
  }, [weekEntries]);

  const chartData = useMemo(() => {
    return last7.map((iso) => ({
      label: dayLabel(iso),
      min: weekEntries
        .filter((e) => e.date === iso)
        .reduce((a, e) => a + (e.duration_min || 0), 0),
    }));
  }, [last7, weekEntries]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <TrainingForm onSaved={load} />

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Sessions (7d)" value={summary.sessions} />
        <StatTile
          label="Minutes (7d)"
          value={summary.totalMin}
          accent="text-accent2"
        />
        <StatTile
          label="kcal (7d)"
          value={Math.round(summary.totalKcal)}
          accent="text-warn"
        />
        <StatTile
          label="Avg RPE"
          value={summary.avgRpe ? summary.avgRpe.toFixed(1) : '—'}
        />
      </div>

      <Card>
        <SectionTitle hint="last 7 days">Training load</SectionTitle>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#26352f" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#8aa19a', fontSize: 11 }} stroke="#26352f" />
              <YAxis tick={{ fill: '#8aa19a', fontSize: 11 }} stroke="#26352f" width={32} />
              <Tooltip
                cursor={{ fill: '#1c2a26' }}
                contentStyle={{ background: '#16211e', border: '1px solid #26352f' }}
                formatter={(v: number) => [`${v} min`, 'Duration']}
              />
              <Bar dataKey="min" fill="#5fd6a6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <History entries={entries} onChange={load} />
    </div>
  );
}

// ---------------------------------------------------------------------------
function TrainingForm({ onSaved }: { onSaved: () => void }) {
  const supabase = getSupabaseBrowser();
  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState<TrainingType>('Turbo intervals');
  const [duration, setDuration] = useState('');
  const [rpe, setRpe] = useState('6');
  const [calories, setCalories] = useState('');
  const [hr, setHr] = useState('');
  const [dist, setDist] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Suggest calories from duration × type rate when calories is untouched.
  const suggested = useMemo(() => {
    const d = parseFloat(duration) || 0;
    return Math.round(d * (TRAINING_KCAL_PER_MIN[type] ?? 6));
  }, [duration, type]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const d = parseInt(duration, 10);
    if (!Number.isFinite(d)) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('training_log').insert({
        user_id: user.id,
        date,
        type,
        duration_min: d,
        rpe: rpe ? parseInt(rpe, 10) : null,
        calories: calories ? parseInt(calories, 10) : suggested || null,
        avg_hr: hr ? parseInt(hr, 10) : null,
        distance_km: dist ? parseFloat(dist) : null,
        notes: notes || null,
      });
    }
    setDuration('');
    setCalories('');
    setHr('');
    setDist('');
    setNotes('');
    setSaving(false);
    onSaved();
  }

  return (
    <Card>
      <SectionTitle>Log a session</SectionTitle>
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
            <label className="label">Type</label>
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value as TrainingType)}
            >
              {TRAINING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Duration (min)</label>
            <input
              type="number"
              inputMode="numeric"
              className="input"
              placeholder="45"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">RPE (1–10)</label>
            <input
              type="number"
              min={1}
              max={10}
              inputMode="numeric"
              className="input"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="label">Calories</label>
            <input
              type="number"
              inputMode="numeric"
              className="input"
              placeholder={suggested ? String(suggested) : 'est.'}
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Avg HR</label>
            <input
              type="number"
              inputMode="numeric"
              className="input"
              placeholder="opt"
              value={hr}
              onChange={(e) => setHr(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Dist (km)</label>
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              className="input"
              placeholder="opt"
              value={dist}
              onChange={(e) => setDist(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">How it felt</label>
          <textarea
            className="input min-h-[64px] resize-y"
            placeholder="Legs heavy early, settled into it. Good session."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button className="btn-primary w-full" disabled={saving}>
          {saving ? 'Saving…' : 'Save session'}
        </button>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
function History({
  entries,
  onChange,
}: {
  entries: TrainingEntry[];
  onChange: () => void;
}) {
  const supabase = getSupabaseBrowser();

  async function remove(id: string) {
    await supabase.from('training_log').delete().eq('id', id);
    onChange();
  }

  return (
    <Card>
      <SectionTitle>History</SectionTitle>
      {entries.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          body="Log your first session above."
        />
      ) : (
        <div className="divide-y divide-line">
          {entries.map((e) => (
            <div key={e.id} className="py-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{e.type}</div>
                  <div className="text-xs text-muted">
                    {prettyDate(e.date)} · {e.duration_min} min
                    {e.rpe ? ` · RPE ${e.rpe}` : ''}
                    {e.calories ? ` · ${e.calories} kcal` : ''}
                    {e.avg_hr ? ` · ${e.avg_hr} bpm` : ''}
                    {e.distance_km ? ` · ${e.distance_km} km` : ''}
                  </div>
                  {e.notes && (
                    <p className="text-xs text-text/70 mt-1 italic">“{e.notes}”</p>
                  )}
                </div>
                <button
                  onClick={() => remove(e.id)}
                  className="text-muted hover:text-danger text-sm pl-3"
                  aria-label="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
