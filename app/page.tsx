import Link from 'next/link';
import Image from 'next/image';
import { baselineCancerStats, SNAPSHOT_DATE } from '@/lib/data';
import { SOURCES } from '@/lib/sources';
import { SearchBox } from '@/components/SearchBox';
import { t, getServerMessages } from '@/lib/i18n-server';

const PRINCIPLE_ICONS = [
  (
    <path
      d="M12 3l7 3v5c0 4.4-3 8.4-7 9.5C8 19.4 5 15.4 5 11V6l7-3z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M8.5 12h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path
        d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.2-3.8-8.5s1.3-6.2 3.8-8.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </>
  ),
  (
    <>
      <path
        d="M10 14l4-4M9 7l1-1a4 4 0 015.7 5.7l-1 1M15 17l-1 1A4 4 0 018.3 12.3l1-1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
];

const PRINCIPLE_KEYS = ['official', 'noRec', 'threeRegions', 'traceable'] as const;

export default async function HomePage() {
  const { messages: m } = await getServerMessages();
  const stats = baselineCancerStats();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slateish-200">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-photo.png')" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0"
          style={{
            // Soft left scrim so the heading hits AA contrast while the photo
            // stays visible on the right half of the viewport.
            background:
              'linear-gradient(to right, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.82) 38%, rgba(255,255,255,0.28) 72%, rgba(255,255,255,0) 100%)',
          }}
          aria-hidden="true"
        />
        <div className="container-page relative py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="label-eyebrow">{m.home.eyebrow}</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-[42px] sm:leading-[1.15]">
              {m.home.title1}
              <br className="hidden sm:block" />
              <span className="text-navy-600"> {m.home.title2}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-slateish-600">
              {m.home.subtitle}
            </p>

            <div className="mx-auto mt-8 max-w-xl">
              <SearchBox size="lg" />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slateish-500">
              <span>{m.common.noMedicalAdvice}</span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slateish-300" />
              <span>{m.common.noRecommendations}</span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slateish-300" />
              <span>{m.common.freeToUse}</span>
            </div>
          </div>
        </div>
      </section>

      {/* After-care entry */}
      <section className="container-page mt-10">
        <Link
          href="/after-care"
          className="card-interactive group flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7"
        >
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M12 21c-4.5-3-8-6.2-8-10a5 5 0 019-3 5 5 0 019 3c0 3.8-3.5 7-8 10l-1 .7-1-.7z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink-950">
                {m.home.afterCareTitle}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slateish-600">
                {m.home.afterCareBody}
              </p>
            </div>
          </div>
          <span className="btn-secondary shrink-0 self-start group-hover:border-navy-400 sm:self-center">
            {m.home.afterCareCta}
            <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M3 7h8M7.5 3.5L11 7l-3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </Link>
      </section>

      {/* Cancer types */}
      <section className="container-page mt-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{m.cancersIndex.title}</h2>
            <p className="mt-1 text-sm text-slateish-500">
              {m.cancersIndex.subtitle}
            </p>
          </div>
          <Link href="/cancers" className="btn-ghost text-[13px]">
            {m.common.viewAllTypes} →
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats.map((c) => (
            <Link
              key={c.slug}
              href={`/cancers/${c.slug}`}
              className="card-interactive group flex flex-col overflow-hidden p-0"
            >
              <div className="relative aspect-[1.55/1] w-full overflow-hidden bg-slateish-100">
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex flex-col gap-2.5 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-ink-950">
                    {m.cancers[c.slug].label}
                  </h3>
                  <svg
                    className="h-3.5 w-3.5 text-slateish-300 transition-all group-hover:translate-x-0.5 group-hover:text-navy-500"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 7h8M7.5 3.5L11 7l-3.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-xs text-slateish-500">{m.cancers[c.slug].descriptor}</p>
                <div className="mt-auto flex items-center gap-1.5 pt-1 text-[11px] text-slateish-500">
                  <span className="chip border-slateish-200 bg-slateish-100 text-slateish-600">
                    {t(m, 'common.recordsIndexed', { n: c.total })}
                  </span>
                  <span className="chip border-navy-100 bg-navy-50 text-navy-700">
                    {t(m, 'common.advancedLaterLine', { n: c.afterCare })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="container-page mt-16">
        <h2 className="text-xl font-semibold tracking-tight">{m.home.principlesTitle}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLE_KEYS.map((key, i) => (
            <div key={key} className="card p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  {PRINCIPLE_ICONS[i]}
                </svg>
              </span>
              <h3 className="mt-3.5 text-sm font-semibold text-ink-950">
                {m.home.principles[key].title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slateish-600">
                {m.home.principles[key].body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Sources strip */}
      <section className="container-page mt-16">
        <div className="card p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-ink-950">
                {m.home.sourcesTitle}
              </h2>
              <p className="mt-1 text-sm text-slateish-500">
                {t(m, 'home.sourcesSub', { date: SNAPSHOT_DATE })}
              </p>
            </div>
            <Link href="/sources" className="btn-secondary text-[13px]">
              {m.home.sourcesCta}
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {Object.values(SOURCES).map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="chip border-slateish-200 bg-slateish-50 text-slateish-600 transition-colors hover:border-navy-300 hover:text-navy-700"
                title={s.fullName}
              >
                {s.label}
                <span className="text-slateish-400">· {s.region}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
