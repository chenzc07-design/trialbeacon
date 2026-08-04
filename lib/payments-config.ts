// Payment-method availability flags. WeChat Pay and Alipay are reserved only —
// the UI greys them out as "coming soon". PayPal is the active processor and
// is wired through env-driven server routes (see lib/paypal.ts).
//
// Nothing here performs a charge. These flags just tell the /pro page what to
// render. They are safe to import from client components.

export const PAYPAL_ENABLED = Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID);

export const WECHAT_ENABLED = false;
export const ALIPAY_ENABLED = false;
