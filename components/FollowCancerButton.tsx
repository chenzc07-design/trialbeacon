'use client';

import { useEffect, useState } from 'react';
import { useI18n } from './I18nProvider';
import { useAuth } from './AuthProvider';
import { useLimitModal } from './LimitModal';
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
 * - At the free limit, clicking an un-followed cancer opens the app-wide
 *   limit modal directly (local pre-check — no network write, no rollback,
 *   no flicker). The modal itself lives in LimitModalProvider, so it is a
 *   single, stable instance unrelated to any card's lifecycle.
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
  const { openLimit, limitSlug } = useLimitModal();
  const label = m.cancers[slug]?.label ?? slug;
  const [busy, setBusy] = useState(false);
  const [following, setFollowing] = useState<boolean>(initialFollowing ?? false);

  // Keep the local toggle in step with the authoritative list from context.
  // Runs only when `user` actually changes; sets the same boolean when the
  // data is unchanged, so React bails out (no render loop).
  useEffect(() => {
    if (user) setFollowing(user.alertCancers?.includes(slug) ?? false);
  }, [user, slug]);

  function currentPath(): string {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  }

  async function doFollow(follow: boolean) {
    if (!user) {
      openSignIn(currentPath());
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/alerts/follow', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, follow }),
      });
      // Fallback: if the local count was stale and the server still rejects,
      // open the modal instead of erroring — never write-and-roll-back.
      if (res.status === 409) {
        openLimit(slug);
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

  function handleClick(e: React.MouseEvent) {
    // Never let a follow click bubble up to the card's navigation link.
    e.stopPropagation();
    if (!ready || limitSlug) return;
    if (status !== 'signed-in' || !user) {
      openSignIn(currentPath());
      return;
    }
    const follows = user.alertCancers ?? [];
    // Local pre-check first: at the free limit and this one not yet followed
    // → open the limit modal directly, with no network write.
    if (!following && follows.length >= ALERT_FREE_LIMIT) {
      openLimit(slug);
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
        onClick={(e) => {
          e.stopPropagation();
          openSignIn(currentPath());
        }}
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
    </>
  );
}
