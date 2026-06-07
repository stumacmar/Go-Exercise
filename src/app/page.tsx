import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import { Dashboard } from '@/components/Dashboard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return <Dashboard userEmail={user.email ?? ''} />;
}
