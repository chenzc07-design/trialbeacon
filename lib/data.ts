import type { UpdateItem, Region, ChangeKind } from './types';
import { TRIAL_SNAPSHOT, SNAPSHOT_DATE } from './data/trials';
import { REGIONAL_SOURCES } from './data/regional';
import { CANCERS, getCancer } from './cancers';
import { fetchCtgov, isOpenStatus } from './ctgov';

export { SNAPSHOT_DATE };

/** Every record known to the offline baseline. */
export function allBaseline(): UpdateItem[] {
  return [...TRIAL_SNAPSHOT, ...REGIONAL_SOURCES];
}

export function matchesCancer(item: UpdateItem, slug: string): boolean {
  if (slug === 'all') return true;
  return item.cancers.includes(slug) || item.cancers.includes('all');
}

export function sortByDate(items: UpdateItem[]): UpdateItem[] {
  return [...items].sort((a, b) => {
    if (a.date === b.date) return a.title.localeCompare(b.title);
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date < b.date ? 1 : -1;
  });
}

function dedupe(items: UpdateItem[]): UpdateItem[] {
  const seen = new Map<string, UpdateItem>();
  for (const item of items) {
    const existing = seen.get(item.id);
    if (!existing) {
      seen.set(item.id, item);
    } else {
      // Merge cancer tags so a pan-tumour trial shows under each relevant type.
      seen.set(item.id, {
        ...existing,
        cancers: Array.from(new Set([...existing.cancers, ...item.cancers])),
      });
    }
  }
  return Array.from(seen.values());
}

export interface FeedResult {
  items: UpdateItem[];
  /** true when live registry data was used, false when the baseline was served */
  live: boolean;
  fetchedAt: string;
}

/**
 * Returns trial records for a cancer type. Attempts the live
 * ClinicalTrials.gov API first, falls back to the bundled baseline.
 */
export async function getCancerFeed(
  slug: string,
  opts: { afterCareOnly?: boolean; limit?: number } = {}
): Promise<FeedResult> {
  const cancer = getCancer(slug);
  const fetchedAt = new Date().toISOString();
  const limit = opts.limit ?? 40;

  let live = false;
  let trials: UpdateItem[] = [];

  if (cancer) {
    try {
      trials = await fetchCtgov(
        {
          cond: cancer.ctgovCond,
          term: opts.afterCareOnly ? cancer.afterCareTerms : undefined,
          pageSize: limit,
          status: [
            'RECRUITING',
            'NOT_YET_RECRUITING',
            'ENROLLING_BY_INVITATION',
            'ACTIVE_NOT_RECRUITING',
          ],
        },
        [slug]
      );
      live = trials.length > 0;
    } catch {
      live = false;
    }
  }

  if (!live) {
    trials = TRIAL_SNAPSHOT.filter((i) => matchesCancer(i, slug));
  }

  const regional = REGIONAL_SOURCES.filter((i) => matchesCancer(i, slug));
  let items = dedupe([...trials, ...regional]);
  if (opts.afterCareOnly) items = items.filter((i) => i.afterCare);

  return { items: sortByDate(items), live, fetchedAt };
}

/** Pan-cancer feed used by the After Conservative / Palliative Care view. */
export async function getAfterCareFeed(limit = 60): Promise<FeedResult> {
  const fetchedAt = new Date().toISOString();
  let live = false;
  let trials: UpdateItem[] = [];

  try {
    const results = await Promise.all(
      CANCERS.slice(0, 5).map((c) =>
        fetchCtgov(
          {
            cond: c.ctgovCond,
            term: c.afterCareTerms,
            pageSize: 12,
            status: ['RECRUITING', 'NOT_YET_RECRUITING', 'ACTIVE_NOT_RECRUITING'],
          },
          [c.slug]
        ).catch(() => [] as UpdateItem[])
      )
    );
    trials = results.flat();
    live = trials.length > 0;
  } catch {
    live = false;
  }

  if (!live) {
    trials = TRIAL_SNAPSHOT.filter((i) => i.afterCare);
  }

  const regional = REGIONAL_SOURCES.filter((i) => i.afterCare);
  const items = dedupe([...trials, ...regional]).filter((i) => i.afterCare);
  return { items: sortByDate(items).slice(0, limit), live, fetchedAt };
}

/**
 * Classifies a record for the Change Tracker.
 * - new: first posted within the window
 * - closed: status indicates the record is no longer open to enrolment
 * - updated: the official record was revised within the window
 */
export function classifyChange(
  item: UpdateItem,
  windowStart: string
): ChangeKind {
  if (!item.date) return null;
  if (item.date < windowStart) return null;
  if (item.firstPosted && item.firstPosted >= windowStart) return 'new';
  const closed = /completed|terminated|withdrawn|suspended/i.test(
    item.status ?? ''
  );
  if (closed) return 'closed';
  return 'updated';
}

export function windowStartISO(days: number, from?: string): string {
  const base = from ? new Date(from) : new Date();
  const d = new Date(base.getTime() - days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

export interface ChangeGroup {
  kind: Exclude<ChangeKind, null>;
  items: UpdateItem[];
}

export async function getChangeTracker(days: number): Promise<{
  groups: ChangeGroup[];
  live: boolean;
  windowStart: string;
  total: number;
}> {
  let live = false;
  let pool: UpdateItem[] = [];

  try {
    const results = await Promise.all(
      CANCERS.map((c) =>
        fetchCtgov(
          {
            cond: c.ctgovCond,
            pageSize: 15,
            updatedFrom: windowStartISO(days),
          },
          [c.slug]
        ).catch(() => [] as UpdateItem[])
      )
    );
    pool = dedupe(results.flat());
    live = pool.length > 0;
  } catch {
    live = false;
  }

  // Reference point: today for live data, the snapshot date for baseline data.
  const reference = live ? undefined : SNAPSHOT_DATE;
  if (!live) pool = TRIAL_SNAPSHOT;

  const windowStart = windowStartISO(days, reference);
  const buckets: Record<Exclude<ChangeKind, null>, UpdateItem[]> = {
    new: [],
    updated: [],
    closed: [],
  };

  for (const item of pool) {
    const kind = classifyChange(item, windowStart);
    if (kind) buckets[kind].push(item);
  }

  const groups: ChangeGroup[] = (['new', 'updated', 'closed'] as const)
    .map((kind) => ({ kind, items: sortByDate(buckets[kind]) }))
    .filter((g) => g.items.length > 0);

  return {
    groups,
    live,
    windowStart,
    total: groups.reduce((n, g) => n + g.items.length, 0),
  };
}

/** Simple, transparent keyword search over titles and identifiers. */
export function searchBaseline(query: string, region?: Region): UpdateItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  return sortByDate(
    allBaseline().filter((item) => {
      if (region && item.region !== region) return false;
      const haystack = `${item.title} ${item.id} ${item.cancers.join(' ')} ${
        item.phase ?? ''
      } ${item.status ?? ''}`.toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    })
  );
}

/**
 * Counts per region bucket. A study recruiting in several regions is counted
 * in each of them, which is what a person scanning the tabs expects.
 */
export function countsByRegion(items: UpdateItem[]): Record<Region, number> {
  const acc: Record<Region, number> = { US: 0, EU: 0, CN: 0, OTHER: 0 };
  for (const item of items) {
    const buckets = item.regions?.length ? item.regions : [item.region];
    for (const r of buckets) acc[r] += 1;
  }
  return acc;
}

/** True when the record belongs to the given region bucket. */
export function inRegion(item: UpdateItem, region: Region): boolean {
  return item.regions?.length
    ? item.regions.includes(region)
    : item.region === region;
}

export interface FilterOptions {
  /** Only records a person could still potentially enter. */
  openOnly?: boolean;
  /** Phase labels to keep, e.g. ["Phase 3"]. Empty = all. */
  phases?: string[];
  /** Region bucket to keep. */
  region?: Region;
}

/** Distinct phase labels present in a result set, in a sensible order. */
export function availablePhases(items: UpdateItem[]): string[] {
  const set = new Set<string>();
  for (const i of items) if (i.phase) set.add(i.phase);
  const order = [
    'Early Phase 1',
    'Phase 1',
    'Phase 1/2',
    'Phase 2',
    'Phase 2/3',
    'Phase 3',
    'Phase 4',
    'Not applicable',
  ];
  return Array.from(set).sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

/**
 * Applies the list filters. Records that carry no status (curated regulator
 * and guideline pages, which are continuously maintained) are never removed
 * by the "open only" filter — they are not enrolment records.
 */
export function applyFilters(
  items: UpdateItem[],
  opts: FilterOptions
): UpdateItem[] {
  return items.filter((item) => {
    if (opts.region && !inRegion(item, opts.region)) return false;
    if (opts.openOnly && item.type === 'trial') {
      // Prefer the raw code; fall back to the display label for baseline rows.
      const open = item.statusCode
        ? isOpenStatus(item.statusCode)
        : /recruiting|enrolling/i.test(item.status ?? '');
      if (!open) return false;
    }
    if (opts.phases?.length) {
      if (!item.phase || !opts.phases.includes(item.phase)) return false;
    }
    return true;
  });
}

/** Looks up a single record in the offline baseline by id (NCT number). */
export function findBaselineItem(id: string): UpdateItem | undefined {
  return allBaseline().find((i) => i.id === id);
}

/** Per-cancer counts computed from the baseline, used for home page cards. */
export function baselineCancerStats() {
  const base = allBaseline();
  return CANCERS.map((c) => {
    const items = base.filter((i) => matchesCancer(i, c.slug));
    return {
      ...c,
      total: items.length,
      afterCare: items.filter((i) => i.afterCare).length,
      regions: countsByRegion(items),
    };
  });
}
