'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Wordmark } from './Logo';
import { LocaleSwitcher } from './LocaleSwitcher';
import { useI18n } from './I18nProvider';
import { useAuth } from './AuthProvider';
import { CANCERS } from '@/lib/cancers';

export function SiteHeader() {
  const pathname = usePathname();
  const { messages: m } = useI18n();
  const { user, status, signOut, openSignIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [cancersOpen, setCancersOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const cancersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node))
        setAccountOpen(false);
      if (cancersRef.current && !cancersRef.current.contains(e.target as Node))
        setCancersOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // After navigating, close mobile drawer.
  useEffect(() => {
    setOpen(false);
    setCancersOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  const NAV = [
    { href: '/after-care', label: m.nav.afterCare },
    {
      href: '/cancers',
      label: m.nav.cancerTypes,
      dropdown: 'cancers' as const,
    },
    { href: '/alerts', label: m.nav.alerts },
    { href: '/sources', label: m.nav.sources },
    { href: '/pro', label: m.pricing.nav },
  ];

  const SECONDARY = [
    { href: '/changes', label: m.nav.changeTracker },
    { href: '/safety', label: m.nav.safety },
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));

  const isCancersActive =
    pathname === '/cancers' || pathname.startsWith('/cancers/');

  return (
    <header className="sticky top-0 z-40 border-b border-slateish-200 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="shrink-0 rounded-md" aria-label="TrialBeacon home">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => {
            if (item.dropdown === 'cancers') {
              return (
                <div key={item.href} className="relative" ref={cancersRef}>
                  <button
                    type="button"
                    onClick={() => setCancersOpen((v) => !v)}
                    aria-expanded={cancersOpen}
                    aria-haspopup="menu"
                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                      isCancersActive
                        ? 'bg-navy-50 text-navy-800'
                        : 'text-slateish-600 hover:bg-slateish-100 hover:text-ink-900'
                    }`}
                  >
                    {item.label}
                    <svg
                      className={`h-3 w-3 transition-transform ${cancersOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 4.5l3 3 3-3"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {cancersOpen ? (
                    <div
                      className="absolute left-0 top-full z-50 mt-1 grid w-[min(680px,calc(100vw-2rem))] grid-cols-2 gap-1 rounded-xl border border-slateish-200 bg-white p-3 shadow-card-hover"
                      role="menu"
                    >
                      <Link
                        href={item.href}
                        className="col-span-2 flex items-center justify-between rounded-lg bg-navy-50 px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-navy-100"
                        role="menuitem"
                      >
                        {m.cancersIndex.title} →
                      </Link>
                      {CANCERS.map((c) => (
                        <Link
                          key={c.slug}
                          href={`/cancers/${c.slug}`}
                          className="rounded-lg px-3 py-2 text-sm text-slateish-700 hover:bg-slateish-50"
                          role="menuitem"
                        >
                          {m.cancers[c.slug].label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            }
            return (
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
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LocaleSwitcher />
          {status === 'signed-in' && user ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-slateish-200 bg-white px-3 py-1.5 text-[13px] font-medium text-ink-900 hover:border-navy-300"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-50 text-[11px] font-semibold text-navy-700">
                  {user.email.slice(0, 1).toUpperCase()}
                </span>
                <span className="max-w-[160px] truncate">{user.email}</span>
                <svg
                  className={`h-3 w-3 transition-transform ${accountOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 4.5l3 3 3-3"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {accountOpen ? (
                <div
                  className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-slateish-200 bg-white p-2 shadow-card-hover"
                  role="menu"
                >
                  <Link
                    href="/account"
                    className="block rounded-lg px-3 py-2 text-sm text-ink-900 hover:bg-slateish-50"
                    role="menuitem"
                  >
                    {m.nav.account}
                  </Link>
                  <Link
                    href="/my-list"
                    className="block rounded-lg px-3 py-2 text-sm text-ink-900 hover:bg-slateish-50"
                    role="menuitem"
                  >
                    {m.nav.myList}
                  </Link>
                  <Link
                    href="/following"
                    className="block rounded-lg px-3 py-2 text-sm text-ink-900 hover:bg-slateish-50"
                    role="menuitem"
                  >
                    {m.nav.following}
                  </Link>
                  <Link
                    href="/alerts"
                    className="block rounded-lg px-3 py-2 text-sm text-ink-900 hover:bg-slateish-50"
                    role="menuitem"
                  >
                    {m.nav.alerts}
                  </Link>
                  <Link
                    href="/pro"
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-ink-900 hover:bg-slateish-50"
                    role="menuitem"
                  >
                    <span>{m.pricing.nav}</span>
                    {user.plan === 'pro' && (user.proUntil ?? 0) > Date.now() ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#eef6f2] px-1.5 py-0.5 text-[10px] font-medium text-[#2e5747]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#3f8f6b]" />
                        Pro
                      </span>
                    ) : null}
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink-900 hover:bg-slateish-50"
                    role="menuitem"
                  >
                    {m.nav.signOut}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openSignIn(pathname)}
              className="rounded-lg border border-slateish-200 bg-white px-3 py-1.5 text-[13px] font-medium text-ink-900 hover:border-navy-300"
            >
              {m.nav.signIn}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-slateish-300 p-2 md:hidden"
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
          className="border-t border-slateish-200 bg-white px-5 py-3 md:hidden"
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
            <div className="grid grid-cols-2 gap-1">
              {SECONDARY.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2 text-[13px] ${
                    isActive(item.href)
                      ? 'bg-navy-50 text-navy-800'
                      : 'text-slateish-500 hover:bg-slateish-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            {status === 'signed-in' && user ? (
              <>
                <Link
                  href="/my-list"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slateish-600 hover:bg-slateish-100"
                >
                  {m.nav.myList}
                </Link>
                <Link
                  href="/following"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slateish-600 hover:bg-slateish-100"
                >
                  {m.nav.following}
                </Link>
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slateish-600 hover:bg-slateish-100"
                >
                  {m.nav.account}
                </Link>
                <Link
                  href="/pro"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slateish-600 hover:bg-slateish-100"
                >
                  {m.pricing.nav}
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    setOpen(false);
                  }}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slateish-600 hover:bg-slateish-100"
                >
                  {m.nav.signOut}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  openSignIn(pathname);
                  setOpen(false);
                }}
                className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slateish-700 hover:bg-slateish-100"
              >
                {m.nav.signIn}
              </button>
            )}
            <div className="px-1 pt-2">
              <LocaleSwitcher />
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
