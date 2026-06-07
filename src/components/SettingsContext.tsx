'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { UserSettings } from '@/lib/types';

const DEFAULTS: Omit<UserSettings, 'user_id'> = {
  calorie_target: 2000,
  protein_target: 160,
  goal_kg: 100.0,
  start_kg: 120.1,
  height_cm: 180.3,
  age: 56,
};

interface SettingsCtx {
  settings: UserSettings | null;
  loading: boolean;
  update: (patch: Partial<UserSettings>) => Promise<void>;
}

const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setSettings(data as unknown as UserSettings);
    } else {
      // The DB trigger normally creates this, but self-heal just in case.
      const row = { user_id: user.id, ...DEFAULTS };
      await supabase.from('user_settings').upsert(row);
      setSettings(row);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (patch: Partial<UserSettings>) => {
      if (!settings) return;
      const next = { ...settings, ...patch };
      setSettings(next); // optimistic
      const supabase = getSupabaseBrowser();
      await supabase
        .from('user_settings')
        .update(patch)
        .eq('user_id', settings.user_id);
    },
    [settings],
  );

  return (
    <Ctx.Provider value={{ settings, loading, update }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
