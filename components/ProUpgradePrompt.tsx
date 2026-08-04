'use client';

import Link from 'next/link';
import { useI18n } from './I18nProvider';

/**
 * Neutral inline upgrade prompt shown when a free generation is blocked
 * (daily limit reached, or the list is too large). Clicking it pings the
 * `upgrade_click` stat and routes to /pro. No recommendation or "fit" wording.
 */
export function ProUpgradePrompt({
  message,
  compact = false,
}: {
  message?: string;
  compact?: boolean;
}) {
  const { messages: m } = useI18n();

  function track() {
    fetch('/api/stats', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event: 'upgrade_click' }),
    }).catch(() => undefined);
  }

  return (
    <div
      className={`rounded-xl border border-navy-200 bg-navy-50/60 p-3 ${
        compact ? '' : 'mt-2'
      }`}
    >
      <p className="text-[13px] leading-relaxed text-ink-800">
        {message ?? m.pricing.freeDailyUsed}
      </p>
      <Link
        href="/pro"
        onClick={track}
        className="btn-primary mt-2 inline-flex text-[13px]"
      >
        {m.pricing.upgradeCta}
      </Link>
    </div>
  );
}
