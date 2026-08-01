'use client';

import { useMemo, useState } from 'react';
import type { UpdateItem, Region } from '@/lib/types';
import { UpdateList } from './UpdateCard';
import { useI18n } from './I18nProvider';
import { t } from '@/lib/i18n-runtime';
import { KEYWORDS, KEYWORD_LABELS, KEYWORD_HEADING } from '@/lib/keywords';

const REGION_ORDER: Region[] = ['US', 'EU', 'CN', 'OTHER'];

/** True when a person could still potentially enter the study. */
function isOpen(item: UpdateItem): boolean {
  if (item.type !== 'trial') return true; // guideline / regulator pages
  const s = `${item.statusCode ?? ''} ${item.status ?? ''}`;
  return /RECRUITING|NOT_YET_RECRUITING|ENROLLING|recruiting|enrolling/i.test(s);
}

function inRegion(item: UpdateItem, region: Region): boolean {
  return item.regions?.length
    ? item.regions.includes(region)
    : item.region === region;
}

const PHASE_ORDER = [
  'Early Phase 1',
  'Phase 1',
  'Phase 1/2',
  'Phase 2',
  'Phase 2/3',
  'Phase 3',
  'Phase 4',
  'Not applicable',
];

/**
 * Region tabs plus the two filters people actually reach for: whether a study
 * is still open, and which phase it is in. Filtering happens client-side
 * because the whole result set is already on the page — a round trip would be
 * slower and would lose scroll position.
 */
export function RegionTabs({ items }: { items: UpdateItem[] }) {
  const { locale, messages: m } = useI18n();
  const [tab, setTab] = useState<Region | 'ALL'>('ALL');
  const [openOnly, setOpenOnly] = useState(false);
  const [phase, setPhase] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);

  const keywordLabels = KEYWORD_LABELS[locale] ?? KEYWORD_LABELS.en;

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      ALL: items.length,
      US: 0,
      EU: 0,
      CN: 0,
      OTHER: 0,
    };
    for (const i of items) {
      const buckets = i.regions?.length ? i.regions : [i.region];
      for (const r of buckets) c[r] += 1;
    }
    return c;
  }, [items]);

  const phases = useMemo(() => {
    const set = new Set<string>();
    for (const i of items) if (i.phase) set.add(i.phase);
    return Array.from(set).sort((a, b) => {
      const ia = PHASE_ORDER.indexOf(a);
      const ib = PHASE_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [items]);

  const visible = useMemo(() => {
    return items.filter((i) => {
      if (tab !== 'ALL' && !inRegion(i, tab)) return false;
      if (openOnly && !isOpen(i)) return false;
      if (phase && i.phase !== phase) return false;
      return true;
    });
  }, [items, tab, openOnly, phase]);

  // Only offer region tabs that actually contain something.
  const tabs: { key: Region | 'ALL'; label: string }[] = [
    { key: 'ALL', label: m.region.all },
    ...REGION_ORDER.filter((r) => counts[r] > 0).map((r) => ({
      key: r,
      label: m.region[r],
    })),
  ];

  const filtered = openOnly || phase !== '' || keywords.length > 0;

  function toggleKeyword(id: string) {
    setKeywords((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  }

  return (
    <div>
      <div
        className="flex gap-1 overflow-x-auto rounded-xl border border-slateish-200 bg-white p-1"
        role="tablist"
        aria-label={m.filters.heading}
      >
        {tabs.map((tb) => (
          <button
            key={tb.key}
            role="tab"
            aria-selected={tab === tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors ${
              tab === tb.key
                ? 'bg-navy-800 text-white'
                : 'text-slateish-600 hover:bg-slateish-100'
            }`}
          >
            {tb.label}
            <span
              className={`rounded-md px-1.5 py-0.5 text-[11px] tabular-nums leading-none ${
                tab === tb.key
                  ? 'bg-white/15 text-white'
                  : 'bg-slateish-100 text-slateish-500'
              }`}
            >
              {counts[tb.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Secondary filters */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3">
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slateish-600">
          <input
            type="checkbox"
            checked={openOnly}
            onChange={(e) => setOpenOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slateish-300 text-navy-700 focus:ring-navy-500"
          />
          <span title={m.filters.openOnlyHint}>{m.filters.openOnly}</span>
        </label>

        {phases.length > 1 ? (
          <label className="flex items-center gap-2 text-[13px] text-slateish-600">
            <span>{m.filters.phase}</span>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              className="rounded-lg border border-slateish-300 bg-white px-2.5 py-1.5 text-[13px] text-ink-900 focus:border-navy-400 focus:outline-none focus:ring-1 focus:ring-navy-400"
            >
              <option value="">{m.filters.allPhases}</option>
              {phases.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <span className="text-xs tabular-nums text-slateish-500">
          {t(m, 'filters.showing', { n: visible.length, total: items.length })}
        </span>

        {filtered ? (
          <button
            type="button"
            onClick={() => {
              setOpenOnly(false);
              setPhase('');
              setKeywords([]);
            }}
            className="text-xs font-medium text-navy-700 underline-offset-2 hover:underline"
          >
            {m.filters.clear}
          </button>
        ) : null}
      </div>

      {/* Transparent keyword highlight — never removes a record, only marks
          the matching words inside each title. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2">
        <span className="text-[12px] font-medium text-slateish-500">
          {KEYWORD_HEADING[locale] ?? KEYWORD_HEADING.en}:
        </span>
        {KEYWORDS.map((k) => {
          const active = keywords.includes(k.id);
          return (
            <button
              key={k.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggleKeyword(k.id)}
              className={`chip transition-colors ${
                active
                  ? 'border-[#e0a94a] bg-[#fdeccb] text-[#7a4a12]'
                  : 'border-slateish-200 bg-white text-slateish-600 hover:border-navy-300'
              }`}
            >
              {keywordLabels[k.id] ?? k.id}
            </button>
          );
        })}
      </div>

      <div className="mt-4" role="tabpanel">
        {visible.length === 0 && items.length > 0 ? (
          <div className="card px-6 py-14 text-center">
            <p className="text-sm font-medium text-ink-800">{m.filters.noMatch}</p>
            <p className="mt-1 text-sm text-slateish-500">{m.filters.noMatchHint}</p>
          </div>
        ) : (
          <UpdateList items={visible} keywords={keywords} />
        )}
      </div>
    </div>
  );
}
