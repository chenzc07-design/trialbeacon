import type { Metadata } from 'next';
import Link from 'next/link';
import { getAfterCareFeed, getCancerFeed } from '@/lib/data';
import { getCancer, CANCERS } from '@/lib/cancers';
import { RegionTabs } from '@/components/RegionTabs';
import { DataStatus } from '@/components/DataStatus';
import { PageHero } from '@/components/PageHero';
import { FilterMotif } from '@/components/Motifs';
import { FreshnessBadge } from '@/components/FreshnessBadge';
import { DiscussionPrompt } from '@/components/DiscussionPrompt';
import { getServerMessages } from '@/lib/i18n-server';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return {
    title: m.afterCare.title,
    description: m.afterCare.introDesktop,
  };
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

  return (
    <>
      <PageHero
        eyebrow={m.afterCare.eyebrow}
        title={m.afterCare.title}
        intro={m.afterCare.introDesktop}
        meta={
          <div className="hidden text-slateish-400 sm:block">
            <FilterMotif className="h-16 w-16 text-navy-200" />
          </div>
        }
      />

      <div className="container-page py-10 sm:py-12">
        <div className="mb-4">
          <FreshnessBadge />
        </div>

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

        {/* Cancer filter */}
        <div className="mt-6 flex flex-wrap gap-1.5" aria-label="Filter by cancer type">
          <Link
            href="/after-care"
            className={`chip ${
              !cancer
                ? 'border-navy-700 bg-navy-800 text-white'
                : 'border-slateish-200 bg-white text-slateish-600 hover:border-navy-300'
            }`}
          >
            {m.common.allTypes}
          </Link>
          {CANCERS.map((c) => (
            <Link
              key={c.slug}
              href={`/after-care?cancer=${c.slug}`}
              className={`chip ${
                cancer?.slug === c.slug
                  ? 'border-navy-700 bg-navy-800 text-white'
                  : 'border-slateish-200 bg-white text-slateish-600 hover:border-navy-300'
              }`}
            >
              {m.cancers[c.slug].label}
            </Link>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <DataStatus live={feed.live} />
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
