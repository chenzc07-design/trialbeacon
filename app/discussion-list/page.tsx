'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/components/I18nProvider';
import { t } from '@/lib/i18n-runtime';
import {
  DISCUSSION_STORAGE_KEY,
  type DiscussionItem,
  discussionFilename,
  regionDisplay,
  localizeStatus,
  guideTypeLabel,
} from '@/lib/discussion-list';
import { DiscussionPrompt } from '@/components/DiscussionPrompt';

/** Locale-neutral YYYY-MM-DD (matches the printable spec). */
function fmtYMD(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

function fmtYMDfromISO(iso?: string): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return fmtYMD(d);
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

  const ymd = fmtYMD(new Date());

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
          {m.discussionList.footer}
        </span>
      </div>

      {/* Repeated on every printed page (position: fixed in print).
          Uses a <div>, not <header>, so the global print rule that hides
          the site chrome does not remove it. */}
      <div className="dl-header">
        <p className="dl-header-brand">{m.discussionList.pageHeaderBrand}</p>
        <p className="dl-header-tag">{m.discussionList.pageHeaderTag}</p>
      </div>

      <div className="dl-body">
        <h1 className="dl-title">{m.discussionList.title}</h1>
        <p className="dl-intro">
          <span className="dl-intro-h">{m.discussionList.introHeading}</span>
          {m.discussionList.introBody}
        </p>
        <div className="dl-meta-top">
          <span>
            {t(m, 'discussionList.generatedDate', { date: ymd })}
          </span>
          <span>
            {t(m, 'discussionList.recordCount', { n: items.length })}
          </span>
        </div>

        <ol className="dl-items">
          {items.map((it) => {
            const isTrial = it.recordType === 'trial';
            const tag = isTrial
              ? m.discussionList.typeTrial
              : m.discussionList.typeGuideline;
            const status = localizeStatus(it.status, locale);
            const region = regionDisplay(it, m);
            const dateStr =
              fmtYMDfromISO(it.firstPosted) ??
              fmtYMDfromISO(it.date ?? undefined);
            const gType = guideTypeLabel(it.guideKind, m);

            return (
              <li
                key={it.id}
                className={
                  isTrial ? 'dl-item dl-item-trial' : 'dl-item dl-item-guide'
                }
              >
                <div className="dl-rectag">{tag}</div>
                <div className="dl-block">
                  <div className="dl-row dl-row-title">
                    <span className="dl-k">
                      {m.discussionList.fieldTitle}：
                    </span>
                  </div>
                  <div className="dl-title-val">{it.title}</div>

                  <div className="dl-row">
                    <span className="dl-k">
                      {m.discussionList.fieldSource}：
                    </span>
                    <span className="dl-source">{it.source}</span>
                  </div>

                  {isTrial ? (
                    <>
                      <div className="dl-row">
                        <span className="dl-k">
                          {m.discussionList.fieldId}：
                        </span>
                        <span className="dl-id">{it.id}</span>
                      </div>
                      <div className="dl-row">
                        <span className="dl-k">
                          {m.discussionList.fieldRegion}：
                        </span>
                        <span>{region}</span>
                      </div>
                      {status && (
                        <div className="dl-row">
                          <span className="dl-k">
                            {m.discussionList.fieldStatus}：
                          </span>
                          <span>{status}</span>
                        </div>
                      )}
                      {dateStr && (
                        <div className="dl-row">
                          <span className="dl-k">
                            {m.discussionList.fieldDate}：
                          </span>
                          <span>{dateStr}</span>
                        </div>
                      )}
                      <div className="dl-note-inline">
                        {m.discussionList.trialNote}
                      </div>
                      <div className="dl-verify">
                        {m.discussionList.verifyById}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="dl-row">
                        <span className="dl-k">
                          {m.discussionList.fieldGuideType}：
                        </span>
                        <span>{gType}</span>
                      </div>
                      <div className="dl-note-inline">
                        {m.discussionList.guideNote}
                      </div>
                    </>
                  )}

                  <div className="dl-link-muted">
                    <span className="dl-k">
                      {m.discussionList.fieldLink}：
                    </span>
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dl-link"
                    >
                      {it.url}
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <DiscussionPrompt />
      </div>

      {/* Fixed footer disclaimer on every printed page (uses a <div>,
          not <footer>, so the global print-chrome rule keeps it). */}
      <div className="dl-footer">{m.discussionList.footer}</div>
    </main>
  );
}
