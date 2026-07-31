import type { Metadata } from 'next';
import { AlertsForm } from '@/components/AlertsForm';
import { Disclaimer } from '@/components/Disclaimer';
import { PageHero } from '@/components/PageHero';
import { MailMotif } from '@/components/Motifs';
import { getServerMessages } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return {
    title: m.alerts.title,
    description: m.alerts.intro,
  };
}

export default async function AlertsPage() {
  const { messages: m } = await getServerMessages();

  return (
    <>
      <PageHero
        eyebrow={m.alerts.eyebrow}
        title={m.alerts.title}
        intro={m.alerts.intro}
        meta={
          <div className="hidden text-slateish-400 sm:block">
            <MailMotif className="h-16 w-16 text-navy-200" />
          </div>
        }
      />

      <div className="container-page py-10 sm:py-12">
      <div className="grid gap-10 lg:grid-cols-[1fr,1.2fr] lg:gap-14">
        <div>
          <ul className="grid gap-2.5">
            {m.alerts.whatYouGet.map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm text-slateish-600">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-navy-600"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8.5l3.2 3L13 4.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {line}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Disclaimer compact />
          </div>
        </div>

        <AlertsForm />
      </div>
      </div>
    </>
  );
}
