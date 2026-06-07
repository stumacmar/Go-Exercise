// Shared data types mirroring the Supabase schema.

export interface UserSettings {
  user_id: string;
  calorie_target: number;
  protein_target: number;
  goal_kg: number;
  start_kg: number;
  height_cm: number;
  age: number;
}

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  kg: number;
}

export interface BpEntry {
  id: string;
  date: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
}

export interface FoodEntry {
  id: string;
  date: string;
  name: string;
  qty: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  barcode: string | null;
}

export type TrainingType =
  | 'Bike endurance'
  | 'Turbo intervals'
  | 'Swim'
  | 'Kettlebell'
  | 'Gym strength'
  | 'Zone2 walk'
  | 'Mobility'
  | 'Other';

export interface TrainingEntry {
  id: string;
  date: string;
  type: TrainingType | string;
  duration_min: number;
  rpe: number | null;
  calories: number | null;
  avg_hr: number | null;
  distance_km: number | null;
  notes: string | null;
}

export interface PlanCompletion {
  id: string;
  week_start: string;
  day_index: number;
  done: boolean;
}

// Open Food Facts normalised result returned by /api/food.
export interface FoodResult {
  name: string;
  barcode: string | null;
  // Per 100 g / 100 ml.
  calories_100: number;
  protein_100: number;
  carbs_100: number;
  fat_100: number;
  serving_g: number | null;
}
