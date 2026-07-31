import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { PageHero } from '@/components/PageHero';
import { ShieldMotif } from '@/components/Motifs';
import { getServerMessages } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return {
    title: m.about.title,
    description: m.about.p1,
  };
}

export default async function AboutPage() {
  const { messages: m } = await getServerMessages();

  return (
    <>
      <PageHero
        eyebrow={m.about.eyebrow}
        title={m.about.title}
        meta={
          <div className="hidden text-slateish-400 sm:block">
            <ShieldMotif className="h-16 w-16 text-navy-200" />
          </div>
        }
      />

      <div className="container-page py-10 sm:py-12">
      <div className="max-w-3xl">
        <div className="grid gap-4 text-sm leading-relaxed text-slateish-600">
          <p>{m.about.p1}</p>
          <p>{m.about.p2}</p>
        </div>

        <figure className="mt-8">
          <Image
            src="/regions-illustration.svg"
            alt=""
            className="w-full rounded-card border border-slateish-200 bg-white"
            width={720}
            height={420}
          />
        </figure>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-ink-950">{m.about.isTitle}</h2>
            <ul className="mt-3 grid gap-2.5">
              {m.about.is.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-slateish-600">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-ink-950">{m.about.isNotTitle}</h2>
            <ul className="mt-3 grid gap-2.5">
              {m.about.isNot.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-slateish-600">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-slateish-400" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 grid gap-4 text-sm leading-relaxed text-slateish-600">
          <h2 className="text-lg font-semibold text-ink-950">{m.about.principlesTitle}</h2>
          <p>
            <strong className="font-semibold text-ink-900">{m.about.neutralityLabel}</strong>{' '}
            {m.about.neutralityBody}
          </p>
          <p>
            <strong className="font-semibold text-ink-900">{m.about.traceabilityLabel}</strong>{' '}
            {m.about.traceabilityBody}
          </p>
          <p>
            <strong className="font-semibold text-ink-900">{m.about.restraintLabel}</strong>{' '}
            {m.about.restraintBody}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/sources" className="btn-secondary text-[13px]">
            {m.about.sourcesCta}
          </Link>
          <Link href="/disclaimer" className="btn-secondary text-[13px]">
            {m.about.disclaimerCta}
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}
