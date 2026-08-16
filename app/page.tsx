import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { baselineCancerStats, SNAPSHOT_DATE } from '@/lib/data';
import { SOURCES } from '@/lib/sources';
import { SearchBox } from '@/components/SearchBox';
import { FreshnessBadge } from '@/components/FreshnessBadge';
import { FollowCancerButton } from '@/components/FollowCancerButton';
import { CancerIcon } from '@/components/CancerIcon';
import { t, getServerMessages } from '@/lib/i18n-server';

const PRINCIPLES = [
  {
    number: '01',
    title: 'Official wording',
    body: 'Titles and links are reproduced from public registries and source pages.',
  },
  {
    number: '02',
    title: 'No treatment ranking',
    body: 'The index does not score, recommend or predict what may be suitable for anyone.',
  },
  {
    number: '03',
    title: 'Traceable by design',
    body: 'Every entry leads back to the original source so you can verify it with your care team.',
  },
];

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

  return (
    <div className="relative overflow-hidden bg-[#f7f9fa]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-20 hidden w-[max(0px,calc((100vw-1200px)/2))] bg-[url('/home-side-texture.jpg')] bg-cover bg-right opacity-75 blur-[1px] lg:block" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-[max(0px,calc((100vw-1200px)/2))] scale-x-[-1] bg-[url('/home-side-texture.jpg')] bg-cover bg-left opacity-75 blur-[1px] lg:block" />
      <section className="relative overflow-hidden border-b border-[#d7e4e0] bg-[#eaf2ef] text-[#173044]">
        <div className="pointer-events-none absolute inset-0 bg-[url('/home-side-texture.jpg')] bg-cover bg-center opacity-35" />
        <div className="pointer-events-none absolute -right-36 -top-44 h-[520px] w-[520px] rounded-full border border-[#b9d0ca]/70 sm:h-[720px] sm:w-[720px]" />
        <div className="pointer-events-none absolute -right-16 -top-24 h-[360px] w-[360px] rounded-full border border-[#b9d0ca]/70 sm:h-[520px] sm:w-[520px]" />

        <div className="container-page relative py-12 sm:py-20 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)] lg:items-center lg:gap-20">
            <div>
              <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#527080]">
                <span className="h-2 w-2 rounded-full bg-[#e5a56b] shadow-[0_0_0_5px_rgba(229,165,107,.14)]" />
                {m.home.eyebrow}
              </div>
              <h1 className="mt-6 max-w-3xl text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] text-[#173044] sm:text-[50px] lg:text-[62px]">
                {m.home.title1Short}
              </h1>
              <p className="mt-6 max-w-2xl text-[15px] leading-7 text-[#527080] sm:text-[17px]">
                {m.home.subtitleShort}
              </p>

              <div className="mt-8 max-w-2xl rounded-2xl bg-white/90 p-2 shadow-[0_20px_60px_rgba(53,91,91,.16)] backdrop-blur-sm sm:flex sm:items-center">
                <div className="min-w-0 flex-1 [&_form]:!border-0 [&_form]:!shadow-none [&_input]:!bg-transparent [&_input]:!text-ink-950 [&_input]:!placeholder:text-slateish-400 [&_button]:!bg-[#0d1d32] [&_button]:hover:!bg-[#18324f]">
                  <SearchBox size="lg" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#527080]">
                <span>{m.common.searchPlaceholder}</span>
              </div>
            </div>

            <div className="relative lg:pt-4">
              <div className="relative mb-5 h-48 overflow-hidden rounded-[28px] border border-white/70 bg-[#dbe9e5] shadow-[0_20px_55px_rgba(53,91,91,.12)] sm:h-56">
                <Image src="/home-research-hero.jpg" alt={m.home.badgeVerbatim} fill sizes="(max-width: 1024px) 100vw, 420px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#173044]/55 via-transparent to-transparent" />
                <p className="absolute inset-x-0 bottom-0 p-5 text-xs font-medium tracking-wide text-white">{m.home.badgeVerbatim}</p>
              </div>
              <div className="rounded-[26px] border border-white/80 bg-white/75 p-5 shadow-[0_24px_70px_rgba(53,91,91,.14)] backdrop-blur-sm sm:p-6">
                <div className="flex items-start justify-between gap-5 border-b border-[#d7e4e0] pb-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#527080]">{m.home.freshnessTitle}</p>
                    <p className="mt-2 text-sm text-[#527080]">{m.home.freshnessBody}</p>
                  </div>
                  <span className="rounded-full border border-[#8bc6b3]/30 bg-[#8bc6b3]/10 px-2.5 py-1 text-[11px] font-medium text-[#39806d]">{m.common.continuouslyUpdated}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 py-5">
                  <div className="rounded-2xl bg-[#edf4f1] p-4">
                    <div className="text-3xl font-semibold tracking-tight text-[#173044]">{totalRecords}+</div>
                    <div className="mt-1 text-xs text-[#527080]">{m.common.recordsIndexed.split('{n} ')[1] ?? m.common.recordsIndexed}</div>
                  </div>
                  <div className="rounded-2xl bg-[#edf4f1] p-4">
                    <div className="text-3xl font-semibold tracking-tight text-[#173044]">{stats.length}</div>
                    <div className="mt-1 text-xs text-[#527080]">{m.cancersIndex.title}</div>
                  </div>
                </div>
                <div className="space-y-3 border-t border-[#d7e4e0] pt-5 text-sm">
                  <div className="flex items-center justify-between gap-4"><span className="text-[#527080]">{m.home.principles.threeRegions.title}</span><span className="font-medium text-[#173044]">US · Europe · China</span></div>
                  <div className="flex items-center justify-between gap-4"><span className="text-[#527080]">{m.common.lastVerified.split('{date}')[0].trim()}</span><span className="font-medium text-[#173044]">{SNAPSHOT_DATE}</span></div>
                  <div className="flex items-center justify-between gap-4"><span className="text-[#527080]">{m.home.principles.noRec.title}</span><span className="font-medium text-[#39806d]">{m.common.noRecommendations}</span></div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 px-1 text-xs text-[#527080]">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#d99b69] text-white">↗</span>
                <span>{m.home.principles.traceable.body}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slateish-200 bg-white">
        <div className="container-page grid divide-y divide-slateish-200 py-1 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-3 py-4 sm:px-6 sm:first:pl-0"><span className="text-lg text-[#d58f5b]">◉</span><div><div className="text-sm font-semibold text-ink-950">{m.home.principles.official.title}</div><div className="mt-0.5 text-xs text-slateish-500">{m.home.principles.official.body}</div></div></div>
          <div className="flex items-center gap-3 py-4 sm:px-6"><span className="text-lg text-[#d58f5b]">⌁</span><div><div className="text-sm font-semibold text-ink-950">{m.home.principles.traceable.title}</div><div className="mt-0.5 text-xs text-slateish-500">{m.home.principles.traceable.body}</div></div></div>
          <div className="flex items-center gap-3 py-4 sm:px-6 sm:last:pr-0"><span className="text-lg text-[#d58f5b]">□</span><div><div className="text-sm font-semibold text-ink-950">{m.home.cancerListTitle}</div><div className="mt-0.5 text-xs text-slateish-500">{m.home.cancerListSub}</div></div></div>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
          <Link href="/after-care" className="group relative overflow-hidden rounded-[24px] bg-[#e8f0f3] p-6 transition-transform duration-200 hover:-translate-y-0.5 sm:p-8">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-[#b8cdd5]" />
            <div className="relative max-w-2xl">
              <p className="label-eyebrow text-[#527080]">{m.home.afterCareKicker}</p>
              <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight text-[#0d1d32] sm:text-3xl">{m.home.afterCareTitle}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#527080]">{m.home.afterCareBody}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0d1d32]">{m.home.afterCareCta} <span className="transition-transform group-hover:translate-x-1">→</span></span>
            </div>
          </Link>
          <div className="rounded-[24px] border border-slateish-200 bg-white p-6 sm:p-8">
            <p className="label-eyebrow">{m.home.freshnessTitle}</p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-ink-950">{m.home.freshnessTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-slateish-600">{m.home.freshnessBody}</p>
            <div className="mt-5"><FreshnessBadge /></div>
          </div>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr] lg:items-stretch">
          <div className="relative min-h-[330px] overflow-hidden rounded-[24px] bg-[#0d1d32]">
            <Image src="/home-research-hero.jpg" alt={m.home.badgeVerbatim} fill sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1d32] via-[#0d1d32]/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#e5b182]">{m.home.badgeVerbatim}</p>
              <h2 className="mt-2 max-w-lg text-2xl font-semibold tracking-tight text-white sm:text-3xl">{m.home.sourcesTitle}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#d0dce4]">{m.home.sourcesSub}</p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <div className="relative min-h-[190px] overflow-hidden rounded-[24px] bg-[#e7f0f2]">
              <Image src="/home-care-team.jpg" alt={m.home.afterCareTitle} fill sizes="(max-width: 1024px) 50vw, 42vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1d32]/80 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5"><p className="text-sm font-semibold text-white">{m.home.afterCareFoot}</p></div>
            </div>
            <div className="relative min-h-[190px] overflow-hidden rounded-[24px] bg-[#ede9e3]">
              <Image src="/home-patient-conversation.jpg" alt={m.home.principles.traceable.title} fill sizes="(max-width: 1024px) 50vw, 42vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1d32]/80 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5"><p className="text-sm font-semibold text-white">{m.home.principles.traceable.body}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slateish-200 bg-[#f7f9fa]">
        <div className="container-page py-12 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="label-eyebrow">{m.cancersIndex.eyebrow}</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950">{m.cancersIndex.title}</h2><p className="mt-2 text-sm text-slateish-500">{m.cancersIndex.subtitle}</p></div>
            <Link href="/cancers" className="btn-secondary text-[13px]">{m.home.browseAllTypes} <span>→</span></Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stats.map((c) => (
              <div key={c.slug} className="group flex min-h-[142px] flex-col rounded-2xl border border-slateish-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#9bb4c0] hover:shadow-card-hover">
                <Link href={`/cancers/${c.slug}`} className="flex flex-1 items-start gap-3">
                  <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[#d5e3df] bg-[#edf4f1]"><Image src={c.image} alt="" fill sizes="40px" className="object-cover opacity-85" /></span>
                  <span className="min-w-0"><span className="block text-[15px] font-semibold leading-tight text-ink-950">{m.cancers[c.slug].label}</span><span className="mt-1.5 block line-clamp-2 text-xs leading-5 text-slateish-500">{m.cancers[c.slug].descriptor}</span></span>
                </Link>
                <div className="mt-4 flex items-center justify-between border-t border-slateish-100 pt-3"><span className="text-[11px] tabular-nums text-slateish-500">{t(m, 'common.recordsIndexed', { n: c.total })}</span><FollowCancerButton slug={c.slug} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-10 sm:py-12">
        <div className="rounded-[24px] border border-[#d7e4e0] bg-[#f3f7f5] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="label-eyebrow text-[#527080]">{m.nav.getWeekly}</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#173044] sm:text-2xl">{m.home.sourcesTitle}</h2>
              <p className="mt-3 text-sm leading-6 text-[#527080]">{m.home.freshnessBody}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link href="/alerts" className="btn-secondary border-[#b8cbc7] bg-white text-[13px]">{m.nav.getWeekly} <span>→</span></Link>
              <Link href="/pro" className="btn-primary bg-[#2e5747] text-[13px] hover:bg-[#254a3b]">{m.pricing.nav} <span>→</span></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div><p className="label-eyebrow">{m.home.principlesTitle}</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">{m.home.principlesTitle}</h2><p className="mt-4 text-sm leading-6 text-slateish-600">{m.home.principles.traceable.body}</p></div>
          <div className="grid gap-3 sm:grid-cols-3">{[m.home.principles.official, m.home.principles.noRec, m.home.principles.traceable].map((item, index) => <div key={index} className="border-t-2 border-[#d58f5b] pt-4"><div className="text-xs font-semibold tabular-nums text-[#b46f3f]">{String(index + 1).padStart(2, '0')}</div><h3 className="mt-3 text-sm font-semibold text-ink-950">{item.title}</h3><p className="mt-2 text-[13px] leading-5 text-slateish-600">{item.body}</p></div>)}</div>
        </div>
      </section>

      <section className="relative z-10 overflow-hidden border-t border-[#d8e2df] bg-[#e8f0ed] text-[#173044]">
        <div className="absolute inset-0 bg-[url('/home-side-texture.jpg')] bg-cover bg-center opacity-30" aria-hidden="true" />
        <div className="container-page relative py-12 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="label-eyebrow text-[#527080]">{m.home.sourcesTitle}</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#173044]">{m.home.sourcesTitle}</h2></div><Link href="/sources" className="btn-secondary border-[#b8cbc7] bg-white/70 text-[#173044] hover:border-[#7ea39b] hover:bg-white">{m.home.sourcesCta} <span>→</span></Link></div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">{SOURCE_GROUPS.map((group) => <div key={group.label} className="rounded-2xl border border-white/70 bg-white/60 p-5 backdrop-blur-sm"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#527080]">{group.label}</div><div className="mt-4 space-y-2">{group.items.map((item) => <div key={item} className="flex items-center gap-2 text-sm font-medium text-[#173044]"><span className="h-1.5 w-1.5 rounded-full bg-[#c9824f]" />{item}</div>)}</div></div>)}</div>
          <p className="mt-8 text-xs leading-5 text-[#527080]">The index is informational only. Records can change on the official source, and nothing here implies suitability, efficacy or medical advice.</p>
        </div>
      </section>
    </div>
  );
}
