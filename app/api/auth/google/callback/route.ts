import { publicOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/google/callback?code=...&state=...
 *
 * This sandbox cannot reach Google, so the code→token exchange happens in the
 * visitor's BROWSER (which can reach Google). This route returns a tiny HTML
 * page that:
 *   1. recovers the PKCE verifier from the signed `state`,
 *   2. exchanges the code at Google's token endpoint (CORS-enabled),
 *   3. posts the resulting id_token to /api/auth/google/verify, where the
 *      server verifies Google's RS256 signature (JWKS) and issues the session.
 *
 * No secrets or network calls to Google are made server-side here.
 */
export async function GET(req: Request) {
  const cid = process.env.GOOGLE_CLIENT_ID;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Signing in with Google…</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b1220;color:#e5e7eb}
  .card{text-align:center;padding:28px 32px;border-radius:14px;background:#111a2e;box-shadow:0 8px 30px rgba(0,0,0,.35)}
  .sp{width:26px;height:26px;border:3px solid #334; border-top-color:#60a5fa;border-radius:50%;display:inline-block;animation:spin 1s linear infinite;vertical-align:middle;margin-right:10px}
  @keyframes spin{to{transform:rotate(360deg)}}
  .err{color:#fca5a5}.ok{color:#86efac}a{color:#93c5fd}
</style>
</head>
<body>
<div class="card">
  <div id="msg"><span class="sp"></span>Completing Google sign-in…</div>
</div>
<script>
const GOOGLE_CLIENT_ID = ${JSON.stringify(cid ?? '')};
const REDIRECT_URI = location.origin + '/api/auth/google/callback';
const msg = document.getElementById('msg');
function b64urlDecode(s){ s = s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length % 4) s += '='; return atob(s); }
function fail(e){
  msg.innerHTML = '<span class="err">Google sign-in failed: ' + String(e) +
    '.</span><br><br><a href="/account">Back to account</a>';
  const u = new URL('/account', location.origin);
  u.searchParams.set('google_error', String(e));
  setTimeout(function(){ window.location.href = u.toString(); }, 2600);
}
(async function(){
  try {
    const q = new URLSearchParams(location.search);
    const code = q.get('code'), state = q.get('state'), error = q.get('error');
    if (error) return fail(error);
    if (!code || !state) return fail('missing_code');
    let verifier;
    try { verifier = JSON.parse(b64urlDecode(state.split('.')[0])).v; } catch (_) { return fail('bad_state'); }
    if (!verifier) return fail('bad_state');
    const tokRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code', code, code_verifier: verifier,
        client_id: GOOGLE_CLIENT_ID, redirect_uri: REDIRECT_URI,
      }),
    });
    if (!tokRes.ok) return fail('token_exchange_failed');
    const tok = await tokRes.json();
    if (!tok.id_token) return fail('no_id_token');
    const vRes = await fetch('/api/auth/google/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id_token: tok.id_token, state }),
    });
    const v = await vRes.json().catch(function(){ return { ok:false }; });
    if (!v.ok) return fail(v.error || 'verify_failed');
    msg.innerHTML = '<span class="ok">Signed in. Redirecting…</span>';
    window.location.href = (v.next && v.next.indexOf('/') === 0) ? v.next : '/account';
  } catch (e) { fail(e && e.message ? e.message : 'oauth_failed'); }
})();
</script>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
