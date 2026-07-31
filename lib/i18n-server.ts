import { cookies } from 'next/headers';
import {
  COOKIE_NAME,
  DEFAULT_LOCALE,
  getMessages,
  isLocale,
  LOCALES,
  LOCALE_NAMES,
  parseAcceptLanguage,
  t,
  lookup,
  interp,
  type Locale,
} from './i18n';
import type { Messages } from './messages/en';

export { COOKIE_NAME, DEFAULT_LOCALE, getMessages, isLocale, LOCALES, LOCALE_NAMES, parseAcceptLanguage, t, lookup, interp };
export type { Locale, Messages };

/** Resolve the active locale for the current request (reads the cookie). */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const c = store.get(COOKIE_NAME)?.value;
  if (isLocale(c)) return c;
  return DEFAULT_LOCALE;
}

/** Convenience: locale + messages for the current request. */
export async function getServerMessages(): Promise<{ locale: Locale; messages: Messages }> {
  const locale = await getServerLocale();
  return { locale, messages: getMessages(locale) };
}
