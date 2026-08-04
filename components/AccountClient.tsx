'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useI18n } from './I18nProvider';
import { PageHero } from './PageHero';
import { CANCERS } from '@/lib/cancers';
import { ALERT_FREE_LIMIT } from '@/lib/auth-shared';
import { t } from '@/lib/i18n-runtime';

function fmtDate(ms: number, locale: string): string {
  try {
    return new Date(ms).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

const DEFAULT_REGIONS = ['US', 'EU', 'CN'];

export function AccountClient() {
  const { messages: m, locale } = useI18n();
  const { user, signOut, eraseAll, openSignIn, refresh, status } = useAuth();
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>(DEFAULT_REGIONS);
  const [confirmErase, setConfirmErase] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const userId = user?.id ?? null;

  /*
   * Every hook has to run on every render, so the stored preferences are
   * pulled into local state here rather than through useState initialisers
   * further down (which sat after the early returns and changed the hook
   * count the moment somebody signed in). Keyed on the account id, so the
   * refresh() that follows a save does not overwrite the form.
   */
  useEffect(() => {
    if (!user) return;
    setSelected(user.alertCancers ?? []);
    setRegions(user.alertRegions?.length ? user.alertRegions : DEFAULT_REGIONS);
    setConfirmErase(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (status === 'unknown') {
    return (
      <div className="container-page py-16">
        <p className="text-sm text-slateish-500">…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <PageHero
          eyebrow={m.auth.eyebrow}
          title={m.account.notSignedIn}
          intro={m.auth.intro}
        />
        <div className="container-page py-10">
          <button
            type="button"
            onClick={() => openSignIn('/account')}
            className="btn-primary"
          >
            {m.account.signInCta}
          </button>
        </div>
      </>
    );
  }

  const toggleCancer = (slug: string) => {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= ALERT_FREE_LIMIT) return prev;
      return [...prev, slug];
    });
  };
  const toggleRegion = (r: string) => {
    setRegions((prev) =>
      prev.includes(r)
        ? prev.length > 1
          ? prev.filter((x) => x !== r)
          : prev
        : [...prev, r]
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/auth/alerts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          enabled: selected.length > 0,
          cancers: selected,
          regions,
        }),
      });
      await refresh();
      setSavedAt(new Date().toLocaleTimeString());
      // Anonymous usage stat — no health information is sent.
      fetch('/api/stats', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event: 'alerts_subscribe' }),
      }).catch(() => undefined);
    } finally {
      setSaving(false);
    }
  };

  const cancelPro = async () => {
    setCancelling(true);
    try {
      await fetch('/api/paypal/cancel', { method: 'POST' });
      await refresh();
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow={m.auth.eyebrow}
        title={m.account.title}
        intro={`${m.auth.signedInTitle}. ${m.auth.signedInBody}`}
      />
      <div className="container-page py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-ink-950">
              {m.account.emailLabel}
            </h2>
            <p className="mt-2 text-sm text-slateish-600">{user.email}</p>
            <hr className="my-5 border-slateish-200" />
            <h2 className="text-base font-semibold text-ink-950">
              {m.account.listTitle}
            </h2>
            <p className="mt-1 text-sm text-slateish-500">
              {m.account.listHint}
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slateish-200 bg-slateish-50 px-2.5 py-1 text-xs text-slateish-600">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3f8f6b]" />
              {m.myList.count.replace('{n|record|records}', String(user.myList.length)).replace(
                '{n|one|many}',
                String(user.myList.length)
              )}{' · '}
              {savedAt ? m.account.saved : ''}
            </p>
            <Link
              href="/my-list"
              className="btn-secondary mt-4 inline-flex text-[13px]"
            >
              {m.nav.myList} →
            </Link>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-semibold text-ink-950">
              {m.account.alertsTitle}
            </h2>
            <p className="mt-1 text-sm text-slateish-500">
              {m.account.alertsHint.replace('{max}', String(ALERT_FREE_LIMIT))}
            </p>

            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-ink-900">
                {m.alerts.form.cancerLegend}
                <span className="ml-2 text-xs font-normal text-slateish-500">
                  {m.account.alertsCount
                    .replace('{n}', String(selected.length))
                    .replace('{max}', String(ALERT_FREE_LIMIT))}
                </span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {CANCERS.map((c) => {
                  const active = selected.includes(c.slug);
                  const disabled = !active && selected.length >= ALERT_FREE_LIMIT;
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => toggleCancer(c.slug)}
                      disabled={disabled}
                      aria-pressed={active}
                      className={`chip transition-colors ${
                        active
                          ? 'border-navy-700 bg-navy-800 text-white'
                          : disabled
                            ? 'border-slateish-200 bg-slateish-50 text-slateish-300'
                            : 'border-slateish-200 bg-white text-slateish-600 hover:border-navy-300'
                      }`}
                    >
                      {m.cancers[c.slug]?.label ?? c.label}
                    </button>
                  );
                })}
              </div>
              {selected.length >= ALERT_FREE_LIMIT ? (
                <p className="mt-2 text-[11px] text-slateish-500">
                  {m.account.freeLimit.replace('{max}', String(ALERT_FREE_LIMIT))}
                </p>
              ) : null}
            </fieldset>

            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-ink-900">
                {m.alerts.form.regionsLegend}
              </legend>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['US', 'EU', 'CN'].map((r) => {
                  const active = regions.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRegion(r)}
                      aria-pressed={active}
                      className={`chip transition-colors ${
                        active
                          ? 'border-navy-700 bg-navy-800 text-white'
                          : 'border-slateish-200 bg-white text-slateish-600 hover:border-navy-300'
                      }`}
                    >
                      {m.region[r as 'US' | 'EU' | 'CN']}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={saving || selected.length === 0}
                className="btn-primary text-[13px]"
              >
                {saving ? m.alerts.form.submitting : m.alerts.form.subscribe}
              </button>
              {savedAt ? (
                <span className="text-xs text-slateish-500">
                  {m.account.saved}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button type="button" onClick={signOut} className="btn-secondary text-[13px]">
            {m.account.signOutCta}
          </button>
        </div>

        {/* Discussion List Pro / subscription management */}
        <div className="mt-6 card p-6">
          <h2 className="text-base font-semibold text-ink-950">
            {m.pricing.manageTitle}
          </h2>
          {user.plan === 'pro' && (user.proUntil ?? 0) > Date.now() ? (
            <>
              <p className="mt-1 text-sm text-slateish-600">
                {t(m, 'pricing.alreadyPro', { date: fmtDate(user.proUntil!, locale) })}
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-slateish-500">
                {m.pricing.manageNote}
              </p>
              <button
                type="button"
                onClick={cancelPro}
                disabled={cancelling}
                className="btn-secondary mt-3 text-[13px]"
              >
                {cancelling ? m.alerts.form.submitting : m.pricing.manageCancel}
              </button>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-slateish-600">{m.pricing.disclaimer}</p>
              <Link href="/pro" className="btn-primary mt-3 inline-flex text-[13px]">
                {m.pricing.upgradeCta}
              </Link>
            </>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-[#e8c9c9] bg-[#faf7f6] p-5">
          <h2 className="text-sm font-semibold text-ink-950">
            {m.account.eraseTitle}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slateish-600">
            {m.account.eraseHint}
          </p>
          {confirmErase ? (
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={async () => {
                  setErasing(true);
                  try {
                    await eraseAll();
                  } finally {
                    setErasing(false);
                  }
                }}
                disabled={erasing}
                className="rounded-xl border border-[#a34747] bg-[#a34747] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#8c3b3b] disabled:opacity-60"
              >
                {erasing ? m.account.erasing : m.account.eraseConfirmCta}
              </button>
              <button
                type="button"
                onClick={() => setConfirmErase(false)}
                className="text-[13px] text-slateish-600 hover:underline"
              >
                {m.account.eraseCancel}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmErase(true)}
              className="btn-secondary mt-4 text-[13px]"
            >
              {m.account.eraseCta}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
