'use client';

import Link from 'next/link';
import { useI18n } from '@/components/I18nProvider';

export default function ProErrorPage() {
  const { messages: m } = useI18n();
  return (
    <main className="container-page max-w-2xl py-16">
      <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
        <h1 className="text-xl font-semibold text-ink-950">{m.pricing.errorTitle}</h1>
        <p className="max-w-md text-sm leading-relaxed text-slateish-600">
          {m.pricing.errorBody}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Link href="/pro" className="btn-primary text-[13px]">
            {m.pricing.retry}
          </Link>
          <Link href="/" className="btn-secondary text-[13px]">
            {m.pricing.backHome}
          </Link>
        </div>
      </div>
    </main>
  );
}
