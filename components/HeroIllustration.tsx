export function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 560 420"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Abstract beacon illustration: a central signal aggregating records from three regions"
    >
      <defs>
        <linearGradient id="hiBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0b1220" />
          <stop offset="0.55" stopColor="#102036" />
          <stop offset="1" stopColor="#0f2742" />
        </linearGradient>
        <radialGradient id="hiCoreGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#5eead4" stopOpacity="0.25" />
          <stop offset="0.45" stopColor="#2dd4bf" stopOpacity="0.08" />
          <stop offset="1" stopColor="#2dd4bf" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hiAmbient" cx="0.5" cy="0.38" r="0.55">
          <stop offset="0" stopColor="#5eead4" stopOpacity="0.14" />
          <stop offset="0.5" stopColor="#2dd4bf" stopOpacity="0.05" />
          <stop offset="1" stopColor="#2dd4bf" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hiBeam" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#e2e8f0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#e2e8f0" stopOpacity="0" />
        </linearGradient>
        <pattern id="hiDots" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1.8" cy="1.8" r="1" fill="#cbd5e1" fillOpacity="0.05" />
        </pattern>
      </defs>

      {/* base panel */}
      <rect width="560" height="420" fill="url(#hiBg)" />
      <rect width="560" height="420" fill="url(#hiDots)" />
      <rect width="560" height="420" fill="url(#hiAmbient)" />

      {/* calm concentric beacon arcs */}
      <g fill="none" stroke="#e2e8f0" strokeOpacity="0.10" strokeWidth="1.3">
        <circle cx="280" cy="170" r="46" />
        <circle cx="280" cy="170" r="92" />
        <circle cx="280" cy="170" r="138" />
        <circle cx="280" cy="170" r="184" />
        <circle cx="280" cy="170" r="232" />
      </g>

      {/* data aggregation lines to regional nodes */}
      <g stroke="#94a3b8" strokeOpacity="0.18" strokeWidth="1.1" fill="none">
        <path d="M280 170 L110 92" />
        <path d="M280 170 L450 86" />
        <path d="M280 170 L92 300" />
        <path d="M280 170 L470 300" />
        <path d="M280 170 L210 250" />
        <path d="M280 170 L360 250" />
      </g>

      {/* region nodes (subdued, cool palette) */}
      <g stroke="#e2e8f0" strokeOpacity="0.45" strokeWidth="1.2">
        <circle cx="110" cy="92" r="7" fill="#2563a8" fillOpacity="0.45" />
        <circle cx="450" cy="86" r="7" fill="#3f6f5e" fillOpacity="0.45" />
        <circle cx="92" cy="300" r="7" fill="#8a5a2b" fillOpacity="0.45" />
        <circle cx="470" cy="300" r="7" fill="#2563a8" fillOpacity="0.45" />
        <circle cx="210" cy="250" r="5" fill="#cbd5e1" fillOpacity="0.20" />
        <circle cx="360" cy="250" r="5" fill="#cbd5e1" fillOpacity="0.20" />
      </g>

      {/* upward beacon beam */}
      <path d="M280 170 L266 36 L294 36 Z" fill="url(#hiBeam)" opacity="0.45" />
      <path d="M280 170 L280 36" stroke="#e2e8f0" strokeOpacity="0.22" strokeWidth="1" />

      {/* core beacon diamond */}
      <circle cx="280" cy="170" r="34" fill="url(#hiCoreGlow)" />
      <path d="M280 150 L299 170 L280 190 L261 170 Z" fill="#e2e8f0" fillOpacity="0.9" />
      <path d="M280 158 L292 170 L280 182 L268 170 Z" fill="#0d9488" fillOpacity="0.85" />
      <circle cx="280" cy="170" r="4" fill="#e2e8f0" />

      {/* faint horizon baseline */}
      <path
        d="M0 372 C 140 366 280 380 420 368 C 490 362 530 366 560 362"
        fill="none"
        stroke="#cbd5e1"
        strokeOpacity="0.10"
        strokeWidth="1.2"
      />
    </svg>
  );
}
