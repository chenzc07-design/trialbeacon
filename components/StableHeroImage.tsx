'use client';

import Image from 'next/image';
import { useState } from 'react';

const PRIMARY_IMAGE = '/home-research-hero.jpg';
const FALLBACK_IMAGE = '/og-image.svg';

/**
 * Keeps the desktop hero visual stable using two bundled, local assets. The
 * fallback is only used after an image error; no remote asset is requested.
 */
export function StableHeroImage({ alt }: { alt: string }) {
  const [src, setSrc] = useState(PRIMARY_IMAGE);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority
      sizes="(max-width: 1024px) 100vw, 420px"
      className="object-cover"
      onError={() => {
        if (src !== FALLBACK_IMAGE) setSrc(FALLBACK_IMAGE);
      }}
    />
  );
}
