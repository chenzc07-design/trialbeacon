import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { baselineCancerStats, SNAPSHOT_DATE } from '@/lib/data';
import { SearchBox } from '@/components/SearchBox';
import { FollowCancerButton } from '@/components/FollowCancerButton';
import { StableHeroImage } from '@/components/StableHeroImage';
import { t, getServerMessages } from '@/lib/i18n-server';

const SOURCE_GROUPS = [
  { label: 'United States', items: ['ClinicalTrials.gov', 'FDA', 'NCCN'] },
  { label: 'Europe', items: ['EMA', 'CTIS', 'ESMO'] },
  { label: 'China', items: ['CDE', 'NMPA', 'ChiCTR'] },
];

export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return {
    title: { absolute: m.home.metaTitle },
    description: m.home.metaDescription,
    openGraph: { title: m.home.metaTitle, description: m.home.metaDescription },
    twitter: { title: m.home.metaTitle, description: m.home.metaDescription },
  };
}

export default async function HomePage() {
  const { messages: m } = await getServerMessages();
  const stats = baselineCancerStats();
  const totalRecords = stats.reduce((sum, item) => sum + item.total, 0);
  const snapshotNote = m.dataStatus.snapshot.replace('{date}', SNAPSHOT_DATE);

  return (
    <div className="relative overflow-hidden bg-[#f7f9fa]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-20 hidden w-[max(0px,calc((100vw-1200px)/2))] bg-[url('/home-side-texture.jpg')] bg-cover bg-right opacity-75 blur-[1px] lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-[max(0px,calc((100vw-1200px)/2))] scale-x-[-1] bg-[url('/home-side-texture.jpg')] bg-cover bg-left opacity-75 blur-[1px] lg:block"
      />

      <section className="relative overflow-hidden border-b border-[#d7e4e0] bg-[#eaf2ef] text-[#173044]">
        <div className="pointer-events-none absolute inset-0 bg-[url('/home-side-texture.jpg')] bg-cover bg-center opacity-30" />
        <div className="pointer-events-none absolute -right-36 -top-44 h-[520px] w-[520px] rounded-full border border-[#b9d0ca]/70 sm:h-[720px] sm:w-[720px]" />
        <div className="pointer-events-none absolute -right-16 -top-24 h-[360px] w-[360px] rounded-full border border-[#b9d0ca]/70 sm:h-[520px] sm:w-[520px]" />

        <div className="container-page relative py-10 sm:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,.92fr)] lg:items-center lg:gap-16">
            <div>
              <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#527080]">
                <span className="h-2 w-2 rounded-full bg-[#e5a56b] shadow-[0_0_0_5px_rgba(229,165,107,.14)]" />
                {m.home.eyebrow}
              </div>
              <h1 className="mt-5 max-w-3xl text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] text-[#173044] sm:text-[50px] lg:text-[60px]">
                {m.home.title1Short}
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[#527080] sm:text-[17px]">
                {m.home.subtitleShort}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/after-care"
                  className="btn-primary min-h-12 justify-center bg-[#0d1d32] px-5 text-[15px] hover:bg-[#18324f]"
                >
                  {m.home.heroCtaShort}
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/cancers"
                  className="btn-secondary min-h-12 justify-center border-[#abc3bc] bg-white/80 px-5 text-[15px] text-[#173044] hover:border-[#7ea39b] hover:bg-white"
                >
                  {m.home.browseAllTypes}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              <div className="mt-7 max-w-2xl rounded-2xl bg-white/90 p-2 shadow-[0_20px_60px_rgba(53,91,91,.16)] backdrop-blur-sm">
                <div className="min-w-0 [&_form]:!border-0 [&_form]:!shadow-none [&_input]:!bg-transparent [&_input]:!text-ink-950 [&_input]:!placeholder:text-slateish-400 [&_button]:!bg-[#0d1d32] [&_button]:hover:!bg-[#18324f]">
                  <SearchBox size="lg" placeholder={m.common.searchAria} />
                </div>
              </div>
            </div>

            <aside className="relative lg:pt-2" aria-label={m.home.freshnessTitle}>
              <div className="relative mb-4 h-36 overflow-hidden rounded-[26px] border border-white/70 bg-[#dbe9e5] shadow-[0_20px_55px_rgba(53,91,91,.12)] sm:h-44">
                <StableHeroImage alt={m.home.badgeVerbatim} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#173044]/55 via-transparent to-transparent" />
                <p className="absolute inset-x-0 bottom-0 p-4 text-xs font-medium tracking-wide text-white">{m.home.badgeVerbatim}</p>
              </div>

              <div className="rounded-[26px] border border-white/80 bg-white/80 p-5 shadow-[0_24px_70px_rgba(53,91,91,.14)] backdrop-blur-sm sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#527080]">{m.home.freshnessTitle}</p>
                    <p className="mt-2 text-sm leading-6 text-[#527080]">{m.common.lastVerified.replace('{date}', SNAPSHOT_DATE)}</p>
                  </div>
                  <span className="rounded-full border border-[#8bc6b3]/30 bg-[#8bc6b3]/10 px-2.5 py-1 text-[11px] font-medium text-[#39806d]">{m.common.continuouslyUpdated}</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 border-y border-[#d7e4e0] py-5">
                  <div className="rounded-2xl bg-[#edf4f1] p-4">
                    <div className="text-3xl font-semibold tracking-tight text-[#173044]">{totalRecords}+</div>
                    <div className="mt-1 text-xs text-[#527080]">{m.common.recordsIndexed.split('{n} ')[1] ?? m.common.recordsIndexed}</div>
                  </div>
                  <div className="rounded-2xl bg-[#edf4f1] p-4">
                    <div className="text-3xl font-semibold tracking-tight text-[#173044]">{stats.length}</div>
                    <div className="mt-1 text-xs text-[#527080]">{m.cancersIndex.title}</div>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-5 text-[#527080]">{snapshotNote}</p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-y border-slateish-200 bg-[#f7f9fa]">
        <div className="container-page py-12 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label-eyebrow">{m.cancersIndex.eyebrow}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950">{m.cancersIndex.title}</h2>
              <p className="mt-2 text-sm text-slateish-500">{m.cancersIndex.subtitle}</p>
            </div>
            <Link href="/cancers" className="btn-secondary text-[13px]">
              {m.home.browseAllTypes} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stats.map((c) => (
              <div key={c.slug} className="group flex min-h-[142px] flex-col rounded-2xl border border-slateish-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#9bb4c0] hover:shadow-card-hover">
                <Link href={`/cancers/${c.slug}`} className="flex flex-1 items-start gap-3">
                  <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[#d5e3df] bg-[#edf4f1]">
                    <Image src={c.image} alt="" fill sizes="40px" className="object-cover opacity-85" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold leading-tight text-ink-950">{m.cancers[c.slug].label}</span>
                    <span className="mt-1.5 block line-clamp-2 text-xs leading-5 text-slateish-500">{m.cancers[c.slug].descriptor}</span>
                  </span>
                </Link>
                <div className="mt-4 flex items-center justify-between border-t border-slateish-100 pt-3">
                  <span className="text-[11px] tabular-nums text-slateish-500">{t(m, 'common.recordsIndexed', { n: c.total })}</span>
                  <FollowCancerButton slug={c.slug} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <div className="rounded-[24px] border border-[#d7e4e0] bg-white p-6 sm:p-8">
          <p className="label-eyebrow text-[#527080]">{m.home.principlesTitle}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">{m.home.principlesTitle}</h2>
          <div className="mt-6 grid gap-4 border-t border-slateish-200 pt-5 sm:grid-cols-3">
            {[m.home.principles.official, m.home.principles.noRec, m.home.principles.traceable].map((item) => (
              <p key={item.title} className="text-sm leading-6 text-slateish-600">
                <span className="font-semibold text-ink-950">{item.title}.</span> {item.body}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 overflow-hidden border-t border-[#d8e2df] bg-[#e8f0ed] text-[#173044]">
        <div className="absolute inset-0 bg-[url('/home-side-texture.jpg')] bg-cover bg-center opacity-30" aria-hidden="true" />
        <div className="container-page relative py-12 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="label-eyebrow text-[#527080]">{m.nav.sources}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#173044]">{m.home.sourcesCta}</h2>
            </div>
            <Link href="/sources" className="btn-secondary border-[#b8cbc7] bg-white/70 text-[#173044] hover:border-[#7ea39b] hover:bg-white">
              {m.home.sourcesCta} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {SOURCE_GROUPS.map((group) => (
              <div key={group.label} className="rounded-2xl border border-white/70 bg-white/60 p-5 backdrop-blur-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#527080]">{group.label}</div>
                <div className="mt-4 space-y-2">
                  {group.items.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm font-medium text-[#173044]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#c9824f]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
