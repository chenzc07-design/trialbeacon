// PayPal integration — scaffold only. Every call is driven by env vars; with
// no credentials configured the routes return a clear error instead of
// attempting a charge. No live transaction is performed from the sandbox.
//
// One-time unlock  -> PayPal v2 Orders API (create + capture).
// Monthly Pro      -> PayPal Subscriptions API (plan_id create; cancel).
// Webhooks         -> signature-verified BILLING.SUBSCRIPTION.* events.
//
// Server-only: reads PAYPAL_CLIENT_SECRET etc. Do not import from a client.

const MODE: 'live' | 'sandbox' =
  process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';

function paypalBase(): string {
  return MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

export function paypalClientId(): string | undefined {
  return process.env.PAYPAL_CLIENT_ID;
}
export function paypalClientSecret(): string | undefined {
  return process.env.PAYPAL_CLIENT_SECRET;
}
export function paypalPlanId(): string | undefined {
  return process.env.PAYPAL_PLAN_ID;
}

/** True when the one-time (Orders) flow can run. */
export function paypalConfigured(): boolean {
  return Boolean(paypalClientId() && paypalClientSecret());
}
/** True when the recurring (Subscriptions) flow can run. */
export function paypalSubscriptionConfigured(): boolean {
  return paypalConfigured() && Boolean(paypalPlanId());
}

async function getAccessToken(): Promise<string> {
  if (!paypalConfigured()) throw new Error('paypal_not_configured');
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${Buffer.from(
        `${paypalClientId()}:${paypalClientSecret()}`
      ).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`paypal_auth_${res.status}`);
  const j = (await res.json()) as { access_token: string };
  return j.access_token;
}

async function paypalFetch(
  path: string,
  method: 'GET' | 'POST' | 'GET' | 'PUT' = 'GET',
  body?: unknown
): Promise<{ status: number; ok: boolean; json: any }> {
  const token = await getAccessToken();
  const res = await fetch(`${paypalBase()}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, ok: res.ok, json };
}

/* ----------------------------------------------------------- one-time order */

export async function createOneTimeOrder(
  amount = '4.90',
  currency = 'USD'
): Promise<string> {
  if (!paypalConfigured()) throw new Error('paypal_not_configured');
  const { json, ok, status } = await paypalFetch('/v2/checkout/orders', 'POST', {
    intent: 'CAPTURE',
    purchase_units: [
      { amount: { currency_code: currency, value: amount } },
    ],
  });
  if (!ok || !json?.id) throw new Error(`paypal_create_${status}`);
  return json.id as string;
}

export async function captureOrder(orderId: string): Promise<any> {
  if (!paypalConfigured()) throw new Error('paypal_not_configured');
  const { json, ok, status } = await paypalFetch(
    `/v2/checkout/orders/${orderId}/capture`,
    'POST'
  );
  if (!ok) throw new Error(`paypal_capture_${status}`);
  return json;
}

/* ------------------------------------------------------------ subscription */

export async function createSubscription(
  subscriberEmail?: string
): Promise<string> {
  if (!paypalSubscriptionConfigured()) throw new Error('paypal_sub_not_configured');
  const body: Record<string, unknown> = { plan_id: paypalPlanId() };
  if (subscriberEmail) body.subscriber = { email_address: subscriberEmail };
  const { json, ok, status } = await paypalFetch(
    '/v1/billing/subscriptions',
    'POST',
    body
  );
  if (!ok || !json?.id) throw new Error(`paypal_sub_create_${status}`);
  return json.id as string;
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<boolean> {
  if (!paypalConfigured()) throw new Error('paypal_not_configured');
  const { ok, status } = await paypalFetch(
    `/v1/billing/subscriptions/${subscriptionId}/cancel`,
    'POST',
    { reason: 'Cancelled by the customer from the TrialBeacon account page.' }
  );
  if (!ok) throw new Error(`paypal_cancel_${status}`);
  return true;
}

/* --------------------------------------------------------------- webhook */

export async function verifyWebhookSignature(
  headers: Record<string, string | undefined>,
  rawBody: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!paypalConfigured() || !webhookId) return false;
  const { json } = await paypalFetch(
    '/v1/notifications/verify-webhook-signature',
    'POST',
    {
      auth_algorithm: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }
  );
  return json?.verification_status === 'SUCCESS';
}
