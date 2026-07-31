/**
 * Decorative SVG motifs used across cards and panels.
 * All use currentColor so the parent `text-*` utility drives the stroke.
 */

export function BeaconMotif({
  className = 'h-10 w-10 text-navy-700',
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="3" fill="currentColor" />
      <circle cx="20" cy="20" r="7" />
      <circle cx="20" cy="20" r="11" />
      <circle cx="20" cy="20" r="15" />
      <path d="M5 20h30" strokeDasharray="2 3" />
      <path d="M20 5v30" strokeDasharray="2 3" />
    </svg>
  );
}

export function MailMotif({
  className = 'h-10 w-10 text-navy-700',
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="10" width="30" height="20" rx="2" />
      <path d="M5 12l15 10 15-10" />
      <path d="M9 28l8-7M31 28l-8-7" />
    </svg>
  );
}

export function CompassMotif({
  className = 'h-10 w-10 text-navy-700',
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="14" />
      <path d="M20 6v4M20 30v4M6 20h4M30 20h4" />
      <path d="M20 20l5-7-2 7-3 7z" fill="currentColor" />
    </svg>
  );
}

export function DocumentMotif({
  className = 'h-10 w-10 text-navy-700',
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 4h16l6 6v26H9z" />
      <path d="M25 4v6h6" />
      <path d="M13 17h14M13 22h14M13 27h9" />
    </svg>
  );
}

export function RssMotif({
  className = 'h-10 w-10 text-navy-700',
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 11c12 0 22 10 22 22" />
      <path d="M7 21c6.6 0 12 5.4 12 12" />
      <circle cx="9" cy="31" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function ShieldMotif({
  className = 'h-10 w-10 text-navy-700',
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 5l12 4v9c0 9-6 14-12 17-6-3-12-8-12-17V9z" />
      <path d="M14 20l5 5 8-9" />
    </svg>
  );
}

export function FilterMotif({
  className = 'h-10 w-10 text-navy-700',
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 8h30l-11 13v10l-8-3v-7z" />
    </svg>
  );
}

export function WaveMotif({
  className = 'h-10 w-10 text-navy-700',
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 16c4-6 8-6 12 0s8 6 12 0 4-6 8 0" />
      <path d="M4 24c4-6 8-6 12 0s8 6 12 0 4-6 8 0" />
    </svg>
  );
}