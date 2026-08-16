import type { Metadata } from 'next';
import Link from 'next/link';
import { liveCancerStats } from '@/lib/data';
import { PageHero } from '@/components/PageHero';
import { BeaconMotif } from '@/components/Motifs';
import { FollowCancerButton } from '@/components/FollowCancerButton';
import { t, getServerMessages } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return {
    title: m.cancersIndex.title,
    description: m.cancersIndex.subtitle,
  };
}

export const revalidate = 3600;

export default async function CancersPage() {
  const { messages: m } = await getServerMessages();
  const stats = await liveCancerStats(80);

  return (
    <>
      <PageHero
        eyebrow={m.cancersIndex.eyebrow}
        title={m.cancersIndex.title}
        intro={m.cancersIndex.subtitle}
        meta={
          <div className="hidden text-slateish-400 sm:block">
            <BeaconMotif className="h-20 w-20 text-navy-200" />
          </div>
        }
      />

      <div className="container-page py-10 sm:py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((c) => (
            <div
              key={c.slug}
              className="card-interactive group flex h-full flex-col p-5 sm:p-6"
            >
              <Link href={`/cancers/${c.slug}`} className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold tracking-tight text-ink-950 sm:text-xl">
                  {m.cancers[c.slug].label}
                </h2>
                <svg
                  className="mt-1 h-4 w-4 shrink-0 text-slateish-300 transition-all group-hover:translate-x-0.5 group-hover:text-navy-500"
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
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slateish-500">
                {m.cancers[c.slug].descriptor}
              </p>
              <div className="mt-auto flex flex-col gap-3 pt-5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="chip border-navy-100 bg-navy-50 font-medium text-navy-800">
                    {t(m, 'common.recordsIndexed', { n: c.total })}
                  </span>
                  <span className="chip border-emerald-100 bg-emerald-50 text-emerald-700">
                    {c.live ? '官方数据 · 近 1 小时更新' : '离线快照'}
                  </span>
                  <span className="chip border-slateish-200 bg-slateish-100 text-slateish-600">
                    {t(m, 'common.advancedLaterLine', { n: c.afterCare })}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="chip border-slateish-200 bg-white text-slateish-600">
                    {m.region.US} {c.regions.US}
                  </span>
                  <span className="chip border-slateish-200 bg-white text-slateish-600">
                    {m.region.EU} {c.regions.EU}
                  </span>
                  <span className="chip border-slateish-200 bg-white text-slateish-600">
                    {m.region.CN} {c.regions.CN}
                  </span>
                </div>
              </div>
              </Link>
              <div className="mt-3 flex items-center justify-end border-t border-slateish-100 pt-3">
                <FollowCancerButton slug={c.slug} hint />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
