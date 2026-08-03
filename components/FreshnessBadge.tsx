'use client';

import { useI18n } from './I18nProvider';
import { useFreshness } from '@/lib/freshness';

/**
 * Compact "Last verified" pill. Highlights (amber) when the verification is
 * older than 7 days. Used wherever a list/feed is shown.
 */
export function FreshnessBadge({ className = '' }: { className?: string }) {
  const { messages: m } = useI18n();
  const { lastVerified, stale } = useFreshness();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tabular-nums ${
        stale
          ? 'border-amber-300 bg-amber-50 text-amber-800'
          : 'border-slateish-200 bg-slateish-50 text-slateish-600'
      } ${className}`}
      title={stale ? m.common.stale7d : undefined}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${stale ? 'bg-amber-500' : 'bg-[#3f8f6b]'}`}
        aria-hidden="true"
      />
      {m.common.lastVerified.replace('{date}', lastVerified)}
    </span>
  );
}
