'use client';

import { useEffect, useState } from 'react';
import { useSettings } from '@/components/SettingsContext';
import { Card, SectionTitle, Spinner } from '@/components/ui';
import { DisclaimerCard } from '@/components/Disclaimer';
import {
  WEEKLY_PLAN,
  NUTRITION_FRAMEWORK,
  PRINCIPLES,
} from '@/lib/constants';

export function Plan() {
  const { settings, loading } = useSettings();
  if (loading || !settings) return <Spinner />;

  return (
    <div className="space-y-4">
      <DisclaimerCard />
      <TargetsEditor />
      <WeeklyTemplate />
      <NutritionFramework />
      <Principles />
    </div>
  );
}

// ---------------------------------------------------------------------------
function TargetsEditor() {
  const { settings, update } = useSettings();
  const [calorie, setCalorie] = useState('');
  const [protein, setProtein] = useState('');
  const [goal, setGoal] = useState('');
  const [start, setStart] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setCalorie(String(settings.calorie_target));
    setProtein(String(settings.protein_target));
    setGoal(String(settings.goal_kg));
    setStart(String(settings.start_kg));
    setHeight(String(settings.height_cm));
    setAge(String(settings.age));
  }, [settings]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await update({
      calorie_target: parseInt(calorie, 10) || 2000,
      protein_target: parseInt(protein, 10) || 160,
      goal_kg: parseFloat(goal) || 100,
      start_kg: parseFloat(start) || 120.1,
      height_cm: parseFloat(height) || 180.3,
      age: parseInt(age, 10) || 56,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <Card>
      <SectionTitle hint="editable">Your targets</SectionTitle>
      <form onSubmit={save} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Calorie target (kcal)" value={calorie} onChange={setCalorie} />
          <Field label="Protein floor (g)" value={protein} onChange={setProtein} />
          <Field label="Start weight (kg)" value={start} onChange={setStart} step="0.1" />
          <Field label="Goal weight (kg)" value={goal} onChange={setGoal} step="0.1" />
          <Field label="Height (cm)" value={height} onChange={setHeight} step="0.1" />
          <Field label="Age" value={age} onChange={setAge} />
        </div>
        <button className="btn-primary w-full">
          {saved ? 'Saved ✓' : 'Save targets'}
        </button>
      </form>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        step={step}
        inputMode="decimal"
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
function WeeklyTemplate() {
  return (
    <Card>
      <SectionTitle hint="TrainingPeaks-style">Weekly training template</SectionTitle>
      <div className="space-y-2">
        {WEEKLY_PLAN.map((d) => (
          <div
            key={d.day}
            className="flex gap-3 items-start py-2 border-b border-line last:border-0"
          >
            <span className="chip bg-panel2 text-accent2 w-12 justify-center shrink-0">
              {d.day}
            </span>
            <div>
              <div className="text-sm font-medium">{d.focus}</div>
              <div className="text-xs text-muted">{d.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
function NutritionFramework() {
  return (
    <Card>
      <SectionTitle>Nutrition framework</SectionTitle>
      <div className="space-y-2">
        {NUTRITION_FRAMEWORK.map((row) => (
          <div
            key={row.area}
            className="grid grid-cols-[5rem_1fr] gap-3 py-2 border-b border-line last:border-0"
          >
            <span className="text-sm font-medium text-accent">{row.area}</span>
            <span className="text-sm text-text/80">{row.guidance}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
function Principles() {
  return (
    <Card>
      <SectionTitle>Principles</SectionTitle>
      <ul className="space-y-2">
        {PRINCIPLES.map((p, i) => (
          <li key={i} className="flex gap-2 text-sm text-text/85">
            <span className="text-accent shrink-0">→</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
