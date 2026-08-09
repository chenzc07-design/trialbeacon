'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useI18n } from './I18nProvider';
import { clearMyListStorage } from '@/lib/mylist-storage';

export interface AuthUser {
  id: string;
  email: string;
  provider: 'email' | 'google' | 'microsoft';
  /** Login methods used with this account (Email/Google/Microsoft). */
  providers: string[];
  myList: string[];
  alertCancers: string[];
  alertRegions: ('US' | 'EU' | 'CN')[];
  alertEnabled: boolean;
  plan: 'free' | 'pro';
  proUntil: number;
  paypalSubscriptionId?: string;
  lastOrder?: {
    type: 'single' | 'subscription';
    amount: string;
    currency: string;
    paypalId: string;
    at: number;
    guest: boolean;
  } | null;
}

interface AuthState {
  user: AuthUser | null;
  status: 'unknown' | 'signed-out' | 'signed-in';
  /** True the first time we asked /api/auth/me on this page. */
  ready: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * Signs out AND deletes the stored preferences everywhere — sync store,
   * this device's cookie, and the local copy of the saved-record list.
   */
  eraseAll: () => Promise<void>;
  /**
   * Open or close the in-page sign-in modal. The modal is rendered
   * inside the provider so it can be triggered from any component.
   */
  openSignIn: (next?: string) => void;
  closeSignIn: () => void;
  signInOpen: boolean;
  signInNext: string;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<'unknown' | 'signed-out' | 'signed-in'>(
    'unknown'
  );
  const [ready, setReady] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [signInNext, setSignInNext] = useState('/');

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me', { cache: 'no-store' });
      const j = await r.json();
      if (j.user) {
        setUser(j.user);
        setStatus('signed-in');
      } else {
        setUser(null);
        setStatus('signed-out');
      }
    } catch {
      setUser(null);
      setStatus('signed-out');
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    setUser(null);
    setStatus('signed-out');
  }, []);

  const eraseAll = useCallback(async () => {
    await fetch('/api/auth/signout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ erase: true }),
    });
    clearMyListStorage();
    setUser(null);
    setStatus('signed-out');
  }, []);

  const openSignIn = useCallback((next?: string) => {
    if (next) setSignInNext(next);
    setSignInOpen(true);
  }, []);
  const closeSignIn = useCallback(() => setSignInOpen(false), []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      status,
      ready,
      refresh,
      signOut,
      eraseAll,
      openSignIn,
      closeSignIn,
      signInOpen,
      signInNext,
    }),
    [
      user,
      status,
      ready,
      refresh,
      signOut,
      eraseAll,
      openSignIn,
      closeSignIn,
      signInOpen,
      signInNext,
    ]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {signInOpen ? <SignInModal /> : null}
    </Ctx.Provider>
  );
}

function SignInModal() {
  const { messages: m } = useI18n();
  const { closeSignIn, refresh, signInNext } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [microsoftError, setMicrosoftError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    const ge = p.get('google_error');
    if (ge) setGoogleError(ge);
    const me = p.get('microsoft_error');
    if (me) setMicrosoftError(me);
  }, []);

  const send = async () => {
    setError(null);
    setInfo(null);
    setDevCode(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError(m.auth.errorEmail);
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/auth/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(
          j?.error === 'email_unavailable'
            ? m.auth.errorEmailUnavailable
            : j?.error === 'rate_limited'
              ? m.auth.errorRateLimited
              : m.auth.errorNetwork
        );
        return;
      }
      if (j.devCode) setDevCode(j.devCode);
      setInfo(m.auth.codeSent);
      setStage('code');
    } catch {
      setError(m.auth.errorNetwork);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setError(null);
    if (!code.trim()) {
      setError(m.auth.errorNoCode);
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, code: code.trim() }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(
          j?.error === 'no_challenge'
            ? m.auth.errorNoCode
            : j?.error === 'too_many_attempts' || j?.error === 'rate_limited'
              ? m.auth.errorRateLimited
              : m.auth.errorInvalid
        );
        if (j?.error === 'too_many_attempts') setStage('email');
        return;
      }
      await refresh();
      closeSignIn();
      // Navigate to the desired page if not already there.
      if (signInNext && signInNext !== '/' && typeof window !== 'undefined') {
        if (window.location.pathname !== signInNext) {
          window.location.href = signInNext;
        }
      }
    } catch {
      setError(m.auth.errorNetwork);
    } finally {
      setBusy(false);
    }
  };

  const startGoogle = () => {
    const next =
      signInNext && signInNext !== '/'
        ? `?next=${encodeURIComponent(signInNext)}`
        : '';
    window.location.href = `/api/auth/google${next}`;
  };

  const startMicrosoft = () => {
    const next =
      signInNext && signInNext !== '/'
        ? `?next=${encodeURIComponent(signInNext)}`
        : '';
    window.location.href = `/api/auth/microsoft${next}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 px-4 py-6 sm:items-center"
      onClick={closeSignIn}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signin-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slateish-200 px-5 py-4">
          <div>
            <p className="label-eyebrow">{m.auth.eyebrow}</p>
            <h2 id="signin-title" className="mt-1 text-lg font-semibold text-ink-950">
              {m.auth.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeSignIn}
            className="rounded-md p-1.5 text-slateish-500 hover:bg-slateish-100"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-slateish-600">{m.auth.intro}</p>

          {googleError ? (
            <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Google sign-in returned: {googleError}. Use the email code below instead.
            </p>
          ) : null}
          {microsoftError ? (
            <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Microsoft sign-in returned: {microsoftError}. Use the email code below instead.
            </p>
          ) : null}

          {stage === 'email' ? (
            <>
              <label htmlFor="signin-email" className="mt-4 block text-sm font-semibold text-ink-900">
                {m.auth.emailLabel}
              </label>
              <input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={m.auth.emailPlaceholder}
                autoComplete="email"
                className="mt-2 w-full rounded-xl border border-slateish-300 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-slateish-400 focus:border-navy-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send();
                }}
              />
              {error ? (
                <p className="mt-3 rounded-lg border border-[#e8c9c9] bg-[#faf0f0] px-3 py-2 text-xs text-[#7a3030]">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                onClick={send}
                disabled={busy}
                className="btn-primary mt-4 w-full"
              >
                {busy ? m.auth.sending : m.auth.sendCode}
              </button>
              <div className="my-4 flex items-center gap-3 text-xs text-slateish-400">
                <div className="h-px flex-1 bg-slateish-200" />
                or
                <div className="h-px flex-1 bg-slateish-200" />
              </div>
              <button
                type="button"
                onClick={startGoogle}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slateish-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-900 hover:bg-slateish-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 18 18" aria-hidden="true">
                  <path
                    d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
                    fill="#4285F4"
                  />
                  <path
                    d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.32A9 9 0 0 0 9 18z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.32z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.96L3.97 7.28C4.68 5.16 6.66 3.58 9 3.58z"
                    fill="#EA4335"
                  />
                </svg>
                {m.auth.googleBtn}
              </button>
              <button
                type="button"
                onClick={startMicrosoft}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slateish-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-900 hover:bg-slateish-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 21 21" aria-hidden="true">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                </svg>
                {m.auth.microsoftBtn}
              </button>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm text-slateish-600">{m.auth.codeHint}</p>
              {info ? (
                <p className="mt-2 rounded-lg border border-[#cfe3d8] bg-[#eef6f2] px-3 py-2 text-xs text-[#2e5747]">
                  {info}
                </p>
              ) : null}
              {devCode ? (
                <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Dev code (no SMTP): <span className="font-semibold tabular-nums">{devCode}</span>
                </p>
              ) : null}
              <label htmlFor="signin-code" className="mt-4 block text-sm font-semibold text-ink-900">
                {m.auth.codeLabel}
              </label>
              <input
                id="signin-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder={m.auth.codePlaceholder}
                className="mt-2 w-full rounded-xl border border-slateish-300 bg-white px-4 py-2.5 text-center text-lg font-semibold tabular-nums tracking-[0.4em] text-ink-900 placeholder:text-slateish-400 focus:border-navy-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') verify();
                }}
              />
              {error ? (
                <p className="mt-3 rounded-lg border border-[#e8c9c9] bg-[#faf0f0] px-3 py-2 text-xs text-[#7a3030]">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                onClick={verify}
                disabled={busy}
                className="btn-primary mt-4 w-full"
              >
                {busy ? m.auth.verifying : m.auth.verify}
              </button>
              <button
                type="button"
                onClick={send}
                disabled={busy}
                className="mt-2 w-full text-center text-xs font-medium text-navy-700 hover:underline"
              >
                {m.auth.resend}
              </button>
            </>
          )}

          <div className="mt-5 rounded-xl border border-slateish-200 bg-slateish-50 p-3 text-xs leading-relaxed text-slateish-600">
            <p className="font-semibold text-ink-800">{m.auth.privacyTitle}</p>
            <p className="mt-1">{m.auth.privacyBody}</p>
            <p className="mt-1">{m.auth.privacyLogin}</p>
          </div>
          <button
            type="button"
            onClick={closeSignIn}
            className="mt-3 w-full text-center text-xs text-slateish-500 hover:underline"
          >
            {m.auth.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
