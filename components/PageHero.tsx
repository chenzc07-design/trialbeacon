import Image from 'next/image';

type Props = {
  eyebrow: string;
  title: string;
  intro?: string;
  /** extra content (chips, badges) rendered under the intro on the right */
  meta?: React.ReactNode;
};

/**
 * Inner-page banner. A calm, low-saturation background image with a soft
 * white-to-transparent gradient on the left so the headline always hits AA
 * contrast, regardless of the photo crop.
 *
 * Re-used across /cancers, /after-care, /changes, /search, /alerts,
 * /sources, /about, /disclaimer, /unsubscribe to give the whole site a
 * consistent visual rhythm without resorting to stock photography.
 */
export function PageHero({ eyebrow, title, intro, meta }: Props) {
  return (
    <section
      className="relative isolate overflow-hidden border-b border-slateish-200/70"
      aria-label="Page header"
    >
      {/* Layered background image — right-aligned focal motif, softens to white on the left */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[#f5f7fb]"
      >
        <Image
          src="/page-hero-bg.png"
          alt=""
          fill
          priority={false}
          sizes="100vw"
          className="object-cover object-right opacity-90"
        />
      </div>
      {/* Soft left scrim — keeps the heading readable */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(to right, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.85) 35%, rgba(255,255,255,0.25) 65%, rgba(255,255,255,0) 100%)',
        }}
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
          </div>
          {meta ? <div className="shrink-0">{meta}</div> : null}
        </div>
      </div>
    </section>
  );
}