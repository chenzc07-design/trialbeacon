'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/components/I18nProvider';
import { t } from '@/lib/i18n-runtime';
import {
  DISCUSSION_STORAGE_KEY,
  type DiscussionItem,
  discussionFilename,
  regionLabel,
} from '@/lib/discussion-list';
import { DiscussionPrompt } from '@/components/DiscussionPrompt';

function fmtDate(iso: string, locale: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Only the source-provided fields, joined — no interpretation. */
function statusLine(it: DiscussionItem, locale: string): string {
  const parts = [
    it.phase,
    it.status,
    it.date ? fmtDate(it.date, locale) : null,
  ].filter(Boolean);
  return parts.join(' · ');
}

export default function DiscussionListPage() {
  const { locale, messages: m } = useI18n();
  // null = still reading storage; [] = empty; populated = records.
  const [items, setItems] = useState<DiscussionItem[] | null>(null);

  useEffect(() => {
    let data: DiscussionItem[] = [];
    try {
      // Primary source: the ?d= URL param (works across tabs / private mode).
      const params = new URLSearchParams(window.location.search);
      const d = params.get('d');
      if (d) {
        const parsed = JSON.parse(decodeURIComponent(d));
        if (Array.isArray(parsed)) data = parsed as DiscussionItem[];
      } else {
        // Fallback for any old bookmarks of the bare route.
        const raw = window.sessionStorage.getItem(DISCUSSION_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) data = parsed as DiscussionItem[];
        }
      }
    } catch {
      data = [];
    }
    setItems(data);
    // Drives the default "Save as PDF" filename in the print dialog.
    document.title = discussionFilename(locale);
  }, [locale]);

  if (items === null) return null;

  if (items.length === 0) {
    return (
      <main className="container-page max-w-3xl py-16">
        <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
          <p className="text-lg font-semibold text-ink-900">
            {m.discussionList.emptyTitle}
          </p>
          <p className="max-w-sm text-sm text-slateish-600">
            {m.discussionList.emptyBody}
          </p>
          <Link href="/cancers" className="btn-primary mt-4">
            {m.discussionList.backLink}
          </Link>
        </div>
      </main>
    );
  }

  const today = new Date().toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="dl-page">
      {/* On-screen only toolbar (hidden when printed). */}
      <div className="dl-toolbar no-print">
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-primary text-[13px]"
        >
          {m.myList.print}
        </button>
        <Link href="/cancers" className="btn border border-slateish-300 bg-white px-4 py-2.5 text-[13px] text-ink-800 hover:border-navy-300 hover:bg-navy-50">
          {m.discussionList.backLink}
        </Link>
        <span className="text-xs text-slateish-500">
          {m.discussionList.footerDisclaimer}
        </span>
      </div>

      {/* Repeated on every printed page (position: fixed in print).
          Uses a <div>, not <header>, so the global print rule that hides
          the site chrome does not remove it. */}
      <div className="dl-header">
        <p className="dl-header-brand">{m.discussionList.header}</p>
        <p className="dl-header-meta">
          {t(m, 'discussionList.generatedOn', { date: today })} ·{' '}
          {t(m, 'discussionList.recordCount', { n: items.length })}
        </p>
      </div>

      <div className="dl-body">
        <h1 className="dl-title">{m.discussionList.title}</h1>
        <p className="dl-subtitle">{m.discussionList.subtitle}</p>

        <ol className="dl-items">
          {items.map((it, idx) => (
            <li key={it.id} className="dl-item">
              <div className="dl-item-head">
                <span className="dl-num">{idx + 1}</span>
                <span className="dl-item-title">{it.title}</span>
              </div>
              <dl className="dl-meta">
                <div className="dl-meta-row">
                  <dt>{m.discussionList.fieldSource}</dt>
                  <dd><span className="whitespace-nowrap">{it.source}</span></dd>
                </div>
                <div className="dl-meta-row">
                  <dt>{m.discussionList.fieldRegion}</dt>
                  <dd>{regionLabel(it)}</dd>
                </div>
                <div className="dl-meta-row">
                  <dt>{m.discussionList.fieldStatus}</dt>
                  <dd>{statusLine(it, locale) || '—'}</dd>
                </div>
                <div className="dl-meta-row">
                  <dt>{m.discussionList.fieldLink}</dt>
                  <dd>
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dl-link"
                    >
                      {it.url}
                    </a>
                    <span className="dl-linkprompt">
                      （{m.discussionList.linkPrompt}）
                    </span>
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>

        <DiscussionPrompt />
      </div>

      {/* Fixed footer disclaimer on every printed page (uses a <div>,
          not <footer>, so the global print-chrome rule keeps it). */}
      <div className="dl-footer">{m.discussionList.footerDisclaimer}</div>
    </main>
  );
}
