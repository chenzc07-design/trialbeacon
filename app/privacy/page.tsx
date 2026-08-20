import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/PageHero';
import { ShieldMotif } from '@/components/Motifs';
import { getServerMessages } from '@/lib/i18n-server';
import { getPublicCopy, SUPPORT_EMAIL } from '@/lib/public-copy';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerMessages();
  const copy = getPublicCopy(locale).privacy;
  return {
    title: copy.title,
    description: copy.description,
  };
}

export default async function PrivacyPage() {
  const { locale } = await getServerMessages();
  const copy = getPublicCopy(locale).privacy;

  return (
    <>
      <PageHero
        eyebrow={copy.eyebrow}
        title={copy.title}
        intro={copy.intro}
        meta={
          <div className="hidden text-slateish-400 sm:block">
            <ShieldMotif className="h-16 w-16 text-navy-200" />
          </div>
        }
      />

      <div className="container-page py-10 sm:py-12">
        <div className="max-w-3xl">
          <div className="grid gap-4">
            {copy.sections.map((section) => (
              <section key={section.heading} className="card p-5">
                <h2 className="text-base font-semibold text-ink-950">{section.heading}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slateish-600">{section.body}</p>
              </section>
            ))}
          </div>

          <section className="mt-8 rounded-card border border-slateish-200 bg-white p-5">
            <h2 className="text-base font-semibold text-ink-950">{copy.contactTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slateish-600">
              {copy.contactBody}{' '}
              <a className="font-medium text-navy-700 underline underline-offset-4" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
            <Link href="/disclaimer" className="btn-secondary mt-4 inline-flex text-[13px]">
              TrialBeacon disclaimer →
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
