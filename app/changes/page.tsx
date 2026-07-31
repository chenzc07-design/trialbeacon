import type { Metadata } from 'next';
import Link from 'next/link';
import { getChangeTracker } from '@/lib/data';
import { UpdateList } from '@/components/UpdateCard';
import { DataStatus } from '@/components/DataStatus';
import { Disclaimer } from '@/components/Disclaimer';
import { PageHero } from '@/components/PageHero';
import { RssMotif } from '@/components/Motifs';
import { t, getServerMessages } from '@/lib/i18n-server';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return {
    title: m.changes.title,
    description: m.changes.intro,
  };
}

export default async function ChangesPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>;
}) {
  const { window: windowParam } = await searchParams;
  const { messages: m } = await getServerMessages();
  const days = windowParam === '14' ? 14 : 7;
  const tracker = await getChangeTracker(days);

  return (
    <>
      <PageHero
        eyebrow={m.changes.eyebrow}
        title={m.changes.title}
        intro={m.changes.intro}
        meta={
          <div className="hidden text-slateish-400 sm:block">
            <RssMotif className="h-16 w-16 text-navy-200" />
          </div>
        }
      />

      <div className="container-page py-10 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-xl border border-slateish-200 bg-white p-1"
          role="group"
          aria-label="Select time window"
        >
          {[7, 14].map((d) => (
            <Link
              key={d}
              href={`/changes?window=${d}`}
              className={`rounded-lg px-4 py-2 text-[13px] font-medium transition-colors ${
                days === d
                  ? 'bg-navy-800 text-white'
                  : 'text-slateish-600 hover:bg-slateish-100'
              }`}
            >
              {t(m, 'changes.lastNDays', { n: d })}
            </Link>
          ))}
        </div>
        <p className="text-xs tabular-nums text-slateish-500">
          {t(m, 'changes.changesSince', { n: tracker.total, date: tracker.windowStart })}
        </p>
      </div>

      <div className="mt-4">
        <DataStatus live={tracker.live} />
      </div>

      {tracker.groups.length === 0 ? (
        <div className="card mt-6 px-6 py-14 text-center">
          <p className="text-sm font-medium text-ink-800">
            {m.changes.noChangesTitle}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slateish-500">
            {m.changes.noChangesBody}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-10">
          {tracker.groups.map((group) => (
            <section key={group.kind}>
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-ink-950">
                    {m.changes.groups[group.kind].heading}
                  </h2>
                  <p className="mt-0.5 text-xs text-slateish-500">
                    {m.changes.groups[group.kind].sub}
                  </p>
                </div>
                <span className="chip border-slateish-200 bg-slateish-100 text-slateish-600">
                  {group.items.length}
                </span>
              </div>
              <div className="mt-4">
                <UpdateList items={group.items} changeKind={group.kind} />
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-10">
        <Disclaimer />
      </div>
      </div>
    </>
  );
}
