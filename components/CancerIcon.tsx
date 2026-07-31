type Props = {
  slug: string;
  className?: string;
  /** override stroke color via CSS `color` */
  style?: React.CSSProperties;
};

/**
 * Brand-consistent abstract icons for each cancer type. All strokes use
 * `currentColor` so the parent `color` (Tailwind text-* utility) drives them.
 * The motifs are deliberately symbolic, not anatomical, to keep a calm,
 * neutral tone consistent with the rest of TrialBeacon.
 */
export function CancerIcon({ slug, className = 'h-7 w-7', style }: Props) {
  const common = (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {ICONS[slug] ?? DEFAULT_ICON}
    </svg>
  );
  return common;
}

const ICONS: Record<string, React.ReactNode> = {
  // lung: two side-by-side rounded lobe silhouettes with a central airway
  lung: (
    <>
      <path d="M9 6c-3 0-5 3-5 7s2 9 4 11c1.5 1.5 3 2 4 1 .8-.8 1-2 1-3V9c0-1.6-1.4-3-3-3h-1z" />
      <path d="M23 6c3 0 5 3 5 7s-2 9-4 11c-1.5 1.5-3 2-4 1-.8-.8-1-2-1-3V9c0-1.6 1.4-3 3-3h1z" />
      <path d="M16 5v22" />
      <path d="M14 9h4M14 13h4M14 17h4" />
    </>
  ),
  // breast: circle + sentinel node dot network
  breast: (
    <>
      <circle cx="16" cy="16" r="9" />
      <circle cx="16" cy="16" r="5" />
      <circle cx="16" cy="16" r="1.6" fill="currentColor" />
      <path d="M7 16h4M21 16h4M16 7v4M16 21v4" />
    </>
  ),
  // colorectal: stylized colon curve
  colorectal: (
    <>
      <path d="M6 12h6c0-3 2-5 4-5s4 2 4 5h6" />
      <path d="M6 20h6c0 3 2 5 4 5s4-2 4-5h6" />
      <circle cx="9" cy="16" r="1.6" fill="currentColor" />
      <circle cx="23" cy="16" r="1.6" fill="currentColor" />
    </>
  ),
  // liver: triangular wedge
  liver: (
    <>
      <path d="M6 22h12l8-10-6-2-6-4-8 6z" />
      <path d="M12 16c2-1 4-1 6 0" />
      <path d="M14 20c2-1 4-1 6 0" />
    </>
  ),
  // gastric: pouch shape
  gastric: (
    <>
      <path d="M9 8h14l-2 12c-.4 2.4-2.5 4-5 4h-2c-2.5 0-4.6-1.6-5-4z" />
      <path d="M11 12v3M15 12v4M19 12v3" />
      <path d="M9 8V6h14v2" />
    </>
  ),
  // pancreatic: elongated lobed shape
  pancreatic: (
    <>
      <path d="M4 14c2-4 5-5 8-4s5 0 8-2 6-2 8 0-2 8-7 10-12 1-15-1-4 0-2-3z" />
      <circle cx="11" cy="13" r="1.4" fill="currentColor" />
      <circle cx="21" cy="13" r="1.4" fill="currentColor" />
    </>
  ),
  // prostate: walnut shape (two ovals + stem)
  prostate: (
    <>
      <ellipse cx="12" cy="17" rx="5" ry="6" />
      <ellipse cx="20" cy="17" rx="5" ry="6" />
      <path d="M16 9V5" />
      <circle cx="16" cy="4" r="1.4" fill="currentColor" />
    </>
  ),
  // ovarian: two overlapping ovals
  ovarian: (
    <>
      <ellipse cx="12" cy="16" rx="5" ry="7" />
      <ellipse cx="20" cy="16" rx="5" ry="7" />
      <path d="M16 9V5" />
      <circle cx="16" cy="4" r="1.4" fill="currentColor" />
    </>
  ),
  // cervical: stylized cell + spindle
  cervical: (
    <>
      <ellipse cx="16" cy="14" rx="7" ry="9" />
      <path d="M16 23v5" />
      <path d="M13 27h6" />
      <circle cx="13" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="16" r="1" fill="currentColor" />
    </>
  ),
  // renal: kidney bean
  renal: (
    <>
      <path d="M22 6c-5 0-10 4-10 11s4 9 8 9 8-3 8-9-2-11-6-11z" />
      <path d="M19 11c-3 0-5 2-5 6" />
      <circle cx="17" cy="20" r="1.6" fill="currentColor" />
    </>
  ),
  // generic fallback (also used when slug unknown)
  generic: (
    <>
      <circle cx="16" cy="16" r="10" />
      <circle cx="16" cy="16" r="5" />
      <circle cx="16" cy="16" r="1.6" fill="currentColor" />
    </>
  ),
};

const DEFAULT_ICON = ICONS.generic;