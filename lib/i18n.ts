// Server-safe i18n module: re-exports the pure runtime helpers and adds the
// message dictionaries + loader. Import this on the server; client components
// should import the helpers from `@/lib/i18n-runtime` to avoid bundling dicts.
import { en } from './messages/en';
import { zh } from './messages/zh';
import { fr } from './messages/fr';
import { de } from './messages/de';
import { ja } from './messages/ja';
import { ko } from './messages/ko';
import type { Messages } from './messages/en';
import * as runtime from './i18n-runtime';

export const {
  LOCALES,
  DEFAULT_LOCALE,
  COOKIE_NAME,
  LOCALE_NAMES,
  isLocale,
  parseAcceptLanguage,
  lookup,
  interp,
  t,
} = runtime;

export type { Locale } from './i18n-runtime';

const DICTS: Record<runtime.Locale, Messages> = { en, zh, fr, de, ja, ko };

export function getMessages(locale: runtime.Locale = DEFAULT_LOCALE): Messages {
  return DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
}
