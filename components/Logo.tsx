export function BeaconMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <g
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="16" cy="7" r="2" fill="#E2A6A6" stroke="none" />
        <path d="M16 9.5 V18" />
        <path d="M11 25 L16 18 L21 25" />
        <path d="M12.5 13.5 A6 6 0 0 1 19.5 13.5" strokeWidth={1.5} />
        <path d="M14 11 A3.5 3.5 0 0 1 18 11" strokeWidth={1.5} />
      </g>
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={`flex items-center gap-2.5 text-navy-900 ${className ?? ''}`}
    >
      <BeaconMark />
      <span className="text-[17px] font-semibold tracking-tight">
        TrialBeacon
      </span>
    </span>
  );
}
