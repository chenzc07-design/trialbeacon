'use client';

import type { ReactNode } from 'react';

/**
 * Anchor that pings the anonymous `view_original` stat on click, then opens the
 * official record as normal. No health information is sent — only the event.
 */
export function ViewOriginalLink({
  href,
  title,
  className,
  children,
}: {
  href: string;
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className={className}
      onClick={() => {
        fetch('/api/stats', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ event: 'view_original' }),
        }).catch(() => undefined);
      }}
    >
      {children}
    </a>
  );
}
