'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  MYLIST_CHANGE_EVENT,
  readMyListStorage,
  writeMyListStorage,
} from '@/lib/mylist-storage';

/** Reads the saved-record ids from localStorage. Safe during SSR. */
export const readMyList = readMyListStorage;

const writeMyList = writeMyListStorage;

/**
 * Client store for the visitor's saved records. Backed by localStorage
 * (so the list survives reloads without an account) and, when signed in,
 * synced to the server.
 */
export function useMyList() {
  const { user, refresh } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [synced, setSynced] = useState(false);

  // Initial read from localStorage.
  useEffect(() => {
    setIds(readMyList());
    const on = () => setIds(readMyList());
    window.addEventListener(MYLIST_CHANGE_EVENT, on);
    return () => window.removeEventListener(MYLIST_CHANGE_EVENT, on);
  }, []);

  // On sign-in: merge local + server (union), then push union to server.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const local = readMyList();
      const server = user.myList ?? [];
      const merged = Array.from(new Set([...local, ...server]));
      if (merged.length !== server.length) {
        try {
          await fetch('/api/auth/mylist', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ op: 'set', myList: merged }),
          });
        } catch {
          /* ignore */
        }
        await refresh();
      }
      if (!cancelled && merged.join('|') !== readMyList().join('|')) {
        writeMyList(merged);
        setSynced(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback(
    async (id: string) => {
      const list = readMyList();
      const next = list.includes(id)
        ? list.filter((x) => x !== id)
        : [...list, id];
      writeMyList(next);
      if (user) {
        try {
          await fetch('/api/auth/mylist', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ op: next.includes(id) ? 'add' : 'remove', id }),
          });
        } catch {
          /* ignore */
        }
        await refresh();
      }
    },
    [user, refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      writeMyList(readMyList().filter((x) => x !== id));
      if (user) {
        try {
          await fetch('/api/auth/mylist', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ op: 'remove', id }),
          });
        } catch {
          /* ignore */
        }
        await refresh();
      }
    },
    [user, refresh]
  );

  const clear = useCallback(async () => {
    writeMyList([]);
    if (user) {
      try {
        await fetch('/api/auth/mylist', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ op: 'clear' }),
        });
      } catch {
        /* ignore */
      }
      await refresh();
    }
  }, [user, refresh]);

  return { ids, has, toggle, remove, clear, synced, signedIn: !!user };
}
