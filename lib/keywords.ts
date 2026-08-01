import type { Locale } from './i18n-runtime';

/**
 * Transparent keyword filter.
 *
 * These are the terms a person scans for when looking at advanced / later-line
 * / palliative settings. Selecting a keyword does NOT remove any record — it
 * only highlights the matching words inside each title, exactly as published
 * in the official record. Nothing is hidden, reordered or judged.
 *
 * The patterns live here (server-safe) so both the client filter UI and the
 * title highlighter share one source of truth.
 */
export interface KeywordDef {
  id: string;
  pattern: RegExp;
}

export const KEYWORDS: KeywordDef[] = [
  { id: 'advanced', pattern: /\badvanced\b/i },
  { id: 'metastatic', pattern: /\bmetastatic\b/i },
  { id: 'recurrent', pattern: /\brecurrent\b/i },
  { id: 'relapsed', pattern: /\brelapsed\b/i },
  {
    id: 'laterLine',
    pattern: /\b(?:later|second|third|fourth)[-\s]?line\b|\blater[-\s]?line\b/i,
  },
  { id: 'palliative', pattern: /\b(?:supportive|palliative)\b/i },
];

/** Display label per locale. Kept here so the 6 message files need no edits. */
export const KEYWORD_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    advanced: 'Advanced',
    metastatic: 'Metastatic',
    recurrent: 'Recurrent',
    relapsed: 'Relapsed',
    laterLine: 'Later-line',
    palliative: 'Supportive / palliative',
  },
  zh: {
    advanced: '晚期',
    metastatic: '转移性',
    recurrent: '复发性',
    relapsed: '复发',
    laterLine: '后线',
    palliative: '支持 / 姑息',
  },
  fr: {
    advanced: 'Avancé',
    metastatic: 'Métastatique',
    recurrent: 'Récurrent',
    relapsed: 'Rechuté',
    laterLine: 'Ligne ultérieure',
    palliative: 'Soins de support / palliatifs',
  },
  de: {
    advanced: 'Fortgeschritten',
    metastatic: 'Metastasiert',
    recurrent: 'Rezidivierend',
    relapsed: 'Rezidiviert',
    laterLine: 'Spätere Linie',
    palliative: 'Supportiv / palliativ',
  },
  ja: {
    advanced: '進行',
    metastatic: '転移性',
    recurrent: '再発',
    relapsed: '再発難治',
    laterLine: '後線',
    palliative: '支持・緩和',
  },
  ko: {
    advanced: '진행성',
    metastatic: '전이성',
    recurrent: '재발성',
    relapsed: '재발',
    laterLine: '후속 치료선',
    palliative: '지지 / 완화',
  },
};

export const KEYWORD_HEADING: Record<Locale, string> = {
  en: 'Highlight terms',
  zh: '高亮关键词',
  fr: 'Surligner les termes',
  de: 'Begriffe hervorheben',
  ja: '用語を強調',
  ko: '용어 강조',
};

/** Build one combined regex from the active keyword ids, for title highlighting. */
export function buildHighlightRegex(ids: string[]): RegExp | null {
  const parts = ids
    .map((id) => KEYWORDS.find((k) => k.id === id)?.pattern.source)
    .filter((s): s is string => Boolean(s));
  if (parts.length === 0) return null;
  return new RegExp(`(${parts.join('|')})`, 'gi');
}
