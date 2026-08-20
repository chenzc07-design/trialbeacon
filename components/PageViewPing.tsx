'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Fire one anonymous `page_view` event whenever the route changes. No health
 * information is ever sent — only that a page was viewed. Render once in the
 * root layout so every navigation (including client-side) is counted. Safe to
 * drop anywhere; renders nothing.
 */
export function PageViewPing() {
  const pathname = usePathname();
  const seen = useRef<string | null>(null);
  useEffect(() => {
    if (seen.current === pathname) return;
    seen.current = pathname;
    fetch('/api/stats', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event: 'page_view' }),
    }).catch(() => undefined);

    // Only bucket the homepage. Other important routes already emit their own
    // fixed event names; no pathname, query, search term or health data is sent.
    if (pathname === '/') {
      fetch('/api/stats', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event: 'view_home' }),
      }).catch(() => undefined);
    }
  }, [pathname]);
  return null;
}
