'use client';

import { useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { SettingsProvider } from './SettingsContext';
import { DisclaimerGate } from './Disclaimer';
import { Overview } from './tabs/Overview';
import { WeightBP } from './tabs/WeightBP';
import { Food } from './tabs/Food';
import { Training } from './tabs/Training';
import { Plan } from './tabs/Plan';

type TabKey = 'overview' | 'weight' | 'food' | 'training' | 'plan';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '◎' },
  { key: 'weight', label: 'Weight·BP', icon: '♥' },
  { key: 'food', label: 'Food', icon: '⊘' },
  { key: 'training', label: 'Training', icon: '⚡' },
  { key: 'plan', label: 'Plan', icon: '☰' },
];

export function Dashboard({ userEmail }: { userEmail: string }) {
  const [tab, setTab] = useState<TabKey>('overview');

  async function signOut() {
    await getSupabaseBrowser().auth.signOut();
    window.location.href = '/login';
  }

  return (
    <SettingsProvider>
      <DisclaimerGate />
      <div className="min-h-dvh max-w-2xl mx-auto pb-24">
        <header className="flex items-center justify-between px-5 pt-6 pb-3">
          <div>
            <h1 className="font-display text-3xl text-accent leading-none">
              Reset
            </h1>
            <p className="text-xs text-muted mt-1 truncate max-w-[12rem]">
              {userEmail}
            </p>
          </div>
          <button onClick={signOut} className="btn-ghost text-sm py-2 px-3">
            Sign out
          </button>
        </header>

        <main className="px-4 space-y-4">
          {tab === 'overview' && <Overview onNavigate={setTab} />}
          {tab === 'weight' && <WeightBP />}
          {tab === 'food' && <Food />}
          {tab === 'training' && <Training />}
          {tab === 'plan' && <Plan />}
        </main>
      </div>

      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-line bg-panel/95 backdrop-blur">
        <div className="max-w-2xl mx-auto grid grid-cols-5">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors ${
                  active ? 'text-accent' : 'text-muted'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="text-lg leading-none">{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom)' }} />
      </nav>
    </SettingsProvider>
  );
}

export type { TabKey };
