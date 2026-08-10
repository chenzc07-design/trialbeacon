import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getServerMessages } from '@/lib/i18n-server';

/**
 * Landing page the homepage QR points to. It detects the visitor's device from
 * the request User-Agent (the phone's browser sends its real UA when scanning
 * the QR) and shows the right path:
 *   - App listed  → App Store / Google Play buttons (set via NEXT_PUBLIC_*_URL).
 *   - Internal test ready → TestFlight / APK buttons.
 *   - Otherwise   → "open the mobile site + add to home screen" (works today).
 *
 * Store / test links are env-driven so they can be switched on without touching
 * code — just set the vars and redeploy.
 */
const SITE_URL = 'https://trialbeacon.cn';
const STORE_IOS = process.env.NEXT_PUBLIC_APP_STORE_URL ?? '';
const STORE_ANDROID = process.env.NEXT_PUBLIC_APP_PLAY_URL ?? '';
const TESTFLIGHT = process.env.NEXT_PUBLIC_APP_TESTFLIGHT_URL ?? '';
// Default points straight at the built .apk file (not the EAS build page), so
// tapping the button downloads the APK directly. Override via
// NEXT_PUBLIC_APP_APK_URL when a new build is published.
const APK =
  process.env.NEXT_PUBLIC_APP_APK_URL ??
  'https://expo.dev/artifacts/eas/p9KgiBD85t7EoL4Zt1ohGz1QmYo3LCflfCZx_GkG8p4.apk';

function isInAppBrowser(ua: string) {
  return /MicroMessenger|MQQBrowser|QQ\//i.test(ua);
}

export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return {
    title: { absolute: m.getApp.title },
    description: m.getApp.subtitle,
  };
}

export default async function GetAppPage() {
  const { messages: m } = await getServerMessages();
  const g = m.getApp;

  const ua = (await headers()).get('user-agent') ?? '';
  const isIOS = /iPhone|iPad|iPod|Macintosh/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const inApp = isInAppBrowser(ua);

  const listed = Boolean(STORE_IOS && STORE_ANDROID);
  const beta = Boolean(TESTFLIGHT || APK);

  // Prioritise the store badge for the detected OS; show both when unknown.
  const showIos = isIOS || (!isIOS && !isAndroid);
  const showAndroid = isAndroid || (!isIOS && !isAndroid);

  return (
    <div className="container-page py-12 sm:py-20">
      <div className="mx-auto max-w-xl text-center">
        <p className="label-eyebrow mx-auto">{g.kicker}</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
          {g.title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slateish-600">
          {g.subtitle}
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-xl space-y-4">
        {/* Store badges — shown once the app is listed (set via NEXT_PUBLIC_*_URL). */}
        {listed ? (
          <div className="card flex flex-col gap-3 p-6">
            {STORE_IOS && showIos ? (
              <a
                href={STORE_IOS}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary justify-center"
              >
                {g.iosButton}
              </a>
            ) : null}
            {STORE_ANDROID && showAndroid ? (
              <a
                href={STORE_ANDROID}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary justify-center"
              >
                {g.androidButton}
              </a>
            ) : null}
          </div>
        ) : null}

        {/* Internal beta — shown when TestFlight / APK links are configured. */}
        {beta ? (
          <div className="card p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slateish-500">
              {g.betaTitle}
            </p>
            <p className="mt-1 text-sm text-slateish-600">{g.betaBody}</p>
            <div className="mt-3 flex flex-col gap-2">
              {TESTFLIGHT && showIos ? (
                <a
                  href={TESTFLIGHT}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary justify-center"
                >
                  {g.testflight}
                </a>
              ) : null}
              {APK && showAndroid ? (
                inApp ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-left">
                    <p className="text-sm font-semibold text-amber-900">
                      {g.inAppBrowserTitle}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-amber-800">
                      {g.inAppBrowserBody}
                    </p>
                    <p className="mt-2 text-sm font-medium text-amber-900">
                      {g.inAppBrowserHint}
                    </p>
                  </div>
                ) : (
                  <a
                    href={APK}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="btn-secondary justify-center"
                  >
                    {g.apk}
                  </a>
                )
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Mobile site — always available, no download required. */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-ink-950">{g.webTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slateish-600">{g.webBody}</p>
          <div className="mt-4">
            <a href={SITE_URL} className="btn-primary justify-center">
              {g.openSite}
            </a>
          </div>
          <p className="mt-3 text-xs text-slateish-400">{g.addHint}</p>
        </div>
      </div>
    </div>
  );
}
