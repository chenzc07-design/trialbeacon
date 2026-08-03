/**
 * The browser-side copy of the visitor's saved-record list.
 *
 * Kept in its own module so both the auth provider and the useMyList hook
 * can touch it without importing each other (which would be a cycle).
 */
export const MYLIST_STORAGE_KEY = 'tb_mylist';
export const MYLIST_CHANGE_EVENT = 'tb-mylist-change';

/** Reads the saved-record ids from localStorage. Safe during SSR. */
export function readMyListStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(MYLIST_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function writeMyListStorage(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MYLIST_STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(MYLIST_CHANGE_EVENT));
  } catch {
    /* private mode or a full quota — the list simply will not persist */
  }
}

/** Drops the local copy. Used by "erase everything" on the account page. */
export function clearMyListStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(MYLIST_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(MYLIST_CHANGE_EVENT));
  } catch {
    /* nothing further we can do */
  }
}
