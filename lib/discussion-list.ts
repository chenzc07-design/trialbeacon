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
    status: item.status,
    phase: item.phase,
    date: item.date ?? null,
    url: item.url,
  };
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
}

/**
 * Cap a set of records by the visitor's auth state, store them for the
 * printable page, and open that page in a new tab. Returns what happened so
 * callers can surface a "only the first N were included" notice.
 *
 * Client-only (touches window / sessionStorage). Safe to call from any
 * event handler in a browser context.
 */
export function launchDiscussionList(
  items: UpdateItem[],
  opts: { signedIn: boolean }
): LaunchResult {
  const limit = opts.signedIn ? SIGNED_IN_EXPORT_LIMIT : FREE_EXPORT_LIMIT;
  const truncated = items.length > limit;
  const capped = truncated ? items.slice(0, limit) : items;
  const payload = capped.map(buildDiscussionItem);

  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(
        DISCUSSION_STORAGE_KEY,
        JSON.stringify(payload)
      );
    } catch {
      /* storage unavailable — the print page will simply show an empty state */
    }
    try {
      window.open('/discussion-list', '_blank', 'noopener,noreferrer');
    } catch {
      /* popup blocked — ignore */
    }
  }

  return { limit, truncated, count: payload.length };
}
