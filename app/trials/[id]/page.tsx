import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { fetchCtgovStudy } from '@/lib/ctgov';
import { findBaselineItem } from '@/lib/data';
import { SNAPSHOT_DATE } from '@/lib/data/trials';
import type { UpdateItem } from '@/lib/types';
import { getServerMessages, t } from '@/lib/i18n-server';
import { RegionBadge, SourceBadge, TypeBadge, PhaseBadge, StatusBadge } from '@/components/badges';
import { SaveToListButton } from '@/components/SaveToListButton';
import { Disclaimer } from '@/components/Disclaimer';

function fmtDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** A labelled row in the structured detail view. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-t border-slateish-100 py-3 sm:grid-cols-[200px_1fr] sm:gap-4">
      <dt className="text-[13px] font-medium text-slateish-500">{label}</dt>
      <dd className="text-sm leading-relaxed text-ink-900">{children}</dd>
    </div>
  );
}

const Muted = ({ children }: { children: ReactNode }) => (
  <span className="text-slateish-400">{children}</span>
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = findBaselineItem(id) ?? null;
  return { title: item?.title ?? id };
}

export default async function TrialDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const { locale, messages: m } = await getServerMessages();

  // Live ClinicalTrials.gov records carry the richest detail. Non-NCT ids are
  // curated links (FDA, EMA, …) and have no live detail endpoint, so we go
  // straight to the verified baseline for them.
  const isNct = /^NCT\d{6,}$/i.test(id);
  const cancersArg = from && from !== 'all' ? [from] : [];

  let item: UpdateItem | null = null;
  let live = false;
  if (isNct) {
    try {
      const found = await fetchCtgovStudy(id, cancersArg);
      if (found) {
        item = found;
        live = true;
      }
    } catch {
      item = null;
    }
  }
  if (!item) item = findBaselineItem(id) ?? null;

  if (!item) {
    return (
      <div className="container-page py-20">
        <div className="card mx-auto max-w-xl p-8 text-center">
          <p className="text-lg font-semibold text-ink-900">
            {m.trial.notFoundTitle}
          </p>
          <p className="mt-2 text-sm text-slateish-600">{m.trial.notFoundBody}</p>
          <Link href="/cancers" className="btn-primary mt-6">
            {m.cancersIndex.title}
          </Link>
        </div>
      </div>
    );
  }

  const backHref =
    from && from !== 'all' ? `/cancers/${from}` : '/cancers';
  const indexedLabels = item.cancers
    .filter((c) => c !== 'all')
    .map((c) => m.cancers[c]?.label ?? c);

  return (
    <>
      <div className="border-b border-slateish-200 bg-navy-900">
        <div className="container-page py-8 sm:py-10">
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-navy-200" aria-label="Breadcrumb">
            <Link href={backHref} className="hover:text-white">
              {from && from !== 'all' ? m.cancers[from]?.label ?? m.cancersIndex.title : m.cancersIndex.title}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-navy-100">{m.trial.breadcrumb}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-1.5">
            <RegionBadge region={item.region} />
            <SourceBadge source={item.source} />
            <TypeBadge type={item.type} />
            {item.phase ? <PhaseBadge phase={item.phase} /> : null}
            {item.status ? <StatusBadge status={item.status} /> : null}
          </div>

          <h1 className="mt-3 max-w-3xl text-balance text-xl font-semibold leading-snug text-white sm:text-2xl">
            {item.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-white px-4 py-2.5 text-navy-900 hover:bg-navy-50"
              title={m.trial.viewOnRegistryHint}
            >
              {m.trial.viewOnRegistry}
              <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                  d="M3.5 1.5h7v7M10.5 1.5L1.5 10.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <SaveToListButton id={item.id} />
            <Link
              href={backHref}
              className="btn px-3 py-2.5 text-navy-100 hover:bg-white/10"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M9.5 4L6 8l3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {m.common.back}
            </Link>
          </div>
        </div>
      </div>

      <div className="container-page max-w-3xl py-8 sm:py-10">
        {!live ? (
          <p className="mb-5 rounded-card border border-slateish-200 bg-slateish-50 px-4 py-3 text-[13px] leading-relaxed text-slateish-600">
            {t(m, 'trial.baselineNotice', { date: SNAPSHOT_DATE })}
          </p>
        ) : null}

        <section aria-label={m.trial.officialRecordTitle} className="card p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-ink-900">
            {m.trial.officialRecordTitle}
          </h2>
          <dl className="mt-2">
            <Field label={m.trial.identifiers}>
              <code className="rounded bg-slateish-100 px-1.5 py-0.5 text-[13px] font-medium text-ink-800">
                {item.id}
              </code>
            </Field>

            <Field label={m.trial.locations}>
              {item.countries && item.countries.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slateish-400">
                    {t(m, 'trial.locationsCount', { n: item.countries.length })}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.countries.map((c) => (
                      <span key={c} className="chip border-slateish-200 bg-white text-slateish-600">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <Muted>{m.trial.locationsUnavailable}</Muted>
              )}
            </Field>

            <Field label={m.trial.interventions}>
              {item.interventions && item.interventions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {item.interventions.map((i) => (
                    <span key={i} className="chip border-slateish-200 bg-white text-slateish-600">
                      {i}
                    </span>
                  ))}
                </div>
              ) : (
                <Muted>{m.trial.notProvided}</Muted>
              )}
            </Field>

            <Field label={m.trial.sponsor}>
              {item.sponsor ?? <Muted>{m.trial.notProvided}</Muted>}
            </Field>

            <Field label={m.trial.enrollment}>
              {typeof item.enrollment === 'number' ? (
                t(m, 'trial.enrollmentValue', { n: item.enrollment })
              ) : (
                <Muted>{m.trial.notProvided}</Muted>
              )}
            </Field>

            <Field label={m.trial.studyType}>
              {item.studyType ?? <Muted>{m.trial.notProvided}</Muted>}
            </Field>

            <Field label={m.trial.phase}>
              {item.phase ?? <Muted>{m.trial.notProvided}</Muted>}
            </Field>

            <Field label={m.trial.status}>
              {item.status ?? <Muted>{m.trial.notProvided}</Muted>}
            </Field>

            <Field label={m.trial.firstPosted}>
              {fmtDate(item.firstPosted, locale) || <Muted>{m.trial.notProvided}</Muted>}
            </Field>

            <Field label={m.trial.lastUpdate}>
              {fmtDate(item.date, locale) || <Muted>{m.trial.notProvided}</Muted>}
            </Field>

            <Field label={m.trial.ageRange}>
              {item.ageRange ?? <Muted>{m.trial.notProvided}</Muted>}
            </Field>

            <Field label={m.trial.sex}>
              {item.sex ?? <Muted>{m.trial.notProvided}</Muted>}
            </Field>

            <Field label={m.trial.contact}>
              {item.hasPublicContact ? (
                <span>{m.trial.contactAvailable}</span>
              ) : (
                <Muted>{m.trial.contactUnavailable}</Muted>
              )}
            </Field>

            <Field label={m.trial.eligibility}>
              {item.eligibility ? (
                <div className="space-y-2">
                  <p className="text-xs leading-relaxed text-slateish-500">
                    {m.trial.eligibilityIntro}
                  </p>
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slateish-50 p-3 text-[12.5px] leading-relaxed text-ink-800">
{item.eligibility}
                  </pre>
                </div>
              ) : (
                <Muted>{m.trial.eligibilityUnavailable}</Muted>
              )}
            </Field>

            {indexedLabels.length > 0 ? (
              <Field label={m.trial.relatedTypes}>
                <div className="flex flex-wrap gap-1.5">
                  {indexedLabels.map((label) => (
                    <span key={label} className="chip border-navy-100 bg-navy-50 text-navy-700">
                      {label}
                    </span>
                  ))}
                </div>
              </Field>
            ) : null}
          </dl>
        </section>

        <div className="mt-6">
          <Disclaimer />
        </div>
      </div>
    </>
  );
}
