export function BeaconMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#1e3350" />
      <path
        d="M16 7v4"
        stroke="#9bb8d8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9.5 9.5l2.8 2.8M22.5 9.5l-2.8 2.8"
        stroke="#6892c1"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="17.5" r="3.2" fill="#fff" />
      <path
        d="M11 25.5c1.2-2.6 2.9-4 5-4s3.8 1.4 5 4"
        stroke="#c6d7ea"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <BeaconMark />
      <span className="text-[17px] font-semibold tracking-tight text-ink-950">
        TrialBeacon
      </span>
    </span>
  );
}
