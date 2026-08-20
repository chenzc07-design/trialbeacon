'use client';

import { SNAPSHOT_DATE } from '@/lib/data';
import { useI18n } from './I18nProvider';

/**
 * Transparent indicator of where the data on the page came from:
 * either the live official API or the bundled verified snapshot.
 */
export function DataStatus({ live }: { live: boolean }) {
  const { messages: m } = useI18n();
  return (
    <p className="flex items-center gap-2 text-xs text-slateish-500">
      <span
        className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-[#3f8f6b]' : 'bg-slateish-400'}`}
        aria-hidden="true"
      />
      {live
        ? m.dataStatus.live
        : m.dataStatus.snapshot.replace('{date}', SNAPSHOT_DATE)}
    </p>
  );
}
