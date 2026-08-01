import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/subscriptions';

export const dynamic = 'force-dynamic';

/**
 * Double opt-in confirmation. A subscriber clicks the link in their
 * confirmation email; this flips `confirmed` to true so the weekly digest
 * job will include them. Renders a tiny page (not a redirect) so it works
 * from any email client without extra routing.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const confirmed = token ? await store.confirm(token) : null;

  const html = confirmed
    ? `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Confirmed · TrialBeacon</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:system-ui,sans-serif;background:#f7f9fb;color:#0f172a;display:grid;place-items:center;min-height:100vh;margin:0}main{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:40px 48px;text-align:center;max-width:420px}h1{font-size:20px;margin:0 0 8px}a{color:#1e3350;font-weight:600}</style>
</head><body><main>
<h1>You're confirmed ✅</h1>
<p style="color:#475569;line-height:1.6;margin:0 0 20px">TrialBeacon will send one plain weekly email with links to newly indexed official records. You can unsubscribe from any email.</p>
<a href="/alerts">Back to TrialBeacon →</a>
</main></body></html>`
    : `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Link invalid · TrialBeacon</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:system-ui,sans-serif;background:#f7f9fb;color:#0f172a;display:grid;place-items:center;min-height:100vh;margin:0}main{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:40px 48px;text-align:center;max-width:420px}h1{font-size:20px;margin:0 0 8px}a{color:#1e3350;font-weight:600}</style>
</head><body><main>
<h1>This link didn't work</h1>
<p style="color:#475569;line-height:1.6;margin:0 0 20px">The confirmation link is invalid or has expired. Try subscribing again.</p>
<a href="/alerts">Back to TrialBeacon →</a>
</main></body></html>`;

  return new NextResponse(html, {
    status: confirmed ? 200 : 400,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
