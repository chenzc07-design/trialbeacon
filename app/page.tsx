import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { baselineCancerStats, SNAPSHOT_DATE } from '@/lib/data';
import { SOURCES } from '@/lib/sources';
import { SearchBox } from '@/components/SearchBox';
import { FreshnessBadge } from '@/components/FreshnessBadge';
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

// Image-led sections restored from the pre-optimization design, using the
// full provided image set (hero photo + steps + tools + trust + gallery + QR).
const STEPS = [
  {
    n: 1,
    img: '/tb-search.png',
    title: 'Search your condition',
    body: 'Type your diagnosis or browse 10+ cancer types. Each page pulls in clinical trial registrations, guideline indexes and regulatory notices from official sources.',
  },
  {
    n: 2,
    img: '/tb-consult.png',
    title: 'Understand the landscape',
    body: 'See what is publicly listed for your cancer type — including advanced, recurrent or later-line options — with a direct link to the original page for every entry.',
  },
  {
    n: 3,
    img: '/tb-community.png',
    title: 'Find what fits you',
    body: 'Share the official records with your care team. Every entry links straight to its source so you and your doctor can verify it together.',
  },
];

const TRUST = [
  {
    img: '/tb-data-source.png',
    title: 'Real-time official data',
    body: 'Every trial comes directly from ClinicalTrials.gov, the EU register and Chinese regulatory sources. No third-party data brokers, no reselling.',
  },
  {
    img: '/tb-privacy.png',
    title: 'Your data stays yours',
    body: 'We do not track you across the web, build advertising profiles from your health searches, or sell your data. No login required.',
  },
  {
    img: '/tb-free-use.png',
    title: 'Free for every patient & caregiver',
    body: '100% free, forever. Sponsors never influence what we list. Your health is personal — and your search history should be too.',
  },
];

const GALLERY = [
  { img: '/tb-research.png', cap: 'Breakthroughs, studied in the lab' },
  { img: '/tb-medical-team.png', cap: 'Care teams, coordinating together' },
  { img: '/tb-innovation.png', cap: 'Precision medicine, moving forward' },
  { img: '/tb-patient-story.png', cap: 'Patients, supported at home' },
  { img: '/tb-empowerment.png', cap: 'You, in control of the search' },
  { img: '/tb-hospital.png', cap: 'Trials, run at trusted centers' },
];

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
      <section className="relative overflow-hidden border-b border-slateish-200 bg-gradient-to-b from-slateish-50 via-white to-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[url('/hero-bg.svg')] bg-cover bg-center opacity-60"
        />
        <div className="container-page relative py-14 sm:py-24">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div>
              <p className="label-eyebrow">{m.home.eyebrow}</p>

              {/* Title: both strings exist in the DOM but only one is shown via CSS.
                  Desktop (≥768px) shows the full version; mobile (<768px) the short one. */}
              <h1 className="mt-4 text-[26px] font-semibold leading-tight tracking-tight text-ink-950 md:text-[40px] md:leading-[1.16]">
                <span className="hidden md:block">{m.home.title1}</span>
                <span className="md:hidden">{m.home.title1Short}</span>
              </h1>

              {/* Subtitle: same CSS-only show/hide, no concatenation. */}
              <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-slateish-600 md:text-[15px]">
                <span className="hidden md:block">{m.home.subtitle}</span>
                <span className="md:hidden">{m.home.subtitleShort}</span>
              </p>

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
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] shadow-card-hover ring-1 ring-ink-950/10">
                <Image
                  src="/tb-hero.png"
                  alt="Hands cupping a source of light — a symbol of care"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card-hover ring-1 ring-slateish-200">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-white">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none">
                    <path
                      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      fill="none"
                      strokeLinejoin="round"
                    />
                  </svg>
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

      {/* ============== After Care — dedicated view ============== */}
      <section className="container-page mt-10 sm:mt-14">
        <Link
          href="/after-care"
          className="card-interactive group flex flex-col gap-5 overflow-hidden border-l-4 border-l-ink-900 border-navy-100 bg-gradient-to-br from-navy-50/70 via-white to-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
          aria-label={m.home.afterCareTitle}
        >
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink-900 text-white">
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none">
                <path
                  d="M7 21h10a3 3 0 003-3V6a3 3 0 00-3-3H7a3 3 0 00-3 3v12a3 3 0 003 3z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 7h8M8 11h8M8 15h5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
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

      {/* ============== How it works ============== */}
      <section className="container-page mt-16">
        <div className="text-center">
          <p className="label-eyebrow mx-auto">How TrialBeacon works</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Three steps to the official record</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slateish-500">
            We never rank, evaluate or suggest treatments. Titles are reproduced verbatim from the
            official record — so you always see what is actually listed.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="card overflow-hidden">
              <div className="relative aspect-[3/2] w-full overflow-hidden bg-slateish-100">
                <Image
                  src={s.img}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-sm font-semibold text-navy-700">
                  {s.n}
                </span>
                <h3 className="mt-3 text-base font-semibold text-ink-950">{s.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slateish-600">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============== Cancer types — clean card index ============== */}
      <section className="container-page mt-16">
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {stats.map((c) => (
            <Link
              key={c.slug}
              href={`/cancers/${c.slug}`}
              className="card-interactive group flex items-center gap-4 p-4"
            >
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slateish-100 ring-1 ring-slateish-200/60">
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

      {/* ============== Built for patients / trust ============== */}
      <section className="mt-16 bg-ink-950">
        <div className="container-page py-16">
          <div className="text-center">
            <p className="label-eyebrow mx-auto !text-navy-300">Built for patients, by design</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              Honest by architecture
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slateish-300">
              Most cancer information is scattered across journals, pharma sites and dense government
              databases. TrialBeacon brings it together — with guardrails that protect you.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST.map((item) => (
              <div
                key={item.title}
                className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-white/5">
                  <Image
                    src={item.img}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slateish-300">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== Sources strip ============== */}
      <section className="container-page mt-16">
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
      <section className="container-page mt-16">
        <h2 className="text-lg font-semibold tracking-tight">{m.home.principlesTitle}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLE_KEYS.map((key, i) => (
            <div key={key} className="card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  {PRINCIPLE_ICONS[i]}
                </svg>
              </span>
              <h3 className="mt-4 text-sm font-semibold text-ink-950">
                {m.home.principles[key].title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-slateish-600">
                {m.home.principles[key].body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============== Behind the records — gallery ============== */}
      <section className="container-page mt-16">
        <div className="text-center">
          <p className="label-eyebrow mx-auto">Behind every record</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            The science &amp; people behind the index
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slateish-500">
            Every listing traces back to researchers, clinicians, regulators and the patients
            themselves. TrialBeacon quietly stitches their public work into one place.
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GALLERY.map((g) => (
            <div
              key={g.img}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-card"
            >
              <Image
                src={g.img}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/70 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="text-sm font-semibold text-white">{g.cap}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============== Get the app ============== */}
      <section className="container-page mt-16 mb-10">
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
