import type { Metadata } from 'next';
import { PageHero } from '@/components/PageHero';
import { ShieldMotif } from '@/components/Motifs';
import { Disclaimer } from '@/components/Disclaimer';
import { getServerMessages } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return { title: m.safety.title, description: m.safety.intro };
}

/**
 * Outbound links to the public bodies the guidance is drawn from. Kept as
 * constants here (not in the message catalogue) because they are stable
 * official URLs and the publisher names are proper nouns.
 */
const SOURCE_LINKS = [
  {
    name: 'U.S. National Cancer Institute (NCI)',
    url: 'https://www.cancer.gov/research/participate/clinical-trials',
  },
  {
    name: 'U.S. Food & Drug Administration (FDA)',
    url: 'https://www.fda.gov/patients/clinical-trials-what-patients-need-know',
  },
  {
    name: 'U.S. HHS — Office for Human Research Protections',
    url: 'https://www.hhs.gov/ohrp/education-and-outreach/about-research-participation/index.html',
  },
];

export default async function SafetyPage() {
  const { messages: m } = await getServerMessages();

  return (
    <>
      <PageHero
        eyebrow={m.safety.eyebrow}
        title={m.safety.title}
        intro={m.safety.intro}
        meta={
          <div className="hidden text-slateish-300 sm:block">
            <ShieldMotif className="h-20 w-20" />
          </div>
        }
      />

      <div className="container-page max-w-3xl py-10 sm:py-12">
        <section aria-label={m.safety.checksTitle}>
          <h2 className="text-lg font-semibold text-ink-950">
            {m.safety.checksTitle}
          </h2>
          <ul className="mt-4 grid gap-3">
            {m.safety.checks.map((c, i) => (
              <li key={i} className="card p-5">
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-800 text-[13px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-medium text-ink-900">
                      {c.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slateish-600">
                      {c.body}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10" aria-label={m.safety.sourcesTitle}>
          <h2 className="text-lg font-semibold text-ink-950">
            {m.safety.sourcesTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slateish-600">
            {m.safety.sourcesIntro}
          </p>
          <ul className="mt-4 grid gap-2">
            {SOURCE_LINKS.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-interactive flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="text-sm font-medium text-navy-800">
                    {s.name}
                  </span>
                  <svg
                    className="h-4 w-4 shrink-0 text-slateish-400"
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
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-card border border-navy-100 bg-navy-50/60 p-5">
          <h2 className="text-sm font-semibold text-ink-900">
            {m.safety.reportTitle}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slateish-600">
            {m.safety.reportBody}
          </p>
        </section>

        <div className="mt-10">
          <Disclaimer />
        </div>
      </div>
    </>
  );
}
