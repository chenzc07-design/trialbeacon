import QRCode from 'qrcode';
import { getServerMessages } from '@/lib/i18n-server';

/**
 * Where the homepage QR points. Phased by design:
 *  - App not yet listed  → the /get-app landing page, which detects the device
 *                           and offers the mobile site / internal test / store.
 *  - App listed          → the same /get-app page shows App Store / Play Store
 *                           buttons once NEXT_PUBLIC_APP_STORE_URL / _PLAY_URL
 *                           are set. One-line change + redeploy (or just set the
 *                           env vars and redeploy).
 */
const APP_QR_TARGET = process.env.NEXT_PUBLIC_APP_QR_URL ?? 'https://trialbeacon.cn/get-app';

/**
 * Prominent "open on your phone" promo placed directly below the hero.
 *
 * Desktop (≥768px): a scannable QR card — the visitor points their phone camera
 * at it to open the mobile site / app. The QR is generated server-side from
 * APP_QR_TARGET, so changing the target needs no asset regeneration.
 *
 * Mobile (<768px): the QR is hidden (scanning from the same phone is pointless
 * and looks awkward), replaced by a short "you're already on your phone" line.
 */
export async function AppQrSection() {
  const { messages: m } = await getServerMessages();
  const p = m.home.appPromo;

  const svg = await QRCode.toString(APP_QR_TARGET, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#0f172a', light: '#ffffff' },
  });

  return (
    <section id="app-promo" className="container-page mt-10 sm:mt-14" aria-label={p.title}>
      <div className="card flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-7">
        {/* Desktop: scannable QR. Hidden on mobile to avoid self-scan. */}
        <div className="hidden shrink-0 rounded-2xl bg-white p-3 shadow-card-hover ring-1 ring-slateish-200 md:block">
          <div
            className="h-[160px] w-[160px]"
            dangerouslySetInnerHTML={{ __html: svg }}
            role="img"
            aria-label={`QR code to ${APP_QR_TARGET}`}
          />
        </div>

        <div className="flex-1 text-center md:text-left">
          <p className="label-eyebrow mx-auto md:mx-0">{p.kicker}</p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-ink-950 sm:text-xl">
            {p.title}
          </h2>
          {/* Desktop: full body + URL. Mobile: compact "already on phone" line. */}
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slateish-600 md:block hidden">
            {p.body}
          </p>
          <p className="mt-3 hidden text-xs font-medium text-slateish-500 md:block">
            {p.urlLabel}
          </p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slateish-600 md:hidden">
            <span className="font-semibold text-ink-950">{p.mobileTitle}</span>{' '}
            {p.mobileBody}
          </p>
        </div>
      </div>
    </section>
  );
}
