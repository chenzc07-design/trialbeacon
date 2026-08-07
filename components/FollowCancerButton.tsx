'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from './I18nProvider';
import { useAuth } from './AuthProvider';
import { t } from '@/lib/i18n-runtime';
import { showToast } from '@/lib/toast';
import { ALERT_FREE_LIMIT } from '@/lib/auth-shared';

/**
 * Toggle a cancer-type follow. Used on both the /cancers grid cards and the
 * detail page, sharing one endpoint and one source of truth (the person's
 * `alertCancers`), so the card and the detail page never disagree.
 *
 * - Anonymous visitors are routed to sign-in (returns to the current page).
 * - A signed-in visitor's click writes the follow immediately and toasts.
 * - Hitting the free limit returns a clear prompt offering "replace a follow"
 *   or "view Pro" instead of silently dropping the request.
 */
export function FollowCancerButton({
  slug,
  fullWidth,
  className = '',
  hint = false,
  initialFollowing,
}: {
  slug: string;
  fullWidth?: boolean;
  className?: string;
  hint?: boolean;
  initialFollowing?: boolean;
}) {
  const { messages: m } = useI18n();
  const { user, status, ready, openSignIn, refresh } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showLimit, setShowLimit] = useState(false);

  const label = m.cancers[slug]?.label ?? slug;
  const [following, setFollowing] = useState<boolean>(initialFollowing ?? false);

  // Keep the local toggle in step with the authoritative list from context.
  useEffect(() => {
    if (user) setFollowing(user.alertCancers?.includes(slug) ?? false);
  }, [user, slug]);

  function currentPath(): string {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  }

  async function doFollow(follow: boolean, replace = false) {
    if (!user) {
      openSignIn(currentPath());
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/alerts/follow', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, follow, replace }),
      });
      if (res.status === 409) {
        setShowLimit(true);
        return;
      }
      if (!res.ok) {
        showToast(m.follow.toastError, 'error');
        return;
      }
      await refresh();
      showToast(
        follow
          ? t(m, 'follow.toastOn', { name: label })
          : t(m, 'follow.toastOff', { name: label }),
        'ok'
      );
    } catch {
      showToast(m.follow.toastError, 'error');
    } finally {
      setBusy(false);
    }
  }

  function handleClick() {
    if (!ready) return;
    if (status !== 'signed-in' || !user) {
      openSignIn(currentPath());
      return;
    }
    void doFollow(!following);
  }

  const base = `text-[13px] disabled:opacity-60 ${fullWidth ? 'w-full' : ''} ${className}`;

  // Auth state still resolving — show a neutral, disabled control so we never
  // flash the wrong "sign in" affordance for an already-signed-in visitor.
  if (!ready) {
    return (
      <button type="button" disabled className={`btn-secondary ${base}`}>
        {m.follow.cancerAdd}
      </button>
    );
  }

  // Signed out — invite to sign in (weekly digest is a Pro perk).
  if (status !== 'signed-in' || !user) {
    return (
      <button
        type="button"
        onClick={() => openSignIn(currentPath())}
        title={m.follow.cancerSignIn}
        className={`btn-secondary ${base}`}
      >
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M8 3.5v9M3.5 8h9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          {m.follow.cancerSignIn}
        </span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-pressed={following}
        title={following ? m.follow.cancerRemove : m.follow.cancerAdd}
        className={`${base} ${
          following
            ? 'btn border border-navy-300 bg-navy-50 text-navy-800 hover:bg-navy-100'
            : 'btn-secondary'
        }`}
      >
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            {following ? (
              <path
                d="M3.5 8.5l3 3 6-7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M8 3.5v9M3.5 8h9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
          </svg>
          {following ? m.follow.cancerSaved : m.follow.cancerAdd}
        </span>
      </button>

      {hint ? (
        <p className="mt-2 max-w-[22rem] text-[11px] leading-snug text-slateish-500">
          {m.follow.hint}
        </p>
      ) : null}

      {showLimit ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-ink-950/50 px-4 py-6 sm:items-center"
          onClick={() => setShowLimit(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-card-hover"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-base font-semibold text-ink-950">
              {t(m, 'follow.limitTitle', { max: ALERT_FREE_LIMIT })}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slateish-600">
              {m.follow.limitBody}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setShowLimit(false);
                  void doFollow(true, true);
                }}
                className="btn-primary w-full"
              >
                {m.follow.limitReplace}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLimit(false);
                  router.push('/pro');
                }}
                className="btn-secondary w-full"
              >
                {m.follow.limitViewPro}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
