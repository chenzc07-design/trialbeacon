'use client';

import { useEffect, useState, type ElementType } from 'react';

/**
 * Renders EXACTLY ONE of two strings based on the real viewport width, so the
 * other string is never present in the DOM — no duplicate text for crawlers,
 * no visual stacking, nothing concatenated.
 *
 * Defaults to the desktop string during SSR and the first client paint (so
 * there is no React hydration mismatch), then switches after mount if the
 * viewport is narrow. The breakpoint (max-width: 639px) mirrors Tailwind's
 * `sm` (640px): below it = mobile/short, at or above = desktop/full.
 */
export function DeviceText({
  desktop,
  mobile,
  as: Tag = 'span',
  className = '',
}: {
  desktop: string;
  mobile: string;
  as?: ElementType;
  className?: string;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return <Tag className={className}>{isMobile ? mobile : desktop}</Tag>;
}
