/**
 * Server-side auth.
 *
 * Design constraint that shapes everything below: on Vercel every route
 * handler is its own serverless function with its own memory. A module-level
 * Map written by /api/auth/start is simply not visible to /api/auth/verify.
 * So nothing here relies on shared process memory.
 *
 *   - Identity is DERIVED from the email (HMAC), not stored.
 *   - The session cookie carries the identity and is HMAC-signed.
 *   - The email code is DERIVED from (email, 10-minute window), so any
 *     instance can verify a code any other instance issued.
 *   - Preferences (follow list, alert settings) live in a second signed
 *     cookie by default, and additionally in Upstash Redis when
 *     UPSTASH_REDIS_REST_URL / _TOKEN are set — that is what makes the
 *     settings follow you to another device.
 *
 * No new dependencies: node:crypto and fetch only.
 */
import crypto from 'node:crypto';
import { cookies, headers } from 'next/headers';
import type { Region } from './types';
import {
  SESSION_COOKIE,
  SESSION_TTL_DAYS,
  CODE_TTL_MIN,
  FREE_FOLLOW_LIMIT,
  ALERT_FREE_LIMIT,
  ANON_UID,
} from './auth-shared';

// Google's public signing keys (JWKS). Used to verify the id_token returned by
// the browser-side PKCE exchange WITHOUT the server ever calling Google — the
// sandbox cannot reach Google's network. Refresh from
// https://www.googleapis.com/oauth2/v3/certs when these rotate (~weekly).
import googleJwks from './google-jwks.json';

export {
  SESSION_COOKIE,
  SESSION_TTL_DAYS,
  CODE_TTL_MIN,
  FREE_FOLLOW_LIMIT,
  ALERT_FREE_LIMIT,
  ANON_UID,
};

export const PREFS_COOKIE = 'tb_prefs';
export const CHALLENGE_COOKIE = 'tb_chal';

/** Hard cap so the prefs cookie can never approach the 4 KB browser limit. */
export const MY_LIST_MAX = 200;

const SECRET =
  process.env.AUTH_SECRET ||
  // Stable dev fallback so signing works without env. In production
  // AUTH_SECRET MUST be set, otherwise sessions are forgeable.
  'tb-dev-secret-do-not-use-in-prod-0000000000000000';

export function isAuthSecretConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET);
}

/**
 * Resolve the PUBLIC origin (scheme + host) of an incoming request.
 *
 * OAuth redirect_uri MUST match the domain the user actually typed, not the
 * internal address the server binds to (e.g. 0.0.0.0:3000 behind a proxy).
 * So we trust the proxy-provided `x-forwarded-host` / `host` headers, and
 * default to https for any non-local host (the public link is always https).
 */
export function publicOrigin(req: Request): string {
  const host =
    req.headers.get('x-forwarded-host') ||
    req.headers.get('host') ||
    new URL(req.url).host;
  const isLocal = /^(localhost|127\.|0\.0\.0\.0|::1|\[::1\])/.test(host);
  const proto =
    req.headers.get('x-forwarded-proto') ||
    (isLocal ? 'http' : 'https');
  return `${proto}://${host}`;
}

/* ------------------------------------------------------------------ types */

export interface Prefs {
  myList: string[];
  alertCancers: string[];
  alertRegions: Region[];
  alertEnabled: boolean;
  /** 'free' unless a single-unlock or subscription entitlement is active. */
  plan: 'free' | 'pro';
  /** Epoch ms when the current Pro entitlement lapses (0 = none). */
  proUntil: number;
  /** Remaining single-unlock credits (each unlocks one full list). */
  unlockCredits: number;
  /** 'YYYY-MM-DD' (UTC) of the day the current generation count covers. */
  genDate: string;
  /** Discussion-list generations performed on `genDate`. */
  genCount: number;
  /** PayPal subscription id, when a recurring plan is active. */
  paypalSubscriptionId?: string;
  /**
   * Minimal, privacy-first record of the most recent paid export entitlement.
   * Holds only payment metadata — never any health information. Shown on the
   * account page so a person can see their last purchase; superseded on the
   * next purchase.
   */
  lastOrder?: OrderRecord;
  /** Preferred UI locale (e.g. 'en' | 'zh'). Persisted so the weekly digest
   * can be rendered in the recipient's language. Optional, never clinical. */
  locale?: string;
  /**
   * Login methods that have been used with this account. An account is keyed
   * by email, so the same address signing in via Email, Google, Microsoft or
   * Apple lands on the same profile; this list records which were used so the
   * account page can show them. Never clinical.
   */
  providers?: string[];
}

/**
 * The single piece of payment metadata we persist. Nothing clinical — just
 * enough to show "your last export entitlement" and reconcile against PayPal.
 */
export interface OrderRecord {
  type: 'single' | 'subscription';
  amount: string; // e.g. "4.90"
  currency: string; // e.g. "USD"
  paypalId: string; // capture id (single) or subscription id (monthly)
  at: number; // epoch ms
  guest: boolean; // true when no session existed at purchase time
}

export interface User extends Prefs {
  id: string;
  email: string;
  emailLower: string;
  provider: Provider;
}

export function defaultPrefs(): Prefs {
  return {
    myList: [],
    alertCancers: [],
    alertRegions: ['US', 'EU', 'CN'],
    alertEnabled: false,
    plan: 'free',
    proUntil: 0,
    unlockCredits: 0,
    genDate: '',
    genCount: 0,
    paypalSubscriptionId: undefined,
    lastOrder: undefined,
    locale: undefined,
    providers: [],
  };
}

/* --------------------------------------------------------------- signing */

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function b64urlDecode(s: string): Buffer {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

function sign(payload: object): string {
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const mac = b64url(crypto.createHmac('sha256', SECRET).update(body).digest());
  return `${body}.${mac}`;
}

function unsign<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const expected = b64url(crypto.createHmac('sha256', SECRET).update(body).digest());
  if (expected.length !== mac.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(mac))) return null;
  try {
    return JSON.parse(b64urlDecode(body).toString('utf8')) as T;
  } catch {
    return null;
  }
}

/* --------------------------------------------------------- oauth helpers */

export interface OAuthState {
  next: string;
  n: string;
  t: number;
  /** PKCE code_verifier — embedded in the (signed) state, surfaced to the
   *  browser so it can perform the code→token exchange client-side. */
  v?: string;
}
export function signState(state: OAuthState): string {
  return sign(state);
}
export function verifyState(token: string): OAuthState | null {
  const s = unsign<OAuthState>(token);
  if (!s) return null;
  // 10-minute replay window, matching the Google flow.
  if (Date.now() - s.t > 10 * 60 * 1000) return null;
  return s;
}

/** PKCE code_verifier + S256 challenge for the browser-side token exchange. */
export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = b64url(crypto.randomBytes(64));
  const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

/**
 * Verify a Google-issued OpenID id_token WITHOUT calling Google's network.
 *
 * The sandbox cannot reach Google, so the OAuth code→token exchange happens in
 * the user's browser (PKCE). The browser hands us the id_token; we verify its
 * RS256 signature against Google's public JWKS (committed to
 * lib/google-jwks.json, refreshed from https://www.googleapis.com/oauth2/v3/certs
 * when keys rotate). This closes the loop: the server never talks to Google,
 * yet the token is cryptographically proven to be Google's.
 */
export function verifyGoogleIdToken(
  idToken: string,
  expectedNonce: string
): { email: string; email_verified?: boolean } {
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('bad_id_token');
  const [h, p, s] = parts;
  let header: { kid?: string; alg?: string };
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(b64urlDecode(h).toString('utf8'));
    payload = JSON.parse(b64urlDecode(p).toString('utf8'));
  } catch {
    throw new Error('bad_id_token');
  }
  if (header.alg && header.alg !== 'RS256') throw new Error('bad_alg');
  const keys = (
    googleJwks as { keys: Array<{ kid: string; kty: string; n: string; e: string }> }
  ).keys;
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('unknown_kid');
  const pub = crypto.createPublicKey({
    key: { kty: 'RSA', n: jwk.n, e: jwk.e },
    format: 'jwk',
  });
  const valid = crypto.verify(
    'sha256',
    Buffer.from(`${h}.${p}`),
    pub,
    b64urlDecode(s)
  );
  if (!valid) throw new Error('bad_signature');
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp < now)
    throw new Error('token_expired');
  const iss = payload.iss as string;
  if (iss !== 'accounts.google.com' && iss !== 'https://accounts.google.com')
    throw new Error('bad_iss');
  if (payload.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error('bad_aud');
  if (expectedNonce && payload.nonce !== expectedNonce) throw new Error('bad_nonce');
  const email = payload.email as string;
  if (!email) throw new Error('no_email');
  return { email, email_verified: Boolean(payload.email_verified) };
}

/**
 * Decode a JWT's payload without verifying its signature. The issuer is
 * reached over a TLS channel and the OAuth `state` is independently verified,
 * so signature checking is intentionally out of scope here — the same posture
 * the Google flow takes (it trusts the access token, not the id_token sig).
 */
export function decodeJwt(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    return JSON.parse(b64urlDecode(parts[1]).toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * Merge a login provider into the account's bound-providers list, persist it
 * to the sync store, and return the prefs cookie to attach to the sign-in
 * response. Used by every OAuth callback so the account page can show which
 * methods have been linked.
 */
export async function providerPrefsCookie(uid: string, provider: Provider): Promise<CookieSpec> {
  const prefs = await resolvePrefsOnSignIn(uid);
  const seen = new Set(prefs.providers ?? []);
  seen.add(provider);
  const next: Prefs = { ...prefs, providers: Array.from(seen) };
  const saved = await savePrefs(uid, next);
  return saved.cookie;
}

/* -------------------------------------------------------------- identity */

/**
 * Deterministic, non-reversible user id. Two sign-ins with the same address
 * always land on the same account without any lookup table.
 */
export function uidForEmail(email: string): string {
  return crypto
    .createHmac('sha256', SECRET)
    .update(`uid:${email.toLowerCase()}`)
    .digest('hex')
    .slice(0, 32);
}

/* ------------------------------------------------------------ email code */

const CODE_WINDOW_MS = CODE_TTL_MIN * 60 * 1000;

function codeForWindow(emailLower: string, w: number): string {
  const mac = crypto
    .createHmac('sha256', SECRET)
    .update(`code:${emailLower}:${w}`)
    .digest();
  return String(mac.readUInt32BE(0) % 1_000_000).padStart(6, '0');
}

/**
 * Returns the code currently valid for this address. Deliberately stateless:
 * the same value is recomputed at verification time.
 */
export function createEmailCode(email: string): { code: string; expires: number } {
  const emailLower = email.toLowerCase();
  const w = Math.floor(Date.now() / CODE_WINDOW_MS);
  // Verification accepts the current and previous window, so the code stops
  // working two window boundaries from now — report that, not the next tick.
  return { code: codeForWindow(emailLower, w), expires: (w + 2) * CODE_WINDOW_MS };
}

/**
 * Accepts the current and the previous window, so a code handed out at
 * 09:59:59 is still usable at 10:05 rather than expiring a second later.
 */
export function verifyEmailCode(email: string, code: string): boolean {
  const emailLower = email.toLowerCase();
  const given = code.trim();
  if (!/^\d{6}$/.test(given)) return false;
  const w = Math.floor(Date.now() / CODE_WINDOW_MS);
  const a = codeForWindow(emailLower, w);
  const b = codeForWindow(emailLower, w - 1);
  // Constant-time compare against both candidates.
  const eq = (x: string) =>
    x.length === given.length &&
    crypto.timingSafeEqual(Buffer.from(x), Buffer.from(given));
  return eq(a) || eq(b);
}

/* ------------------------------------------------- challenge (attempts) */

interface Challenge {
  e: string; // emailLower
  n: number; // attempts used
  exp: number;
}

export function issueChallengeCookie(email: string): CookieSpec {
  const payload: Challenge = {
    e: email.toLowerCase(),
    n: 0,
    exp: Date.now() + CODE_WINDOW_MS * 2,
  };
  return cookieSpec(CHALLENGE_COOKIE, sign(payload), CODE_TTL_MIN * 2 * 60);
}

export async function readChallenge(): Promise<Challenge | null> {
  const c = await cookies();
  const ch = unsign<Challenge>(c.get(CHALLENGE_COOKIE)?.value);
  if (!ch || Date.now() > ch.exp) return null;
  return ch;
}

export function bumpChallengeCookie(ch: Challenge): CookieSpec {
  return cookieSpec(
    CHALLENGE_COOKIE,
    sign({ ...ch, n: ch.n + 1 }),
    Math.max(1, Math.floor((ch.exp - Date.now()) / 1000))
  );
}

export const CHALLENGE_MAX_ATTEMPTS = 5;

/* --------------------------------------------------------------- cookies */

export interface CookieSpec {
  name: string;
  value: string;
  options: {
    httpOnly: true;
    sameSite: 'lax';
    secure: boolean;
    path: string;
    maxAge: number;
  };
}

function cookieSpec(name: string, value: string, maxAgeSeconds: number): CookieSpec {
  return {
    name,
    value,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: maxAgeSeconds,
    },
  };
}

/** Login methods supported. An account is keyed by email, so every method
 *  for the same address resolves to the same profile. */
export type Provider = 'email' | 'google' | 'microsoft' | 'apple';

interface SessionPayload {
  uid: string;
  email: string;
  provider: Provider;
  iat: number;
  exp: number;
}

export function issueSessionCookie(
  email: string,
  provider: Provider
): CookieSpec {
  const iat = Date.now();
  const exp = iat + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
  const payload: SessionPayload = {
    uid: uidForEmail(email),
    email,
    provider,
    iat,
    exp,
  };
  return cookieSpec(
    SESSION_COOKIE,
    sign(payload),
    SESSION_TTL_DAYS * 24 * 60 * 60
  );
}

export function clearSessionCookie(): CookieSpec {
  return cookieSpec(SESSION_COOKIE, '', 0);
}
export function clearPrefsCookie(): CookieSpec {
  return cookieSpec(PREFS_COOKIE, '', 0);
}
export function clearChallengeCookie(): CookieSpec {
  return cookieSpec(CHALLENGE_COOKIE, '', 0);
}

/* ---------------------------------------------------- preference storage */

const KV_URL = process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/** True when settings can follow the person to another device. */
export function isSyncConfigured(): boolean {
  return Boolean(KV_URL && KV_TOKEN);
}

/**
 * Upstash REST pipeline. The multi-command endpoint is `/pipeline` and it
 * takes a bare array of command arrays; posting that shape to the base URL
 * is read as one malformed command, which is why this must not be
 * "simplified" back.
 */
async function upstash(commands: [string, ...string[]][]): Promise<unknown[]> {
  const base = KV_URL!.replace(/\/+$/, '');
  const res = await fetch(`${base}/pipeline`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${KV_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`upstash_${res.status}`);
  const json = (await res.json()) as { result?: unknown }[] | { result?: unknown[] };
  if (Array.isArray(json)) return json.map((r) => r.result);
  return json.result ?? [];
}

function prefsKey(uid: string) {
  return `tb:prefs:${uid}`;
}

async function readRemotePrefs(uid: string): Promise<Prefs | null> {
  if (!isSyncConfigured()) return null;
  try {
    const res = await upstash([['GET', prefsKey(uid)]]);
    const raw = res[0];
    return raw ? (JSON.parse(String(raw)) as Prefs) : null;
  } catch {
    return null;
  }
}

async function writeRemotePrefs(uid: string, p: Prefs): Promise<void> {
  if (!isSyncConfigured()) return;
  try {
    await upstash([['SET', prefsKey(uid), JSON.stringify(p)]]);
  } catch {
    /* cookie copy is still authoritative for this device */
  }
}

async function deleteRemotePrefs(uid: string): Promise<void> {
  if (!isSyncConfigured()) return;
  try {
    await upstash([['DEL', prefsKey(uid)]]);
  } catch {
    /* nothing further we can do from here */
  }
}

interface PrefsCookiePayload extends Prefs {
  uid: string;
}

function sanitizePrefs(p: Partial<Prefs> | null | undefined): Prefs {
  const d = defaultPrefs();
  if (!p) return d;
  const regions = Array.isArray(p.alertRegions)
    ? (p.alertRegions.filter(
        (r) => r === 'US' || r === 'EU' || r === 'CN' || r === 'OTHER'
      ) as Region[])
    : d.alertRegions;
  const proUntil = typeof p.proUntil === 'number' && p.proUntil > 0 ? p.proUntil : 0;
  const plan =
    p.plan === 'pro' && proUntil > Date.now() ? 'pro' : 'free';
  return {
    myList: Array.isArray(p.myList)
      ? Array.from(new Set(p.myList.filter((x) => typeof x === 'string'))).slice(
          0,
          MY_LIST_MAX
        )
      : d.myList,
    alertCancers: Array.isArray(p.alertCancers)
      ? p.alertCancers.filter((x) => typeof x === 'string').slice(0, ALERT_FREE_LIMIT)
      : d.alertCancers,
    alertRegions: regions.length ? regions : d.alertRegions,
    alertEnabled: typeof p.alertEnabled === 'boolean' ? p.alertEnabled : d.alertEnabled,
    plan,
    proUntil,
    unlockCredits:
      typeof p.unlockCredits === 'number' && p.unlockCredits >= 0
        ? Math.floor(p.unlockCredits)
        : 0,
    genDate: typeof p.genDate === 'string' ? p.genDate : '',
    genCount:
      typeof p.genCount === 'number' && p.genCount >= 0 ? Math.floor(p.genCount) : 0,
    paypalSubscriptionId:
      typeof p.paypalSubscriptionId === 'string' && p.paypalSubscriptionId.length > 0
        ? p.paypalSubscriptionId
        : undefined,
    lastOrder: sanitizeOrder(p?.lastOrder),
    locale:
      typeof p?.locale === 'string' && p.locale.length > 0 && p.locale.length <= 8
        ? p.locale
        : undefined,
    providers: Array.isArray(p?.providers)
      ? (p!.providers as unknown[]).filter(
          (x): x is string =>
            typeof x === 'string' && ['email', 'google', 'microsoft', 'apple'].includes(x)
        )
      : [],
  };
}

/** Keep only well-formed order records; drop anything malformed. */
function sanitizeOrder(o: unknown): OrderRecord | undefined {
  if (!o || typeof o !== 'object') return undefined;
  const r = o as Record<string, unknown>;
  if (r.type !== 'single' && r.type !== 'subscription') return undefined;
  if (typeof r.paypalId !== 'string' || r.paypalId.length === 0) return undefined;
  if (typeof r.at !== 'number' || !Number.isFinite(r.at)) return undefined;
  return {
    type: r.type,
    amount: typeof r.amount === 'string' ? r.amount : '',
    currency: typeof r.currency === 'string' ? r.currency : 'USD',
    paypalId: r.paypalId,
    at: r.at,
    guest: r.guest === true,
  };
}

/** True while a Pro subscription / entitlement is currently active. */
export function isProActive(p: Prefs): boolean {
  return p.plan === 'pro' && p.proUntil > Date.now();
}

/**
 * Resolves the prefs + identity for the current request without requiring a
 * session. Signed-in callers use their derived uid; everyone else falls back
 * to the anonymous `tb_prefs` cookie so the daily generation cap still works
 * for visitors who never sign in. Used by the quota + entitlement checks.
 */
export async function getRequestPrefs(): Promise<{ uid: string; prefs: Prefs }> {
  const user = await getCurrentUser();
  if (user) return { uid: user.id, prefs: sanitizePrefs(user) };
  const local = await readPrefsForUid(ANON_UID);
  return { uid: ANON_UID, prefs: local ?? defaultPrefs() };
}

export function prefsCookie(uid: string, p: Prefs): CookieSpec {
  const payload: PrefsCookiePayload = { uid, ...sanitizePrefs(p) };
  return cookieSpec(PREFS_COOKIE, sign(payload), SESSION_TTL_DAYS * 24 * 60 * 60);
}

/**
 * Preferences left on this device for a given account, read without needing
 * a session. Sign-in uses this: at that moment the session cookie does not
 * exist yet, so getCurrentUser() would return null and a returning visitor
 * would find an empty follow list.
 */
export async function readPrefsForUid(uid: string): Promise<Prefs | null> {
  const c = await cookies();
  const local = unsign<PrefsCookiePayload>(c.get(PREFS_COOKIE)?.value);
  if (!local || local.uid !== uid) return null;
  return sanitizePrefs(local);
}

/**
 * The preferences to restore when somebody signs in: whatever the sync store
 * holds, otherwise whatever this device kept, otherwise defaults.
 */
export async function resolvePrefsOnSignIn(uid: string): Promise<Prefs> {
  const remote = await readRemotePrefs(uid);
  if (remote) return sanitizePrefs(remote);
  return (await readPrefsForUid(uid)) ?? defaultPrefs();
}

/**
 * Looks up a person's stored preferences by email (used by the weekly digest
 * job to find the saved-record list + locale for a confirmed subscriber).
 * Derives the uid from the address and reads the sync store when configured;
 * returns null when nothing durable is stored (e.g. local-only cookie).
 */
export async function readUserPrefsByEmail(email: string): Promise<Prefs | null> {
  const uid = uidForEmail(email);
  const remote = await readRemotePrefs(uid);
  if (remote) return sanitizePrefs(remote);
  return null;
}

/* ------------------------------------------------------------ current user */

async function readSession(): Promise<SessionPayload | null> {
  const c = await cookies();
  const s = unsign<SessionPayload>(c.get(SESSION_COOKIE)?.value);
  if (!s || !s.uid || !s.email) return null;
  if (Date.now() > s.exp) return null;
  return s;
}

/**
 * Resolves the signed-in person. Remote prefs win when the sync store is
 * configured, otherwise the signed cookie on this device is used.
 */
export async function getCurrentUser(): Promise<User | null> {
  const s = await readSession();
  if (!s) return null;

  const remote = await readRemotePrefs(s.uid);
  let prefs: Prefs;
  if (remote) {
    prefs = sanitizePrefs(remote);
  } else {
    const c = await cookies();
    const local = unsign<PrefsCookiePayload>(c.get(PREFS_COOKIE)?.value);
    prefs = sanitizePrefs(local && local.uid === s.uid ? local : null);
  }

  return {
    id: s.uid,
    email: s.email,
    emailLower: s.email.toLowerCase(),
    provider: s.provider,
    ...prefs,
  };
}

/**
 * Persists preferences everywhere available and hands back the cookie the
 * route must attach to its response.
 */
export async function savePrefs(uid: string, next: Prefs): Promise<{
  prefs: Prefs;
  cookie: CookieSpec;
}> {
  const clean = sanitizePrefs(next);
  await writeRemotePrefs(uid, clean);
  return { prefs: clean, cookie: prefsCookie(uid, clean) };
}

export async function erasePrefs(uid: string): Promise<void> {
  await deleteRemotePrefs(uid);
}

/* ------------------------------------------------------- IP rate limiting */

/*
 * Best-effort only. Each serverless instance keeps its own bucket, so this
 * slows down casual abuse rather than preventing a distributed attempt. The
 * per-session challenge counter above is the meaningful limit.
 */
const ipBuckets = new Map<string, { n: number; until: number }>();

export function checkIpRate(ip: string, max = 6, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const b = ipBuckets.get(ip);
  if (!b || b.until < now) {
    ipBuckets.set(ip, { n: 1, until: now + windowMs });
    return true;
  }
  if (b.n >= max) return false;
  b.n += 1;
  return true;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get('x-forwarded-for')?.split(',')[0].trim() || h.get('x-real-ip') || 'local'
  );
}

/* --------------------------------------------------------- tiny KV counter */

/**
 * Increment a counter in the sync store. Returns null when sync is not
 * configured (callers fall back to in-memory). Used by the anonymous stats
 * module so it can reuse the same Redis when available.
 */
export async function kvIncr(key: string, by = 1): Promise<number | null> {
  if (!isSyncConfigured()) return null;
  try {
    const res = await upstash([['INCRBY', key, String(by)]]);
    const raw = res[0];
    return typeof raw === 'number' ? raw : Number(raw ?? 0);
  } catch {
    return null;
  }
}

export async function kvGet(key: string): Promise<number> {
  if (!isSyncConfigured()) return 0;
  try {
    const res = await upstash([['GET', key]]);
    const raw = res[0];
    const n = raw == null ? 0 : Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}
