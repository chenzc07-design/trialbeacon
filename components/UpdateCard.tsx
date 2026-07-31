'use client';

import Link from 'next/link';
import type { UpdateItem, Region } from '@/lib/types';
import { SOURCES } from '@/lib/sources';
import { useI18n } from './I18nProvider';
import {
  RegionBadge,
  SourceBadge,
  TypeBadge,
  PhaseBadge,
  StatusBadge,
  ChangeBadge,
} from './badges';
import { SaveToListButton } from './SaveToListButton';

function formatDate(iso: string, locale: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function UpdateCard({
  item,
  changeKind,
}: {
  item: UpdateItem;
  changeKind?: 'new' | 'updated' | 'closed';
}) {
  const { locale, messages: m } = useI18n();
  const source = SOURCES[item.source];
  const regions: Region[] = item.regions?.length ? item.regions : [item.region];

  return (
    <article className="card-interactive flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-1.5">
        {regions.map((r) => (
          <RegionBadge key={r} region={r} />
        ))}
        <SourceBadge source={item.source} />
        <TypeBadge type={item.type} />
        {changeKind ? <ChangeBadge kind={changeKind} /> : null}
      </div>

      <h3 className="text-[15px] font-medium leading-snug text-ink-900">
        <Link
          href={`/trials/${item.id}${
            item.cancers[0] && item.cancers[0] !== 'all'
              ? `?from=${item.cancers[0]}`
              : ''
          }`}
          className="transition-colors hover:text-navy-700"
          aria-label={`${m.common.details}: ${item.title}`}
        >
          {item.title}
        </Link>
      </h3>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <PhaseBadge phase={item.phase} />
          <StatusBadge status={item.status} />
          <span className="text-xs tabular-nums text-slateish-500">
            {item.date ? formatDate(item.date, locale) : m.common.continuouslyUpdated}
          </span>
        </div>

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
}: {
  items: UpdateItem[];
  changeKind?: 'new' | 'updated' | 'closed';
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
    <div className="grid gap-3">
      {items.map((item) => (
        <UpdateCard key={item.id} item={item} changeKind={changeKind} />
      ))}
    </div>
  );
}
