import { describe, it, expect } from 'vitest';
import {
  toISO,
  fromISO,
  todayISO,
  weekStart,
  weekStartISO,
  addDays,
  daysBetween,
  lastNDates,
  dayLabel,
  prettyDate,
} from '@/lib/dates';

describe('UAT: date helpers', () => {
  it('UAT-052 toISO formats a date as YYYY-MM-DD zero-padded', () => {
    expect(toISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  it('UAT-053 toISO pads single-digit month and day', () => {
    expect(toISO(new Date(2026, 8, 9))).toBe('2026-09-09');
  });
  it('UAT-054 fromISO round-trips through toISO', () => {
    expect(toISO(fromISO('2026-06-07'))).toBe('2026-06-07');
  });
  it('UAT-055 fromISO builds a local date with correct parts', () => {
    const d = fromISO('2026-12-25');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 11, 25]);
  });
  it('UAT-056 todayISO matches the YYYY-MM-DD pattern', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('UAT-057 weekStart of a Monday is the same Monday', () => {
    // 2026-06-01 is a Monday.
    expect(toISO(weekStart(new Date(2026, 5, 1)))).toBe('2026-06-01');
  });
  it('UAT-058 weekStart of a Wednesday returns the Monday before', () => {
    // 2026-06-03 is a Wednesday.
    expect(toISO(weekStart(new Date(2026, 5, 3)))).toBe('2026-06-01');
  });
  it('UAT-059 weekStart of a Sunday returns the Monday six days earlier', () => {
    // 2026-06-07 is a Sunday.
    expect(toISO(weekStart(new Date(2026, 5, 7)))).toBe('2026-06-01');
  });
  it('UAT-060 weekStart of a Saturday returns that week Monday', () => {
    // 2026-06-06 is a Saturday.
    expect(toISO(weekStart(new Date(2026, 5, 6)))).toBe('2026-06-01');
  });
  it('UAT-061 weekStartISO returns a string in ISO form', () => {
    expect(weekStartISO(new Date(2026, 5, 3))).toBe('2026-06-01');
  });
  it('UAT-062 weekStart always lands on a Monday (getDay === 1)', () => {
    for (let i = 0; i < 14; i++) {
      const d = addDays(new Date(2026, 0, 1), i);
      expect(weekStart(d).getDay()).toBe(1);
    }
  });
  it('UAT-063 addDays adds positive days', () => {
    expect(toISO(addDays(new Date(2026, 5, 7), 3))).toBe('2026-06-10');
  });
  it('UAT-064 addDays subtracts with negatives', () => {
    expect(toISO(addDays(new Date(2026, 5, 7), -7))).toBe('2026-05-31');
  });
  it('UAT-065 addDays crosses month boundaries', () => {
    expect(toISO(addDays(new Date(2026, 5, 30), 1))).toBe('2026-07-01');
  });
  it('UAT-066 addDays crosses year boundaries', () => {
    expect(toISO(addDays(new Date(2026, 11, 31), 1))).toBe('2027-01-01');
  });
  it('UAT-067 daysBetween counts forward days', () => {
    expect(daysBetween('2026-06-01', '2026-06-08')).toBe(7);
  });
  it('UAT-068 daysBetween is zero for the same day', () => {
    expect(daysBetween('2026-06-07', '2026-06-07')).toBe(0);
  });
  it('UAT-069 daysBetween is negative going backward', () => {
    expect(daysBetween('2026-06-08', '2026-06-01')).toBe(-7);
  });
  it('UAT-070 daysBetween spans months correctly', () => {
    expect(daysBetween('2026-05-30', '2026-06-02')).toBe(3);
  });
  it('UAT-071 lastNDates returns exactly N entries', () => {
    expect(lastNDates(7)).toHaveLength(7);
  });
  it('UAT-072 lastNDates ends today (oldest first)', () => {
    const arr = lastNDates(7);
    expect(arr[arr.length - 1]).toBe(todayISO());
  });
  it('UAT-073 lastNDates entries are strictly increasing by one day', () => {
    const arr = lastNDates(5);
    for (let i = 1; i < arr.length; i++) {
      expect(daysBetween(arr[i - 1], arr[i])).toBe(1);
    }
  });
  it('UAT-074 lastNDates(1) is just today', () => {
    expect(lastNDates(1)).toEqual([todayISO()]);
  });
  it('UAT-075 dayLabel maps Monday to "Mon"', () => {
    expect(dayLabel('2026-06-01')).toBe('Mon');
  });
  it('UAT-076 dayLabel maps Sunday to "Sun"', () => {
    expect(dayLabel('2026-06-07')).toBe('Sun');
  });
  it('UAT-077 dayLabel maps Saturday to "Sat"', () => {
    expect(dayLabel('2026-06-06')).toBe('Sat');
  });
  it('UAT-078 dayLabel returns a 3-letter weekday for any date', () => {
    for (let i = 0; i < 7; i++) {
      expect(dayLabel(toISO(addDays(new Date(2026, 5, 1), i)))).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/);
    }
  });
  it('UAT-079 prettyDate produces a human-readable, non-empty string', () => {
    expect(prettyDate('2026-06-07').length).toBeGreaterThan(0);
  });
  it('UAT-080 prettyDate includes the day number', () => {
    expect(prettyDate('2026-06-07')).toMatch(/7/);
  });
});
