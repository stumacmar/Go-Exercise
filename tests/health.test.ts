import { describe, it, expect } from 'vitest';
import { categorizeBp, calorieNudges, bpReminder } from '@/lib/health';

// =============================================================================
// UAT: Blood-pressure auto-categorisation (ACC/AHA thresholds)
// =============================================================================
describe('UAT: BP categorisation', () => {
  it('UAT-001 normal 110/70 is Healthy', () => {
    expect(categorizeBp(110, 70).category).toBe('Healthy');
  });
  it('UAT-002 119/79 is Healthy (upper edge)', () => {
    expect(categorizeBp(119, 79).category).toBe('Healthy');
  });
  it('UAT-003 120/79 is Elevated (sys 120, dia <80)', () => {
    expect(categorizeBp(120, 79).category).toBe('Elevated');
  });
  it('UAT-004 129/79 is Elevated (upper edge)', () => {
    expect(categorizeBp(129, 79).category).toBe('Elevated');
  });
  it('UAT-005 120/80 is Stage 1 (dia crosses 80)', () => {
    expect(categorizeBp(120, 80).category).toBe('Stage 1');
  });
  it('UAT-006 130/79 is Stage 1 (sys crosses 130)', () => {
    expect(categorizeBp(130, 79).category).toBe('Stage 1');
  });
  it('UAT-007 139/89 is Stage 1 (upper edge)', () => {
    expect(categorizeBp(139, 89).category).toBe('Stage 1');
  });
  it('UAT-008 140/85 is Stage 2 (sys crosses 140)', () => {
    expect(categorizeBp(140, 85).category).toBe('Stage 2');
  });
  it('UAT-009 135/90 is Stage 2 (dia crosses 90)', () => {
    expect(categorizeBp(135, 90).category).toBe('Stage 2');
  });
  it('UAT-010 179/119 is Stage 2 (just below crisis)', () => {
    expect(categorizeBp(179, 119).category).toBe('Stage 2');
  });
  it('UAT-011 180/100 is Crisis (sys crosses 180)', () => {
    expect(categorizeBp(180, 100).category).toBe('Crisis');
  });
  it('UAT-012 150/120 is Crisis (dia crosses 120)', () => {
    expect(categorizeBp(150, 120).category).toBe('Crisis');
  });
  it('UAT-013 200/130 is Crisis (both high)', () => {
    expect(categorizeBp(200, 130).category).toBe('Crisis');
  });
  it('UAT-014 Crisis takes precedence over Stage 2 ranges', () => {
    expect(categorizeBp(185, 95).category).toBe('Crisis');
  });
  it('UAT-015 Healthy returns the accent (green) colour', () => {
    expect(categorizeBp(110, 70).color).toBe('#5fd6a6');
  });
  it('UAT-016 Stage 1 returns the warn (amber) colour', () => {
    expect(categorizeBp(132, 82).color).toBe('#f0a35e');
  });
  it('UAT-017 Elevated returns the warn (amber) colour', () => {
    expect(categorizeBp(122, 78).color).toBe('#f0a35e');
  });
  it('UAT-018 Stage 2 returns the danger (red) colour', () => {
    expect(categorizeBp(145, 92).color).toBe('#ef6f6f');
  });
  it('UAT-019 Crisis returns the danger (red) colour', () => {
    expect(categorizeBp(190, 125).color).toBe('#ef6f6f');
  });
  it('UAT-020 every category carries a non-empty explanatory note', () => {
    for (const [s, d] of [
      [110, 70],
      [122, 78],
      [132, 82],
      [145, 92],
      [190, 125],
    ] as const) {
      expect(categorizeBp(s, d).note.length).toBeGreaterThan(0);
    }
  });
  it('UAT-021 high systolic alone (160/70) reaches Stage 2', () => {
    expect(categorizeBp(160, 70).category).toBe('Stage 2');
  });
  it('UAT-022 elevated requires diastolic under 80 (125/82 is Stage 1)', () => {
    expect(categorizeBp(125, 82).category).toBe('Stage 1');
  });
  it('UAT-023 crisis note mentions urgent/medical wording', () => {
    expect(categorizeBp(190, 125).note.toLowerCase()).toMatch(/urgent|medical/);
  });
});

// =============================================================================
// UAT: Calorie & protein safety nudges (the danger is eating TOO LITTLE)
// =============================================================================
describe('UAT: calorie & protein nudges', () => {
  const base = { calorieTarget: 2000, proteinTarget: 160 };

  it('UAT-024 calories under 1200 produce a danger-level warning', () => {
    const n = calorieNudges({ ...base, calories: 900, protein: 80, hasAnyFood: true });
    expect(n.some((x) => x.level === 'danger')).toBe(true);
  });
  it('UAT-025 the low-intake warning never congratulates', () => {
    const n = calorieNudges({ ...base, calories: 800, protein: 50, hasAnyFood: true });
    const danger = n.find((x) => x.level === 'danger')!;
    expect(danger.body.toLowerCase()).not.toMatch(/well done|great job|congrat|nice work/);
  });
  it('UAT-026 the low-intake warning explicitly says never to celebrate', () => {
    const n = calorieNudges({ ...base, calories: 800, protein: 50, hasAnyFood: true });
    const danger = n.find((x) => x.level === 'danger')!;
    expect(danger.body.toLowerCase()).toMatch(/never|celebrate/);
  });
  it('UAT-027 low-intake warning urges protein and fluids', () => {
    const n = calorieNudges({ ...base, calories: 800, protein: 50, hasAnyFood: true });
    const danger = n.find((x) => x.level === 'danger')!;
    expect(danger.body.toLowerCase()).toMatch(/protein/);
    expect(danger.body.toLowerCase()).toMatch(/fluid/);
  });
  it('UAT-028 exactly 1200 kcal is NOT flagged as dangerously low', () => {
    const n = calorieNudges({ ...base, calories: 1200, protein: 160, hasAnyFood: true });
    expect(n.some((x) => x.level === 'danger')).toBe(false);
  });
  it('UAT-029 1199 kcal IS flagged as dangerously low', () => {
    const n = calorieNudges({ ...base, calories: 1199, protein: 160, hasAnyFood: true });
    expect(n.some((x) => x.level === 'danger')).toBe(true);
  });
  it('UAT-030 zero calories with no food logged yields no danger spam', () => {
    const n = calorieNudges({ ...base, calories: 0, protein: 0, hasAnyFood: false });
    expect(n.some((x) => x.level === 'danger')).toBe(false);
  });
  it('UAT-031 protein below target produces a warn nudge', () => {
    const n = calorieNudges({ ...base, calories: 1500, protein: 100, hasAnyFood: true });
    expect(n.some((x) => x.level === 'warn')).toBe(true);
  });
  it('UAT-032 protein warn states the gap in grams', () => {
    const n = calorieNudges({ ...base, calories: 1500, protein: 100, hasAnyFood: true });
    const warn = n.find((x) => x.level === 'warn')!;
    expect(warn.title).toMatch(/60g/);
  });
  it('UAT-033 protein at target shows an ok confirmation', () => {
    const n = calorieNudges({ ...base, calories: 1800, protein: 160, hasAnyFood: true });
    expect(n.some((x) => x.level === 'ok')).toBe(true);
  });
  it('UAT-034 protein above target shows an ok confirmation', () => {
    const n = calorieNudges({ ...base, calories: 1800, protein: 200, hasAnyFood: true });
    expect(n.some((x) => x.level === 'ok')).toBe(true);
  });
  it('UAT-035 protein ok does not appear when no food logged', () => {
    const n = calorieNudges({ ...base, calories: 0, protein: 0, hasAnyFood: false });
    expect(n.some((x) => x.level === 'ok')).toBe(false);
  });
  it('UAT-036 between 1200 and target shows an info "kcal to target" nudge', () => {
    const n = calorieNudges({ ...base, calories: 1500, protein: 160, hasAnyFood: true });
    expect(n.some((x) => x.level === 'info')).toBe(true);
  });
  it('UAT-037 info nudge reports the correct remaining kcal', () => {
    const n = calorieNudges({ ...base, calories: 1500, protein: 160, hasAnyFood: true });
    const info = n.find((x) => x.level === 'info')!;
    expect(info.title).toMatch(/500/);
  });
  it('UAT-038 no info nudge once at/over the calorie target', () => {
    const n = calorieNudges({ ...base, calories: 2000, protein: 160, hasAnyFood: true });
    expect(n.some((x) => x.level === 'info')).toBe(false);
  });
  it('UAT-039 dangerously-low day still nudges protein when short', () => {
    const n = calorieNudges({ ...base, calories: 900, protein: 40, hasAnyFood: true });
    expect(n.some((x) => x.level === 'danger')).toBe(true);
    expect(n.some((x) => x.level === 'warn')).toBe(true);
  });
  it('UAT-040 custom targets are respected (protein floor 200)', () => {
    const n = calorieNudges({ calorieTarget: 2500, proteinTarget: 200, calories: 1800, protein: 190, hasAnyFood: true });
    expect(n.find((x) => x.level === 'warn')!.title).toMatch(/10g/);
  });
  it('UAT-041 custom calorie target reflected in remaining', () => {
    const n = calorieNudges({ calorieTarget: 2500, proteinTarget: 160, calories: 2000, protein: 160, hasAnyFood: true });
    expect(n.find((x) => x.level === 'info')!.title).toMatch(/500/);
  });
  it('UAT-042 every nudge has a title and body', () => {
    const n = calorieNudges({ ...base, calories: 900, protein: 40, hasAnyFood: true });
    for (const x of n) {
      expect(x.title.length).toBeGreaterThan(0);
      expect(x.body.length).toBeGreaterThan(0);
    }
  });
  it('UAT-043 nudge levels are within the allowed set', () => {
    const n = calorieNudges({ ...base, calories: 900, protein: 40, hasAnyFood: true });
    for (const x of n) {
      expect(['danger', 'warn', 'info', 'ok']).toContain(x.level);
    }
  });
  it('UAT-044 no food logged yields zero nudges (clean empty state)', () => {
    const n = calorieNudges({ ...base, calories: 0, protein: 0, hasAnyFood: false });
    expect(n).toHaveLength(0);
  });
});

// =============================================================================
// UAT: Weekly BP reminder + meds-review note
// =============================================================================
describe('UAT: BP reminder', () => {
  it('UAT-045 no readings ever → prompts to log first BP', () => {
    const r = bpReminder(null);
    expect(r?.title.toLowerCase()).toMatch(/blood pressure/);
  });
  it('UAT-046 7 days since last reading → reminder appears', () => {
    expect(bpReminder(7)).not.toBeNull();
  });
  it('UAT-047 10 days → reminder appears', () => {
    expect(bpReminder(10)).not.toBeNull();
  });
  it('UAT-048 6 days → no reminder yet', () => {
    expect(bpReminder(6)).toBeNull();
  });
  it('UAT-049 0 days (logged today) → no reminder', () => {
    expect(bpReminder(0)).toBeNull();
  });
  it('UAT-050 weekly reminder mentions GP review of medication', () => {
    expect(bpReminder(8)!.body.toLowerCase()).toMatch(/gp|review/);
  });
  it('UAT-051 reminder never suggests self-adjusting medication', () => {
    expect(bpReminder(8)!.body.toLowerCase()).toMatch(/never adjust/);
  });
});
