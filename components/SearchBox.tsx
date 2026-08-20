'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useI18n } from './I18nProvider';

export function SearchBox({
  initialQuery = '',
  autoFocus = false,
  size = 'md',
  placeholder,
}: {
  initialQuery?: string;
  autoFocus?: boolean;
  size?: 'md' | 'lg';
  placeholder?: string;
}) {
  const router = useRouter();
  const { messages: m } = useI18n();
  const [q, setQ] = useState(initialQuery);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = q.trim();
        fetch('/api/stats', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ event: 'search_submit' }),
        }).catch(() => undefined);
        router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
      }}
      className="flex w-full items-stretch gap-2"
    >
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">{m.common.searchAria}</span>
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slateish-400"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M14 14l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus={autoFocus}
          placeholder={placeholder ?? m.common.searchPlaceholder}
          className={`min-w-0 w-full rounded-xl border border-slateish-300 bg-white pl-10 pr-4 text-ink-900 placeholder:text-slateish-400 focus:border-navy-400 ${
            size === 'lg' ? 'py-3.5 text-[15px]' : 'py-2.5 text-sm'
          }`}
        />
      </label>
      <button type="submit" className={size === 'lg' ? 'btn-primary shrink-0 px-4 sm:px-5' : 'btn-primary shrink-0'}>
        {m.common.searchButton}
      </button>
    </form>
  );
}
