'use client';

import { useEffect, useState } from 'react';
import { DISCLAIMER } from '@/lib/constants';

const ACK_KEY = 'reset_disclaimer_ack_v1';

// First-load disclaimer modal. The localStorage flag only records that the
// user has acknowledged it — it is not used as a source of truth for any data.
export function DisclaimerGate() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(ACK_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  function acknowledge() {
    try {
      localStorage.setItem(ACK_KEY, new Date().toISOString());
    } catch {
      /* ignore private-mode storage errors */
    }
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="panel w-full max-w-md p-6">
        <h2 className="font-display text-2xl text-warn">Before you start</h2>
        <p className="text-sm text-text/90 mt-3">{DISCLAIMER}</p>
        <ul className="text-sm text-text/80 mt-3 space-y-1.5 list-disc pl-5">
          <li>
            On appetite-suppressing medication the bigger risk is eating{' '}
            <strong>too little</strong>. Aim toward your target — never chase
            very low days.
          </li>
          <li>Log your blood pressure weekly.</li>
          <li>
            Medication may need a GP review as your weight drops — never adjust
            it yourself.
          </li>
        </ul>
        <button className="btn-primary w-full mt-5" onClick={acknowledge}>
          I understand
        </button>
      </div>
    </div>
  );
}

// Inline version reused inside the Plan tab.
export function DisclaimerCard() {
  return (
    <div className="rounded-xl2 border border-warn/40 bg-warn/10 p-4">
      <p className="font-semibold text-warn text-sm">Not medical advice</p>
      <p className="text-sm text-text/80 mt-1">{DISCLAIMER}</p>
    </div>
  );
}
