// Pure, dependency-free i18n helpers + constants.
// Safe to import from client components (does NOT import any message dictionary).

export const LOCALES = ['en', 'zh', 'fr', 'de', 'ja', 'ko'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const COOKIE_NAME = 'tb_locale';

/** Native (endonym) names, shown in the language switcher. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  ko: '한국어',
};

export function isLocale(v: string | undefined | null): v is Locale {
  return !!v && (LOCALES as readonly string[]).includes(v);
}

/** Pick the best supported locale from an Accept-Language header. */
export function parseAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { tag: (tag || '').toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const base = tag.split('-')[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

/** Dot-path lookup into a messages object. */
export function lookup(
  messages: any,
  key: string
): string | undefined {
  const parts = key.split('.');
  let cur: unknown = messages;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string' ? cur : undefined;
}

/**
 * Replace {name} placeholders. Plural form: {n|one|many} selects by count n.
 */
export function interp(
  template: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return template;
  return template.replace(/\{[^}]+\}/g, (match) => {
    const inner = match.slice(1, -1).trim();
    if (inner.includes('|')) {
      const [name, one, many] = inner.split('|');
      const val = vars[name.trim()];
      const n = typeof val === 'number' ? val : Number(val);
      return n === 1 ? (one ?? String(val ?? '')) : (many ?? String(val ?? ''));
    }
    const val = vars[inner];
    return val === undefined ? match : String(val);
  });
}

/** Translate by key, with optional interpolation. Returns the key if missing. */
export function t(
  messages: any,
  key: string,
  vars?: Record<string, string | number>
): string {
  const raw = lookup(messages, key);
  if (raw === undefined) return key;
  return vars ? interp(raw, vars) : raw;
}
