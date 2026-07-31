import type { Metadata } from 'next';
import { UnsubscribeForm } from '@/components/UnsubscribeForm';
import { PageHero } from '@/components/PageHero';
import { getServerMessages } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return {
    title: m.unsubscribe.title,
    description: m.unsubscribe.intro,
    robots: { index: false, follow: false },
  };
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const { messages: m } = await getServerMessages();

  return (
    <>
      <PageHero
        eyebrow={m.unsubscribe.eyebrow}
        title={m.unsubscribe.title}
        intro={m.unsubscribe.intro}
      />

      <div className="container-page py-10 sm:py-12">
      <div className="max-w-xl">
        <UnsubscribeForm initialEmail={email ?? ''} />
      </div>
      </div>
    </>
  );
}
