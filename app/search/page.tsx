import type { Metadata } from 'next';
import Link from 'next/link';
import { searchBaseline } from '@/lib/data';
import { CANCERS } from '@/lib/cancers';
import { SearchBox } from '@/components/SearchBox';
import { UpdateList } from '@/components/UpdateCard';
import { PageHero } from '@/components/PageHero';
import { CompassMotif } from '@/components/Motifs';
import { t, getServerMessages } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return {
    title: m.search.title,
    description: m.search.intro,
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { messages: m } = await getServerMessages();
  const query = (q ?? '').trim();
  const results = query ? searchBaseline(query) : [];

  return (
    <>
      <PageHero
        eyebrow={m.search.eyebrow}
        title={m.search.title}
        intro={m.search.intro}
        meta={
          <div className="hidden text-slateish-400 sm:block">
            <CompassMotif className="h-16 w-16 text-navy-200" />
          </div>
        }
      />

      <div className="container-page py-10 sm:py-12">
      <div className="max-w-2xl">
        <SearchBox initialQuery={query} autoFocus={!query} />
      </div>

      {query ? (
        <div className="mt-8">
          <p className="text-sm text-slateish-600">
            {t(m, 'search.results', { n: results.length, query })}
          </p>
          <div className="mt-4">
            <UpdateList items={results} />
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <h2 className="label-eyebrow">{m.search.quickEntries}</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {CANCERS.map((c) => (
              <Link
                key={c.slug}
                href={`/cancers/${c.slug}`}
                className="chip border-slateish-200 bg-white text-slateish-600 hover:border-navy-300 hover:text-navy-700"
              >
                {m.cancers[c.slug].label}
              </Link>
            ))}
            <Link
              href="/after-care"
              className="chip border-navy-100 bg-navy-50 text-navy-700 hover:border-navy-300"
            >
              {m.nav.afterCare}
            </Link>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
