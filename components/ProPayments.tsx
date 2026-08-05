'use client';

import { useEffect, useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useI18n } from './I18nProvider';
import { WECHAT_ENABLED, ALIPAY_ENABLED } from '@/lib/payments-config';

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_ON = Boolean(CLIENT_ID);

type ActivePlan = 'single' | 'monthly' | null;

/**
 * Pricing + payment surface for /pro.
 *
 * PayPal's JS SDK can only be initialised once per page and with a single
 * intent. Because one-time orders (`intent: 'capture'`) and subscriptions
 * (`intent: 'subscription', vault: true`) cannot coexist in the same SDK
 * instance, we let the user pick a plan first, then render only the matching
 * PayPal button set.
 *
 * WeChat / Alipay are reserved and shown greyed as "coming soon".
 */
export function ProPayments() {
  const { messages: m } = useI18n();
  const [active, setActive] = useState<ActivePlan>(null);

  // Plan id is resolved at runtime from the server (env may be set after the
  // client build, so it cannot rely on build-time inlining).
  const [planId, setPlanId] = useState<string | null>(null);
  const [paypalStatus, setPaypalStatus] = useState<'loading' | 'error' | 'ready'>(
    'loading'
  );
  useEffect(() => {
    fetch('/api/paypal/config')
      .then(async (r) => {
        if (!r.ok) throw new Error(`config_${r.status}`);
        const j = await r.json();
        if (j.planId) {
          setPlanId(j.planId);
          setPaypalStatus('ready');
        } else {
          setPaypalStatus('error');
        }
      })
      .catch(() => setPaypalStatus('error'));
  }, []);

  const unavailable = (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
      {m.pricing.paypalUnavailable}
    </p>
  );
  const loading = (
    <p className="rounded-lg border border-slateish-200 bg-slateish-50 px-3 py-2 text-[12px] text-slateish-600">
      Loading PayPal…
    </p>
  );

  const singleButtons = (
    <PayPalButtons
      style={{ layout: 'vertical', label: 'paypal', height: 44 }}
      createOrder={async () => {
        const r = await fetch('/api/paypal/create-order', { method: 'POST' });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'paypal_error');
        return j.orderId;
      }}
      onApprove={async (data) => {
        const r = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ orderId: data.orderID }),
        });
        if (!r.ok) {
          window.location.href = '/pro/error';
          return;
        }
        window.location.href = '/pro/success?type=single';
      }}
      onError={() => {
        window.location.href = '/pro/error';
      }}
    />
  );

  const monthlyButtons = (
    <PayPalButtons
      style={{ layout: 'vertical', label: 'subscribe', height: 44 }}
      createSubscription={(_data, actions) =>
        actions.subscription.create({ plan_id: planId! })
      }
      onApprove={async (data) => {
        const subId = (data as { subscriptionID?: string }).subscriptionID;
        const r = await fetch('/api/paypal/subscription-approved', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ subscriptionId: subId }),
        });
        if (!r.ok) {
          window.location.href = '/pro/error';
          return;
        }
        window.location.href = '/pro/success?type=monthly';
      }}
      onError={() => {
        window.location.href = '/pro/error';
      }}
    />
  );

  const renderAction = (plan: 'single' | 'monthly') => {
    if (!PAYPAL_ON) return unavailable;
    if (active !== plan) {
      return (
        <button
          type="button"
          onClick={() => setActive(plan)}
          className="w-full rounded-lg bg-[#2e5747] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#254a3b]"
        >
          {plan === 'single' ? m.pricing.payWithPaypal : m.pricing.upgradeCta || 'Subscribe with PayPal'}
        </button>
      );
    }
    if (plan === 'single') {
      return (
        <PayPalScriptProvider
          options={{ clientId: CLIENT_ID!, currency: 'USD', intent: 'capture' }}
        >
          {singleButtons}
        </PayPalScriptProvider>
      );
    }
    if (paypalStatus === 'loading') return loading;
    if (paypalStatus === 'error' || !planId) return unavailable;
    return (
      <PayPalScriptProvider
        options={{
          clientId: CLIENT_ID!,
          currency: 'USD',
          intent: 'subscription',
          vault: true,
        }}
      >
        {monthlyButtons}
      </PayPalScriptProvider>
    );
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Single unlock */}
      <div className="card flex flex-col p-5">
        <h3 className="text-sm font-semibold text-ink-950">{m.pricing.singleTitle}</h3>
        <p className="mt-2 text-2xl font-semibold text-ink-950">{m.pricing.singlePrice}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-slateish-600">
          {m.pricing.singleDesc}
        </p>
        <div className="mt-4 flex-1">{renderAction('single')}</div>
      </div>

      {/* Monthly Pro */}
      <div className="card flex flex-col p-5">
        <h3 className="text-sm font-semibold text-ink-950">{m.pricing.monthlyTitle}</h3>
        <p className="mt-2 text-2xl font-semibold text-ink-950">
          {m.pricing.monthlyPrice}
          <span className="text-sm font-normal text-slateish-500">
            {m.pricing.monthlyPer}
          </span>
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-slateish-600">
          {m.pricing.monthlyDesc}
        </p>
        <div className="mt-4 flex-1">{renderAction('monthly')}</div>
      </div>

      {/* Reserved methods (greyed) */}
      <div className="sm:col-span-2 mt-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slateish-400">
          {m.pricing.otherMethodsTitle}
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {[
            { enabled: WECHAT_ENABLED, name: 'WeChat Pay' },
            { enabled: ALIPAY_ENABLED, name: 'Alipay' },
          ].map((m2) => (
            <div
              key={m2.name}
              className={`flex items-center justify-between rounded-xl border border-slateish-200 bg-slateish-50 px-4 py-3 ${
                m2.enabled ? '' : 'opacity-60'
              }`}
            >
              <span className="text-sm text-slateish-600">{m2.name}</span>
              {m2.enabled ? (
                <span className="text-[12px] font-medium text-[#2e5747]">PayPal</span>
              ) : (
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slateish-500">
                  {m.pricing.comingSoon}
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-slateish-500">{m.pricing.otherMethodsNote}</p>
      </div>
    </div>
  );
}
