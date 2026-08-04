// Helpers for the neutral "doctor discussion list" export.
//
// This module ONLY organises public official records into a printable list.
// It never ranks, recommends, scores, interprets, or adds any analysis. The
// exported fields are limited to what the source already publishes: title,
// source, region, status/phase/date, and the original link.

import type { Region, UpdateItem } from './types';
import { SOURCES } from './sources';
import type { Locale } from './i18n-runtime';

/** The minimal, source-faithful shape stored for the printable list. */
export interface DiscussionItem {
  id: string;
  /** Official title, reproduced verbatim. */
  title: string;
  /** Resolved source label, e.g. "ClinicalTrials.gov". */
  source: string;
  region: Region;
  /** All region buckets the record covers, when known. */
  regions?: Region[];
  status?: string;
  phase?: string;
  /** ISO date of the most recent official update, or null. */
  date: string | null;
  /** Direct link to the original official page. */
  url: string;
}

export const DISCUSSION_STORAGE_KEY = 'tb_discussion_list';

/** Cap for visitors who are not signed in (per the product spec). */
export const FREE_EXPORT_LIMIT = 10;
/** Cap for signed-in users (generous; the list is meant to be short). */
export const SIGNED_IN_EXPORT_LIMIT = 50;

/** Map an official record into the export shape. No transformation of meaning. */
export function buildDiscussionItem(item: UpdateItem): DiscussionItem {
  return {
    id: item.id,
    title: item.title,
    source: SOURCES[item.source]?.label ?? item.source,
    region: item.region,
    regions: item.regions,
    status: item.status,
    phase: item.phase,
    date: item.date ?? null,
    url: item.url,
  };
}

/** Format the region coverage for the list, using all known buckets. */
export function regionLabel(item: {
  region: Region;
  regions?: Region[];
}): string {
  const buckets = item.regions?.length ? item.regions : [item.region];
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const r of buckets) {
    const label = regionShort(r);
    if (seen.has(label)) continue;
    seen.add(label);
    labels.push(label);
  }
  return labels.join(' / ');
}

/** Short region label used on the list, matching the spec (US / EU / China). */
export function regionShort(region: Region): string {
  if (region === 'CN') return 'China';
  if (region === 'EU') return 'EU';
  if (region === 'US') return 'US';
  return 'Other';
}

/** Build the suggested download filename for the current date + locale. */
export function discussionFilename(locale: Locale): string {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const stamp = `${y}${mo}${day}`;
  const base = locale === 'zh' ? '沟通清单' : 'discussion-list';
  return `${base}-${stamp}.pdf`;
}

export interface LaunchResult {
  limit: number;
  truncated: boolean;
  count: number;
  /** True when the browser blocked the new window (popup blockers). */
  blocked: boolean;
}

/**
 * Open the printable discussion-list page in a new tab. The capped records are
 * passed in the URL (?d=…) so the page works reliably across tabs, in private
 * mode, and when sessionStorage is unavailable — no fragile storage hand-off.
 *
 * Returns what happened so callers can surface a "only the first N were
 * included" or "popup blocked" notice. Client-only (touches window). Safe to
 * call from any user-gesture event handler.
 */
export function openDiscussionListPrint(
  items: UpdateItem[],
  opts: { signedIn: boolean }
): LaunchResult {
  const limit = opts.signedIn ? SIGNED_IN_EXPORT_LIMIT : FREE_EXPORT_LIMIT;
  const truncated = items.length > limit;
  const capped = truncated ? items.slice(0, limit) : items;
  const payload = capped.map(buildDiscussionItem);

  if (typeof window === 'undefined') {
    return { limit, truncated, count: payload.length, blocked: false };
  }

  const encoded = encodeURIComponent(JSON.stringify(payload));
  const url = `/discussion-list?d=${encoded}`;

  let blocked = false;
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) blocked = true;
  } catch {
    blocked = true;
  }

  // Keep a sessionStorage fallback for any old bookmarks of the bare route.
  try {
    window.sessionStorage.setItem(
      DISCUSSION_STORAGE_KEY,
      JSON.stringify(payload)
    );
  } catch {
    /* storage unavailable — the URL param is the source of truth anyway */
  }

  return { limit, truncated, count: payload.length, blocked };
}
