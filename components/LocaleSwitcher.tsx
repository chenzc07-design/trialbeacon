'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LOCALES, LOCALE_NAMES, COOKIE_NAME, type Locale } from '@/lib/i18n-runtime';
import { useI18n } from './I18nProvider';

/** A 5-pointed star polygon centered at (cx,cy), outer radius R, inner r. */
function Star({
  cx,
  cy,
  R,
  r,
  fill,
  rotate = 0,
}: {
  cx: number;
  cy: number;
  R: number;
  r: number;
  fill: string;
  rotate?: number;
}) {
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const a1 = (Math.PI / 180) * (rotate - 90 + i * 72);
    pts.push(`${(cx + R * Math.cos(a1)).toFixed(2)},${(cy + R * Math.sin(a1)).toFixed(2)}`);
    const a2 = (Math.PI / 180) * (rotate - 90 + i * 72 + 36);
    pts.push(`${(cx + r * Math.cos(a2)).toFixed(2)},${(cy + r * Math.sin(a2)).toFixed(2)}`);
  }
  return <polygon points={pts.join(' ')} fill={fill} />;
}

/**
 * Inline, dependency-free flag for each supported locale. SVG (not emoji) so
 * it renders identically everywhere, including Windows, where flag emoji
 * degrade to letter pairs. Geometry is simplified but recognisable.
 */
function Flag({ locale, className }: { locale: Locale; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 30 20',
    role: 'img' as const,
    'aria-hidden': true,
    style: { borderRadius: 2 },
  };
  switch (locale) {
    case 'en':
      return (
        <svg {...common}>
          <rect width="30" height="20" fill="#fff" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} y={i * ((20 / 13) * 2)} width="30" height={20 / 13} fill="#B22234" />
          ))}
          <rect width="13" height={(20 / 13) * 7} fill="#3C3B6E" />
        </svg>
      );
    case 'zh':
      return (
        <svg {...common}>
          <rect width="30" height="20" fill="#DE2910" />
          <Star cx={5} cy={5} R={3} r={1.2} fill="#FFDE00" />
          <Star cx={10} cy={2} R={1} r={0.4} fill="#FFDE00" rotate={239} />
          <Star cx={12} cy={4} R={1} r={0.4} fill="#FFDE00" rotate={262} />
          <Star cx={12} cy={7} R={1} r={0.4} fill="#FFDE00" rotate={286} />
          <Star cx={10} cy={9} R={1} r={0.4} fill="#FFDE00" rotate={309} />
        </svg>
      );
    case 'ja':
      return (
        <svg {...common}>
          <rect width="30" height="20" fill="#fff" />
          <circle cx="15" cy="10" r="6" fill="#BC002D" />
        </svg>
      );
    case 'fr':
      return (
        <svg {...common}>
          <rect width="10" height="20" fill="#0055A4" />
          <rect x="10" width="10" height="20" fill="#fff" />
          <rect x="20" width="10" height="20" fill="#EF4135" />
        </svg>
      );
    case 'de':
      return (
        <svg {...common}>
          <rect width="30" height={20 / 3} fill="#000" />
          <rect y={20 / 3} width="30" height={20 / 3} fill="#DD0000" />
          <rect y={(20 / 3) * 2} width="30" height={20 / 3} fill="#FFCE00" />
        </svg>
      );
    case 'ko':
      return (
        <svg {...common}>
          <rect width="30" height="20" fill="#fff" stroke="#d8d8d8" strokeWidth="0.4" />
          <g fill="#000">
            {/* four trigrams, simplified to three bars each */}
            <rect x="2.5" y="2" width="4" height="0.8" />
            <rect x="2.5" y="3.4" width="4" height="0.8" />
            <rect x="2.5" y="4.8" width="4" height="0.8" />
            <rect x="23.5" y="2" width="4" height="0.8" />
            <rect x="23.5" y="3.4" width="4" height="0.8" />
            <rect x="23.5" y="4.8" width="4" height="0.8" />
            <rect x="2.5" y="14.4" width="4" height="0.8" />
            <rect x="2.5" y="15.8" width="4" height="0.8" />
            <rect x="2.5" y="17.2" width="4" height="0.8" />
            <rect x="23.5" y="14.4" width="4" height="0.8" />
            <rect x="23.5" y="15.8" width="4" height="0.8" />
            <rect x="23.5" y="17.2" width="4" height="0.8" />
          </g>
          <circle cx="15" cy="10" r="5.5" fill="#fff" />
          <path
            d="M15 4.5 A5.5 5.5 0 0 1 15 15.5 A2.75 2.75 0 0 1 15 10 A2.75 2.75 0 0 0 15 4.5 Z"
            fill="#CD2E3A"
          />
          <path
            d="M15 4.5 A5.5 5.5 0 0 0 15 15.5 A2.75 2.75 0 0 0 15 10 A2.75 2.75 0 0 1 15 4.5 Z"
            fill="#0047A0"
          />
        </svg>
      );
    default:
      return <svg {...common} />;
  }
}

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
        <Flag locale={locale} className="h-3.5 w-[21px] shrink-0" />
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
                aria-label={`Switch to ${LOCALE_NAMES[l]}`}
                className={`flex w-full items-center justify-between gap-2 px-3.5 py-2 text-[13px] transition-colors hover:bg-slateish-100 ${
                  l === locale ? 'font-semibold text-navy-800' : 'text-ink-800'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Flag locale={l} className="h-3.5 w-[21px] shrink-0" />
                  {LOCALE_NAMES[l]}
                </span>
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
