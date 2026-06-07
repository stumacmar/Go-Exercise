'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { useSettings } from '@/components/SettingsContext';
import {
  Card,
  SectionTitle,
  Spinner,
  Ring,
  ProgressBar,
  Badge,
  NudgeBanner,
  EmptyState,
} from '@/components/ui';
import { categorizeBp, calorieNudges, bpReminder } from '@/lib/health';
import { WEEKLY_PLAN } from '@/lib/constants';
import {
  todayISO,
  weekStartISO,
  weekStart,
  toISO,
  addDays,
  daysBetween,
  prettyDate,
} from '@/lib/dates';
import type {
  WeightEntry,
  BpEntry,
  FoodEntry,
  PlanCompletion,
} from '@/lib/types';
import type { TabKey } from '@/components/Dashboard';

export function Overview({ onNavigate }: { onNavigate: (t: TabKey) => void }) {
  const { settings, loading: settingsLoading } = useSettings();
  const supabase = getSupabaseBrowser();

  const [weight, setWeight] = useState<WeightEntry | null>(null);
  const [bp, setBp] = useState<BpEntry | null>(null);
  const [food, setFood] = useState<FoodEntry[]>([]);
  const [completions, setCompletions] = useState<PlanCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  const wkStart = weekStartISO();

  const load = useCallback(async () => {
    const [w, b, f, p] = await Promise.all([
      supabase
        .from('weight_log')
        .select('*')
        .order('date', { ascending: false })
        .limit(1),
      supabase
        .from('bp_log')
        .select('*')
        .order('date', { ascending: false })
        .limit(1),
      supabase.from('food_log').select('*').eq('date', todayISO()),
      supabase.from('plan_completion').select('*').eq('week_start', wkStart),
    ]);
    setWeight(((w.data as WeightEntry[]) ?? [])[0] ?? null);
    setBp(((b.data as BpEntry[]) ?? [])[0] ?? null);
    setFood((f.data as FoodEntry[]) ?? []);
    setCompletions((p.data as PlanCompletion[]) ?? []);
    setLoading(false);
  }, [supabase, wkStart]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(
    () =>
      food.reduce(
        (a, e) => ({
          calories: a.calories + Number(e.calories),
          protein: a.protein + Number(e.protein),
          carbs: a.carbs + Number(e.carbs),
          fat: a.fat + Number(e.fat),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [food],
  );

  async function toggleDay(dayIndex: number, current: boolean) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    // optimistic
    setCompletions((prev) => {
      const others = prev.filter((c) => c.day_index !== dayIndex);
      return [
        ...others,
        {
          id: `tmp-${dayIndex}`,
          week_start: wkStart,
          day_index: dayIndex,
          done: !current,
        },
      ];
    });
    await supabase.from('plan_completion').upsert(
      {
        user_id: user.id,
        week_start: wkStart,
        day_index: dayIndex,
        done: !current,
      },
      { onConflict: 'user_id,week_start,day_index' },
    );
    load();
  }

  if (settingsLoading || loading || !settings) return <Spinner />;

  const calorieTarget = settings.calorie_target;
  const proteinTarget = settings.protein_target;
  const startKg = Number(settings.start_kg);
  const goalKg = Number(settings.goal_kg);

  const currentKg = weight ? Number(weight.kg) : startKg;
  const toGoal = currentKg - goalKg;
  const lost = startKg - currentKg;
  const totalToLose = startKg - goalKg;

  const bpCat = bp ? categorizeBp(bp.systolic, bp.diastolic) : null;
  const daysSinceBp = bp ? daysBetween(bp.date, todayISO()) : null;

  const nudges = calorieNudges({
    calories: totals.calories,
    protein: totals.protein,
    calorieTarget,
    proteinTarget,
    hasAnyFood: food.length > 0,
  });
  const reminder = bpReminder(daysSinceBp);

  const doneByDay = new Map(completions.map((c) => [c.day_index, c.done]));
  const ws = weekStart();

  return (
    <div className="space-y-4">
      {/* Safety nudges first — they matter most. */}
      {nudges
        .filter((n) => n.level === 'danger' || n.level === 'warn')
        .map((n, i) => (
          <NudgeBanner key={`n${i}`} nudge={n} />
        ))}
      {reminder && <NudgeBanner nudge={reminder} />}

      {/* Weight & goal */}
      <Card>
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="text-xs text-muted">Current weight</div>
            <div className="text-3xl font-semibold">
              {currentKg.toFixed(1)}
              <span className="text-base text-muted"> kg</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted">To goal</div>
            <div className="text-2xl font-semibold text-accent">
              {toGoal > 0 ? toGoal.toFixed(1) : '0.0'}
              <span className="text-base text-muted"> kg</span>
            </div>
          </div>
        </div>
        <ProgressBar value={currentKg} min={goalKg} max={startKg} color="#7fb8ff" />
        <div className="flex justify-between text-xs text-muted mt-1.5">
          <span>start {startKg.toFixed(1)}</span>
          <span>
            {lost > 0 ? `${lost.toFixed(1)} kg lost` : 'getting started'} ·{' '}
            {totalToLose > 0
              ? `${Math.round((lost / totalToLose) * 100)}%`
              : '—'}
          </span>
          <span>goal {goalKg.toFixed(1)}</span>
        </div>
        {!weight && (
          <button
            className="btn-ghost w-full mt-3 text-sm"
            onClick={() => onNavigate('weight')}
          >
            Log your first weigh-in →
          </button>
        )}
      </Card>

      {/* BP + calories row */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="text-xs text-muted mb-1">Latest BP</div>
          {bp && bpCat ? (
            <button
              className="text-left w-full"
              onClick={() => onNavigate('weight')}
            >
              <div className="text-2xl font-semibold tabular-nums">
                {bp.systolic}/{bp.diastolic}
              </div>
              <div className="mt-1.5">
                <Badge color={bpCat.color}>{bpCat.category}</Badge>
              </div>
              <div className="text-xs text-muted mt-1">
                {prettyDate(bp.date)}
              </div>
            </button>
          ) : (
            <button
              className="text-left"
              onClick={() => onNavigate('weight')}
            >
              <div className="text-muted text-sm">No reading yet</div>
              <div className="text-accent text-sm mt-2">Log BP →</div>
            </button>
          )}
        </Card>

        <Card>
          <div className="text-xs text-muted mb-1">Today</div>
          <div className="flex items-center justify-center">
            <Ring
              value={totals.calories}
              max={calorieTarget}
              size={104}
              stroke={10}
              label={Math.round(totals.calories)}
              sublabel={`/ ${calorieTarget}`}
              color={
                totals.calories > calorieTarget ? '#f0a35e' : '#5fd6a6'
              }
            />
          </div>
        </Card>
      </div>

      {/* Macro split */}
      <Card>
        <SectionTitle hint="today">Macros</SectionTitle>
        <div className="grid grid-cols-3 gap-3 text-center">
          <MacroPill
            label="Protein"
            value={Math.round(totals.protein)}
            target={proteinTarget}
            color="#5fd6a6"
          />
          <MacroPill
            label="Carbs"
            value={Math.round(totals.carbs)}
            color="#7fb8ff"
          />
          <MacroPill label="Fat" value={Math.round(totals.fat)} color="#f0a35e" />
        </div>
        <button
          className="btn-ghost w-full mt-3 text-sm"
          onClick={() => onNavigate('food')}
        >
          Log food →
        </button>
      </Card>

      {/* This-week training strip */}
      <Card>
        <SectionTitle hint={`week of ${prettyDate(wkStart)}`}>
          This week
        </SectionTitle>
        <div className="space-y-1.5">
          {WEEKLY_PLAN.map((d, i) => {
            const dateISO = toISO(addDays(ws, i));
            const isToday = dateISO === todayISO();
            const done = doneByDay.get(i) ?? false;
            return (
              <label
                key={d.day}
                className={`flex items-center gap-3 py-2 px-2 rounded-lg cursor-pointer ${
                  isToday ? 'bg-panel2' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => toggleDay(i, done)}
                  className="h-5 w-5 accent-[#5fd6a6]"
                />
                <span className="chip bg-bg text-muted w-11 justify-center shrink-0">
                  {d.day}
                </span>
                <span
                  className={`text-sm flex-1 ${
                    done ? 'line-through text-muted' : ''
                  }`}
                >
                  {d.focus}
                </span>
                {isToday && (
                  <span className="text-[10px] text-accent">today</span>
                )}
              </label>
            );
          })}
        </div>
      </Card>

      {food.length === 0 && !weight && (
        <EmptyState
          title="Welcome to Reset"
          body="Start by logging a weigh-in, a meal, or a training session. Everything syncs across your phone and laptop."
        />
      )}
    </div>
  );
}

function MacroPill({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target?: number;
  color: string;
}) {
  return (
    <div className="panel p-3" style={{ borderColor: `${color}44` }}>
      <div className="text-lg font-semibold" style={{ color }}>
        {value}
        <span className="text-xs text-muted">g</span>
      </div>
      <div className="text-xs text-muted">{label}</div>
      {target ? (
        <div className="text-[10px] text-muted mt-0.5">/ {target}g</div>
      ) : null}
    </div>
  );
}
