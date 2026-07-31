/**
 * Region buckets. `OTHER` exists so a study recruiting outside the three
 * tracked jurisdictions is reported honestly instead of being mislabelled.
 */
export type Region = 'US' | 'EU' | 'CN' | 'OTHER';

/** The three jurisdictions the site tracks as first-class sources. */
export const TRACKED_REGIONS = ['US', 'EU', 'CN'] as const;

export type SourceId =
  | 'ctgov'
  | 'fda'
  | 'nccn'
  | 'ema'
  | 'ctis'
  | 'esmo'
  | 'cde'
  | 'nmpa'
  | 'chictr';

export type UpdateType = 'trial' | 'regulatory' | 'guideline' | 'registry';

export type ChangeKind = 'new' | 'updated' | 'closed' | null;

export interface UpdateItem {
  /** Stable unique id, e.g. NCT number or curated slug */
  id: string;
  /** Neutral, factual title. No evaluative language. */
  title: string;
  source: SourceId;
  /**
   * Primary region bucket used by the region tabs.
   *
   * For registry records this is DERIVED from the recruiting countries in the
   * official record — never assumed. When a study recruits across several
   * regions the extra buckets are listed in `regions`.
   */
  region: Region;
  /**
   * Every region the record actually covers, derived from official recruiting
   * locations. Always contains `region`. A pan-regional phase 3 study will
   * carry all three.
   */
  regions?: Region[];
  type: UpdateType;
  /** ISO date of the most recent official update. Null = continuously updated live source. */
  date: string | null;
  /** ISO date the record was first posted, when known. */
  firstPosted?: string;
  /** Direct link to the original official page. Required for every item. */
  url: string;
  /** Cancer slugs this item relates to. 'all' = pan-cancer. */
  cancers: string[];
  /** Trial phase label, when applicable, e.g. "Phase 3". */
  phase?: string;
  /** Official status string, e.g. "Recruiting". */
  status?: string;
  /** Raw upstream status token, e.g. "RECRUITING" — used for filtering. */
  statusCode?: string;
  /**
   * True if the record relates to advanced, metastatic, relapsed/refractory,
   * later-line, or supportive/palliative settings.
   */
  afterCare?: boolean;

  /* ---------------------------------------------------------------- detail
   * The fields below are populated from the official record when available.
   * They are intentionally optional: the offline baseline carries only what
   * can be verified, and the UI states plainly when a field is unavailable
   * rather than inventing a value.
   */

  /** ISO 3166 country names exactly as published in the official record. */
  countries?: string[];
  /** Interventions (drug / procedure names) as published. Never rewritten. */
  interventions?: string[];
  /** Lead sponsor name as published. */
  sponsor?: string;
  /** Target enrolment count as published. */
  enrollment?: number;
  /** Study type, e.g. "Interventional". */
  studyType?: string;
  /** Age range as published, e.g. "18 Years and older". */
  ageRange?: string;
  /** Sex eligibility as published, e.g. "All". */
  sex?: string;
  /**
   * Verbatim eligibility criteria text from the official record.
   * Displayed read-only and always alongside a link to the source.
   */
  eligibility?: string;
  /** True when the official record lists a public contact. */
  hasPublicContact?: boolean;
}

export interface SourceMeta {
  id: SourceId;
  label: string;
  fullName: string;
  region: Region;
  url: string;
  kind: 'registry' | 'regulator' | 'guidelines';
}

export interface CancerType {
  slug: string;
  label: string;
  /** Short factual descriptor shown on cards (no evaluative language). */
  descriptor: string;
  /** ClinicalTrials.gov condition query */
  ctgovCond: string;
  /** Extra terms used for the after-care view */
  afterCareTerms: string;
  /**
   * Decorative abstract tile used as the visual mark for this cancer.
   * Generated locally; intentionally calm and abstract — no disease imagery.
   */
  image: string;
}
