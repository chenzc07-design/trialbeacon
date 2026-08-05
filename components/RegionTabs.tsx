'use client';

import { useMemo, useState } from 'react';
import type { UpdateItem, Region } from '@/lib/types';
import { UpdateList } from './UpdateCard';
import { useI18n } from './I18nProvider';
import { useAuth } from './AuthProvider';
import { t } from '@/lib/i18n-runtime';
import {
  FREE_EXPORT_LIMIT,
  SIGNED_IN_EXPORT_LIMIT,
  openDiscussionListPrint,
} from '@/lib/discussion-list';
import { downloadDiscussionListPdf } from '@/lib/discussion-pdf';
import { requestQuota } from '@/lib/quota-client';
import { ProUpgradePrompt } from './ProUpgradePrompt';
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

type SortKey = 'recent' | 'title' | 'phase';

function phaseRank(p?: string): number {
  const i = PHASE_ORDER.indexOf(p ?? '');
  return i === -1 ? PHASE_ORDER.length : i;
}

/**
 * Region tabs plus the filters people actually reach for: whether a study is
 * still open, which phase it is in, and whether the official wording places it
 * in an advanced / later-line setting. Filtering happens client-side because
 * the whole result set is already on the page — a round trip would be slower
 * and would lose scroll position.
 *
 * Default order is most-recently-updated first, so the top of the list is
 * always the part of the record set that moved last.
 */
export function RegionTabs({
  items,
  selectable = false,
}: {
  items: UpdateItem[];
  selectable?: boolean;
}) {
  const { locale, messages: m } = useI18n();
  const { status } = useAuth();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);

  // --- daily quota status is now a static hint beside limitNote;
  //     `requestQuota` effect removed — the /pro link is always visible. ---

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** Build the list from the selected records (mode A) or the current
   *  filtered view (mode B), then download a real PDF directly. Falls back to
   *  the printable page if the in-browser PDF engine is unavailable. The
   *  daily / record quota is checked (and consumed) before any generation. */
  async function onDownload(chosen: UpdateItem[]) {
    if (chosen.length === 0) return;
    setBusy(true);
    setUpgradeMsg(null);
    try {
      const q = await requestQuota(chosen.length, true);
      if (!q.allowed) {
        setUpgradeMsg(
          q.reason === 'genLimit'
            ? t(m, 'pricing.freeListTooLarge', { max: q.genLimit })
            : m.pricing.freeDailyUsed
        );
        return;
      }
      ping('select_generate');
      const res = await downloadDiscussionListPdf({
        items: chosen,
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
      const res = openDiscussionListPrint(chosen, {
        signedIn: status === 'signed-in',
      });
      setNotice(
        res.blocked
          ? t(m, 'discussionList.popupBlocked')
          : t(m, 'discussionList.printFallback')
      );
    } finally {
      setBusy(false);
    }
  }

  /** Open the printable page in a new tab (secondary option). Gated the same
   *  way as the direct download so the free daily limit is respected. */
  function onOpenPrint(chosen: UpdateItem[]) {
    if (chosen.length === 0) return;
    setUpgradeMsg(null);
    requestQuota(chosen.length, true)
      .then((q) => {
        if (!q.allowed) {
          setUpgradeMsg(
            q.reason === 'genLimit'
              ? t(m, 'pricing.freeListTooLarge', { max: q.genLimit })
              : m.pricing.freeDailyUsed
          );
          return;
        }
        ping('select_generate');
        const res = openDiscussionListPrint(chosen, {
          signedIn: status === 'signed-in',
        });
        setNotice(
          res.blocked
            ? t(m, 'discussionList.popupBlocked')
            : res.truncated
              ? t(m, 'discussionList.limitExceeded', { max: res.limit })
              : null
        );
      })
      .catch(() => {
        const res = openDiscussionListPrint(chosen, {
          signedIn: status === 'signed-in',
        });
        setNotice(
          res.blocked ? t(m, 'discussionList.popupBlocked') : null
        );
      });
  }

  /** Fire an anonymous usage event (no health info). Best-effort. */
  function ping(event: string) {
    fetch('/api/stats', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event }),
    }).catch(() => undefined);
  }
  const [tab, setTab] = useState<Region | 'ALL'>('ALL');
  const [openOnly, setOpenOnly] = useState(false);
  const [afterCareOnly, setAfterCareOnly] = useState(false);
  const [phase, setPhase] = useState<string>('');
  const [sort, setSort] = useState<SortKey>('recent');
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

  // Only worth offering the after-care filter when the set is actually mixed —
  // on the After Care view every record already qualifies.
  const mixedAfterCare = useMemo(() => {
    let yes = 0;
    for (const i of items) if (i.afterCare) yes += 1;
    return yes > 0 && yes < items.length;
  }, [items]);

  const visible = useMemo(() => {
    const kept = items.filter((i) => {
      if (tab !== 'ALL' && !inRegion(i, tab)) return false;
      if (openOnly && !isOpen(i)) return false;
      if (afterCareOnly && !i.afterCare) return false;
      if (phase && i.phase !== phase) return false;
      return true;
    });
    const sorted = [...kept];
    if (sort === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title, locale));
    } else if (sort === 'phase') {
      sorted.sort((a, b) => {
        const d = phaseRank(a.phase) - phaseRank(b.phase);
        return d !== 0 ? d : a.title.localeCompare(b.title, locale);
      });
    } else {
      // Most recent first. Records with no date are "continuously updated"
      // live sources; they sit at the end rather than pretending to be new.
      sorted.sort((a, b) => {
        if (a.date === b.date) return a.title.localeCompare(b.title, locale);
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date < b.date ? 1 : -1;
      });
    }
    return sorted;
  }, [items, tab, openOnly, afterCareOnly, phase, sort, locale]);

  // Only currently-visible, checked records count / get exported — a record
  // the user filtered away never leaks into the output.
  const selectedVisible = useMemo(
    () => visible.filter((i) => selectedIds.has(i.id)),
    [visible, selectedIds]
  );

  // Only offer region tabs that actually contain something.
  const tabs: { key: Region | 'ALL'; label: string }[] = [
    { key: 'ALL', label: m.region.all },
    ...REGION_ORDER.filter((r) => counts[r] > 0).map((r) => ({
      key: r,
      label: m.region[r],
    })),
  ];

  const filtered =
    openOnly || afterCareOnly || phase !== '' || keywords.length > 0 || sort !== 'recent';

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

        {mixedAfterCare ? (
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slateish-600">
            <input
              type="checkbox"
              checked={afterCareOnly}
              onChange={(e) => setAfterCareOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slateish-300 text-navy-700 focus:ring-navy-500"
            />
            <span title={m.filters.afterCareOnlyHint}>{m.filters.afterCareOnly}</span>
          </label>
        ) : null}

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

        <label className="flex items-center gap-2 text-[13px] text-slateish-600">
          <span>{m.common.sortBy}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-slateish-300 bg-white px-2.5 py-1.5 text-[13px] text-ink-900 focus:border-navy-400 focus:outline-none focus:ring-1 focus:ring-navy-400"
          >
            <option value="recent">{m.common.sortRecent}</option>
            <option value="title">{m.common.sortTitle}</option>
            <option value="phase">{m.common.sortPhase}</option>
          </select>
        </label>

        <span className="text-xs tabular-nums text-slateish-500">
          {t(m, 'filters.showing', { n: visible.length, total: items.length })}
        </span>

        {filtered ? (
          <button
            type="button"
            onClick={() => {
              setOpenOnly(false);
              setAfterCareOnly(false);
              setPhase('');
              setSort('recent');
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

      {selectable ? (
        <div className="mt-4 rounded-card border border-slateish-200 bg-slateish-50/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-xl">
              <p className="text-[13px] font-semibold text-ink-900">
                {m.discussionList.launcherHeading}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slateish-600">
                {m.discussionList.launcherSub}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-white px-2 py-1 text-xs tabular-nums text-slateish-500">
                {t(m, 'discussionList.selectedCount', { n: selectedVisible.length })}
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set(visible.map((i) => i.id)))}
                disabled={visible.length === 0}
                className="btn border border-slateish-300 bg-white px-3 py-1.5 text-[12px] text-slateish-700 hover:border-navy-300 hover:bg-navy-50 disabled:opacity-50"
              >
                {m.discussionList.selectAll}
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                disabled={selectedIds.size === 0}
                className="btn border border-slateish-300 bg-white px-3 py-1.5 text-[12px] text-slateish-700 hover:border-navy-300 hover:bg-navy-50 disabled:opacity-50"
              >
                {m.discussionList.clearSelection}
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onDownload(selectedVisible)}
              disabled={selectedVisible.length === 0 || busy}
              className="btn-primary text-[13px]"
            >
              {busy ? m.discussionList.generating : m.discussionList.generate}
            </button>
            {selectedVisible.length > 0 ? (
              <button
                type="button"
                onClick={() => onOpenPrint(selectedVisible)}
                disabled={busy}
                className="btn border border-slateish-300 bg-white px-4 py-2.5 text-[13px] text-ink-800 hover:border-navy-300 hover:bg-navy-50"
              >
                {m.discussionList.openPrint}
              </button>
            ) : null}
            {filtered && visible.length > 0 ? (
              <button
                type="button"
                onClick={() => onDownload(visible)}
                disabled={busy}
                className="btn border border-slateish-300 bg-white px-4 py-2.5 text-[13px] text-ink-800 hover:border-navy-300 hover:bg-navy-50"
              >
                {m.discussionList.useFilter}
              </button>
            ) : null}
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-slateish-400">
            {t(m, 'discussionList.limitNote', {
              max:
                status === 'signed-in' ? SIGNED_IN_EXPORT_LIMIT : FREE_EXPORT_LIMIT,
            })}{' '}
            <a href="/pro" className="font-medium text-navy-700 underline underline-offset-2 hover:text-navy-900">
              {m.pricing.nav}
            </a>
          </p>
          {upgradeMsg ? (
            <ProUpgradePrompt message={upgradeMsg} />
          ) : null}
          {notice ? (
            <p className="mt-1 text-[11px] font-medium text-[#7a4a12]">{notice}</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4" role="tabpanel">
        {visible.length === 0 && items.length > 0 ? (
          <div className="card px-6 py-14 text-center">
            <p className="text-sm font-medium text-ink-800">{m.filters.noMatch}</p>
            <p className="mt-1 text-sm text-slateish-500">{m.filters.noMatchHint}</p>
          </div>
        ) : (
          <UpdateList
            items={visible}
            keywords={keywords}
            selectedIds={selectable ? selectedIds : undefined}
            onToggleSelect={selectable ? toggleSelect : undefined}
          />
        )}
      </div>
    </div>
  );
}
