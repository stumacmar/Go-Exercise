// Date helpers — everything is stored as a local YYYY-MM-DD string so a "day"
// matches the user's wall clock rather than UTC.

export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Monday-based start of the week containing `d`.
export function weekStart(d: Date = new Date()): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = copy.getDay(); // 0 = Sun … 6 = Sat
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  copy.setDate(copy.getDate() + diff);
  return copy;
}

export function weekStartISO(d: Date = new Date()): string {
  return toISO(weekStart(d));
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function daysBetween(aISO: string, bISO: string): number {
  const a = fromISO(aISO).getTime();
  const b = fromISO(bISO).getTime();
  return Math.round((b - a) / 86_400_000);
}

// Array of the last `n` ISO dates ending today (oldest first).
export function lastNDates(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    out.push(toISO(addDays(today, -i)));
  }
  return out;
}

const DOW_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function dayLabel(iso: string): string {
  const d = fromISO(iso);
  const idx = (d.getDay() + 6) % 7; // Monday = 0
  return DOW_SHORT[idx];
}

export function prettyDate(iso: string): string {
  return fromISO(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
