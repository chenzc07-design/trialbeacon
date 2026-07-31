'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Wordmark } from './Logo';
import { LocaleSwitcher } from './LocaleSwitcher';
import { useI18n } from './I18nProvider';

export function SiteHeader() {
  const pathname = usePathname();
  const { messages: m } = useI18n();
  const [open, setOpen] = useState(false);

  const NAV = [
    { href: '/cancers', label: m.nav.cancerTypes },
    { href: '/after-care', label: m.nav.afterCare },
    { href: '/changes', label: m.nav.changeTracker },
    { href: '/safety', label: m.nav.safety },
    { href: '/my-list', label: m.nav.myList },
    { href: '/sources', label: m.nav.sources },
    { href: '/alerts', label: m.nav.alerts },
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));

  return (
    <header className="sticky top-0 z-40 border-b border-slateish-200 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="shrink-0 rounded-md" aria-label="TrialBeacon home">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-navy-50 text-navy-800'
                  : 'text-slateish-600 hover:bg-slateish-100 hover:text-ink-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LocaleSwitcher />
          <Link href="/alerts" className="btn-primary text-[13px]">
            {m.nav.getWeekly}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-slateish-300 p-2 lg:hidden"
          aria-expanded={open}
          aria-label={m.nav.toggleMenu}
        >
          <svg className="h-5 w-5 text-ink-900" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            {open ? (
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            ) : (
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open ? (
        <nav
          className="border-t border-slateish-200 bg-white px-5 py-3 lg:hidden"
          aria-label="Mobile"
        >
          <div className="grid gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive(item.href)
                    ? 'bg-navy-50 text-navy-800'
                    : 'text-slateish-600 hover:bg-slateish-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center justify-between px-1 pt-2">
              <LocaleSwitcher />
              <Link
                href="/alerts"
                onClick={() => setOpen(false)}
                className="btn-primary"
              >
                {m.nav.getWeekly}
              </Link>
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
