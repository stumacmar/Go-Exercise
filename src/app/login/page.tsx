'use client';

import { useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('sending');
    const supabase = getSupabaseBrowser();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });
    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      setStatus('sent');
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-5">
      <div className="panel w-full max-w-sm p-7">
        <div className="mb-6">
          <h1 className="font-display text-4xl text-accent">Reset</h1>
          <p className="text-muted mt-1 text-sm">
            Your private health &amp; training dashboard.
          </p>
        </div>

        {status === 'sent' ? (
          <div className="space-y-3">
            <div className="chip bg-accent/15 text-accent">Check your email</div>
            <p className="text-sm text-text/90">
              We sent a magic sign-in link to <strong>{email}</strong>. Open it
              on this device to continue. The link works on your phone and your
              laptop — your data syncs across both.
            </p>
            <button
              className="btn-ghost w-full mt-2"
              onClick={() => setStatus('idle')}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={sendLink} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'Sending…' : 'Send magic link'}
            </button>
            {status === 'error' && (
              <p className="text-danger text-sm">{message}</p>
            )}
            <p className="text-xs text-muted">
              No password needed — we email you a one-time sign-in link.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
