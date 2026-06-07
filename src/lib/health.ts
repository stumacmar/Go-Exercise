// Domain logic: blood-pressure categorisation, calorie/protein safety nudges.
// These thresholds follow the ACC/AHA (2017) adult BP categories. This is a
// tracking aid only — NOT medical advice.

export type BpCategory =
  | 'Healthy'
  | 'Elevated'
  | 'Stage 1'
  | 'Stage 2'
  | 'Crisis';

export interface BpResult {
  category: BpCategory;
  color: string; // tailwind-ish hex for badges
  note: string;
}

export function categorizeBp(systolic: number, diastolic: number): BpResult {
  // Hypertensive crisis takes precedence (either value).
  if (systolic >= 180 || diastolic >= 120) {
    return {
      category: 'Crisis',
      color: '#ef6f6f',
      note: 'Very high — if you have symptoms, seek urgent medical advice.',
    };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return {
      category: 'Stage 2',
      color: '#ef6f6f',
      note: 'Stage 2 hypertension range.',
    };
  }
  if (systolic >= 130 || diastolic >= 80) {
    return {
      category: 'Stage 1',
      color: '#f0a35e',
      note: 'Stage 1 hypertension range.',
    };
  }
  if (systolic >= 120 && diastolic < 80) {
    return {
      category: 'Elevated',
      color: '#f0a35e',
      note: 'Slightly elevated.',
    };
  }
  return {
    category: 'Healthy',
    color: '#5fd6a6',
    note: 'Within a healthy range.',
  };
}

// ----------------------------------------------------------------------------
// Calorie & protein safety nudges (Mounjaro context: the risk is eating too
// little, never too much). Returns the most important message to surface.
// ----------------------------------------------------------------------------
export type NudgeLevel = 'danger' | 'warn' | 'info' | 'ok';

export interface Nudge {
  level: NudgeLevel;
  title: string;
  body: string;
}

export function calorieNudges(opts: {
  calories: number;
  protein: number;
  calorieTarget: number;
  proteinTarget: number;
  hasAnyFood: boolean;
}): Nudge[] {
  const { calories, protein, calorieTarget, proteinTarget, hasAnyFood } = opts;
  const nudges: Nudge[] = [];

  // Under-eating is the headline risk on appetite-suppressing medication.
  if (hasAnyFood && calories > 0 && calories < 1200) {
    nudges.push({
      level: 'danger',
      title: 'Intake looks very low today',
      body: 'On appetite-suppressing medication the real risk is eating too little. Prioritise protein and fluids, and aim back toward your target — under-eating slows recovery and costs muscle. This is never something to celebrate.',
    });
  }

  // Protein floor — muscle preservation in a deficit. Only nudge once the day
  // has actually started (something logged), so a fresh day stays quiet.
  if (hasAnyFood && protein < proteinTarget) {
    const gap = Math.max(0, Math.round(proteinTarget - protein));
    nudges.push({
      level: 'warn',
      title: `Protein ${gap}g below target`,
      body: `You're under your ${proteinTarget}g protein floor. Protein protects muscle while you lose weight — a shake, Greek yoghurt, eggs, or lean meat will help close the gap.`,
    });
  } else if (hasAnyFood) {
    nudges.push({
      level: 'ok',
      title: 'Protein target met',
      body: `Nice — you're at or above your ${proteinTarget}g protein floor.`,
    });
  }

  // Gentle progress note toward calories, without ever praising very low intake.
  if (hasAnyFood && calories >= 1200 && calories < calorieTarget) {
    const remaining = Math.round(calorieTarget - calories);
    nudges.push({
      level: 'info',
      title: `${remaining} kcal to target`,
      body: 'Room left today — keep fuelling steadily, protein first.',
    });
  }

  return nudges;
}

// Weekly BP logging reminder + meds-review note.
export function bpReminder(daysSinceLastBp: number | null): Nudge | null {
  if (daysSinceLastBp === null) {
    return {
      level: 'info',
      title: 'Log your blood pressure',
      body: 'Add your first BP reading so we can track it weekly.',
    };
  }
  if (daysSinceLastBp >= 7) {
    return {
      level: 'warn',
      title: 'Time for a BP check',
      body: `It's been ${daysSinceLastBp} days. Log a reading this week. As your weight drops, your BP and cholesterol medication may need a review — please raise this with your GP. Never adjust medication yourself.`,
    };
  }
  return null;
}
