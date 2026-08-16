import type { UpdateItem, Region } from './types';
import { regionsFromCountries, primaryRegion } from './regions';

const API_BASE = 'https://clinicaltrials.gov/api/v2/studies';

/** Compact field set for list queries — keeps responses small. */
const LIST_FIELDS = [
  'protocolSection.identificationModule',
  'protocolSection.statusModule',
  'protocolSection.designModule',
  'protocolSection.conditionsModule',
  'protocolSection.contactsLocationsModule',
].join('|');

/** Full field set for a single study detail view. */
const DETAIL_FIELDS = [
  'protocolSection.identificationModule',
  'protocolSection.statusModule',
  'protocolSection.designModule',
  'protocolSection.conditionsModule',
  'protocolSection.armsInterventionsModule',
  'protocolSection.sponsorCollaboratorsModule',
  'protocolSection.eligibilityModule',
  'protocolSection.contactsLocationsModule',
  'protocolSection.descriptionModule',
].join('|');

interface CtgovStudy {
  protocolSection?: {
    identificationModule?: {
      nctId?: string;
      briefTitle?: string;
      officialTitle?: string;
    };
    statusModule?: {
      overallStatus?: string;
      studyFirstPostDateStruct?: { date?: string };
      lastUpdatePostDateStruct?: { date?: string };
    };
    designModule?: {
      phases?: string[];
      studyType?: string;
      enrollmentInfo?: { count?: number };
    };
    conditionsModule?: { conditions?: string[] };
    armsInterventionsModule?: {
      interventions?: { name?: string; type?: string }[];
    };
    sponsorCollaboratorsModule?: {
      leadSponsor?: { name?: string };
    };
    eligibilityModule?: {
      eligibilityCriteria?: string;
      sex?: string;
      minimumAge?: string;
      maximumAge?: string;
    };
    contactsLocationsModule?: {
      locations?: { country?: string; city?: string; facility?: string }[];
      centralContacts?: { name?: string }[];
    };
    descriptionModule?: { briefSummary?: string };
  };
}

export interface CtgovQuery {
  cond: string;
  term?: string;
  pageSize?: number;
  /** ISO date; only records updated on/after this date */
  updatedFrom?: string;
  status?: string[];
}

export function phaseLabel(phases?: string[]): string | undefined {
  if (!phases || phases.length === 0) return undefined;
  const map: Record<string, string> = {
    EARLY_PHASE1: 'Early Phase 1',
    PHASE1: 'Phase 1',
    PHASE2: 'Phase 2',
    PHASE3: 'Phase 3',
    PHASE4: 'Phase 4',
    NA: 'Not applicable',
  };
  const parts = phases.map((p) => map[p] ?? p);
  if (parts.length === 1) return parts[0];
  // "Phase 1" + "Phase 2" -> "Phase 1/2"
  const nums = parts
    .map((p) => p.match(/Phase (\d)/)?.[1])
    .filter(Boolean) as string[];
  if (nums.length === parts.length) return `Phase ${nums.join('/')}`;
  return parts.join(' / ');
}

export function statusLabel(status?: string): string | undefined {
  if (!status) return undefined;
  const map: Record<string, string> = {
    RECRUITING: 'Recruiting',
    NOT_YET_RECRUITING: 'Not yet recruiting',
    ENROLLING_BY_INVITATION: 'Enrolling by invitation',
    ACTIVE_NOT_RECRUITING: 'Active, not recruiting',
    SUSPENDED: 'Suspended',
    TERMINATED: 'Terminated',
    COMPLETED: 'Completed',
    WITHDRAWN: 'Withdrawn',
    WITHHELD: 'Withheld',
    UNKNOWN: 'Unknown status',
  };
  return map[status] ?? status.replace(/_/g, ' ').toLowerCase();
}

const CLOSED_STATUSES = new Set([
  'COMPLETED',
  'TERMINATED',
  'WITHDRAWN',
  'SUSPENDED',
]);

export function isClosedStatus(status?: string): boolean {
  return !!status && CLOSED_STATUSES.has(status);
}

/** Statuses that mean a person could potentially still enter the study. */
const OPEN_STATUSES = new Set([
  'RECRUITING',
  'NOT_YET_RECRUITING',
  'ENROLLING_BY_INVITATION',
]);

export function isOpenStatus(status?: string): boolean {
  return !!status && OPEN_STATUSES.has(status);
}

const AFTER_CARE_PATTERN =
  /\b(advanced|metastatic|refractory|relapsed|recurrent|unresectable|palliative|supportive care|second[- ]line|third[- ]line|later[- ]line|previously treated|castration[- ]resistant|platinum[- ]resistant|stage iv|end[- ]of[- ]life|quality of life|symptom)\b/i;

export function looksAfterCare(text: string): boolean {
  return AFTER_CARE_PATTERN.test(text);
}

export function buildCtgovUrl(q: CtgovQuery): string {
  const params = new URLSearchParams();
  params.set('query.cond', q.cond);
  if (q.term) params.set('query.term', q.term);
  params.set('fields', LIST_FIELDS);
  params.set('pageSize', String(q.pageSize ?? 20));
  params.set('sort', 'LastUpdatePostDate:desc');
  if (q.status?.length) {
    params.set('filter.overallStatus', q.status.join('|'));
  }
  if (q.updatedFrom) {
    params.set(
      'filter.advanced',
      `AREA[LastUpdatePostDate]RANGE[${q.updatedFrom},MAX]`
    );
  }
  return `${API_BASE}?${params.toString()}`;
}

/** Distinct recruiting countries, in first-seen order. */
function extractCountries(study: CtgovStudy): string[] {
  const locs = study.protocolSection?.contactsLocationsModule?.locations ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const l of locs) {
    const c = l.country?.trim();
    if (c && !seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  }
  return out;
}

export function normalizeStudy(
  study: CtgovStudy,
  cancers: string[]
): UpdateItem | null {
  const p = study.protocolSection;
  const nctId = p?.identificationModule?.nctId;
  const title = p?.identificationModule?.briefTitle;
  if (!nctId || !title) return null;

  const rawStatus = p?.statusModule?.overallStatus;

  // Region is DERIVED from the countries in the official record. When the
  // record lists no locations we say OTHER rather than guessing.
  const countries = extractCountries(study);
  const regions: Region[] =
    countries.length > 0 ? regionsFromCountries(countries) : [];

  const conditions = p?.conditionsModule?.conditions ?? [];
  const interventions = (p?.armsInterventionsModule?.interventions ?? [])
    .map((i) => i.name?.trim())
    .filter((n): n is string => !!n);

  const elig = p?.eligibilityModule;
  const ageRange = [elig?.minimumAge, elig?.maximumAge]
    .filter(Boolean)
    .join(' – ');

  return {
    id: nctId,
    title,
    source: 'ctgov',
    region: primaryRegion(regions),
    regions: regions.length > 0 ? regions : undefined,
    type: 'trial',
    date: p?.statusModule?.lastUpdatePostDateStruct?.date ?? null,
    firstPosted: p?.statusModule?.studyFirstPostDateStruct?.date,
    url: `https://clinicaltrials.gov/study/${nctId}`,
    cancers,
    phase: phaseLabel(p?.designModule?.phases),
    status: statusLabel(rawStatus),
    statusCode: rawStatus,
    // Screen the title AND the registered conditions, so a study titled
    // neutrally but registered for "Metastatic Breast Cancer" is still caught.
    afterCare: looksAfterCare(`${title} ${conditions.join(' ')}`),
    countries: countries.length > 0 ? countries : undefined,
    interventions: interventions.length > 0 ? interventions : undefined,
    sponsor: p?.sponsorCollaboratorsModule?.leadSponsor?.name,
    enrollment: p?.designModule?.enrollmentInfo?.count,
    studyType: p?.designModule?.studyType,
    ageRange: ageRange || undefined,
    sex: elig?.sex,
    eligibility: elig?.eligibilityCriteria,
    hasPublicContact:
      (p?.contactsLocationsModule?.centralContacts?.length ?? 0) > 0,
  };
}

/**
 * Fetches records from the ClinicalTrials.gov public API.
 * Throws on network/HTTP failure so callers can fall back to the local dataset.
 */
export async function fetchCtgov(
  q: CtgovQuery,
  cancers: string[],
  revalidate = 3600
): Promise<UpdateItem[]> {
  const requestInit: RequestInit & { next?: { revalidate: number } } = {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  };
  if (revalidate === 0) {
    requestInit.cache = 'no-store';
  } else {
    requestInit.next = { revalidate };
  }
  const res = await fetch(buildCtgovUrl(q), requestInit);
  if (!res.ok) throw new Error(`ClinicalTrials.gov responded ${res.status}`);
  const json = (await res.json()) as { studies?: CtgovStudy[] };
  return (json.studies ?? [])
    .map((s) => normalizeStudy(s, cancers))
    .filter((x): x is UpdateItem => x !== null);
}

/**
 * Fetches one study by NCT number with the full detail field set.
 * Returns null when the registry has no such record.
 */
export async function fetchCtgovStudy(
  nctId: string,
  cancers: string[] = [],
  revalidate = 3600
): Promise<UpdateItem | null> {
  const url = `${API_BASE}/${encodeURIComponent(nctId)}?fields=${encodeURIComponent(
    DETAIL_FIELDS
  )}`;
  const requestInit: RequestInit & { next?: { revalidate: number } } = {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  };
  if (revalidate === 0) {
    requestInit.cache = 'no-store';
  } else {
    requestInit.next = { revalidate };
  }
  const res = await fetch(url, requestInit);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`ClinicalTrials.gov responded ${res.status}`);
  const study = (await res.json()) as CtgovStudy;
  return normalizeStudy(study, cancers);
}