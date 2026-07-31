'use client';

import { useState } from 'react';
import { CANCERS } from '@/lib/cancers';
import { t } from '@/lib/i18n-runtime';
import { useI18n } from './I18nProvider';

const MAX = 3;
const REGIONS = [
  { key: 'US', labelKey: 'region.US' },
  { key: 'EU', labelKey: 'region.EU' },
  { key: 'CN', labelKey: 'region.CN' },
] as const;

export function AlertsForm() {
  const { messages: m } = useI18n();
  const [email, setEmail] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>(['US', 'EU', 'CN']);
  const [state, setState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const toggleCancer = (slug: string) => {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX) return prev;
      return [...prev, slug];
    });
  };

  const toggleRegion = (key: string) => {
    setRegions((prev) =>
      prev.includes(key)
        ? prev.length > 1
          ? prev.filter((r) => r !== key)
          : prev
        : [...prev, key]
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('submitting');
    setMessage('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, cancers: selected, regions }),
      });
      const json = await res.json();
      if (!res.ok) {
        setState('error');
        setMessage(json.error ?? m.alerts.form.errorNetwork);
        return;
      }
      setState('done');
    } catch {
      setState('error');
      setMessage(m.alerts.form.errorNetwork);
    }
  };

  if (state === 'done') {
    return (
      <div className="card p-6 text-center sm:p-8">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#eef6f2] text-[#2e5747]">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M4 10.5l4 4 8-8.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h2 className="mt-4 text-lg font-semibold text-ink-950">{m.alerts.form.savedTitle}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slateish-600">
          {m.alerts.form.savedBody}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-6 sm:p-8">
      <div>
        <label htmlFor="alert-email" className="text-sm font-semibold text-ink-900">
          {m.alerts.form.emailLabel}
        </label>
        <input
          id="alert-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={m.alerts.form.emailPlaceholder}
          className="mt-2 w-full rounded-xl border border-slateish-300 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-slateish-400 focus:border-navy-400"
        />
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-ink-900">
          {m.alerts.form.cancerLegend}
          <span className="ml-2 text-xs font-normal text-slateish-500">
            {t(m, 'alerts.form.selectedCount', { n: selected.length, max: MAX })}
          </span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CANCERS.map((c) => {
            const active = selected.includes(c.slug);
            const disabled = !active && selected.length >= MAX;
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => toggleCancer(c.slug)}
                disabled={disabled}
                aria-pressed={active}
                className={`chip transition-colors ${
                  active
                    ? 'border-navy-700 bg-navy-800 text-white'
                    : disabled
                      ? 'border-slateish-200 bg-slateish-50 text-slateish-300'
                      : 'border-slateish-200 bg-white text-slateish-600 hover:border-navy-300'
                }`}
              >
                {m.cancers[c.slug]?.label ?? c.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-ink-900">{m.alerts.form.regionsLegend}</legend>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {REGIONS.map((r) => {
            const active = regions.includes(r.key);
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => toggleRegion(r.key)}
                aria-pressed={active}
                className={`chip transition-colors ${
                  active
                    ? 'border-navy-700 bg-navy-800 text-white'
                    : 'border-slateish-200 bg-white text-slateish-600 hover:border-navy-300'
                }`}
              >
                {t(m, r.labelKey)}
              </button>
            );
          })}
        </div>
      </fieldset>

      {state === 'error' ? (
        <p className="mt-4 rounded-lg border border-[#e8c9c9] bg-[#faf0f0] px-3.5 py-2.5 text-sm text-[#7a3030]">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={state === 'submitting' || selected.length === 0 || !email}
        className="btn-primary mt-6 w-full sm:w-auto"
      >
        {state === 'submitting' ? m.alerts.form.submitting : m.alerts.form.subscribe}
      </button>

      <p className="mt-4 text-xs leading-relaxed text-slateish-500">
        {m.alerts.form.finePrint}
      </p>
    </form>
  );
}
