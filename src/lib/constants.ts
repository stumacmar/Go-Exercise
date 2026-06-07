import type { TrainingType } from './types';

export const TRAINING_TYPES: TrainingType[] = [
  'Bike endurance',
  'Turbo intervals',
  'Swim',
  'Kettlebell',
  'Gym strength',
  'Zone2 walk',
  'Mobility',
  'Other',
];

// Rough kcal/min defaults to pre-fill the calorie field (user can override).
export const TRAINING_KCAL_PER_MIN: Record<string, number> = {
  'Bike endurance': 8,
  'Turbo intervals': 11,
  Swim: 9,
  Kettlebell: 8,
  'Gym strength': 6,
  'Zone2 walk': 5,
  Mobility: 3,
  Other: 6,
};

// The weekly training template (Mon … Sun).
export interface PlanDay {
  day: string;
  focus: string;
  type: TrainingType | 'Rest';
  detail: string;
}

export const WEEKLY_PLAN: PlanDay[] = [
  { day: 'Mon', focus: 'Kettlebell', type: 'Kettlebell', detail: 'Full-body strength — swings, goblet squats, presses, carries. ~30–40 min.' },
  { day: 'Tue', focus: 'Turbo intervals', type: 'Turbo intervals', detail: 'Structured bike intervals on the trainer. Hard but controlled. ~40–50 min.' },
  { day: 'Wed', focus: 'Swim', type: 'Swim', detail: 'Easy aerobic swim, technique focus. Joint-friendly. ~30–40 min.' },
  { day: 'Thu', focus: 'Gym strength', type: 'Gym strength', detail: 'Resistance session — compound lifts, progressive overload. ~45 min.' },
  { day: 'Fri', focus: 'Mobility', type: 'Mobility', detail: 'Mobility / stretching / light recovery. ~20–30 min.' },
  { day: 'Sat', focus: 'Endurance ride', type: 'Bike endurance', detail: 'Longer Zone-2 road ride. Conversational pace. 60–120 min.' },
  { day: 'Sun', focus: 'Rest', type: 'Rest', detail: 'Rest or gentle walk. Recovery is where adaptation happens.' },
];

// Nutrition framework rows shown in the Plan tab.
export interface NutritionRow {
  area: string;
  guidance: string;
}

export const NUTRITION_FRAMEWORK: NutritionRow[] = [
  { area: 'Protein', guidance: 'Hit your protein floor every day (default 160g). Spread across meals — aim 30–45g per meal.' },
  { area: 'Calories', guidance: 'Aim toward your target (default 2000). On Mounjaro the danger is under-eating — do not chase very low days.' },
  { area: 'Fluids', guidance: 'Drink steadily, especially on appetite-suppressed days. Dehydration worsens fatigue and headaches.' },
  { area: 'Fibre & veg', guidance: 'Plenty of vegetables and fibre — helps digestion (GLP-1 meds can slow it) and satiety.' },
  { area: 'Carbs', guidance: 'Time most carbs around training. Whole-food sources where possible.' },
  { area: 'Fats', guidance: "Don't fear healthy fats — olive oil, oily fish, nuts. Support hormones and satiety." },
];

export const PRINCIPLES: string[] = [
  'Protein first — it preserves muscle while you lose fat.',
  'Strength train at least 2× per week (kettlebell + gym) to protect muscle as weight drops.',
  'Eat enough. On appetite-suppressing medication, under-eating is the bigger risk — aim toward target, never celebrate very low intake.',
  'Steady beats heroic — consistent Zone-2 cardio plus structured intervals.',
  'Log blood pressure weekly. As weight falls, medication may need a GP review — never adjust it yourself.',
  'Sleep and recovery are training. Rest days are part of the plan.',
];

export const DISCLAIMER =
  'Reset is a personal tracking tool, not medical advice. It does not diagnose, treat, or replace your GP or any clinician. Always follow professional medical guidance, and never start, stop, or change medication based on anything shown here.';
