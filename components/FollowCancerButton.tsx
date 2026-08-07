'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useI18n } from './I18nProvider';
import { useAuth } from './AuthProvider';

/**
 * Toggle a cancer-type follow (login required). Following saves the slug to
 * the person's `alertCancers` list (visible in /following) for every signed-
 * in visitor. The weekly digest email that goes with it is a Pro feature and
 * is gated in the API, so a free follower sees their list in-site but receives
 * no mail. Anonymous visitors are routed to sign-in.
 */
export function FollowCancerButton({
  slug,
  fullWidth,
  className = '',
}: {
  slug: string;
  fullWidth?: boolean;
  className?: string;
}) {
  const { messages: m } = useI18n();
  const { user, status, openSignIn, refresh } = useAuth();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  const following = !!user?.alertCancers?.includes(slug);

  async function toggle() {
    if (!user) {
      openSignIn(pathname);
      return;
    }
    setBusy(true);
    try {
      const next = following
        ? user.alertCancers.filter((s) => s !== slug)
        : [...user.alertCancers, slug];
      const res = await fetch('/api/auth/alerts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          enabled: user.alertEnabled,
          cancers: next,
          regions: user.alertRegions,
        }),
      });
      if (res.ok) await refresh();
    } catch {
      /* ignore — next render reflects real state */
    } finally {
      setBusy(false);
    }
  }

  // Anonymous: invite to sign in (weekly digest is a Pro perk).
  if (status !== 'signed-in' || !user) {
    return (
      <button
        type="button"
        onClick={() => openSignIn(pathname)}
        title={m.follow.cancerSignIn}
        className={`btn-secondary text-[13px] ${fullWidth ? 'w-full' : ''} ${className}`}
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
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={following}
      title={following ? m.follow.cancerRemove : m.follow.cancerAdd}
      className={`text-[13px] disabled:opacity-60 ${
        fullWidth ? 'w-full' : ''
      } ${
        following
          ? 'btn border border-navy-300 bg-navy-50 text-navy-800 hover:bg-navy-100'
          : 'btn-secondary'
      } ${className}`}
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
            <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          )}
        </svg>
        {following ? m.follow.cancerSaved : m.follow.cancerAdd}
      </span>
    </button>
  );
}
