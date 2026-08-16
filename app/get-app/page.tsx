import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getServerMessages } from '@/lib/i18n-server';

const SITE_URL = 'https://trialbeacon.cn';
const STORE_IOS = process.env.NEXT_PUBLIC_APP_STORE_URL ?? '';
const STORE_ANDROID = process.env.NEXT_PUBLIC_APP_PLAY_URL ?? '';
const TESTFLIGHT = process.env.NEXT_PUBLIC_APP_TESTFLIGHT_URL ?? '';
const APK =
  process.env.NEXT_PUBLIC_APP_APK_URL ??
  'https://expo.dev/artifacts/eas/WZPVt8ST1umEEUROJ2uywamBhOFq8WYpPMgI-n3qzDI.apk';

function isInAppBrowser(ua: string) {
  return /MicroMessenger|MQQBrowser|QQ\//i.test(ua);
}

export async function generateMetadata(): Promise<Metadata> {
  const { messages: m } = await getServerMessages();
  return { title: { absolute: m.getApp.title }, description: m.getApp.subtitle };
}

function BeaconMark() {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-950 text-white shadow-lg shadow-ink-950/15">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
        <path d="M12 3v18M4.5 8.5 12 3l7.5 5.5M4.5 15.5 12 21l7.5-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      </svg>
    </span>
  );
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
  const showIos = isIOS || (!isIOS && !isAndroid);
  const showAndroid = isAndroid || (!isIOS && !isAndroid);
  const deviceLabel = isIOS ? 'iPhone / iPad' : isAndroid ? 'Android' : '浏览器';

  return (
    <main className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[url('/hero-bg.svg')] bg-cover bg-center opacity-50" />
      <div className="container-page relative py-8 sm:py-16">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center gap-4">
            <BeaconMark />
            <div>
              <p className="label-eyebrow">TrialBeacon</p>
              <p className="mt-1 text-xs text-slateish-500">官方来源癌症信息索引</p>
            </div>
          </div>

          <div className="mt-10 sm:mt-14">
            <p className="label-eyebrow">{g.kicker}</p>
            <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.03em] text-ink-950 sm:text-4xl">
              {g.title}
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-7 text-slateish-600">{g.subtitle}</p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slateish-200 bg-white/80 px-3 py-1.5 text-xs text-slateish-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              当前设备：{deviceLabel}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {listed ? (
              <section className="card overflow-hidden p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                    <span className="text-sm font-semibold">01</span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-ink-950">从应用商店获取</h2>
                    <p className="mt-1 text-sm text-slateish-600">选择与你的设备匹配的版本。</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {STORE_IOS && showIos ? <a href={STORE_IOS} target="_blank" rel="noopener noreferrer" className="btn-primary min-h-12 justify-center">{g.iosButton}</a> : null}
                  {STORE_ANDROID && showAndroid ? <a href={STORE_ANDROID} target="_blank" rel="noopener noreferrer" className="btn-secondary min-h-12 justify-center">{g.androidButton}</a> : null}
                </div>
              </section>
            ) : null}

            {beta ? (
              <section className="card overflow-hidden p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <span className="text-sm font-semibold">02</span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-ink-950">测试版入口</h2>
                    <p className="mt-1 text-sm text-slateish-600">适合提前体验新功能；正式版上线后建议优先使用商店版本。</p>
                  </div>
                </div>
                <div className="mt-5 space-y-2.5">
                  {TESTFLIGHT && showIos ? <a href={TESTFLIGHT} target="_blank" rel="noopener noreferrer" className="btn-primary min-h-12 justify-center">{g.testflight}</a> : null}
                  {APK && showAndroid ? (inApp ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
                      <p className="text-sm font-semibold text-amber-900">{g.inAppBrowserTitle}</p>
                      <p className="mt-1 text-sm leading-relaxed text-amber-800">{g.inAppBrowserBody}</p>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-amber-900">{g.inAppBrowserHint}</p>
                    </div>
                  ) : <a href={APK} target="_blank" rel="noopener noreferrer" download className="btn-secondary min-h-12 justify-center">{g.apk}</a>) : null}
                  {APK && showAndroid && !inApp && g.autoUpdate ? <p className="pt-1 text-center text-xs leading-5 text-slateish-500">{g.autoUpdate}</p> : null}
                </div>
              </section>
            ) : null}

            <section className="card border-navy-100 bg-gradient-to-br from-navy-50/80 via-white to-white p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-950 text-white">
                  <span className="text-sm font-semibold">03</span>
                </div>
                <div>
                  <h2 className="font-semibold text-ink-950">无需下载，也能使用</h2>
                  <p className="mt-1 text-sm leading-relaxed text-slateish-600">移动网页已针对手机屏幕优化，打开即可搜索并保存官方来源。</p>
                </div>
              </div>
              <a href={SITE_URL} className="btn-primary mt-5 min-h-12 w-full justify-center">{g.openSite}</a>
              <p className="mt-3 text-center text-xs leading-5 text-slateish-500">{g.addHint}</p>
            </section>
          </div>

          <p className="mt-8 text-center text-xs leading-5 text-slateish-400">官方来源可追溯 · 不提供医疗建议 · 不对治疗方案进行推荐或排序</p>
        </div>
      </div>
    </main>
  );
}
