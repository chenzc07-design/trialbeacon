import { FreshnessBadge } from './FreshnessBadge';

type Props = {
  eyebrow: string;
  title: string;
  intro?: string;
  /** extra content (chips, badges, CTAs) rendered under the intro on the right */
  meta?: React.ReactNode;
  /** render the "Last verified" badge in the header (consistent with the homepage) */
  freshness?: boolean;
};

/**
 * Inner-page banner. A calm, low-saturation light background with the same
 * faint geometric texture used on the homepage hero, so every branch page
 * reads as one family: small label → title → one-line subtitle →
 * "Last verified" badge. No photographs, no institutional logos.
 *
 * Re-used across /cancers, /after-care, /changes, /search, /alerts,
 * /sources, /about, /disclaimer, /unsubscribe and /pro to give the whole
 * site a consistent visual rhythm.
 */
export function PageHero({ eyebrow, title, intro, meta, freshness }: Props) {
  return (
    <section
      className="relative isolate overflow-hidden border-b border-slateish-200 bg-gradient-to-b from-slateish-50 via-white to-white"
      aria-label="Page header"
    >
      {/* Faint geometric line-art texture — same motif as the homepage hero,
          kept very light so the headline always hits AA contrast. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[url('/hero-bg.svg')] bg-cover bg-center opacity-60"
      />

      <div className="container-page py-10 sm:py-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="label-eyebrow">{eyebrow}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
              {title}
            </h1>
            {intro ? (
              <p className="mt-3 max-w-prose text-sm leading-relaxed text-slateish-600">
                {intro}
              </p>
            ) : null}
            {freshness ? (
              <div className="mt-4">
                <FreshnessBadge />
              </div>
            ) : null}
          </div>
          {meta ? <div className="shrink-0">{meta}</div> : null}
        </div>
      </div>
    </section>
  );
}
