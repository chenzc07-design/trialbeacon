'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { UpdateItem, Region, UpdateType } from '@/lib/types';
import { SOURCES } from '@/lib/sources';
import { SNAPSHOT_DATE } from '@/lib/data/trials';
import { useI18n } from './I18nProvider';
import {
  RegionBadge,
  SourceBadge,
  PhaseBadge,
  StatusBadge,
  ChangeBadge,
} from './badges';
import { SaveToListButton } from './SaveToListButton';
import { buildHighlightRegex } from '@/lib/keywords';

/**
 * The record list exposes exactly two public-facing categories — a clinical
 * trial registration, or an entry point to public guideline / regulatory
 * information. Everything else in `UpdateType` (regulatory, guideline,
 * registry) folds into the second bucket. The colour difference is purely
 * decorative (trial = quiet gray-blue, guideline = quiet gray-green) and never
 * implies one is better or more relevant than the other.
 */
function typeMeta(type: UpdateType, trialLabel: string, guidelineLabel: string) {
  const isTrial = type === 'trial';
  return {
    label: isTrial ? trialLabel : guidelineLabel,
    className: isTrial
      ? 'border-[#c9dcf0] bg-[#eef5fc] text-[#1d4e7e]'
      : 'border-[#cfe0d9] bg-[#eef6f2] text-[#2e5747]',
  };
}

function formatDate(iso: string, locale: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Wraps any keyword matches in the title with a <mark> so a reader can scan
 * which records are advanced / metastatic / later-line / palliative. The text
 * is never altered — only the matching substrings are visually highlighted.
 */
function highlightTitle(title: string, keywords?: string[]) {
  const re = buildHighlightRegex(keywords ?? []);
  if (!re) return title;
  const out: (string | ReactNode)[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(title)) !== null) {
    if (m.index > last) out.push(title.slice(last, m.index));
    out.push(
      <mark
        key={i++}
        className="rounded bg-[#fdeccb] px-0.5 text-[#7a4a12]"
      >
        {m[0]}
      </mark>
    );
    last = m.index + m[0].length;
    if (m[0].length === 0) re.lastIndex++; // guard against zero-width
  }
  if (last < title.length) out.push(title.slice(last));
  return out;
}

export function UpdateCard({
  item,
  changeKind,
  keywords,
  selected,
  onToggleSelect,
}: {
  item: UpdateItem;
  changeKind?: 'new' | 'updated' | 'closed';
  keywords?: string[];
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const { locale, messages: m } = useI18n();
  const source = SOURCES[item.source];
  const regions: Region[] = item.regions?.length ? item.regions : [item.region];
  const type = typeMeta(
    item.type,
    m.discussionList.typeTrial,
    m.discussionList.typeGuideline
  );

  return (
    <article className="card-interactive flex flex-col gap-3 p-5 sm:p-6">
      {/* Top row — region · source · public category (two types only). */}
      <div className="flex flex-wrap items-center gap-1.5">
        {regions.map((r) => (
          <RegionBadge key={r} region={r} />
        ))}
        <SourceBadge source={item.source} />
        <span className={`chip ${type.className}`}>{type.label}</span>
        {changeKind ? <ChangeBadge kind={changeKind} /> : null}
      </div>

      {/* Title — kept to a readable 2–3 lines. */}
      <h3 className="clamp-3 text-base font-semibold leading-snug text-ink-900">
        <Link
          href={`/trials/${item.id}${
            item.cancers[0] && item.cancers[0] !== 'all'
              ? `?from=${item.cancers[0]}`
              : ''
          }`}
          className="transition-colors hover:text-navy-700"
          aria-label={`${m.common.details}: ${item.title}`}
        >
          {highlightTitle(item.title, keywords)}
        </Link>
      </h3>

      {/* Sub-row — Phase · Status · date. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <PhaseBadge phase={item.phase} />
        <StatusBadge status={item.status} />
        <span className="text-xs tabular-nums text-slateish-500">
          {formatDate(SNAPSHOT_DATE, locale)}
        </span>
      </div>

      {/* Bottom row — select (when building a list) · add to follow list · view original. */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slateish-100 pt-3">
        {onToggleSelect ? (
          <label className="flex items-center gap-2 text-[13px] text-slateish-600">
            <input
              type="checkbox"
              checked={!!selected}
              onChange={onToggleSelect}
              className="h-4 w-4 rounded border-slateish-300 text-navy-700 focus:ring-navy-500"
              aria-label={`${m.discussionList.selectRecord}: ${item.title}`}
            />
            <span>{m.discussionList.selectRecord}</span>
          </label>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <SaveToListButton id={item.id} />
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 rounded-lg border border-slateish-300 bg-white px-3 py-1.5 text-xs font-medium text-navy-800 transition-colors hover:border-navy-400 hover:bg-navy-50"
            aria-label={`${source.label} — ${m.common.viewOriginal}`}
          >
            {m.common.viewOriginal}
            <svg
              className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3.5 1.5h7v7M10.5 1.5L1.5 10.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}

export function UpdateList({
  items,
  changeKind,
  keywords,
  selectedIds,
  onToggleSelect,
}: {
  items: UpdateItem[];
  changeKind?: 'new' | 'updated' | 'closed';
  keywords?: string[];
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}) {
  const { messages: m } = useI18n();
  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
        <svg
          className="h-8 w-8 text-slateish-300"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M20 20l-3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <p className="text-sm font-medium text-ink-800">{m.common.noRecordsMatch}</p>
        <p className="max-w-sm text-sm text-slateish-500">
          {m.common.openRegistries}
        </p>
      </div>
    );
  }
  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <UpdateCard
          key={item.id}
          item={item}
          changeKind={changeKind}
          keywords={keywords}
          selected={selectedIds?.has(item.id)}
          onToggleSelect={
            onToggleSelect ? () => onToggleSelect(item.id) : undefined
          }
        />
      ))}
    </div>
  );
}
