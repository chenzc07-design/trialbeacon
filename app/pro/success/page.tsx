'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/components/I18nProvider';

export default function ProSuccessPage() {
  const { messages: m } = useI18n();
  const [monthly, setMonthly] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setMonthly(p.get('type') === 'monthly');
  }, []);

  return (
    <main className="container-page max-w-2xl py-16">
      <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef6f2] text-2xl text-[#3f8f6b]">
          ✓
        </div>
        <h1 className="text-xl font-semibold text-ink-950">{m.pricing.successTitle}</h1>
        <p className="max-w-md text-sm leading-relaxed text-slateish-600">
          {monthly ? m.pricing.successBodyPro : m.pricing.successBodySingle}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Link href="/after-care" className="btn-primary text-[13px]">
            {m.pricing.successCta}
          </Link>
          <Link href="/pro" className="btn-secondary text-[13px]">
            {m.pricing.nav}
          </Link>
        </div>
        <p className="mt-4 text-[12px] leading-relaxed text-slateish-400">
          {m.pricing.statNote}
        </p>
      </div>
    </main>
  );
}
