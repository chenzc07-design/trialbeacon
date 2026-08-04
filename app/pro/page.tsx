'use client';

import Link from 'next/link';
import { useI18n } from '@/components/I18nProvider';
import { useAuth } from '@/components/AuthProvider';
import { ProPayments } from '@/components/ProPayments';
import { StatsPing } from '@/components/StatsPing';
import { PageHero } from '@/components/PageHero';
import { t } from '@/lib/i18n-runtime';

function fmtDate(ms: number, locale: string): string {
  try {
    return new Date(ms).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function ProPage() {
  const { messages: m, locale } = useI18n();
  const { user } = useAuth();
  const isPro = user?.plan === 'pro' && (user.proUntil ?? 0) > Date.now();

  return (
    <main className="container-page max-w-3xl py-10">
      <StatsPing event="pro_visit" />

      <PageHero
        eyebrow={m.pricing.eyebrow}
        title={m.pricing.title}
        intro={m.pricing.subtitle}
      />

      {/* Active status */}
      {isPro ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#cfe3d8] bg-[#eef6f2] p-4">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#3f8f6b]" />
          <p className="text-sm text-ink-900">
            {t(m, 'pricing.alreadyPro', { date: fmtDate(user!.proUntil!, locale) })}
          </p>
        </div>
      ) : null}

      {/* Pricing cards */}
      <div className="mt-6">
        <ProPayments />
      </div>

      {/* What you get / don't */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-ink-950">
            {m.pricing.whatYouGetTitle}
          </h2>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-slateish-700">
            {m.pricing.whatYouGet.map((x, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[#3f8f6b]">✓</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-ink-950">
            {m.pricing.whatYouDontTitle}
          </h2>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-slateish-700">
            {m.pricing.whatYouDont.map((x, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-slateish-400">–</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Manage (pro only) */}
      {isPro ? (
        <div className="mt-6 card p-5">
          <h2 className="text-sm font-semibold text-ink-950">{m.pricing.manageTitle}</h2>
          <p className="mt-1 text-[13px] text-slateish-600">{m.pricing.manageNote}</p>
          <Link href="/account" className="btn-secondary mt-3 inline-flex text-[13px]">
            {m.pricing.manageCancel}
          </Link>
        </div>
      ) : null}

      {/* Disclaimers */}
      <div className="mt-8 space-y-3">
        <p className="rounded-xl border border-slateish-200 bg-slateish-50 p-3 text-[12px] leading-relaxed text-slateish-600">
          {m.pricing.disclaimer}
        </p>
        <p className="text-[12px] leading-relaxed text-slateish-400">
          {m.pricing.statNote}
        </p>
      </div>
    </main>
  );
}
