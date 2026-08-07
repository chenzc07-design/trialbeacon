'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from './I18nProvider';
import { useAuth } from './AuthProvider';
import { t } from '@/lib/i18n-runtime';
import { showToast } from '@/lib/toast';
import { ALERT_FREE_LIMIT } from '@/lib/auth-shared';

interface LimitModalState {
  /** The cancer slug the visitor tried to follow at the limit, or null. */
  limitSlug: string | null;
  openLimit: (slug: string) => void;
  closeLimit: () => void;
}

const Ctx = createContext<LimitModalState | null>(null);

export function useLimitModal(): LimitModalState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLimitModal must be used within LimitModalProvider');
  return v;
}

/**
 * A single, app-wide limit modal. Rendered once in the root layout (outside
 * the cancer grid) so it never mounts/unmounts when cards re-render — that is
 * what keeps it visually stable and prevents the flicker a per-card modal can
 * cause. Opening it is a pure local-state action: no follow is written, no
 * network call happens until the visitor picks which follow to drop.
 */
export function LimitModalProvider({ children }: { children: ReactNode }) {
  const { messages: m } = useI18n();
  const { user, refresh } = useAuth();
  const router = useRouter();

  const [limitSlug, setLimitSlug] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string>('');
  const [busy, setBusy] = useState(false);

  // Seed the "which follow to drop" selection when the modal opens.
  useEffect(() => {
    if (limitSlug && user) {
      const list = user.alertCancers ?? [];
      setChosen(list[0] ?? '');
    }
  }, [limitSlug, user]);

  const openLimit = useCallback((slug: string) => setLimitSlug(slug), []);
  const closeLimit = useCallback(() => {
    setLimitSlug(null);
    setChosen('');
    setBusy(false);
  }, []);

  const confirmReplace = useCallback(async () => {
    if (!user || !limitSlug || !chosen) return;
    setBusy(true);
    try {
      const res = await fetch('/api/alerts/follow', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug: limitSlug,
          follow: true,
          replace: true,
          replaceSlug: chosen,
        }),
      });
      if (!res.ok) {
        showToast(m.follow.toastError, 'error');
        closeLimit();
        return;
      }
      // One transaction: server swaps the chosen follow for the new one, then
      // we refresh once so every card settles to its correct state together.
      await refresh();
      const name = m.cancers[limitSlug]?.label ?? limitSlug;
      showToast(t(m, 'follow.toastOn', { name }), 'ok');
      closeLimit();
    } catch {
      showToast(m.follow.toastError, 'error');
      closeLimit();
    } finally {
      setBusy(false);
    }
  }, [user, limitSlug, chosen, m, refresh]);

  const viewPro = useCallback(() => {
    closeLimit();
    router.push('/pro');
  }, [router]);

  const value = useMemo<LimitModalState>(
    () => ({ limitSlug, openLimit, closeLimit }),
    [limitSlug, openLimit, closeLimit]
  );

  const follows = user?.alertCancers ?? [];
  const targetLabel = limitSlug ? (m.cancers[limitSlug]?.label ?? limitSlug) : '';

  return (
    <Ctx.Provider value={value}>
      {children}
      {limitSlug ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-ink-950/50 px-4 py-6 sm:items-center"
          onClick={closeLimit}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-card-hover"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={closeLimit}
              aria-label="Close"
              className="absolute right-3 top-3 rounded-md p-1.5 text-slateish-400 hover:bg-slateish-100"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <h3 className="pr-8 text-base font-semibold text-ink-950">
              {t(m, 'follow.limitTitle', { max: ALERT_FREE_LIMIT })}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slateish-600">
              {m.follow.limitBody}
            </p>
            <p className="mt-3 text-xs font-medium text-slateish-500">
              {m.follow.limitPick}
            </p>
            <div className="mt-2 flex max-h-56 flex-col gap-1.5 overflow-y-auto">
              {follows.map((s) => (
                <label
                  key={s}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    chosen === s
                      ? 'border-navy-300 bg-navy-50 text-navy-900'
                      : 'border-slateish-200 text-ink-800 hover:border-navy-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="tb-replace"
                    checked={chosen === s}
                    onChange={() => setChosen(s)}
                    className="accent-navy-700"
                  />
                  {m.cancers[s]?.label ?? s}
                </label>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={busy || !chosen}
                onClick={confirmReplace}
                className="btn-primary w-full disabled:opacity-60"
              >
                {t(m, 'follow.limitReplace', { name: targetLabel })}
              </button>
              <button
                type="button"
                onClick={viewPro}
                className="btn-secondary w-full"
              >
                {m.follow.limitViewPro}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Ctx.Provider>
  );
}
