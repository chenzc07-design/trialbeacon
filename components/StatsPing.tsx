'use client';

import { useEffect, useRef } from 'react';

/**
 * Fire one anonymous usage event on mount. No health information is ever sent —
 * only the event name. Safe to drop anywhere; renders nothing.
 */
export function StatsPing({ event }: { event: string }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    fetch('/api/stats', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event }),
    }).catch(() => undefined);
  }, [event]);
  return null;
}
