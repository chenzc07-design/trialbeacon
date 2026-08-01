export function BeaconMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <g
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 11 L19 11 L22.5 27 L9.5 27 Z" />
        <path d="M12.3 14 L19.7 14" strokeWidth={1.5} />
        <path d="M12.5 9 A4 4 0 0 1 19.5 9" strokeWidth={1.5} />
        <path d="M10.5 9 A6 6 0 0 1 21.5 9" strokeWidth={1.5} />
        <circle cx="16" cy="9" r="2" fill="#E2A6A6" stroke="none" />
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
