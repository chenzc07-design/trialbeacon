'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import type { UpdateItem } from '@/lib/types';
import { useI18n } from './I18nProvider';
import { useAuth } from './AuthProvider';
import { t } from '@/lib/i18n-runtime';
import { downloadDiscussionListPdf } from '@/lib/discussion-pdf';
import { requestQuota } from '@/lib/quota-client';
import { SINGLE_UNLOCK_RECORDS } from '@/lib/auth-shared';

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_ON = Boolean(CLIENT_ID);
const SUPPORT_EMAIL = 'support@trialbeacon.cn';

type Mode = 'banner' | 'pay' | 'done' | 'collapsed';

function ping(event: string) {
  fetch('/api/stats', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ event }),
  }).catch(() => undefined);
}

/**
 * Proactive, neutral upsell shown when a free visitor has selected at (or
 * above) the free record ceiling. Offers a one-off single export paid via
 * PayPal (fulfilled inline — the PDF of the selected records is generated
 * right here, so the visitor never leaves the page or loses their selection)
 * and a link to the Pro plan. Collapsible to a small persistent hint.
 *
 * Sells only organisation + export of public official records. No medical
 * advice, recommendation, matching, or outcome language.
 */
export function ExportUpsell({
  selectedItems,
  freeLimit,
}: {
  selectedItems: UpdateItem[];
  freeLimit: number;
}) {
  const { locale, messages: m } = useI18n();
  const { status, user } = useAuth();

  const isPro = user?.plan === 'pro' && (user.proUntil ?? 0) > Date.now();
  const atLimit = selectedItems.length >= freeLimit;
  const show = !isPro && atLimit;

  const [mode, setMode] = useState<Mode>('banner');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [guest, setGuest] = useState(false);
  const pingedLimit = useRef(false);

  // Report the limit-reached exposure once, when the banner first appears.
  useEffect(() => {
    if (show && mode === 'banner' && !pingedLimit.current) {
      pingedLimit.current = true;
      ping('limit_reached');
    }
  }, [show, mode]);

  if (!show) return null;

  async function doDownload() {
    setBusy(true);
    setErrorMsg(null);
    try {
      // Consume a generation. After a single purchase the just-granted credit
      // lifts the per-list cap, so this is allowed for up to 10 records.
      const q = await requestQuota(selectedItems.length, true);
      if (!q.allowed) {
        setErrorMsg(t(m, 'pricing.freeListTooLarge', { max: q.genLimit }));
        return;
      }
      await downloadDiscussionListPdf({
        items: selectedItems,
        signedIn: status === 'signed-in',
        locale,
        messages: m,
        recordLimit: q.genLimit || SINGLE_UNLOCK_RECORDS,
      });
    } catch {
      setErrorMsg(m.export.downloadFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onApprove(orderID: string) {
    setBusy(true);
    setErrorMsg(null);
    try {
      const r = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderId: orderID }),
      });
      if (!r.ok) {
        ping('payment_failure');
        setErrorMsg(m.export.payFailed);
        setMode('banner');
        return;
      }
      setGuest(status !== 'signed-in');
      // Fulfil immediately — generate the PDF of the selected records.
      await doDownload();
      setMode('done');
    } catch {
      ping('payment_failure');
      setErrorMsg(m.export.payFailed);
      setMode('banner');
    } finally {
      setBusy(false);
    }
  }

  /* ---------- collapsed: small persistent hint ---------- */
  if (mode === 'collapsed') {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slateish-200 bg-slateish-50 px-3 py-2 text-[12px] text-slateish-600">
        <span className="text-[#7a4a12]">●</span>
        <span>{t(m, 'export.collapsedHint', { n: freeLimit })}</span>
        <Link
          href="/pro"
          onClick={() => ping('pro_click')}
          className="font-medium text-navy-700 underline underline-offset-2 hover:text-navy-900"
        >
          {m.export.seeProShort}
        </Link>
        <button
          type="button"
          onClick={() => setMode('banner')}
          className="ml-auto text-navy-700 hover:underline"
        >
          {m.export.expand}
        </button>
      </div>
    );
  }

  /* ---------- done: success + regenerate ---------- */
  if (mode === 'done') {
    return (
      <div className="mt-3 rounded-card border border-[#cfe3d8] bg-[#eef6f2] p-4">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3f8f6b] text-[12px] text-white">
            ✓
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-900">{m.export.ready}</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-slateish-600">
              {m.export.readyNote}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={doDownload}
            disabled={busy}
            className="btn-primary text-[13px]"
          >
            {busy ? m.discussionList.generating : m.export.regenerate}
          </button>
          {guest ? (
            <Link href="/account" className="btn-secondary text-[13px]">
              {m.export.guestSave}
            </Link>
          ) : null}
        </div>
        {errorMsg ? (
          <p className="mt-2 text-[12px] font-medium text-[#7a3030]">
            {errorMsg}{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
              {SUPPORT_EMAIL}
            </a>
          </p>
        ) : null}
      </div>
    );
  }

  /* ---------- paying: inline PayPal ---------- */
  if (mode === 'pay') {
    return (
      <div className="mt-3 rounded-card border border-navy-200 bg-navy-50/50 p-4">
        <p className="text-[13px] font-medium text-ink-900">{m.export.payTitle}</p>
        <p className="mt-1 text-[12px] text-slateish-500">{m.export.billedViaPaypal}</p>
        <div className="mt-3">
          {PAYPAL_ON ? (
            <PayPalScriptProvider
              options={{ clientId: CLIENT_ID!, currency: 'USD', intent: 'capture' }}
            >
              <PayPalButtons
                style={{ layout: 'vertical', label: 'paypal', height: 44 }}
                disabled={busy}
                createOrder={async () => {
                  const r = await fetch('/api/paypal/create-order', { method: 'POST' });
                  const j = await r.json();
                  if (!r.ok) throw new Error(j.error || 'paypal_error');
                  return j.orderId;
                }}
                onApprove={async (data: { orderID?: string }) =>
                  onApprove(data.orderID ?? '')
                }
                onError={() => {
                  ping('payment_failure');
                  setErrorMsg(m.export.payFailed);
                  setMode('banner');
                }}
                onCancel={() => setMode('banner')}
              />
            </PayPalScriptProvider>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
              {m.pricing.paypalUnavailable}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setErrorMsg(null);
            setMode('banner');
          }}
          className="mt-2 text-[12px] text-slateish-500 hover:underline"
        >
          {m.export.back}
        </button>
        {errorMsg ? (
          <p className="mt-2 text-[12px] font-medium text-[#7a3030]">{errorMsg}</p>
        ) : null}
      </div>
    );
  }

  /* ---------- banner (default) ---------- */
  return (
    <div className="mt-3 rounded-card border border-navy-200 bg-navy-50/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-ink-900">
            {t(m, 'export.limitTitle', { n: freeLimit })}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-slateish-600">
            {m.export.limitBody}
          </p>
        </div>
        <button
          type="button"
          aria-label={m.export.dismiss}
          onClick={() => setMode('collapsed')}
          className="shrink-0 rounded-md p-1 text-slateish-400 hover:bg-white hover:text-slateish-600"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            ping('buy_single_click');
            if (!PAYPAL_ON) {
              setErrorMsg(m.pricing.paypalUnavailable);
              return;
            }
            setErrorMsg(null);
            setMode('pay');
          }}
          className="btn-primary justify-center text-[13px]"
        >
          {t(m, 'export.buySingle', { price: m.pricing.singlePrice })}
        </button>
        <Link
          href="/pro"
          onClick={() => ping('pro_click')}
          className="btn-secondary justify-center text-[13px]"
        >
          {t(m, 'export.seePro', { price: m.pricing.monthlyPrice })}
        </Link>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-slateish-400">
        {m.export.finePrint}
      </p>
      {errorMsg ? (
        <p className="mt-2 text-[12px] font-medium text-[#7a3030]">{errorMsg}</p>
      ) : null}
    </div>
  );
}
