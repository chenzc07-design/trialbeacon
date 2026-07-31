import type { Metadata } from 'next';
import { PageHero } from '@/components/PageHero';
import { ShieldMotif } from '@/components/Motifs';
import { getServerMessages } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return {
    title: m.disclaimer.title,
    description: m.disclaimer.intro,
  };
}

const SECTION_KEYS = [
  'noAdvice',
  'noRelationship',
  'accuracy',
  'eligibility',
  'thirdParty',
  'wellbeing',
] as const;

export default async function DisclaimerPage() {
  const { messages: m } = await getServerMessages();

  return (
    <>
      <PageHero
        eyebrow={m.disclaimer.eyebrow}
        title={m.disclaimer.title}
        intro={m.disclaimer.intro}
        meta={
          <div className="hidden text-slateish-400 sm:block">
            <ShieldMotif className="h-16 w-16 text-navy-200" />
          </div>
        }
      />

      <div className="container-page py-10 sm:py-12">
      <div className="max-w-3xl">
        <div className="grid gap-4">
          {SECTION_KEYS.map((key) => (
            <section key={key} className="card p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-ink-950">
                {m.disclaimer.sections[key].heading}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slateish-600">
                {m.disclaimer.sections[key].body}
              </p>
            </section>
          ))}
        </div>
      </div>
      </div>
    </>
  );
}
