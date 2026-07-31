'use client';

import Link from 'next/link';
import { useI18n } from './I18nProvider';

/**
 * The global disclaimer. Rendered in the footer of every page, inside the
 * after-care view and in email templates. Wording is deliberately plain.
 */
export function Disclaimer({ compact = false }: { compact?: boolean }) {
  const { messages: m } = useI18n();

  if (compact) {
    return (
      <p className="text-xs leading-relaxed text-slateish-500">
        {m.disclaimer.compact}{' '}
        <Link href="/disclaimer" className="link-underline">
          {m.disclaimer.title}
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="rounded-card border border-navy-100 bg-navy-50/60 p-5">
      <div className="flex gap-3">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-navy-600"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="10" cy="10" r="8.2" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M10 9v5M10 6.2v.2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <div>
          <h2 className="text-sm font-semibold text-ink-900">
            {m.disclaimer.bannerTitle}
          </h2>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-slateish-600">
            {m.disclaimer.bannerBody}{' '}
            <Link href="/disclaimer" className="link-underline">
              {m.disclaimer.title}
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
