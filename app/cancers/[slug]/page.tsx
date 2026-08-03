import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { CANCERS, getCancer } from '@/lib/cancers';
import { getCancerFeed } from '@/lib/data';
import { RegionTabs } from '@/components/RegionTabs';
import { DataStatus } from '@/components/DataStatus';
import { FreshnessBadge } from '@/components/FreshnessBadge';
import { Disclaimer } from '@/components/Disclaimer';
import { PageHero } from '@/components/PageHero';
import { t, getServerMessages } from '@/lib/i18n-server';

export const revalidate = 3600;

export function generateStaticParams() {
  return CANCERS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { messages: m } = await getServerMessages();
  const cancer = getCancer(slug);
  if (!cancer) return {};
  return {
    title: m.cancers[slug].label,
    description: m.cancersIndex.subtitle,
  };
}

export default async function CancerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { messages: m } = await getServerMessages();
  const cancer = getCancer(slug);
  if (!cancer) notFound();

  const feed = await getCancerFeed(slug);

  return (
    <>
      <PageHero
        eyebrow={m.cancersIndex.title}
        title={m.cancers[slug].label}
        intro={`${m.cancers[slug].descriptor}. ${t(m, 'cancerDetail.indexed', { n: feed.items.length })}`}
        meta={
          <div className="hidden items-center gap-3 sm:flex">
            <span className="relative block h-16 w-24 overflow-hidden rounded-xl bg-white/70 ring-1 ring-navy-100">
              <Image
                src={cancer.image}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            </span>
            <Link
              href={`/after-care?cancer=${slug}`}
              className="btn-secondary text-[13px]"
            >
              {m.cancerDetail.advancedViewCta}
            </Link>
          </div>
        }
      />

      <div className="container-page py-10 sm:py-12">
      <nav className="text-xs text-slateish-500" aria-label="Breadcrumb">
        <Link href="/cancers" className="hover:text-navy-700">
          {m.cancersIndex.title}
        </Link>
        <span className="mx-1.5" aria-hidden="true">/</span>
        <span className="text-ink-800">{m.cancers[slug].label}</span>
      </nav>

      <div className="mt-4 flex sm:hidden">
        <Link
          href={`/after-care?cancer=${slug}`}
          className="btn-secondary text-[13px]"
        >
          {m.cancerDetail.advancedViewCta}
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <DataStatus live={feed.live} />
        <FreshnessBadge />
      </div>

      <div className="mt-5">
        <RegionTabs items={feed.items} />
      </div>

      <div className="mt-10">
        <Disclaimer />
      </div>
      </div>
    </>
  );
}
