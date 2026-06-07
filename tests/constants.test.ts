import { describe, it, expect } from 'vitest';
import {
  TRAINING_TYPES,
  TRAINING_KCAL_PER_MIN,
  WEEKLY_PLAN,
  NUTRITION_FRAMEWORK,
  PRINCIPLES,
  DISCLAIMER,
} from '@/lib/constants';

describe('UAT: plan & constants integrity', () => {
  it('UAT-081 there are exactly 8 training types', () => {
    expect(TRAINING_TYPES).toHaveLength(8);
  });
  it('UAT-082 training types include the brief-specified disciplines', () => {
    for (const t of ['Bike endurance', 'Turbo intervals', 'Swim', 'Kettlebell', 'Gym strength', 'Zone2 walk', 'Mobility', 'Other']) {
      expect(TRAINING_TYPES).toContain(t);
    }
  });
  it('UAT-083 every training type has a kcal/min estimate', () => {
    for (const t of TRAINING_TYPES) {
      expect(TRAINING_KCAL_PER_MIN[t]).toBeGreaterThan(0);
    }
  });
  it('UAT-084 the weekly plan covers all 7 days', () => {
    expect(WEEKLY_PLAN).toHaveLength(7);
  });
  it('UAT-085 the weekly plan runs Mon→Sun in order', () => {
    expect(WEEKLY_PLAN.map((d) => d.day)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });
  it('UAT-086 Monday is kettlebell and Sunday is rest (per the brief)', () => {
    expect(WEEKLY_PLAN[0].type).toBe('Kettlebell');
    expect(WEEKLY_PLAN[6].type).toBe('Rest');
  });
  it('UAT-087 the template includes turbo intervals, swim, gym and an endurance ride', () => {
    const types = WEEKLY_PLAN.map((d) => d.type);
    expect(types).toContain('Turbo intervals');
    expect(types).toContain('Swim');
    expect(types).toContain('Gym strength');
    expect(types).toContain('Bike endurance');
  });
  it('UAT-088 every plan day has a non-empty detail string', () => {
    for (const d of WEEKLY_PLAN) expect(d.detail.length).toBeGreaterThan(0);
  });
  it('UAT-089 the plan schedules at least two strength sessions', () => {
    const strength = WEEKLY_PLAN.filter((d) => d.type === 'Kettlebell' || d.type === 'Gym strength');
    expect(strength.length).toBeGreaterThanOrEqual(2);
  });
  it('UAT-090 the nutrition framework lists protein, calories and fluids', () => {
    const areas = NUTRITION_FRAMEWORK.map((r) => r.area.toLowerCase());
    expect(areas).toContain('protein');
    expect(areas).toContain('calories');
    expect(areas).toContain('fluids');
  });
  it('UAT-091 principles mention protein-first', () => {
    expect(PRINCIPLES.join(' ').toLowerCase()).toMatch(/protein first/);
  });
  it('UAT-092 principles mention strength 2× per week to protect muscle', () => {
    expect(PRINCIPLES.join(' ').toLowerCase()).toMatch(/2.?.?per week|2×|twice/);
    expect(PRINCIPLES.join(' ').toLowerCase()).toMatch(/muscle/);
  });
  it('UAT-093 principles warn against self-adjusting medication', () => {
    expect(PRINCIPLES.join(' ').toLowerCase()).toMatch(/never adjust/);
  });
  it('UAT-094 the disclaimer states it is not medical advice', () => {
    expect(DISCLAIMER.toLowerCase()).toMatch(/not medical advice/);
  });
});
