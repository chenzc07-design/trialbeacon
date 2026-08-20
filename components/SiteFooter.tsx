'use client';

import Link from 'next/link';
import { BeaconMark } from './Logo';
import { Disclaimer } from './Disclaimer';
import { useI18n } from './I18nProvider';
import { getPublicCopy } from '@/lib/public-copy';

export function SiteFooter() {
  const { locale, messages: m } = useI18n();
  const copy = getPublicCopy(locale);

  const FOOTER_LINKS = [
    {
      heading: m.footer.browse,
      links: [
        { href: '/cancers', label: m.nav.cancerTypes },
        { href: '/after-care', label: m.nav.afterCare },
        { href: '/changes', label: m.nav.changeTracker },
        { href: '/search', label: m.notFound.search },
      ],
    },
    {
      heading: m.footer.about,
      links: [
        { href: '/sources', label: m.sources.title },
        { href: '/about', label: m.about.title },
        { href: '/privacy', label: copy.footerPrivacy },
        { href: '/disclaimer', label: m.disclaimer.title },
      ],
    },
    {
      heading: m.footer.stayInformed,
      links: [
        { href: '/alerts', label: m.nav.alerts },
        { href: '/my-list', label: m.nav.myList },
        { href: '/account', label: m.nav.account },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t border-slateish-200 bg-white">
      <div className="container-page py-10">
        <Disclaimer />

        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <BeaconMark className="h-6 w-6" />
              <span className="text-[15px] font-semibold text-ink-950">
                TrialBeacon
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slateish-500">
              {m.footer.tagline}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slateish-400">
              {m.footer.desc}
            </p>
          </div>

          {FOOTER_LINKS.map((col) => (
            <div key={col.heading}>
              <h3 className="label-eyebrow">{col.heading}</h3>
              <ul className="mt-3 grid gap-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-slateish-600 transition-colors hover:text-navy-700"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="rule mt-10 pt-6">
          <p className="text-xs leading-relaxed text-slateish-400">
            {m.footer.legal}
          </p>
        </div>
      </div>
    </footer>
  );
}
