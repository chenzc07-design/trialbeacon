import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { baselineCancerStats, SNAPSHOT_DATE } from '@/lib/data';
import { SOURCES } from '@/lib/sources';
import { SearchBox } from '@/components/SearchBox';
import { FreshnessBadge } from '@/components/FreshnessBadge';
import { DeviceText } from '@/components/DeviceText';
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

const SOURCES_PILLS = Object.values(SOURCES).map((s) => ({
  id: s.id,
  label: s.label,
  region: s.region,
  url: s.url,
  fullName: s.fullName,
}));

/**
 * Per-locale title and description. Without this the homepage inherits the
 * root layout's single English pair, so all six languages get indexed under
 * the same English snippet.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return {
    // `absolute` keeps the "· TrialBeacon" template off the homepage title,
    // which already names the site.
    title: { absolute: m.home.metaTitle },
    description: m.home.metaDescription,
    openGraph: {
      title: m.home.metaTitle,
      description: m.home.metaDescription,
    },
    twitter: {
      title: m.home.metaTitle,
      description: m.home.metaDescription,
    },
  };
}

export default async function HomePage() {
  const { messages: m } = await getServerMessages();
  const stats = baselineCancerStats();

  return (
    <>
      {/* ============== Hero (desktop + mobile) ============== */}
      <section className="relative overflow-hidden border-b border-slateish-200 bg-gradient-to-b from-navy-50/50 via-white to-white">
        <div className="container-page py-12 sm:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div>
              <p className="label-eyebrow">{m.home.eyebrow}</p>

              {/* One H1 — only ONE of the two strings is ever in the DOM.
                  Desktop shows the full version, mobile the short one. */}
              <DeviceText
                as="h1"
                desktop={m.home.title1}
                mobile={m.home.title1Short}
                className="mt-4 text-[26px] font-semibold leading-tight tracking-tight text-ink-950 sm:text-[40px] sm:leading-[1.16]"
              />

              {/* One subtitle — same device-aware, single-string behaviour. */}
              <DeviceText
                as="p"
                desktop={m.home.subtitle}
                mobile={m.home.subtitleShort}
                className="mt-5 max-w-xl text-[14px] leading-relaxed text-slateish-600 sm:text-[15px]"
              />

              {m.home.subtitleNo ? (
                <p className="mt-3 max-w-xl text-[13px] font-medium leading-relaxed text-slateish-500">
                  {m.home.subtitleNo}
                </p>
              ) : null}

              {/* Primary action — the After Care view is the point of the site. */}
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <Link href="/after-care" className="btn-primary justify-center">
                  <span className="hidden sm:inline">{m.home.heroCta}</span>
                  <span className="sm:hidden">{m.home.heroCtaShort}</span>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                      d="M3 7h8M7.5 3.5L11 7l-3.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
                <Link href="/cancers" className="btn-secondary justify-center">
                  {m.home.heroCtaSecondary}
                </Link>
              </div>

              <div className="mt-6 max-w-xl">
                <SearchBox size="lg" />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slateish-500">
                <span>{m.common.noMedicalAdvice}</span>
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slateish-300" />
                <span>{m.common.noRecommendations}</span>
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slateish-300" />
                <span>{m.common.freeToUse}</span>
              </div>

              <div className="mt-4">
                <FreshnessBadge />
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] shadow-card-hover">
                <Image
                  src="/tb-hero.png"
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card-hover">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-xl">
                  🛡️
                </span>
                <div>
                  <div className="text-sm font-semibold text-ink-950">{m.home.badgeVerbatim}</div>
                  <div className="text-xs text-slateish-500">{m.home.badgeRegions}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== After Care — the absolute hero block ============== */}
      <section className="container-page mt-8 sm:mt-10">
        <Link
          href="/after-care"
          className="card-interactive group flex flex-col gap-5 border-navy-100 bg-gradient-to-br from-navy-50/70 via-white to-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7"
          aria-label={m.home.afterCareTitle}
        >
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-700 text-white">
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                <path
                  d="M12 21c-4.5-3-8-6.2-8-10a5 5 0 019-3 5 5 0 019 3c0 3.8-3.5 7-8 10l-1 .7-1-.7z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  fill="none"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="label-eyebrow">{m.home.afterCareKicker}</p>
              <h2 className="mt-1 text-xl font-semibold text-ink-950 sm:text-2xl">
                {m.home.afterCareTitle}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slateish-600">
                {m.home.afterCareBody}
              </p>
              {m.home.afterCareNotRec ? (
                <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slateish-500">
                  {m.home.afterCareNotRec}
                </p>
              ) : null}
              <p className="mt-3 max-w-2xl text-[11px] leading-relaxed text-slateish-400">
                {m.home.afterCareFoot}
              </p>
            </div>
          </div>
          <span className="btn-primary shrink-0 self-start group-hover:brightness-110 sm:self-center">
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

      {/* ============== Cancer types — de-emphasised, just an entry ============== */}
      <section className="container-page mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-ink-950">
              {m.home.cancerListTitle}
            </h2>
            <p className="mt-1 text-sm text-slateish-500">{m.home.cancerListSub}</p>
          </div>
          <Link href="/cancers" className="btn-ghost text-[13px]">
            {m.home.cancerListCta} →
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {stats.map((c) => (
            <Link
              key={c.slug}
              href={`/cancers/${c.slug}`}
              className="card-interactive group flex items-center gap-3 p-3 sm:p-4"
            >
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slateish-100">
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-[14px] font-semibold text-ink-950">
                    {m.cancers[c.slug].label}
                  </h3>
                  <svg
                    className="h-3 w-3 shrink-0 text-slateish-300 transition-all group-hover:translate-x-0.5 group-hover:text-navy-500"
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
                <p className="mt-0.5 truncate text-[11px] text-slateish-500">
                  {m.cancers[c.slug].descriptor}
                </p>
                <p className="mt-1 text-[11px] tabular-nums text-slateish-500">
                  {t(m, 'common.recordsIndexed', { n: c.total })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============== Sources strip ============== */}
      <section className="container-page mt-14">
        <div className="card p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-ink-950">
                {m.home.sourcesTitle}
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slateish-500">
                <span>
                  {t(m, 'home.sourcesSub', { date: SNAPSHOT_DATE })}
                </span>
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slateish-300" />
                <FreshnessBadge />
              </p>
            </div>
            <Link href="/sources" className="btn-secondary text-[13px]">
              {m.home.sourcesCta}
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {SOURCES_PILLS.map((s) => (
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

      {/* ============== Principles ============== */}
      <section className="container-page mt-14">
        <h2 className="text-lg font-semibold tracking-tight">{m.home.principlesTitle}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* ============== Get the app ============== */}
      <section className="container-page mt-14">
        <div className="card flex flex-col items-center gap-4 p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-2xl">📱</span>
          <h2 className="text-xl font-semibold tracking-tight text-ink-950">Take TrialBeacon with you</h2>
          <p className="max-w-md text-sm text-slateish-500">
            Scan to open TrialBeacon on your phone — your official clinical-trial record, wherever you are.
          </p>
          <div className="rounded-2xl bg-white p-3 shadow-card-hover ring-1 ring-slateish-200">
            <Image
              src="/tb-app-qr.png"
              alt="QR code — scan to open TrialBeacon at trialbeacon.cn"
              width={180}
              height={180}
            />
          </div>
          <p className="text-xs text-slateish-400">trialbeacon.cn</p>
        </div>
      </section>
    </>
  );
}
