'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { UpdateItem } from '@/lib/types';
import { findBaselineItem } from '@/lib/data';
import { getCancer } from '@/lib/cancers';
import { useMyList } from '@/components/useMyList';
import { useI18n } from '@/components/I18nProvider';
import { useAuth } from '@/components/AuthProvider';
import { t } from '@/lib/i18n-runtime';
import { downloadDiscussionListPdf } from '@/lib/discussion-pdf';
import { requestQuota } from '@/lib/quota-client';
import { ProUpgradePrompt } from '@/components/ProUpgradePrompt';
import { RegionBadge, SourceBadge, TypeBadge, StatusBadge } from '@/components/badges';

/**
 * The follow centre: every record a person saved, every cancer type they
 * follow, and the optional Pro-only weekly digest toggle. Purely an
 * organising surface — no ranking, no recommendation, no interpretation.
 */
export function FollowingClient() {
  const { locale, messages: m } = useI18n();
  const { user, status, openSignIn, refresh } = useAuth();
  const { ids, remove } = useMyList();
  const [busyPdf, setBusyPdf] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);
  const [digestBusy, setDigestBusy] = useState(false);
  const [digestSaved, setDigestSaved] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState<
    'idle' | 'sent' | 'error' | 'no_follows' | 'not_configured'
  >('idle');

  const recordItems = useMemo(
    () =>
      ids
        .map((id) => findBaselineItem(id))
        .filter((x): x is UpdateItem => x != null),
    [ids]
  );

  const cancerItems = useMemo(
    () => (user?.alertCancers ?? []).map((slug) => getCancer(slug)).filter(Boolean),
    [user?.alertCancers]
  );

  const isPro =
    !!user && user.plan === 'pro' && (user.proUntil ?? 0) > Date.now();

  if (status === 'unknown') {
    return (
      <main className="container-page max-w-3xl py-16">
        <div className="card p-8 text-center text-sm text-slateish-500">
          {m.following.title}…
        </div>
      </main>
    );
  }

  if (status !== 'signed-in' || !user) {
    return (
      <main className="container-page max-w-2xl py-16">
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <h1 className="text-xl font-semibold text-ink-950">{m.following.title}</h1>
          <p className="max-w-md text-sm leading-relaxed text-slateish-600">
            {m.following.intro}
          </p>
          <button
            type="button"
            onClick={() => openSignIn('/following')}
            className="btn-primary mt-2 text-[13px]"
          >
            {m.nav.signIn}
          </button>
        </div>
      </main>
    );
  }

  async function onGeneratePdf() {
    if (recordItems.length === 0) return;
    setBusyPdf(true);
    setNotice(null);
    setUpgradeMsg(null);
    try {
      const q = await requestQuota(recordItems.length, true);
      if (!q.allowed) {
        setUpgradeMsg(
          q.reason === 'genLimit'
            ? t(m, 'pricing.freeListTooLarge', { max: q.genLimit })
            : m.pricing.freeDailyUsed
        );
        return;
      }
      const res = await downloadDiscussionListPdf({
        items: recordItems,
        signedIn: status === 'signed-in',
        locale,
        messages: m,
        recordLimit: q.genLimit,
      });
      setNotice(res.truncated ? t(m, 'discussionList.limitExceeded', { max: q.genLimit }) : null);
    } catch {
      setNotice(t(m, 'discussionList.printFallback'));
    } finally {
      setBusyPdf(false);
    }
  }

  async function unfollowCancer(slug: string) {
    try {
      const next = user!.alertCancers.filter((s) => s !== slug);
      const res = await fetch('/api/auth/alerts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          enabled: user!.alertEnabled,
          cancers: next,
          regions: user!.alertRegions,
        }),
      });
      if (res.ok) await refresh();
    } catch {
      /* ignore */
    }
  }

  async function toggleDigest() {
    setDigestBusy(true);
    setDigestSaved(false);
    try {
      const res = await fetch('/api/auth/alerts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          enabled: !user!.alertEnabled,
          cancers: user!.alertCancers,
          regions: user!.alertRegions,
        }),
      });
      if (res.ok) {
        await refresh();
        setDigestSaved(true);
      }
    } catch {
      /* ignore */
    } finally {
      setDigestBusy(false);
    }
  }

  async function sendTestEmail() {
    setTestBusy(true);
    setTestResult('idle');
    try {
      const res = await fetch('/api/digest/test', { method: 'POST' });
      if (res.status === 503) {
        setTestResult('not_configured');
        return;
      }
      if (res.status === 400) {
        setTestResult('no_follows');
        return;
      }
      if (res.ok) {
        const j = (await res.json().catch(() => ({}))) as { delivered?: boolean };
        setTestResult(j.delivered ? 'sent' : 'error');
      } else {
        setTestResult('error');
      }
    } catch {
      setTestResult('error');
    } finally {
      setTestBusy(false);
    }
  }

  return (
    <main className="container-page max-w-3xl py-10 sm:py-12">
      <p className="label-eyebrow">{m.nav.following ?? m.following.title}</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink-950">{m.following.title}</h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-slateish-600">
        {m.following.intro}
      </p>

      {/* Followed records */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-ink-900">{m.following.recordsTitle}</h2>
        {recordItems.length === 0 ? (
          <div className="mt-3 rounded-card border border-slateish-200 bg-white p-5 text-sm text-slateish-600">
            <p>{m.following.recordsEmpty}</p>
            <Link href="/cancers" className="btn-secondary mt-3 inline-flex text-[13px]">
              {m.following.recordsEmptyCta}
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onGeneratePdf}
                disabled={busyPdf}
                className="btn-primary text-[13px] disabled:opacity-60"
              >
                {busyPdf ? m.following.generating : m.following.generatePdf}
              </button>
              <span className="text-sm tabular-nums text-slateish-500">
                {t(m, 'myList.count', { n: recordItems.length })}
              </span>
            </div>
            {upgradeMsg ? <ProUpgradePrompt message={upgradeMsg} /> : null}
            {notice ? (
              <p className="mt-2 text-[12px] font-medium text-[#7a4a12]">{notice}</p>
            ) : null}
            <ul className="mt-4 grid gap-3">
              {recordItems.map((item) => (
                <li key={item.id} className="card-interactive flex flex-col gap-3 p-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <RegionBadge region={item.region} />
                    <SourceBadge source={item.source} />
                    <TypeBadge type={item.type} />
                    {item.status ? <StatusBadge status={item.status} /> : null}
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/trials/${item.id}${
                        item.cancers[0] && item.cancers[0] !== 'all'
                          ? `?from=${item.cancers[0]}`
                          : ''
                      }`}
                      className="text-[15px] font-medium leading-snug text-ink-900 hover:text-navy-700"
                    >
                      {item.title}
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="no-print shrink-0 rounded-lg border border-slateish-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slateish-600 hover:border-red-300 hover:text-red-700"
                    >
                      {m.following.unfollow}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Followed cancer types */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold text-ink-900">{m.following.cancersTitle}</h2>
        {cancerItems.length === 0 ? (
          <div className="mt-3 rounded-card border border-slateish-200 bg-white p-5 text-sm text-slateish-600">
            <p>{m.following.cancersEmpty}</p>
          </div>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {cancerItems.map((c) => (
              <li
                key={c!.slug}
                className="flex items-center justify-between gap-3 rounded-card border border-slateish-200 bg-white p-4"
              >
                <Link
                  href={`/cancers/${c!.slug}`}
                  className="text-[15px] font-medium text-ink-900 hover:text-navy-700"
                >
                  {m.cancers[c!.slug]?.label ?? c!.label}
                </Link>
                <button
                  type="button"
                  onClick={() => unfollowCancer(c!.slug)}
                  className="shrink-0 rounded-lg border border-slateish-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slateish-600 hover:border-red-300 hover:text-red-700"
                >
                  {m.following.unfollow}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Weekly digest (Pro-only) */}
      <section className="mt-10 rounded-card border border-slateish-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-ink-900">{m.following.digestTitle}</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-slateish-600">
          {m.following.digestBody}
        </p>
        {isPro ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={toggleDigest}
              disabled={digestBusy}
              role="switch"
              aria-checked={user.alertEnabled}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-60 ${
                user.alertEnabled
                  ? 'border-navy-700 bg-navy-800 text-white'
                  : 'border-slateish-300 bg-white text-slateish-600'
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  user.alertEnabled ? 'bg-white' : 'bg-slateish-300'
                }`}
              />
              {user.alertEnabled ? m.following.digestOn : m.following.digestOff}
            </button>
            <p className="mt-2 text-[12px] text-slateish-500">{m.following.digestToggle}</p>
            {digestSaved ? (
              <p className="mt-2 text-[12px] font-medium text-[#3f8f6b]">
                {m.following.digestSaved}
              </p>
            ) : null}
            {recordItems.length === 0 && cancerItems.length === 0 ? (
              <p className="mt-3 border-t border-slateish-200 pt-3 text-[12px] text-slateish-500">
                {m.following.testNoFollows}
              </p>
            ) : (
              <div className="mt-3 border-t border-slateish-200 pt-3">
                <button
                  type="button"
                  onClick={sendTestEmail}
                  disabled={testBusy}
                  className="btn-secondary text-[13px] disabled:opacity-60"
                >
                  {testBusy ? m.following.sendingTest : m.following.sendTest}
                </button>
                {testResult === 'sent' ? (
                  <p className="mt-2 text-[12px] font-medium text-[#3f8f6b]">
                    {m.following.testSent}
                  </p>
                ) : testResult === 'error' ? (
                  <p className="mt-2 text-[12px] font-medium text-[#7a3030]">
                    {m.following.testError}
                  </p>
                ) : testResult === 'not_configured' ? (
                  <p className="mt-2 text-[12px] text-slateish-500">
                    {m.following.testNotConfigured}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-[#cfe3d8] bg-[#eef6f2] px-3 py-2.5 text-[13px] text-[#2e5747]">
            <p>{m.following.digestProOnly}</p>
            <Link href="/pro" className="mt-1 inline-block font-semibold underline">
              {m.pricing.nav}
            </Link>
          </div>
        )}
      </section>

      <p className="mt-8 rounded-xl border border-slateish-200 bg-slateish-50 p-3 text-[12px] leading-relaxed text-slateish-600">
        {m.following.disclaimer}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link href="/after-care" className="link-underline text-[13px]">
          {m.following.openAfterCare} →
        </Link>
        <Link href="/my-list" className="link-underline text-[13px]">
          {m.nav.myList} →
        </Link>
      </div>
    </main>
  );
}
