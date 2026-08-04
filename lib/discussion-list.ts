// Helpers for the neutral "doctor discussion list" export.
//
// This module ONLY organises public official records into a printable list.
// It never ranks, recommends, scores, interprets, or adds any analysis. The
// exported fields are limited to what the source already publishes.

import type { Region, UpdateItem } from './types';
import { SOURCES } from './sources';
import type { Locale } from './i18n-runtime';
import type { Messages } from './messages/en';
import { summariseCountries } from './regions';

/**
 * The two — and only two — record categories the neutral checklist supports.
 * Every record MUST carry one of these labels so a clinician (and the user)
 * can tell a clinical-trial registration apart from a public guideline or
 * regulatory entry at a glance. Nothing is ever mixed or left unlabelled.
 */
export type RecordType = 'trial' | 'guideline';

/** The kind of a guideline/regulatory entry, drives the "类型" line. */
export type GuideKind = 'guidelines' | 'regulator';

/** The source-faithful shape stored for the printable list. */
export interface DiscussionItem {
  id: string;
  /** Official title, reproduced verbatim. */
  title: string;
  /** Resolved source label, e.g. "ClinicalTrials.gov". */
  source: string;
  /** Required, never-missing category label. */
  recordType: RecordType;
  /** For guideline/regulatory entries: guidelines vs regulator. */
  guideKind?: GuideKind;
  region: Region;
  /** All region buckets the record covers, when known. */
  regions?: Region[];
  status?: string;
  phase?: string;
  /** Study type as published, e.g. "Interventional". */
  studyType?: string;
  /** Target enrolment count as published. */
  enrollment?: number;
  /** ISO date the record was first posted, when known. */
  firstPosted?: string;
  /** Recruiting countries as published. */
  countries?: string[];
  /** Whether the official record lists a public contact. */
  hasPublicContact?: boolean;
  /** Reserved for a future "pro" report: lead sponsor name. */
  sponsor?: string;
  /** Reserved for a future "pro" report: interventions as published. */
  interventions?: string[];
  /** Reserved for a future "pro" report: verbatim eligibility criteria. */
  eligibility?: string;
  /** Reserved for a future "pro" report: published age range. */
  ageRange?: string;
  /** Reserved for a future "pro" report: published sex eligibility. */
  sex?: string;
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
  const meta = SOURCES[item.source];
  const recordType: RecordType =
    item.type === 'regulatory' || item.type === 'guideline'
      ? 'guideline'
      : 'trial';
  const guideKind: GuideKind | undefined =
    meta?.kind === 'guidelines' || meta?.kind === 'regulator'
      ? meta.kind
      : undefined;
  return {
    id: item.id,
    title: item.title,
    source: meta?.label ?? item.source,
    recordType,
    guideKind,
    region: item.region,
    regions: item.regions,
    status: item.status,
    phase: item.phase,
    studyType: item.studyType,
    enrollment: item.enrollment,
    firstPosted: item.firstPosted,
    countries: item.countries,
    hasPublicContact: item.hasPublicContact,
    // Pro-only fields: pass through when available, but the free UI does not
    // render them yet.
    sponsor: item.sponsor,
    interventions: item.interventions,
    eligibility: item.eligibility,
    ageRange: item.ageRange,
    sex: item.sex,
    date: item.date ?? null,
    url: item.url,
  };
}

/** Localised "类型" line for a guideline/regulatory entry. */
export function guideTypeLabel(
  kind: GuideKind | undefined,
  m: Messages
): string | undefined {
  if (!kind) return undefined;
  return kind === 'guidelines'
    ? m.discussionList.guideTypeGuideline
    : m.discussionList.guideTypeRegulatory;
}

/** Localised status strings for the Chinese UI. */
const STATUS_ZH: Record<string, string> = {
  Recruiting: '招募中',
  'Not yet recruiting': '尚未招募',
  'Enrolling by invitation': '邀请入组',
  'Active, not recruiting': '进行中，不再招募',
  Suspended: '暂停',
  Terminated: '已终止',
  Completed: '已完成',
  Withdrawn: '已撤回',
  Withheld: '未公开',
  'Unknown status': '状态未知',
};

/** Localised phase strings for the Chinese UI. */
const PHASE_ZH: Record<string, string> = {
  'Early Phase 1': '早期 I 期',
  'Phase 1': 'I 期',
  'Phase 2': 'II 期',
  'Phase 3': 'III 期',
  'Phase 4': 'IV 期',
  'Not applicable': '不适用',
};

/** Localised study-type strings for the Chinese UI. */
const STUDY_TYPE_ZH: Record<string, string> = {
  Interventional: '干预性研究',
  Observational: '观察性研究',
};

/** Translate a source status label for the current locale. */
export function localizeStatus(
  status: string | undefined,
  locale: Locale
): string | undefined {
  if (!status) return undefined;
  if (locale !== 'zh') return status;
  return STATUS_ZH[status] ?? status;
}

/** Translate a source phase label for the current locale. */
export function localizePhase(
  phase: string | undefined,
  locale: Locale
): string | undefined {
  if (!phase) return phase;
  if (locale !== 'zh') return phase;
  const parts = phase.split('/').map((p) => PHASE_ZH[p.trim()] ?? p.trim());
  return parts.join('/');
}

/** Translate a source study-type label for the current locale. */
export function localizeStudyType(
  type: string | undefined,
  locale: Locale
): string | undefined {
  if (!type) return type;
  if (locale !== 'zh') return type;
  return STUDY_TYPE_ZH[type] ?? type;
}

/**
 * Format the region coverage for the list, localised and using country details
 * when they make the label more informative.
 *
 * For records that recruit outside the tracked jurisdictions (OTHER), we show
 * the actual published countries instead of the vague "Other" bucket.
 */
export function regionDisplay(
  item: { region: Region; regions?: Region[]; countries?: string[] },
  messages: Messages
): string {
  const buckets = item.regions?.length ? item.regions : [item.region];
  const hasOther = buckets.includes('OTHER');
  if (item.countries && item.countries.length > 0 && hasOther) {
    return summariseCountries(item.countries, 3);
  }
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const r of buckets) {
    const label = messages.region[r];
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
 * When the payload (e.g. with country arrays) would make the URL too long for
 * some browsers, we fall back to sessionStorage and open the bare route.
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
    if (url.length > 3000) {
      // Keep the payload in sessionStorage and open the bare route; the page
      // reads storage as a fallback.
      window.sessionStorage.setItem(
        DISCUSSION_STORAGE_KEY,
        JSON.stringify(payload)
      );
      const win = window.open('/discussion-list', '_blank', 'noopener,noreferrer');
      if (!win) blocked = true;
    } else {
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (!win) blocked = true;
    }
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
