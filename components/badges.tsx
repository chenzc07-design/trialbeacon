'use client';

import type { Region, SourceId, UpdateType } from '@/lib/types';
import { SOURCES } from '@/lib/sources';
import { useI18n } from './I18nProvider';

const REGION_STYLES: Record<Region, string> = {
  US: 'border-[#c9dcf0] bg-[#eef5fc] text-[#1d4e7e]',
  EU: 'border-[#cfe0d9] bg-[#eef6f2] text-[#2e5747]',
  CN: 'border-[#e6d7c3] bg-[#f9f3ea] text-[#6e4a24]',
  OTHER: 'border-slateish-300 bg-slateish-100 text-slateish-600',
};

export function RegionBadge({ region }: { region: Region }) {
  return (
    <span className={`chip ${REGION_STYLES[region]}`} title={`Region: ${region}`}>
      <span
        className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
        aria-hidden="true"
      />
      {region}
    </span>
  );
}

export function SourceBadge({ source }: { source: SourceId }) {
  const meta = SOURCES[source];
  return (
    <span
      className="chip border-slateish-200 bg-slateish-100 text-slateish-600"
      title={meta.fullName}
    >
      {meta.label}
    </span>
  );
}

export function TypeBadge({ type }: { type: UpdateType }) {
  const { messages: m } = useI18n();
  return (
    <span className="chip border-navy-100 bg-navy-50 text-navy-700">
      {m.badge.type[type]}
    </span>
  );
}

export function PhaseBadge({ phase }: { phase?: string }) {
  if (!phase) return null;
  return (
    <span className="chip border-slateish-200 bg-white text-slateish-600">
      {phase}
    </span>
  );
}

export function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const open = /recruiting|enrolling/i.test(status) && !/not yet/i.test(status);
  return (
    <span
      className={`chip ${
        open
          ? 'border-[#cfe0d9] bg-[#eef6f2] text-[#2e5747]'
          : 'border-slateish-200 bg-slateish-100 text-slateish-600'
      }`}
    >
      {status}
    </span>
  );
}

export function ChangeBadge({ kind }: { kind: 'new' | 'updated' | 'closed' }) {
  const { messages: m } = useI18n();
  const styles = {
    new: 'border-[#cfe0d9] bg-[#eef6f2] text-[#2e5747]',
    updated: 'border-[#c9dcf0] bg-[#eef5fc] text-[#1d4e7e]',
    closed: 'border-slateish-300 bg-slateish-100 text-slateish-600',
  } as const;
  return <span className={`chip ${styles[kind]}`}>{m.badge.change[kind]}</span>;
}
