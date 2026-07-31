import type { Metadata } from 'next';
import { SOURCES } from '@/lib/sources';
import { SNAPSHOT_DATE } from '@/lib/data';
import type { Region } from '@/lib/types';
import { RegionBadge } from '@/components/badges';
import { PageHero } from '@/components/PageHero';
import { DocumentMotif } from '@/components/Motifs';
import { t, getServerMessages } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return {
    title: m.sources.title,
    description: m.sources.intro,
  };
}

const METHOD_KEYS = [
  'where',
  'what',
  'absent',
  'afterCare',
  'freshness',
  'corrections',
] as const;

export default async function SourcesPage() {
  const { messages: m } = await getServerMessages();
  const regions: Region[] = ['US', 'EU', 'CN'];

  return (
    <>
      <PageHero
        eyebrow={m.sources.eyebrow}
        title={m.sources.title}
        intro={m.sources.intro}
        meta={
          <div className="hidden text-slateish-400 sm:block">
            <DocumentMotif className="h-16 w-16 text-navy-200" />
          </div>
        }
      />

      <div className="container-page py-10 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-3">
        {regions.map((region) => (
          <section key={region}>
            <div className="flex items-center gap-2.5">
              <RegionBadge region={region} />
              <h2 className="text-base font-semibold text-ink-950">
                {m.region[region]}
              </h2>
            </div>
            <div className="mt-3 grid gap-2.5">
              {Object.values(SOURCES)
                .filter((s) => s.region === region)
                .map((s) => (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-interactive group flex items-start justify-between gap-3 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink-950">{s.label}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slateish-500">
                        {s.fullName}
                      </p>
                      <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-slateish-400">
                        {m.sources.kind[s.kind]}
                      </p>
                    </div>
                    <svg
                      className="mt-1 h-3.5 w-3.5 shrink-0 text-slateish-300 group-hover:text-navy-500"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3.5 1.5h7v7M10.5 1.5L1.5 10.5"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-lg font-semibold text-ink-950">{m.sources.methodologyTitle}</h2>
        <div className="mt-4 grid gap-4">
          {METHOD_KEYS.map((key) => (
            <div key={key} className="card p-5">
              <h3 className="text-sm font-semibold text-ink-950">
                {m.sources.method[key].title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slateish-600">
                {key === 'freshness'
                  ? t(m, 'sources.method.freshness.body', { date: SNAPSHOT_DATE })
                  : m.sources.method[key].body}
              </p>
            </div>
          ))}
        </div>
      </section>
      </div>
    </>
  );
}
