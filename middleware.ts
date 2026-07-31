import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_NAME, DEFAULT_LOCALE, isLocale, parseAcceptLanguage } from './lib/i18n-runtime';

/**
 * Detects the visitor's preferred language from the `Accept-Language` header on
 * the first visit and persists it in a cookie. After that, the cookie wins, so
 * a manual switch (or an OS/browser change) is honoured on subsequent requests.
 */
export function middleware(request: NextRequest) {
  const cookieLocale = request.cookies.get(COOKIE_NAME)?.value;
  const locale = isLocale(cookieLocale)
    ? cookieLocale
    : parseAcceptLanguage(request.headers.get('accept-language'));

  const response = NextResponse.next();
  if (!isLocale(cookieLocale)) {
    response.cookies.set(COOKIE_NAME, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$).*)',
  ],
};
