'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'tb_mylist';

/** Reads the saved-record ids from localStorage. Safe during SSR. */
export function readMyList(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeMyList(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  // Let every open view (e.g. the My list page) refresh in place.
  window.dispatchEvent(new CustomEvent('tb-mylist-change'));
}

/**
 * Small client store for the visitor's saved records. Backed by localStorage so
 * the list survives reloads, and kept in sync across tabs/components via an
 * event. No data ever leaves the browser.
 */
export function useMyList() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readMyList());
    const on = () => setIds(readMyList());
    window.addEventListener('tb-mylist-change', on);
    return () => window.removeEventListener('tb-mylist-change', on);
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    const list = readMyList();
    const next = list.includes(id)
      ? list.filter((x) => x !== id)
      : [...list, id];
    writeMyList(next);
  }, []);

  const remove = useCallback((id: string) => {
    writeMyList(readMyList().filter((x) => x !== id));
  }, []);

  const clear = useCallback(() => writeMyList([]), []);

  return { ids, has, toggle, remove, clear };
}
