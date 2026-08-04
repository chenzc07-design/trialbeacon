'use client';

import { useState } from 'react';
import { useI18n } from './I18nProvider';

/**
 * A minimal, neutral question prompt. It only teaches a visitor how to ask
 * their clinician about the records they gathered — it gives no answers, no
 * recommendations, and no interpretation. The copy button is hidden when the
 * page is printed (the prompt text itself stays on the page).
 */
export function DiscussionPrompt({ compact = false }: { compact?: boolean }) {
  const { messages: m } = useI18n();
  const [copied, setCopied] = useState(false);
  const lines = m.discussionList.promptLines;

  async function onCopy() {
    const text = `${m.discussionList.promptHeading}\n${lines.join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the text is still visible on screen/paper */
    }
  }

  return (
    <section
      className={
        compact
          ? 'rounded-card border border-slateish-200 bg-white p-4'
          : 'rounded-card border border-slateish-200 bg-white p-5 sm:p-6'
      }
    >
      <h2 className="text-sm font-semibold text-ink-900">
        {m.discussionList.promptHeading}
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-slateish-500">
        {m.discussionList.promptIntro}
      </p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed text-ink-800">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
      <button
        type="button"
        onClick={onCopy}
        className="no-print btn border border-slateish-300 bg-white px-3 py-1.5 text-[12px] text-navy-800 hover:border-navy-400 hover:bg-navy-50"
      >
        {copied ? m.discussionList.promptCopied : m.discussionList.promptCopy}
      </button>
    </section>
  );
}
