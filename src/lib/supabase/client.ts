'use client';

import { createBrowserClient } from '@supabase/ssr';

// A singleton browser client. RLS on the database guarantees a user can only
// ever read or write their own rows, so it is safe to query directly from
// client components with the anon key.
let cached: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowser() {
  if (cached) return cached;
  cached = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return cached;
}
