import type { Metadata } from 'next';
import Link from 'next/link';
import { getAfterCareFeed, getCancerFeed, SNAPSHOT_DATE } from '@/lib/data';
import { getCancer, CANCERS } from '@/lib/cancers';
import { RegionTabs } from '@/components/RegionTabs';
import { DataStatus } from '@/components/DataStatus';
import { PageHero } from '@/components/PageHero';
import { StatsPing } from '@/components/StatsPing';
import { FilterMotif } from '@/components/Motifs';
import { DiscussionPrompt } from '@/components/DiscussionPrompt';
import { FollowCancerButton } from '@/components/FollowCancerButton';
import { getServerMessages } from '@/lib/i18n-server';
import { afterCareSeo } from '@/lib/public-copy';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerMessages();
  return afterCareSeo(locale);
}

export default async function AfterCarePage({
  searchParams,
}: {
  searchParams: Promise<{ cancer?: string }>;
}) {
  const { cancer: cancerParam } = await searchParams;
  const { messages: m } = await getServerMessages();
  const cancer = cancerParam ? getCancer(cancerParam) : undefined;

  const feed = cancer
    ? await getCancerFeed(cancer.slug, { afterCareOnly: true })
    : await getAfterCareFeed();
  const snapshotNote = m.dataStatus.snapshot.replace('{date}', SNAPSHOT_DATE);

  return (
    <>
      <StatsPing event="view_aftercare" />
      <PageHero
        eyebrow={m.afterCare.eyebrow}
        title={m.afterCare.title}
        intro={m.afterCare.introDesktop}
        freshness
        meta={
          <div className="hidden text-slateish-400 sm:block">
            <FilterMotif className="h-16 w-16 text-navy-200" />
          </div>
        }
      />

      <div className="container-page py-10 sm:py-12">
        <p className="mb-4 text-xs leading-5 text-slateish-500">
          {snapshotNote}
        </p>

        {/* Mobile short intro — hidden on sm+ */}
        <p className="mb-4 text-sm leading-relaxed text-slateish-600 sm:hidden">
          {m.afterCare.introMobile}
        </p>

        <div className="rounded-card border border-slateish-200 bg-white p-4">
          <p className="text-xs leading-relaxed text-slateish-500">
            <strong className="font-semibold text-ink-800">
              {m.afterCare.pleaseRead}
            </strong>{' '}
            {m.afterCare.pleaseReadBody}
          </p>
        </div>

        {/* Cancer filter — pill buttons. Selected = solid teal; unselected =
            light outline. Scrolls horizontally on small screens, wraps on sm+. */}
        <div
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:pb-0"
          aria-label="Filter by cancer type"
        >
          <Link
            href="/after-care"
            className={`pill ${!cancer ? 'pill-solid' : 'pill-outline'}`}
          >
            {m.common.allTypes}
          </Link>
          {CANCERS.map((c) => (
            <Link
              key={c.slug}
              href={`/after-care?cancer=${c.slug}`}
              className={`pill ${cancer?.slug === c.slug ? 'pill-solid' : 'pill-outline'}`}
            >
              {m.cancers[c.slug].label}
            </Link>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <DataStatus live={feed.live} />
          {cancer ? (
            <FollowCancerButton slug={cancer.slug} />
          ) : null}
        </div>

        <div className="mt-5">
          <RegionTabs items={feed.items} selectable />
        </div>

        <div className="mt-8 rounded-card border border-slateish-200 bg-white p-4">
          <p className="text-xs leading-relaxed text-slateish-500">
            {m.afterCare.foot}
          </p>
        </div>

        <div className="mt-6">
          <DiscussionPrompt />
        </div>
      </div>
    </>
  );
}
