'use client';

import { useI18n } from './I18nProvider';
import { useFreshness } from '@/lib/freshness';

/**
 * Compact "Last verified" pill. Highlights (amber) when the verification is
 * older than 7 days. Used wherever a list/feed is shown — homepage Hero,
 * the After Care view, cancer lists and the change tracker. The date is set
 * in semibold so the freshness reads at a glance without shouting.
 */
export function FreshnessBadge({ className = '' }: { className?: string }) {
  const { messages: m } = useI18n();
  const { lastVerified, stale } = useFreshness();
  const tpl = m.common.lastVerified;
  const i = tpl.indexOf('{date}');
  const label = i >= 0 ? tpl.slice(0, i) : tpl;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium tabular-nums ${
        stale
          ? 'border-amber-300 bg-amber-50 text-amber-800'
          : 'border-slateish-200 bg-slateish-50 text-slateish-700'
      } ${className}`}
      title={stale ? m.common.stale7d : undefined}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${stale ? 'bg-amber-500' : 'bg-[#3f8f6b]'}`}
        aria-hidden="true"
      />
      {label}
      <span className="font-semibold">{lastVerified}</span>
    </span>
  );
}
