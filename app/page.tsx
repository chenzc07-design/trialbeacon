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
    <>
      <section className="relative overflow-hidden bg-[#0d1d32] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="pointer-events-none absolute -right-36 -top-44 h-[520px] w-[520px] rounded-full border border-white/10 sm:h-[720px] sm:w-[720px]" />
        <div className="pointer-events-none absolute -right-16 -top-24 h-[360px] w-[360px] rounded-full border border-white/10 sm:h-[520px] sm:w-[520px]" />

        <div className="container-page relative py-12 sm:py-20 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)] lg:items-center lg:gap-20">
            <div>
              <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a9c5d7]">
                <span className="h-2 w-2 rounded-full bg-[#e5a56b] shadow-[0_0_0_5px_rgba(229,165,107,.14)]" />
                Independent clinical research index
              </div>
              <h1 className="mt-6 max-w-3xl text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[50px] lg:text-[62px]">
                A clearer way to read the cancer trial landscape.
              </h1>
              <p className="mt-6 max-w-2xl text-[15px] leading-7 text-[#c8d5df] sm:text-[17px]">
                Public clinical-trial registrations, guideline indexes and regulatory notices — gathered from official sources and linked back to the original record.
              </p>

              <div className="mt-8 max-w-2xl rounded-2xl bg-white p-2 shadow-[0_20px_60px_rgba(0,0,0,.22)] sm:flex sm:items-center">
                <div className="min-w-0 flex-1 [&_form]:!border-0 [&_form]:!shadow-none [&_input]:!bg-transparent [&_input]:!text-ink-950 [&_input]:!placeholder:text-slateish-400 [&_button]:!bg-[#0d1d32] [&_button]:hover:!bg-[#18324f]">
                  <SearchBox size="lg" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#a9bac8]">
                <span>Search by condition, phase or NCT number</span>
                <span className="hidden h-1 w-1 self-center rounded-full bg-[#6f8799] sm:block" />
                <span>No login required to browse</span>
              </div>
            </div>

            <div className="relative lg:pt-4">
              <div className="rounded-[26px] border border-white/15 bg-white/[0.07] p-5 shadow-[0_24px_70px_rgba(0,0,0,.18)] backdrop-blur-sm sm:p-6">
                <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a9c5d7]">Registry pulse</p>
                    <p className="mt-2 text-sm text-[#d8e2e9]">What is currently indexed</p>
                  </div>
                  <span className="rounded-full border border-[#8bc6b3]/30 bg-[#8bc6b3]/10 px-2.5 py-1 text-[11px] font-medium text-[#b8e4d4]">Live + verified</span>
                </div>
                <div className="grid grid-cols-2 gap-3 py-5">
                  <div className="rounded-2xl bg-white/[0.08] p-4">
                    <div className="text-3xl font-semibold tracking-tight text-white">{totalRecords}+</div>
                    <div className="mt-1 text-xs text-[#a9bac8]">indexed records</div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.08] p-4">
                    <div className="text-3xl font-semibold tracking-tight text-white">{stats.length}</div>
                    <div className="mt-1 text-xs text-[#a9bac8]">cancer types</div>
                  </div>
                </div>
                <div className="space-y-3 border-t border-white/10 pt-5 text-sm">
                  <div className="flex items-center justify-between gap-4"><span className="text-[#a9bac8]">Regions covered</span><span className="font-medium text-white">US · Europe · China</span></div>
                  <div className="flex items-center justify-between gap-4"><span className="text-[#a9bac8]">Last verified</span><span className="font-medium text-white">{SNAPSHOT_DATE}</span></div>
                  <div className="flex items-center justify-between gap-4"><span className="text-[#a9bac8]">Record policy</span><span className="font-medium text-[#b8e4d4]">No ranking</span></div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 px-1 text-xs text-[#a9bac8]">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e5a56b] text-[#0d1d32]">↗</span>
                <span>Every result keeps a direct link to its official source.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slateish-200 bg-white">
        <div className="container-page grid divide-y divide-slateish-200 py-1 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-3 py-4 sm:px-6 sm:first:pl-0"><span className="text-lg text-[#d58f5b]">◉</span><div><div className="text-sm font-semibold text-ink-950">Official sources</div><div className="mt-0.5 text-xs text-slateish-500">Registries and regulators</div></div></div>
          <div className="flex items-center gap-3 py-4 sm:px-6"><span className="text-lg text-[#d58f5b]">⌁</span><div><div className="text-sm font-semibold text-ink-950">Traceable records</div><div className="mt-0.5 text-xs text-slateish-500">Original titles and links</div></div></div>
          <div className="flex items-center gap-3 py-4 sm:px-6 sm:last:pr-0"><span className="text-lg text-[#d58f5b]">□</span><div><div className="text-sm font-semibold text-ink-950">Free to browse</div><div className="mt-0.5 text-xs text-slateish-500">No account required</div></div></div>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
          <Link href="/after-care" className="group relative overflow-hidden rounded-[24px] bg-[#e8f0f3] p-6 transition-transform duration-200 hover:-translate-y-0.5 sm:p-8">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-[#b8cdd5]" />
            <div className="relative max-w-2xl">
              <p className="label-eyebrow text-[#527080]">Focused view</p>
              <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight text-[#0d1d32] sm:text-3xl">Advanced, recurrent and later-line records in one place.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#527080]">A dedicated view for public records whose official wording explicitly refers to advanced, metastatic, recurrent, refractory, later-line or supportive care.</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0d1d32]">Open the focused view <span className="transition-transform group-hover:translate-x-1">→</span></span>
            </div>
          </Link>
          <div className="rounded-[24px] border border-slateish-200 bg-white p-6 sm:p-8">
            <p className="label-eyebrow">Data status</p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-ink-950">A calm starting point for a difficult search.</h2>
            <p className="mt-3 text-sm leading-6 text-slateish-600">TrialBeacon is an index, not a medical service. Use the original record and your treating team to decide what information matters to you.</p>
            <div className="mt-5"><FreshnessBadge /></div>
          </div>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr] lg:items-stretch">
          <div className="relative min-h-[330px] overflow-hidden rounded-[24px] bg-[#0d1d32]">
            <Image src="/tb-research.png" alt="Researcher working with a microscope in a laboratory" fill sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1d32] via-[#0d1d32]/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#e5b182]">From research to record</p>
              <h2 className="mt-2 max-w-lg text-2xl font-semibold tracking-tight text-white sm:text-3xl">The science is complex. The source trail should not be.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#d0dce4]">Use TrialBeacon to move from a broad question to the public record behind it — without replacing the researchers, clinicians or original registry.</p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <div className="relative min-h-[190px] overflow-hidden rounded-[24px] bg-[#e7f0f2]">
              <Image src="/tb-medical-team.png" alt="A multidisciplinary medical team reviewing information together" fill sizes="(max-width: 1024px) 50vw, 42vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1d32]/80 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5"><p className="text-sm font-semibold text-white">Bring the original source to the care conversation.</p></div>
            </div>
            <div className="relative min-h-[190px] overflow-hidden rounded-[24px] bg-[#ede9e3]">
              <Image src="/tb-patient-story.png" alt="A person and their companion sitting together at home" fill sizes="(max-width: 1024px) 50vw, 42vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1d32]/80 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5"><p className="text-sm font-semibold text-white">Keep the search human, calm and verifiable.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slateish-200 bg-[#f7f9fa]">
        <div className="container-page py-12 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="label-eyebrow">Browse the index</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950">Cancer types</h2><p className="mt-2 text-sm text-slateish-500">Start broad, then open the original record.</p></div>
            <Link href="/cancers" className="btn-secondary text-[13px]">View all cancer types <span>→</span></Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stats.map((c) => (
              <div key={c.slug} className="group flex min-h-[142px] flex-col rounded-2xl border border-slateish-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#9bb4c0] hover:shadow-card-hover">
                <Link href={`/cancers/${c.slug}`} className="flex flex-1 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f0f3] text-[#31596c]"><CancerIcon slug={c.slug} className="h-6 w-6" /></span>
                  <span className="min-w-0"><span className="block text-[15px] font-semibold leading-tight text-ink-950">{m.cancers[c.slug].label}</span><span className="mt-1.5 block line-clamp-2 text-xs leading-5 text-slateish-500">{m.cancers[c.slug].descriptor}</span></span>
                </Link>
                <div className="mt-4 flex items-center justify-between border-t border-slateish-100 pt-3"><span className="text-[11px] tabular-nums text-slateish-500">{t(m, 'common.recordsIndexed', { n: c.total })}</span><FollowCancerButton slug={c.slug} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div><p className="label-eyebrow">How to use it</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">Designed for verification, not persuasion.</h2><p className="mt-4 text-sm leading-6 text-slateish-600">The product stays deliberately narrow: help you find public records, understand where they came from and take the source to a conversation with your care team.</p></div>
          <div className="grid gap-3 sm:grid-cols-3">{PRINCIPLES.map((item) => <div key={item.number} className="border-t-2 border-[#d58f5b] pt-4"><div className="text-xs font-semibold tabular-nums text-[#b46f3f]">{item.number}</div><h3 className="mt-3 text-sm font-semibold text-ink-950">{item.title}</h3><p className="mt-2 text-[13px] leading-5 text-slateish-600">{item.body}</p></div>)}</div>
        </div>
      </section>

      <section className="bg-[#0d1d32] text-white">
        <div className="container-page py-12 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="label-eyebrow text-[#a9c5d7]">Source map</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Where the records come from</h2></div><Link href="/sources" className="btn-secondary border-white/20 bg-transparent text-white hover:border-white/40 hover:bg-white/10">Sources & methodology <span>→</span></Link></div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">{SOURCE_GROUPS.map((group) => <div key={group.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9c5d7]">{group.label}</div><div className="mt-4 space-y-2">{group.items.map((item) => <div key={item} className="flex items-center gap-2 text-sm text-white"><span className="h-1.5 w-1.5 rounded-full bg-[#e5a56b]" />{item}</div>)}</div></div>)}</div>
          <p className="mt-8 text-xs leading-5 text-[#9eb0bf]">The index is informational only. Records can change on the official source, and nothing here implies suitability, efficacy or medical advice.</p>
        </div>
      </section>
    </>
  );
}
