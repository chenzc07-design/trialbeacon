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

const TOOLS = [
  { img: '/tb-drug-decoder.png', icon: '💊', title: 'Drug Decoder', body: 'Plain-English profiles for cancer drugs — what each one does, key trial results and approval history, sourced from official labels.' },
  { img: '/tb-treatment-arcs.png', icon: '📈', title: 'Treatment Arcs', body: 'See a month-by-month timeline of what to expect on a therapy, which labs to ask about, and when to talk to your specialist.' },
  { img: '/tb-match-me.png', icon: '🎯', title: 'Match Me', body: 'Enter your age, location and treatment history. We surface the publicly listed trials that fit your profile first.' },
  { img: '/tb-med-check.png', icon: '⚠️', title: 'Medication conflict checker', body: 'Check which of your current medications might conflict with a trial’s listed eligibility criteria — before you ask your team.' },
  { img: '/tb-drug-compare.png', icon: '⚖️', title: 'Drug comparison charts', body: 'Compare approved drugs for the same cancer side by side — mechanism, dosing, side effects and trial data in one view.' },
  { img: '/tb-genetics.png', icon: '🧬', title: 'Genetics & testing', body: 'Understand how your mutation type affects eligibility, and find CLIA-certified testing labs from the official registry.' },
];

const TRUST = [
  { img: '/tb-data-source.png', icon: '📊', title: 'Real-time official data', body: 'Every trial comes directly from ClinicalTrials.gov, the EU register and Chinese regulatory sources. No third-party data brokers, no reselling.' },
  { img: '/tb-ai-tech.png', icon: '🤖', title: 'AI that speaks your language', body: 'Eligibility criteria are written for review boards. Our AI rewrites them so you can tell in seconds whether a record might apply to you.' },
  { img: '/tb-privacy.png', icon: '🔒', title: 'Your data stays yours', body: 'We do not track you across the web, build advertising profiles from your health searches, or sell your data. No login required.' },
  { img: '/tb-free-use.png', icon: '👥', title: 'Free for every patient & caregiver', body: '100% free, forever. Sponsors never influence what we list. Your health is personal — and your search history should be too.' },
];

const GALLERY = [
  { img: '/tb-research.png', cap: 'Breakthroughs, studied in the lab' },
  { img: '/tb-medical-team.png', cap: 'Care teams, coordinating together' },
  { img: '/tb-innovation.png', cap: 'Precision medicine, moving forward' },
  { img: '/tb-patient-story.png', cap: 'Patients, supported at home' },
  { img: '/tb-empowerment.png', cap: 'You, in control of the search' },
  { img: '/tb-hospital.png', cap: 'Trials, run at trusted centers' },
];

export default async function HomePage() {
  const { messages: m } = await getServerMessages();
  const stats = baselineCancerStats();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slateish-200 bg-gradient-to-b from-navy-50/50 via-white to-white">
        <div className="container-page py-16 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="label-eyebrow">{m.home.eyebrow}</p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-[44px] sm:leading-[1.12]">
                {m.home.title1}
                <br className="hidden sm:block" />
                <span className="text-navy-600"> {m.home.title2}</span>
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slateish-600">
                {m.home.subtitle}
              </p>

              <div className="mt-8 max-w-xl">
                <SearchBox size="lg" />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slateish-500">
                <span>{m.common.noMedicalAdvice}</span>
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slateish-300" />
                <span>{m.common.noRecommendations}</span>
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slateish-300" />
                <span>{m.common.freeToUse}</span>
              </div>

              <div className="mt-8 flex flex-wrap gap-6">
                <div>
                  <div className="text-2xl font-semibold text-navy-700">3</div>
                  <div className="text-xs text-slateish-500">Regions indexed</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-navy-700">10+</div>
                  <div className="text-xs text-slateish-500">Cancer types</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-navy-700">100%</div>
                  <div className="text-xs text-slateish-500">Free &amp; private</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] shadow-card-hover">
                <Image
                  src="/tb-hero.png"
                  alt="Hands cupping a glowing heart — a symbol of hope for cancer patients"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card-hover">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-xl">🛡️</span>
                <div>
                  <div className="text-sm font-semibold text-ink-950">Verbatim from source</div>
                  <div className="text-xs text-slateish-500">US · EU · China official records</div>
                </div>
              </div>
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

      {/* How it works */}
      <section className="container-page mt-16">
        <div className="text-center">
          <p className="label-eyebrow mx-auto">How TrialBeacon works</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Three steps to the official record
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slateish-500">
            We never rank, evaluate or suggest treatments. Titles are reproduced verbatim from the official record — so you always see what is actually listed.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="card overflow-hidden">
              <div className="relative aspect-[3/2] w-full overflow-hidden">
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

      {/* Cancer types */}
      <section className="container-page mt-16">
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

      {/* Tools / feature modules */}
      <section className="container-page mt-16">
        <div className="text-center">
          <p className="label-eyebrow mx-auto">More than a search box</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Tools built around the official record
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slateish-500">
            TrialBeacon brings scattered government and regulatory data together in one quiet, plain-language place — for the people who actually need it.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <div key={tool.title} className="card flex flex-col p-5">
              <div className="relative mb-4 aspect-[16/10] w-full overflow-hidden rounded-xl">
                <Image
                  src={tool.img}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <h3 className="text-base font-semibold text-ink-950">
                {tool.icon} {tool.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slateish-600">{tool.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Built for patients / trust */}
      <section className="mt-16 bg-ink-950">
        <div className="container-page py-16">
          <div className="text-center">
            <p className="label-eyebrow mx-auto !bg-navy-500/20 !text-navy-300">Built for patients, by design</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              Honest by architecture
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slateish-300">
              Most cancer information is scattered across journals, pharma sites and dense government databases. TrialBeacon brings it together — with guardrails that protect you.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((item) => (
              <div key={item.title} className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image
                    src={item.img}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 25vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold text-white">
                    {item.icon} {item.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slateish-300">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
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

      {/* Behind the records — gallery */}
      <section className="container-page mt-16">
        <div className="text-center">
          <p className="label-eyebrow mx-auto">Behind every record</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            The science &amp; people behind the index
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slateish-500">
            Every listing traces back to researchers, clinicians, regulators and the patients themselves. TrialBeacon quietly stitches their public work into one place.
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GALLERY.map((g) => (
            <div key={g.img} className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-card">
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

      {/* Get the app / scan QR */}
      <section className="container-page mt-16">
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
