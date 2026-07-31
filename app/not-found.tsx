import type { Metadata } from 'next';
import Link from 'next/link';
import { CompassMotif } from '@/components/Motifs';
import { getServerMessages } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return {
    title: m.notFound.title,
    robots: { index: false, follow: false },
  };
}

export default async function NotFound() {
  const { messages: m } = await getServerMessages();

  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <CompassMotif className="h-12 w-12 text-navy-200" />
      <p className="mt-4 label-eyebrow">{m.notFound.eyebrow}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {m.notFound.title}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-slateish-500">
        {m.notFound.body}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary text-[13px]">
          {m.notFound.home}
        </Link>
        <Link href="/cancers" className="btn-secondary text-[13px]">
          {m.notFound.cancers}
        </Link>
        <Link href="/search" className="btn-secondary text-[13px]">
          {m.notFound.search}
        </Link>
      </div>
    </div>
  );
}
