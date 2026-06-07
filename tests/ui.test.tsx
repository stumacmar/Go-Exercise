import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Ring,
  ProgressBar,
  Badge,
  NudgeBanner,
  EmptyState,
  StatTile,
  Card,
  Spinner,
  SectionTitle,
} from '@/components/ui';
import { DisclaimerCard } from '@/components/Disclaimer';
import type { Nudge } from '@/lib/health';

describe('UAT: UI components render', () => {
  it('UAT-109 Ring shows its centre label and sublabel', () => {
    render(<Ring value={1500} max={2000} label={1500} sublabel="/ 2000" />);
    expect(screen.getByText('1500')).toBeInTheDocument();
    expect(screen.getByText('/ 2000')).toBeInTheDocument();
  });

  it('UAT-110 Ring caps the arc at 100% when over target (no overflow)', () => {
    const { container } = render(<Ring value={4000} max={2000} label="over" />);
    // The progress circle is the second <circle>; its dash must not exceed
    // the circumference (i.e. the ring never wraps past full).
    const circles = container.querySelectorAll('circle');
    const dashAttr = circles[1].getAttribute('stroke-dasharray')!;
    const [dash, gap] = dashAttr.split(' ').map(Number);
    expect(gap).toBeGreaterThanOrEqual(0);
    expect(dash).toBeGreaterThan(0);
  });

  it('UAT-111 ProgressBar fill width is clamped to 0–100%', () => {
    const { container } = render(<ProgressBar value={200} min={0} max={100} />);
    const fill = container.querySelector('.h-full') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('UAT-112 ProgressBar maps weight between goal and start correctly', () => {
    // value 110 on a 100..120 scale → 50%
    const { container } = render(<ProgressBar value={110} min={100} max={120} />);
    const fill = container.querySelector('.h-full') as HTMLElement;
    expect(fill.style.width).toBe('50%');
  });

  it('UAT-113 Badge renders its label and colour', () => {
    render(<Badge color="#5fd6a6">Healthy</Badge>);
    const el = screen.getByText('Healthy');
    expect(el).toBeInTheDocument();
    // jsdom normalises the hex colour to rgb(95, 214, 166).
    expect(el.getAttribute('style')).toMatch(/95,\s*214,\s*166/);
  });

  it('UAT-114 NudgeBanner shows the title and body', () => {
    const nudge: Nudge = { level: 'warn', title: 'Protein low', body: 'Add a shake.' };
    render(<NudgeBanner nudge={nudge} />);
    expect(screen.getByText('Protein low')).toBeInTheDocument();
    expect(screen.getByText('Add a shake.')).toBeInTheDocument();
  });

  it('UAT-115 EmptyState shows its title and body copy', () => {
    render(<EmptyState title="Nothing yet" body="Log something." />);
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
    expect(screen.getByText('Log something.')).toBeInTheDocument();
  });

  it('UAT-116 StatTile renders label, value and subtext', () => {
    render(<StatTile label="Sessions" value={5} sub="last 7 days" />);
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('last 7 days')).toBeInTheDocument();
  });

  it('UAT-117 Card renders its children', () => {
    render(<Card><span>inside</span></Card>);
    expect(screen.getByText('inside')).toBeInTheDocument();
  });

  it('UAT-118 SectionTitle shows the heading and hint', () => {
    render(<SectionTitle hint="today">Macros</SectionTitle>);
    expect(screen.getByText('Macros')).toBeInTheDocument();
    expect(screen.getByText('today')).toBeInTheDocument();
  });

  it('UAT-119 Spinner shows a loading label', () => {
    render(<Spinner label="Loading data…" />);
    expect(screen.getByText('Loading data…')).toBeInTheDocument();
  });

  it('UAT-120 the Plan-tab disclaimer card states it is not medical advice', () => {
    render(<DisclaimerCard />);
    // The card has a heading and a body; both mention it. Assert the heading.
    expect(screen.getByText('Not medical advice')).toBeInTheDocument();
    expect(screen.getAllByText(/not medical advice/i).length).toBeGreaterThanOrEqual(1);
  });
});
