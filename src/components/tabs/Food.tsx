'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { useSettings } from '@/components/SettingsContext';
import {
  Card,
  SectionTitle,
  Spinner,
  EmptyState,
  Ring,
  NudgeBanner,
} from '@/components/ui';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { calorieNudges } from '@/lib/health';
import { todayISO, prettyDate } from '@/lib/dates';
import type { FoodEntry, FoodResult } from '@/lib/types';

export function Food() {
  const { settings } = useSettings();
  const supabase = getSupabaseBrowser();
  const [date, setDate] = useState(todayISO());
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('food_log')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: true });
    setEntries((data as FoodEntry[]) ?? []);
    setLoading(false);
  }, [supabase, date]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    return entries.reduce(
      (acc, e) => ({
        calories: acc.calories + Number(e.calories),
        protein: acc.protein + Number(e.protein),
        carbs: acc.carbs + Number(e.carbs),
        fat: acc.fat + Number(e.fat),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [entries]);

  const calorieTarget = settings?.calorie_target ?? 2000;
  const proteinTarget = settings?.protein_target ?? 160;

  const nudges = calorieNudges({
    calories: totals.calories,
    protein: totals.protein,
    calorieTarget,
    proteinTarget,
    hasAnyFood: entries.length > 0,
  });

  async function remove(id: string) {
    await supabase.from('food_log').delete().eq('id', id);
    load();
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl">Food &amp; calories</h2>
          <input
            type="date"
            className="input w-auto py-1.5"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-5">
          <Ring
            value={totals.calories}
            max={calorieTarget}
            label={Math.round(totals.calories)}
            sublabel={`/ ${calorieTarget}`}
            color={totals.calories > calorieTarget ? '#f0a35e' : '#5fd6a6'}
          />
          <div className="flex-1 space-y-2">
            <Macro
              label="Protein"
              value={totals.protein}
              target={proteinTarget}
              unit="g"
              color="#5fd6a6"
            />
            <Macro label="Carbs" value={totals.carbs} unit="g" color="#7fb8ff" />
            <Macro label="Fat" value={totals.fat} unit="g" color="#f0a35e" />
            <div className="text-xs text-muted pt-1">
              {Math.max(0, Math.round(calorieTarget - totals.calories))} kcal
              remaining
            </div>
          </div>
        </div>
      </Card>

      {nudges.map((n, i) => (
        <NudgeBanner key={i} nudge={n} />
      ))}

      <AddFood date={date} onAdded={load} />

      <Card>
        <SectionTitle hint={prettyDate(date)}>Logged today</SectionTitle>
        {loading ? (
          <Spinner />
        ) : entries.length === 0 ? (
          <EmptyState
            title="Nothing logged yet"
            body="Scan, search, or add a food above."
          />
        ) : (
          <div className="divide-y divide-line">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <div className="text-sm truncate">{e.name}</div>
                  <div className="text-xs text-muted">
                    {Math.round(Number(e.calories))} kcal · P{' '}
                    {Math.round(Number(e.protein))} · C{' '}
                    {Math.round(Number(e.carbs))} · F {Math.round(Number(e.fat))}
                  </div>
                </div>
                <button
                  onClick={() => remove(e.id)}
                  className="text-muted hover:text-danger text-sm pl-3"
                  aria-label="Delete"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Macro({
  label,
  value,
  target,
  unit,
  color,
}: {
  label: string;
  value: number;
  target?: number;
  unit: string;
  color: string;
}) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums">
          {Math.round(value)}
          {unit}
          {target ? ` / ${target}${unit}` : ''}
        </span>
      </div>
      {target ? (
        <div className="h-1.5 rounded-full bg-bg mt-1 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
type Mode = 'search' | 'manual';

function AddFood({ date, onAdded }: { date: string; onAdded: () => void }) {
  const [mode, setMode] = useState<Mode>('search');
  const [scanning, setScanning] = useState(false);
  const [candidate, setCandidate] = useState<FoodResult | null>(null);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <button
          className={`chip ${
            mode === 'search'
              ? 'bg-accent text-bg'
              : 'bg-panel2 text-muted border border-line'
          }`}
          onClick={() => setMode('search')}
        >
          Scan / search
        </button>
        <button
          className={`chip ${
            mode === 'manual'
              ? 'bg-accent text-bg'
              : 'bg-panel2 text-muted border border-line'
          }`}
          onClick={() => setMode('manual')}
        >
          Manual
        </button>
      </div>

      {scanning && (
        <BarcodeScanner
          onClose={() => setScanning(false)}
          onDetected={async (code) => {
            setScanning(false);
            const r = await lookupBarcode(code);
            if (r) setCandidate(r);
            else
              setCandidate({
                name: '',
                barcode: code,
                calories_100: 0,
                protein_100: 0,
                carbs_100: 0,
                fat_100: 0,
                serving_g: null,
              });
          }}
        />
      )}

      {mode === 'search' && !candidate && (
        <SearchPanel onScan={() => setScanning(true)} onPick={setCandidate} />
      )}

      {mode === 'search' && candidate && (
        <PortionEditor
          candidate={candidate}
          date={date}
          onCancel={() => setCandidate(null)}
          onAdded={() => {
            setCandidate(null);
            onAdded();
          }}
        />
      )}

      {mode === 'manual' && <ManualEntry date={date} onAdded={onAdded} />}
    </Card>
  );
}

async function lookupBarcode(code: string): Promise<FoodResult | null> {
  try {
    const res = await fetch(`/api/food?barcode=${encodeURIComponent(code)}`);
    const data = await res.json();
    return data.found ? (data.result as FoodResult) : null;
  } catch {
    return null;
  }
}

function SearchPanel({
  onScan,
  onPick,
}: {
  onScan: () => void;
  onPick: (r: FoodResult) => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<FoodResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`/api/food?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.error) setMsg(data.error);
      setResults((data.results as FoodResult[]) ?? []);
      if ((data.results ?? []).length === 0 && !data.error)
        setMsg('No matches. Try a manual entry.');
    } catch {
      setMsg('Search failed — you can add this food manually.');
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <button onClick={onScan} className="btn-primary w-full">
        📷 Scan barcode
      </button>
      <form onSubmit={search} className="flex gap-2">
        <input
          className="input"
          placeholder="Search foods (e.g. greek yoghurt)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn-ghost" disabled={loading}>
          {loading ? '…' : 'Go'}
        </button>
      </form>
      {msg && <p className="text-xs text-muted">{msg}</p>}
      {results.length > 0 && (
        <div className="divide-y divide-line max-h-72 overflow-auto">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => onPick(r)}
              className="w-full text-left py-2.5 hover:text-accent"
            >
              <div className="text-sm truncate">{r.name}</div>
              <div className="text-xs text-muted">
                {Math.round(r.calories_100)} kcal · P {Math.round(r.protein_100)}{' '}
                · C {Math.round(r.carbs_100)} · F {Math.round(r.fat_100)} /100g
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PortionEditor({
  candidate,
  date,
  onCancel,
  onAdded,
}: {
  candidate: FoodResult;
  date: string;
  onCancel: () => void;
  onAdded: () => void;
}) {
  const supabase = getSupabaseBrowser();
  const [name, setName] = useState(candidate.name);
  const [grams, setGrams] = useState(String(candidate.serving_g ?? 100));
  const [saving, setSaving] = useState(false);

  const g = parseFloat(grams) || 0;
  const factor = g / 100;
  const calc = {
    calories: candidate.calories_100 * factor,
    protein: candidate.protein_100 * factor,
    carbs: candidate.carbs_100 * factor,
    fat: candidate.fat_100 * factor,
  };

  async function add() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('food_log').insert({
        user_id: user.id,
        date,
        name: name || 'Food',
        qty: g,
        calories: Math.round(calc.calories * 10) / 10,
        protein: Math.round(calc.protein * 10) / 10,
        carbs: Math.round(calc.carbs * 10) / 10,
        fat: Math.round(calc.fat * 10) / 10,
        barcode: candidate.barcode,
      });
    }
    setSaving(false);
    onAdded();
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label">Name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Amount (grams / ml)</label>
        <input
          type="number"
          inputMode="decimal"
          className="input"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
        />
        {candidate.serving_g && (
          <p className="text-xs text-muted mt-1">
            Typical serving ≈ {candidate.serving_g} g
          </p>
        )}
      </div>
      <div className="text-sm bg-bg rounded-lg p-3 border border-line">
        <span className="font-semibold">{Math.round(calc.calories)} kcal</span>
        <span className="text-muted">
          {' '}
          · P {Math.round(calc.protein)} · C {Math.round(calc.carbs)} · F{' '}
          {Math.round(calc.fat)}
        </span>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-ghost flex-1">
          Back
        </button>
        <button onClick={add} className="btn-primary flex-1" disabled={saving}>
          {saving ? 'Adding…' : 'Add'}
        </button>
      </div>
    </div>
  );
}

function ManualEntry({ date, onAdded }: { date: string; onAdded: () => void }) {
  const supabase = getSupabaseBrowser();
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [cal, setCal] = useState('');
  const [p, setP] = useState('');
  const [c, setC] = useState('');
  const [f, setF] = useState('');
  const [saving, setSaving] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const q = parseFloat(qty) || 1;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('food_log').insert({
        user_id: user.id,
        date,
        name: name || 'Food',
        qty: q,
        calories: (parseFloat(cal) || 0) * q,
        protein: (parseFloat(p) || 0) * q,
        carbs: (parseFloat(c) || 0) * q,
        fat: (parseFloat(f) || 0) * q,
        barcode: null,
      });
    }
    setName('');
    setQty('1');
    setCal('');
    setP('');
    setC('');
    setF('');
    setSaving(false);
    onAdded();
  }

  return (
    <form onSubmit={add} className="space-y-3">
      <div>
        <label className="label">Name</label>
        <input
          className="input"
          placeholder="e.g. Chicken &amp; rice"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">Calories (per unit)</label>
          <input
            type="number"
            inputMode="decimal"
            className="input"
            placeholder="450"
            value={cal}
            onChange={(e) => setCal(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Quantity (×)</label>
          <input
            type="number"
            step="0.25"
            inputMode="decimal"
            className="input"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label">Protein g</label>
          <input
            type="number"
            inputMode="decimal"
            className="input"
            placeholder="opt"
            value={p}
            onChange={(e) => setP(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Carbs g</label>
          <input
            type="number"
            inputMode="decimal"
            className="input"
            placeholder="opt"
            value={c}
            onChange={(e) => setC(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Fat g</label>
          <input
            type="number"
            inputMode="decimal"
            className="input"
            placeholder="opt"
            value={f}
            onChange={(e) => setF(e.target.value)}
          />
        </div>
      </div>
      <button className="btn-primary w-full" disabled={saving}>
        {saving ? 'Adding…' : 'Add food'}
      </button>
    </form>
  );
}
