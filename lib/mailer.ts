/**
 * Email delivery adapter.
 *
 * Intentionally provider-agnostic and dependency-free. Configure with
 * environment variables and the weekly digest starts sending; leave them
 * unset and the digest job runs in dry-run mode.
 *
 *   EMAIL_PROVIDER=resend
 *   EMAIL_API_KEY=re_xxx
 *   EMAIL_FROM="TrialBeacon <updates@yourdomain.com>"
 *
 * To add another provider, extend the switch in `sendEmail`.
 */
export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  /** Optional HTML body. When present, providers send a multipart message;
   * when absent, the digest falls back to plain text only. */
  html?: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.EMAIL_API_KEY && process.env.EMAIL_FROM);
}

async function sendViaResend(email: OutgoingEmail): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email.to],
      subject: email.subject,
      text: email.text,
      ...(email.html ? { html: email.html } : {}),
      // Plain text only: no tracking pixels, no open/click tracking.
    }),
  });
  return res.ok;
}

async function sendViaPostmark(email: OutgoingEmail): Promise<boolean> {
  const res = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'X-Postmark-Server-Token': process.env.EMAIL_API_KEY ?? '',
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      From: process.env.EMAIL_FROM,
      To: email.to,
      Subject: email.subject,
      TextBody: email.text,
      ...(email.html ? { HtmlBody: email.html } : {}),
      TrackOpens: false,
      TrackLinks: 'None',
    }),
  });
  return res.ok;
}

export async function sendEmail(email: OutgoingEmail): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  const provider = (process.env.EMAIL_PROVIDER ?? 'resend').toLowerCase();
  try {
    switch (provider) {
      case 'postmark':
        return await sendViaPostmark(email);
      case 'resend':
      default:
        return await sendViaResend(email);
    }
  } catch {
    return false;
  }
}
