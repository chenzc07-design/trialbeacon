'use client';

import { useState } from 'react';
import { useI18n } from './I18nProvider';

export function UnsubscribeForm({ initialEmail = '' }: { initialEmail?: string }) {
  const { messages: m } = useI18n();
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('submitting');
    setMessage('');
    try {
      const res = await fetch(
        `/api/subscribe?email=${encodeURIComponent(email)}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok) {
        setState('error');
        setMessage(json.error ?? m.alerts.form.errorNetwork);
        return;
      }
      setState('done');
      setMessage(
        json.removed
          ? m.unsubscribe.doneMsgRemoved
          : m.unsubscribe.doneMsgNone
      );
    } catch {
      setState('error');
      setMessage(m.alerts.form.errorNetwork);
    }
  };

  if (state === 'done') {
    return (
      <div className="card p-6 sm:p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slateish-100 text-slateish-600">
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
        <h2 className="mt-4 text-lg font-semibold text-ink-950">{m.unsubscribe.doneTitle}</h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-slateish-600">
          {message}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-slateish-500">
          {m.unsubscribe.finePrint}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-6 sm:p-8">
      <label htmlFor="unsub-email" className="text-sm font-semibold text-ink-900">
        {m.unsubscribe.emailLabel}
      </label>
      <input
        id="unsub-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={m.unsubscribe.emailPlaceholder}
        className="mt-2 w-full rounded-xl border border-slateish-300 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-slateish-400 focus:border-navy-400"
      />

      {state === 'error' ? (
        <p className="mt-4 rounded-lg border border-[#e8c9c9] bg-[#faf0f0] px-3.5 py-2.5 text-sm text-[#7a3030]">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={state === 'submitting' || !email}
        className="btn-primary mt-6 w-full sm:w-auto"
      >
        {state === 'submitting' ? m.unsubscribe.submitting : m.unsubscribe.button}
      </button>

      <p className="mt-4 text-xs leading-relaxed text-slateish-500">
        {m.unsubscribe.finePrint}
      </p>
    </form>
  );
}
