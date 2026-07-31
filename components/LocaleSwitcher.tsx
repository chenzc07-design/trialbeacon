'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LOCALES, LOCALE_NAMES, COOKIE_NAME, type Locale } from '@/lib/i18n-runtime';
import { useI18n } from './I18nProvider';

export function LocaleSwitcher() {
  const { locale, messages } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const choose = (next: Locale) => {
    setOpen(false);
    if (next === locale) return;
    // Persist the choice, then re-render the current route in the new locale.
    document.cookie = `${COOKIE_NAME}=${next};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    router.refresh();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={messages.locale.label}
        className="flex items-center gap-1.5 rounded-lg border border-slateish-300 px-2.5 py-2 text-[13px] font-medium text-slateish-600 transition-colors hover:border-navy-300 hover:text-ink-900"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M2.5 10h15M10 2.5c2.3 2.1 3.5 4.8 3.5 7.5S12.3 15.4 10 17.5C7.7 15.4 6.5 12.7 6.5 10S7.7 4.6 10 2.5z"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </svg>
        <span className="hidden sm:inline">{LOCALE_NAMES[locale]}</span>
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M3 4.5L6 7.5l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-slateish-200 bg-white py-1 shadow-card-hover"
        >
          {LOCALES.map((l) => (
            <li key={l} role="option" aria-selected={l === locale}>
              <button
                type="button"
                onClick={() => choose(l)}
                className={`flex w-full items-center justify-between px-3.5 py-2 text-[13px] transition-colors hover:bg-slateish-100 ${
                  l === locale ? 'font-semibold text-navy-800' : 'text-ink-800'
                }`}
              >
                {LOCALE_NAMES[l]}
                {l === locale ? (
                  <svg className="h-3.5 w-3.5 text-navy-700" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
