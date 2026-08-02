import Link from 'next/link';
import Image from 'next/image';
import { baselineCancerStats, SNAPSHOT_DATE } from '@/lib/data';
import { SOURCES } from '@/lib/sources';
import { SearchBox } from '@/components/SearchBox';

// GitHub 网页版专用：装饰图直接引用预览站，避免在 GitHub 里传 21 张图。
// 癌种网格仍用项目里原有的 cancer-*.png（本地）。
const BASE = 'https://af73f65d0b7b099a8.gz1.agentos-app.net';
const TOOL_IMAGES = [
  BASE + '/tb-search.png',
  BASE + '/tb-drug-decoder.png',
  BASE + '/tb-treatment-arcs.png',
  BASE + '/tb-match-me.png',
  BASE + '/tb-med-check.png',
  BASE + '/tb-drug-compare.png',
];
const TOOL_HREFS = ['/search', '/search', '/cancers', '/after-care', '/safety', '/search'];
const TRUST_IMAGES = [BASE + '/tb-data-source.png', BASE + '/tb-ai-tech.png', BASE + '/tb-privacy.png', BASE + '/tb-free-use.png'];
const GALLERY_IMAGES = [
  BASE + '/tb-medical-team.png',
  BASE + '/tb-research.png',
  BASE + '/tb-innovation.png',
  BASE + '/tb-patient-story.png',
  BASE + '/tb-empowerment.png',
  BASE + '/tb-hospital.png',
];

export default function HomePage() {
  const stats = baselineCancerStats();
  const totalRecords = stats.reduce((n, c) => n + c.total, 0);
  const typeCount = stats.length;

  return (
    <>
      <section className="relative overflow-hidden border-b border-slateish-200 bg-white">
        <div className="container-page grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="label-eyebrow">Independent · Neutral · Traceable</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink-950 sm:text-[44px] sm:leading-[1.12]">
              Trusted updates from official sources.
              <br />
              <span className="text-navy-600">Nothing more.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slateish-600">
              TrialBeacon is a quiet index of publicly listed clinical trials, guideline indexes and
              regulatory notices from the United States, Europe and China — with a direct link to the
              original page for every single entry.
            </p>
            <div className="mt-7 max-w-xl"><SearchBox size="lg" /></div>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slateish-500">
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-coral-500" aria-hidden="true" />No medical advice</span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slateish-300" />
              <span>No treatment recommendations</span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slateish-300" />
              <span>Free to use</span>
            </div>
            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-5">
              <div><dt className="text-2xl font-semibold tracking-tight text-navy-700">{totalRecords.toLocaleString()}</dt><dd className="mt-0.5 text-xs text-slateish-500">records indexed</dd></div>
              <div><dt className="text-2xl font-semibold tracking-tight text-navy-700">{typeCount}</dt><dd className="mt-0.5 text-xs text-slateish-500">cancer types</dd></div>
              <div><dt className="text-2xl font-semibold tracking-tight text-navy-700">3</dt><dd className="mt-0.5 text-xs text-slateish-500">regions</dd></div>
            </dl>
          </div>
          <div className="relative"><div className="relative aspect-[4/3] w-full overflow-hidden rounded-card shadow-card-hover ring-1 ring-slateish-200"><img src={BASE + '/tb-hero.png'} alt="" className="object-cover w-full h-full" /></div></div>
        </div>
      </section>
      <section className="container-page mt-10">
        <Link href="/after-care" className="card-interactive group flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700"><svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true"><path d="M12 21c-4.5-3-8-6.2-8-10a5 5 0 019-3 5 5 0 019 3c0 3.8-3.5 7-8 10l-1 .7-1-.7z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" /></svg></span>
            <div><h2 className="text-lg font-semibold text-ink-950">For advanced and later-line disease</h2><p className="mt-1 max-w-2xl text-sm leading-relaxed text-slateish-600">When standard options are limited, TrialBeacon surfaces publicly listed trials and regulatory notices for advanced or later-line cancer — always with a direct link to the official source.</p></div>
          </div>
          <span className="btn-secondary shrink-0 self-start group-hover:border-navy-400 sm:self-center">Explore after-care options<svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
        </Link>
      </section>
      <section className="container-page mt-16">
        <div className="max-w-2xl"><h2 className="text-xl font-semibold tracking-tight text-ink-950">How it works</h2><p className="mt-1.5 text-sm text-slateish-500">Three steps from a question to a verified official record.</p></div>
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {[{ t: 'Search the index', b: 'Type a drug, a keyword or an NCT number and see every official record we link to.' },{ t: 'Explore by cancer type', b: 'Open any cancer page to compare records from the US, Europe and China side by side.' },{ t: 'Verify at the source', b: 'Every entry opens the original official page in one click, so you can check it yourself.' }].map((s, i) => (<div key={i} className="card relative p-6"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-600 text-sm font-semibold text-white">{i + 1}</span><h3 className="mt-4 text-base font-semibold text-ink-950">{s.t}</h3><p className="mt-1.5 text-[13px] leading-relaxed text-slateish-600">{s.b}</p></div>))}
        </div>
      </section>
      <section className="container-page mt-16">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold tracking-tight text-ink-950">Browse by cancer type</h2><p className="mt-1 text-sm text-slateish-500">Open any type to compare official records from the US, Europe and China side by side.</p></div><Link href="/cancers" className="btn-ghost text-[13px]">View all types →</Link></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats.map((c) => (<Link key={c.slug} href={`/cancers/${c.slug}`} className="card-interactive group flex flex-col overflow-hidden p-0"><div className="relative aspect-[1.55/1] w-full overflow-hidden bg-slateish-100"><Image src={c.image} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /></div><div className="flex flex-col gap-2.5 p-4"><div className="flex items-center justify-between"><h3 className="text-[15px] font-semibold text-ink-950">{c.label}</h3><svg className="h-3.5 w-3.5 text-slateish-300 transition-all group-hover:translate-x-0.5 group-hover:text-navy-500" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div><p className="text-xs text-slateish-500">{c.descriptor}</p><div className="mt-auto flex items-center gap-1.5 pt-1 text-[11px] text-slateish-500"><span className="chip border-slateish-200 bg-slateish-100 text-slateish-600">{c.total} records indexed</span><span className="chip border-navy-100 bg-navy-50 text-navy-700">{c.afterCare} advanced / later-line</span></div></div></Link>))}
        </div>
      </section>
      <section className="container-page mt-16">
        <div className="max-w-2xl"><h2 className="text-xl font-semibold tracking-tight text-ink-950">Tools that respect your time</h2><p className="mt-1.5 text-sm text-slateish-500">Quiet, single-purpose helpers — each one links straight to the official record.</p></div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[{ t: 'Search', b: 'Find any indexed trial, drug or record by keyword, phase or NCT number.' },{ t: 'Drug decoder', b: 'Look up a medication and the official records that study it.' },{ t: 'Treatment arcs', b: 'See how a cancer type is studied across lines of therapy.' },{ t: 'Match me', b: 'Scan publicly listed options for advanced or later-line disease.' },{ t: 'Med check', b: 'What official guidance says to verify before contacting a study.' },{ t: 'Drug compare', b: 'Compare what each official source lists for the same medicine.' }].map((tool, i) => (<Link key={i} href={TOOL_HREFS[i] ?? '/search'} className="card-interactive group flex flex-col overflow-hidden p-0"><div className="relative aspect-[16/10] w-full overflow-hidden bg-navy-50"><img src={TOOL_IMAGES[i]} alt="" className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-[1.04]" /></div><div className="flex flex-col gap-1.5 p-5"><h3 className="text-[15px] font-semibold text-ink-950">{tool.t}</h3><p className="text-[13px] leading-relaxed text-slateish-600">{tool.b}</p></div></Link>))}
        </div>
      </section>
      <section className="mt-16 bg-ink-950">
        <div className="container-page py-14 sm:py-16">
          <div className="max-w-2xl"><span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-coral-400"><span className="h-1.5 w-1.5 rounded-full bg-coral-500" aria-hidden="true" />Honest by architecture</span><h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-[28px]">Honest by architecture</h2><p className="mt-2 text-sm leading-relaxed text-slateish-300">The product is built so that the honest choice is also the easy choice.</p></div>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[{ t: 'Official sources only', b: 'Every link lands on ClinicalTrials.gov, FDA, NCCN, EMA, CTIS, ESMO, CDE, NMPA or ChiCTR.' },{ t: 'Transparent, even the AI', b: 'Any assistance shows its source and never invents a record or a result.' },{ t: 'Your privacy', b: 'No accounts required for the core index. We do not track you or sell data.' },{ t: 'Free, forever', b: 'The index stays free. Paid features, if ever added, will never include ads or rankings.' }].map((pt, i) => (<div key={i} className="overflow-hidden rounded-card bg-white/5 ring-1 ring-white/10"><div className="relative aspect-[16/10] w-full overflow-hidden"><img src={TRUST_IMAGES[i]} alt="" className="object-cover w-full h-full" /></div><div className="p-5"><h3 className="text-[15px] font-semibold text-white">{pt.t}</h3><p className="mt-1.5 text-[13px] leading-relaxed text-slateish-300">{pt.b}</p></div></div>))}
          </div>
        </div>
      </section>
      <section className="container-page mt-16">
        <div className="max-w-2xl"><h2 className="text-xl font-semibold tracking-tight text-ink-950">Built with people who understand</h2><p className="mt-1.5 text-sm text-slateish-500">Designed alongside clinicians, researchers and the people who use it most.</p></div>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {['Medical teams', 'Researchers', 'Innovation', 'Patient stories', 'Empowerment', 'Hospitals'].map((title, i) => (<div key={i} className="group relative aspect-[3/4] overflow-hidden rounded-card ring-1 ring-slateish-200"><img src={GALLERY_IMAGES[i]} alt="" className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-[1.05]" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/85 to-transparent p-3 pt-8"><p className="text-[13px] font-medium text-white">{title}</p></div></div>))}
        </div>
      </section>
      <section className="container-page mt-16">
        <div className="card p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-base font-semibold text-ink-950">Every link goes to the official source</h2><p className="mt-1 text-sm text-slateish-500">Records current as of {SNAPSHOT_DATE}.</p></div><Link href="/sources" className="btn-secondary text-[13px]">See all sources</Link></div>
          <div className="mt-5 flex flex-wrap gap-2">
            {Object.values(SOURCES).map((s) => (<a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="chip border-slateish-200 bg-slateish-50 text-slateish-600 transition-colors hover:border-navy-300 hover:text-navy-700" title={s.fullName}>{s.label}<span className="text-slateish-400">· {s.region}</span></a>))}
          </div>
        </div>
      </section>
    </>
  );
}
