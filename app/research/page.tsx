import type { Metadata } from 'next';
import { PageHero } from '@/components/PageHero';
import { ResearchAnalyticsClient } from '@/components/ResearchAnalyticsClient';
import { getServerMessages } from '@/lib/i18n-server';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return {
    title: m.research.title,
    description: m.research.intro,
  };
}

export default async function ResearchPage() {
  const { messages: m } = await getServerMessages();

  return (
    <>
      <PageHero eyebrow={m.research.eyebrow} title={m.research.title} intro={m.research.intro} />
      <ResearchAnalyticsClient />
    </>
  );
}
