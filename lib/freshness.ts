'use client';

import { useEffect, useState } from 'react';
import { SNAPSHOT_DATE } from './data/trials';

/**
 * Computes the freshness of the bundled snapshot relative to the visitor's
 * current date. Returns ISO yyyy-mm-dd of the snapshot and `stale=true` when
 * the gap to "today" is more than 7 days.
 */
export function computeFreshness(snapshotIso: string) {
  const snap = new Date(`${snapshotIso}T00:00:00Z`);
  const now = new Date();
  const ms = now.getTime() - snap.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return { lastVerified: snapshotIso, stale: days > 7 };
}

/**
 * Hook: returns freshness in a stable shape. Re-runs on the client only —
 * server output is identical (snapshot date is fixed), so SSR + hydration
 * match.
 */
export function useFreshness() {
  const [state, setState] = useState(() => computeFreshness(SNAPSHOT_DATE));
  useEffect(() => {
    setState(computeFreshness(SNAPSHOT_DATE));
  }, []);
  return state;
}
