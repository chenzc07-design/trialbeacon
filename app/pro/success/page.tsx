'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { UpdateItem } from '@/lib/types';
import { findBaselineItem } from '@/lib/data';
import { useI18n } from '@/components/I18nProvider';
import { useAuth } from '@/components/AuthProvider';
import { useMyList } from '@/components/useMyList';
import { downloadDiscussionListPdf } from '@/lib/discussion-pdf';
import { requestQuota } from '@/lib/quota-client';
import { t } from '@/lib/i18n-runtime';

export default function ProSuccessPage() {
  const { locale, messages: m } = useI18n();
  const { status } = useAuth();
  const { ids } = useMyList();
  const [monthly, setMonthly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setMonthly(p.get('type') === 'monthly');
  }, []);

  const items = useMemo(
    () =>
      ids
        .map((id) => findBaselineItem(id))
        .filter((x): x is UpdateItem => x != null),
    [ids]
  );

  async function onDownload() {
    if (items.length === 0) return;
    setBusy(true);
    setNotice(null);
    try {
      const q = await requestQuota(items.length, true);
      if (!q.allowed) {
        setNotice(
          q.reason === 'genLimit'
            ? t(m, 'pricing.freeListTooLarge', { max: q.genLimit })
            : m.pricing.freeDailyUsed
        );
        return;
      }
      const res = await downloadDiscussionListPdf({
        items,
        signedIn: status === 'signed-in',
        locale,
        messages: m,
        recordLimit: q.genLimit,
      });
      setNotice(res.truncated ? t(m, 'discussionList.limitExceeded', { max: q.genLimit }) : null);
    } catch {
      setNotice(t(m, 'discussionList.printFallback'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container-page max-w-2xl py-16">
      <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef6f2] text-2xl text-[#3f8f6b]">
          ✓
        </div>
        <h1 className="text-xl font-semibold text-ink-950">{m.pricing.successTitle}</h1>
        <p className="max-w-md text-sm leading-relaxed text-slateish-600">
          {monthly ? m.pricing.successBodyPro : m.pricing.successBodySingle}
        </p>

        {/* Primary: download the discussion list PDF */}
        <div className="mt-2 flex w-full flex-col items-center gap-2">
          <button
            type="button"
            onClick={onDownload}
            disabled={busy || items.length === 0}
            className="btn-primary w-full text-[14px] disabled:opacity-60 sm:w-auto"
          >
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M8 2v8m0 0L5 7m3 3 3-3M3 13h10"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {busy ? m.discussionList.generating : m.pricing.successDownload}
            </span>
          </button>
          {items.length === 0 ? (
            <p className="text-[12px] text-slateish-500">{m.pricing.successEmpty}</p>
          ) : (
            <p className="text-[12px] tabular-nums text-slateish-400">
              {t(m, 'myList.count', { n: items.length })}
            </p>
          )}
        </div>

        {/* Neutral next-appointment hint */}
        <p className="mt-2 max-w-sm text-[12px] leading-relaxed text-slateish-500">
          {m.pricing.successNext}
        </p>

        {/* Secondary navigation */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Link href="/after-care" className="btn-secondary text-[13px]">
            {m.nav.afterCare}
          </Link>
          <Link href="/following" className="btn-secondary text-[13px]">
            {m.nav.following}
          </Link>
        </div>

        <p className="mt-4 text-[12px] leading-relaxed text-slateish-400">
          {m.pricing.successHint}
        </p>
        <p className="text-[12px] leading-relaxed text-slateish-400">
          {m.pricing.statNote}
        </p>
      </div>
    </main>
  );
}
