'use client';

import { useMyList } from './useMyList';
import { useI18n } from './I18nProvider';

/**
 * Toggle button that adds or removes a record from the visitor's saved list
 * (localStorage). Renders the same on the server and the first client paint
 * (unsaved), then reflects the real state after mount — so there is no
 * hydration mismatch.
 */
export function SaveToListButton({
  id,
  fullWidth,
}: {
  id: string;
  fullWidth?: boolean;
}) {
  const { messages: m } = useI18n();
  const { has, toggle } = useMyList();
  const saved = has(id);

  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={saved}
      className={`btn-secondary text-[13px] ${
        saved ? 'border-navy-300 bg-navy-50 text-navy-800' : ''
      } ${fullWidth ? 'w-full' : ''}`}
    >
      <span className="inline-flex items-center gap-1.5">
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          {saved ? (
            <path
              d="M3.5 8.5l3 3 6-7"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          )}
        </svg>
        {saved ? m.follow.saved : m.follow.add}
      </span>
    </button>
  );
}
