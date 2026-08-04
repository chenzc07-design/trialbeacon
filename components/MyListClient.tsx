'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { UpdateItem } from '@/lib/types';
import { findBaselineItem } from '@/lib/data';
import { useMyList } from '@/components/useMyList';
import { useI18n } from '@/components/I18nProvider';
import { useAuth } from '@/components/AuthProvider';
import { t } from '@/lib/i18n-runtime';
import { downloadDiscussionListPdf } from '@/lib/discussion-pdf';
import { requestQuota } from '@/lib/quota-client';
import { ProUpgradePrompt } from '@/components/ProUpgradePrompt';
import { RegionBadge, SourceBadge, TypeBadge, StatusBadge } from '@/components/badges';

const NOTES_KEY = 'tb_mylist_notes';

export function MyListClient() {
  const { locale, messages: m } = useI18n();
  const { status } = useAuth();
  const { ids, remove, clear } = useMyList();
  const [today, setToday] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);

  async function onExportList() {
    if (items.length === 0) return;
    setBusy(true);
    setNotice(null);
    setUpgradeMsg(null);
    try {
      const q = await requestQuota(items.length, true);
      if (!q.allowed) {
        setUpgradeMsg(
          q.reason === 'genLimit'
            ? t(m, 'pricing.freeListTooLarge', { max: q.genLimit })
            : m.pricing.freeDailyUsed
        );
        return;
      }
      fetch('/api/stats', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event: 'select_generate' }),
      }).catch(() => undefined);
      const res = await downloadDiscussionListPdf({
        items,
        signedIn: status === 'signed-in',
        locale,
        messages: m,
      });
      setNotice(
        res.truncated
          ? t(m, 'discussionList.limitExceeded', { max: res.limit })
          : null
      );
    } catch {
      setNotice(t(m, 'discussionList.printFallback'));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    );
    try {
      setNotes(window.localStorage.getItem(NOTES_KEY) ?? '');
    } catch {
      setNotes('');
    }
  }, [locale]);

  const items = useMemo(
    () =>
      ids
        .map((id) => findBaselineItem(id))
        .filter((x): x is UpdateItem => x != null),
    [ids]
  );

  function onClear() {
    if (window.confirm(m.myList.clearConfirm)) clear();
  }

  function onNotes(v: string) {
    setNotes(v);
    try {
      window.localStorage.setItem(NOTES_KEY, v);
    } catch {
      /* ignore */
    }
  }

  if (items.length === 0) {
    return (
      <div className="container-page max-w-2xl py-16">
        <div className="card p-8 text-center">
          <p className="text-lg font-semibold text-ink-900">{m.myList.empty}</p>
          <p className="mt-2 text-sm text-slateish-600">{m.myList.emptyHint}</p>
          <Link href="/cancers" className="btn-primary mt-6">
            {m.cancersIndex.title}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-8 sm:py-10">
      <div className="no-print">
        <p className="label-eyebrow">{m.myList.eyebrow}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-semibold text-ink-950">{m.myList.title}</h1>
          <p className="text-sm tabular-nums text-slateish-500">
            {t(m, 'myList.count', { n: items.length })}
          </p>
        </div>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-slateish-600">
          {m.myList.intro}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => window.print()} className="btn-primary text-[13px]">
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M4.5 6.5V3h7v3.5M4.5 11.5h7M3 6.5h10v5.5H3z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
            </svg>
            {m.myList.print}
          </button>
          <button
            type="button"
            onClick={onExportList}
            disabled={busy}
            className="btn border border-slateish-300 bg-white px-4 py-2.5 text-[13px] text-ink-800 hover:border-navy-300 hover:bg-navy-50 disabled:opacity-60"
          >
            {busy ? m.discussionList.generating : m.discussionList.exportList}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="btn border border-slateish-300 bg-white px-4 py-2.5 text-[13px] text-slateish-600 hover:border-red-300 hover:text-red-700"
          >
            {m.myList.clearAll}
          </button>
        </div>
        {upgradeMsg ? (
          <ProUpgradePrompt message={upgradeMsg} />
        ) : null}
        {notice ? (
          <p className="mt-2 text-[12px] font-medium text-[#7a4a12]">{notice}</p>
        ) : null}
        <Link href="/safety" className="no-print link-underline mt-3 inline-block text-[13px]">
          {m.nav.safety} →
        </Link>
      </div>

      {/* Saved records */}
      <ul className="mt-6 grid gap-3">
        {items.map((item) => (
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
                {m.myList.remove}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Printable appointment-prep material */}
      <section className="mt-10 rounded-card border border-slateish-200 bg-white p-5 sm:p-6">
        <p className="text-xs text-slateish-400">{today ? t(m, 'myList.printedOn', { date: today }) : ''}</p>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-slateish-600">
          {m.myList.printIntro}
        </p>

        <h2 className="mt-6 text-sm font-semibold text-ink-900">
          {m.myList.questionsTitle}
        </h2>
        <p className="mt-1 text-sm text-slateish-600">{m.myList.questionsIntro}</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-800">
          {m.myList.questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ol>

        <h2 className="mt-6 text-sm font-semibold text-ink-900">
          {m.myList.notesLabel}
        </h2>
        <textarea
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
          rows={4}
          placeholder="…"
          className="no-print mt-2 w-full rounded-lg border border-slateish-300 bg-white p-3 text-sm text-ink-900 focus:border-navy-400 focus:outline-none focus:ring-1 focus:ring-navy-400"
        />
        <p className="print:block hidden whitespace-pre-wrap text-sm leading-relaxed text-ink-800">
          {notes}
        </p>

        <p className="mt-6 border-t border-slateish-100 pt-4 text-xs leading-relaxed text-slateish-400">
          {m.myList.disclaimerPrint}
        </p>
      </section>
    </div>
  );
}
