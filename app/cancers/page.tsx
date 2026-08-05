import type { Metadata } from 'next';
import Link from 'next/link';
import { baselineCancerStats } from '@/lib/data';
import { PageHero } from '@/components/PageHero';
import { BeaconMotif } from '@/components/Motifs';
import { t, getServerMessages } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return {
    title: m.cancersIndex.title,
    description: m.cancersIndex.subtitle,
  };
}

export default async function CancersPage() {
  const { messages: m } = await getServerMessages();
  const stats = baselineCancerStats();

  return (
    <>
      <PageHero
        eyebrow={m.cancersIndex.eyebrow}
        title={m.cancersIndex.title}
        intro={m.cancersIndex.subtitle}
        freshness
        meta={
          <div className="hidden text-slateish-400 sm:block">
            <BeaconMotif className="h-20 w-20 text-navy-200" />
          </div>
        }
      />

      <div className="container-page py-10 sm:py-12">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((c) => (
            <Link
              key={c.slug}
              href={`/cancers/${c.slug}`}
              className="card-interactive group flex flex-col p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-ink-950">
                  {m.cancers[c.slug].label}
                </h2>
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-slateish-300 transition-all group-hover:translate-x-0.5 group-hover:text-navy-500"
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
              <p className="mt-1.5 text-sm leading-relaxed text-slateish-500">
                {m.cancers[c.slug].descriptor}
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
                <span className="chip border-slateish-200 bg-slateish-100 text-slateish-600">
                  {t(m, 'common.recordsIndexed', { n: c.total })}
                </span>
                <span className="chip border-navy-100 bg-navy-50 text-navy-700">
                  {t(m, 'common.advancedLaterLine', { n: c.afterCare })}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-[11px] tabular-nums text-slateish-400">
                <span>{m.region.US} {c.regions.US}</span>
                <span>{m.region.EU} {c.regions.EU}</span>
                <span>{m.region.CN} {c.regions.CN}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
