import { CANCERS, getCancer } from '@/lib/cancers';

/** Canonical site origin. Override with SITE_URL in production. */
export const SITE_URL =
  process.env.SITE_URL ?? 'https://trialbeacon.vercel.app';

/**
 * Hreflang alternates for a given path.
 *
 * TrialBeacon uses a cookie-based locale switcher (not URL-based i18n), so
 * every locale is served from the same URL. Each language therefore points
 * back to that same path, with `x-default` as the fallback Google uses when
 * no explicit language match is found.
 */
export function hreflangAll(path: string): Record<string, string> {
  return {
    en: path,
    zh: path,
    fr: path,
    de: path,
    ja: path,
    ko: path,
    'x-default': path,
  };
}

/** JSON-LD for the whole site: a neutral WebSite + independent Organisation. */
export function siteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'TrialBeacon',
        description:
          'A neutral index of publicly listed clinical trials, guideline indexes and regulatory notices from official sources in the United States, Europe and China.',
        inLanguage: 'en',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'TrialBeacon',
        url: SITE_URL,
        description:
          'TrialBeacon is an independent information index. It is not affiliated with, or endorsed by, any registry or agency referenced on the site.',
      },
    ],
  };
}

/** JSON-LD for a single cancer-type page: a CollectionPage of official records. */
export function cancerJsonLd(slug: string) {
  const cancer = getCancer(slug);
  if (!cancer) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/cancers/${slug}#webpage`,
    url: `${SITE_URL}/cancers/${slug}`,
    name: `${cancer.label} — official updates`,
    description: `Publicly listed clinical trials, guidelines and regulatory notices for ${cancer.label.toLowerCase()} from official US, European and Chinese sources.`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: {
      '@type': 'MedicalCondition',
      name: cancer.label,
    },
  };
}

/** All public, indexable routes for the sitemap. */
export function sitemapRoutes(): { path: string; changeFreq: string; priority: number }[] {
  return [
    { path: '/', changeFreq: 'daily', priority: 1 },
    { path: '/cancers', changeFreq: 'daily', priority: 0.9 },
    { path: '/after-care', changeFreq: 'daily', priority: 0.8 },
    { path: '/changes', changeFreq: 'daily', priority: 0.8 },
    { path: '/search', changeFreq: 'weekly', priority: 0.5 },
    { path: '/sources', changeFreq: 'monthly', priority: 0.6 },
    { path: '/about', changeFreq: 'monthly', priority: 0.5 },
    { path: '/disclaimer', changeFreq: 'monthly', priority: 0.4 },
    { path: '/safety', changeFreq: 'monthly', priority: 0.4 },
    { path: '/alerts', changeFreq: 'monthly', priority: 0.6 },
    ...CANCERS.map((c) => ({
      path: `/cancers/${c.slug}`,
      changeFreq: 'daily',
      priority: 0.8,
    })),
  ];
}
