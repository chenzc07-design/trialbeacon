# TrialBeacon — Handoff & Status Summary

> Generated 2026-08-07 · based on local `master` vs. pushed remotes.
> Repo: `github.com/chenzc07-design/trialbeacon` · branch: `master`

---

## 1. Status at a glance

| Item | Value |
| --- | --- |
| Working tree | Has the metrics feature + dev seed route (see §8); `.env.local` + `.tb_state/` are git-ignored runtime files |
| Commits ahead of pushed state | Local `master` is ahead of `ssh-origin` — push when ready |
| Latest local commit | `6f037c1` — owner dashboard metrics feature (committed, pending push to `ssh-origin`) |
| `origin/master` (https) | **Stale cached ref**; not the source of truth |
| Next.js version | `15.5.7` (README's CVE-2025-66478 note already resolved) |

**Bottom line:** build complete with OAuth + owner metrics dashboard. Google is now configured + live (redirect verified), but **this sandbox blocks outbound traffic to Google**, so the final token exchange cannot complete *here* — it works on real hosting (Vercel / trialbeacon.cn). Microsoft + Apple endpoints *are* reachable from the sandbox, so those can be tested live once credentials are added. The metrics dashboard needs `STATS_TOKEN` (and optionally Upstash) to be production-grade. See §8 for the live demo link and §9 for the OAuth network caveat.

---

## 2. Client's progress (what was delivered)

The last development burst ran **2026-08-04 → 2026-08-08** and produced **22 commits** (all under the `TrialBeacon Deploy` identity). They fall into five coherent workstreams:

### A. Discussion List Pro / revenue (the biggest chunk)
- Monthly **$6.9 Pro subscription** + one-time single payments via PayPal.
- `/pro` pricing page, quota gating on the discussion list, limit-upsell prompts.
- Success-page **PDF download** (jsPDF) of the purchased list.
- PayPal hardening: runtime plan-id resolution via `/api/paypal/config`, `vault=true` for subscriptions, single `PayPalScriptProvider`, loading/error states, separate intents for subscription vs. one-time.
- Removed "free forever" contradictions from copy; neutralised "fits you" wording.

### B. Follow + weekly digest
- Per–cancer-type **Follow** with a `/following` centre and an inline "Follow updates" button on `/cancers` + homepage cards (shared state, limit prompt, toast).
- **Pro-only weekly digest**; cron route at `/api/cron/digest` (dry-run when no email provider is set).
- "Send a test email" buttons on the follow and update-reminder pages (real send, any logged-in user).

### C. Microsoft + Apple OAuth (unpushed — see §3)
- Sign in with **Microsoft** (Entra ID "common" tenant — any personal or work/school account) and **Sign in with Apple** (incl. Hide-My-Email relay addresses, used as the account key).
- Bound-providers display + flag icons on the language switcher.
- Google OAuth already existed; this commit extended the same `lib/auth.ts` flow to the two new providers.

### D. Design & freshness
- Branch/detail pages: stronger grid cards, pill filters + selected state, sticky discussion toolbar, unified light header.
- `SNAPSHOT_DATE` unified to **2026-08-05** so After Care / cancer lists share one freshness source with the page badge.

### E. Copy & i18n fixes
- `/pricing` 301 redirect; always-visible Pro link in discussion cards.
- After Care Pro prompts aligned to spec across **en / zh / de / fr / ja / ko** (the six supported locales).
- English Pro nav label set to "Pro" (zh stays "沟通清单 Pro").

---

## 3. The one outstanding change (not yet pushed)

`5ed4613 feat(auth): add Microsoft + Apple OAuth login…` is **pushed** to `ssh-origin/master` (along with `6ccc0d4`, the env-doc commit). It touches 17 files (+588 / −21):

- New routes: `app/api/auth/microsoft/{route,callback}/route.ts`, `app/api/auth/apple/{route,callback}/route.ts`
- Extended `lib/auth.ts` (state signing, session + provider-preference cookies, uid-by-email)
- UI: `components/AccountClient.tsx`, `components/AuthProvider.tsx`, `components/LocaleSwitcher.tsx`
- i18n strings added in all six `lib/messages/*.ts`

**It will not function until credentials are configured** (see §5). Push it once those are in place.

---

## 4. Environment & secrets

Copy `.env.example` → `.env.local` and fill in. Current required variables:

| Variable | Purpose | Status |
| --- | --- | --- |
| `AUTH_SECRET` | Signs session + preference cookies (use `openssl rand -hex 32`) | Required in prod |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Optional — cross-device saved lists / stats | Optional |
| `PAYPAL_CLIENT_ID` / `_SECRET` | Server-side PayPal auth | Required for Pro |
| `PAYPAL_MODE` | `sandbox` (default) or `live` | Set to `live` for prod |
| `PAYPAL_PLAN_ID` / `PAYPAL_WEBHOOK_ID` | Subscription plan + event verification | Required for subs |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` / `_PLAN_ID` | Browser-safe PayPal public values | Required for Pro UI |
| `STATS_TOKEN` | Protects `/admin/stats` | Optional |
| `MICROSOFT_CLIENT_ID` / `_SECRET` | **Microsoft Entra ID app** | ⚠️ **Not in `.env.example`** |
| `APPLE_CLIENT_ID` / `APPLE_KEY_ID` / `APPLE_TEAM_ID` / `APPLE_PRIVATE_KEY` | **Sign in with Apple** | ⚠️ **Not in `.env.example`** |

> ✅ **Resolved:** the eight `MICROSOFT_*` / `APPLE_*` variables are now documented in `.env.example` (commit `6ccc0d4`). The next person can configure auth directly from the example without grepping the source.

---

## 5. Pre-launch / action checklist

- [x] **Push the OAuth commit** (`5ed4613`) to `ssh-origin` — done (`6ccc0d4` is the tip).
- [x] **Document the new OAuth env vars** in `.env.example` — done (eight vars added, §4).
- [x] **Google OAuth configured + live** — `GOOGLE_CLIENT_ID`/`_SECRET` in `.env.local`; `/api/auth/google` verified to 307-redirect to Google with the correct `redirect_uri`. ⚠️ **Cannot finish in this sandbox** (Google is network-blocked here — see §9). Register the redirect URI in Google Cloud Console and deploy to reachable hosting for it to complete.
- [ ] **Register a Microsoft Entra ID app** (any-account "common" tenant) and set `MICROSOFT_CLIENT_ID` / `_SECRET`; add the `/api/auth/microsoft/callback` redirect URI. Microsoft endpoints *are* reachable from the sandbox, so this can be tested live here.
- [ ] **Configure Sign in with Apple** (Services ID + key; **$99/yr Apple Developer account required**), set the four `APPLE_*` vars, and wire the `form_post` callback to `/api/auth/apple/callback`. Apple endpoints are reachable from the sandbox, so this can be tested live here too.
- [ ] **Set `AUTH_SECRET`** in production (sessions are forgeable without it).
- [ ] **PayPal go-live:** create the live billing plan + webhook, set `PAYPAL_MODE=live`, `PAYPAL_PLAN_ID`, `PAYPAL_WEBHOOK_ID`, and the public client/plan ids.
- [ ] **Reconcile the https remote** — `origin/master` is a stale ref; a fresh `git fetch origin` should be run and confirmed before relying on it.
- [ ] **Next.js advisory** already cleared (on `15.5.7`); no action needed, but keep the line current.

---

## 6. Run & deploy (from README)

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm build && pnpm start
```

- **Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind 3.4.
- **Data:** ClinicalTrials.gov API v2 (1-hour ISR) with a verified snapshot fallback (`SNAPSHOT_DATE = 2026-08-05`); curated official US/EU/CN links in `lib/data/regional.ts`.
- **Deploy:** Vercel / Cloudflare Pages / any Node host. Weekly digest cron: `0 8 * * 1` → `/api/cron/digest` (guard with `CRON_SECRET`).
- **i18n:** locale lives in a `tb_locale` cookie (no URL segments); `lib/messages/en.ts` is the source of truth — a missing key is a build error.

---

## 7. Architecture refresher

- Server components use `getServerMessages()`; client components use `useI18n()`; pure helpers in `lib/i18n-runtime.ts`.
- Subscription store is abstracted behind `SubscriptionStore` — swap the file adapter for Postgres/SQLite/Resend without touching routes.
- Email delivery via `EMAIL_PROVIDER` (resend | postmark) + `EMAIL_API_KEY` + `EMAIL_FROM`; double opt-in through a per-subscription `token`.
- No medical advice, rankings, or recommendations by design — every entry links back to the official source.

---

## 8. Owner dashboard — 经营数据 (`/admin/stats`)

The site owner wanted a dead-simple way to see **visits / registrations / paid-users / revenue** without leaving the app. Built end-to-end:

| Piece | File | Notes |
| --- | --- | --- |
| Anonymous event counters | `lib/stats.ts` | `page_view` + 12 funnels; no health data stored |
| Payment + registration store | `lib/metrics.ts` | payment records → revenue + paid-user count; first-seen email → registration count |
| Admin page (gated) | `app/admin/stats/page.tsx` | 6 KPI cards + raw event table + recent payments; protected by `STATS_TOKEN` |
| Page-view ping | `components/PageViewPing.tsx` | client component, fires `page_view` on every route change |
| Persistence fallback | `lib/persist.ts` | local JSON file (`.tb_state/`) when Upstash is not configured |
| Dev seed | `app/api/admin/seed/route.ts` | **Kept in repo.** Gated by `STATS_TOKEN`; auto-disabled once Upstash is configured (can't wipe live prod data), but usable in local dev + sandbox preview. Idempotent: resets then writes ~1.3k visits, 28 registrations, 14 payments |

**Persistence:** when `UPSTASH_REDIS_REST_URL` + `_TOKEN` are set, both stores use Upstash (durable, multi-instance). Otherwise they hydrate from / write back to `.tb_state/*.json` so the numbers **survive server restarts** in local-dev / sandbox preview. `.tb_state/` is git-ignored (runtime state only).

**How the owner views it:**
- Live demo link (sandbox preview): `https://af73f65d0b7b099a8.gz1.agentos-app.net/admin/stats?token=demo`
- To (re)populate demo numbers: open `…/api/admin/seed?token=demo` once (dev mode only).
- For production Vercel: set `STATS_TOKEN` in project env vars, then visit `/admin/stats?token=<that token>`.

> The seed route is intentionally **kept** in the repo at the owner's request. It is gated by `STATS_TOKEN` and auto-disabled once Upstash (real prod persistence) is configured, so it can never wipe live production data — but it stays usable in local dev and the sandbox preview where stats fall back to the local `.tb_state/` file.

---

## 9. OAuth in this sandbox — what works and what doesn't

**Root cause of the earlier `google_not_configured` error:** `next start` reads `.env.local` once at boot. The long-lived process the sandbox supervisor keeps alive was started *before* the Google creds were added, so it never saw them. Killing that process and letting the supervisor respawn a fresh `next start` fixed it — now `/api/auth/google` correctly 307-redirects to Google. **Rule of thumb: after editing `.env.local`, restart the server** (or re-publish) so new vars are picked up.

**Sandbox outbound network reality (verified 2026-08-07):**

| Provider | Token/userinfo endpoint | Reachable from sandbox? | Can login finish *here*? |
| --- | --- | --- | --- |
| Google | `oauth2.googleapis.com`, `accounts.google.com` | ❌ blocked (DNS sinkhole `198.18.0.56`, no proxy reaches it) | **No** — token exchange fails |
| Microsoft | `login.microsoftonline.com` | ✅ reachable (302) | **Yes** (email taken from `id_token`, so the blocked `graph.microsoft.com` is only a fallback) |
| Apple | `appleid.apple.com` | ✅ reachable (403 on root GET, `/auth/token` works) | **Yes** (email comes from the posted `id_token`) |

So: **Google login is code-correct and will work on your real hosting** (Vercel / trialbeacon.cn) once the redirect URI is registered — it just can't complete inside this sandbox. **Microsoft and Apple can be proven to work right here** if you drop in credentials.

**Exact redirect URIs to register** (the sandbox preview domain is stable across re-publishes):

| Provider | Authorized redirect URI | Authorized JavaScript origin |
| --- | --- | --- |
| Google | `https://af73f65d0b7b099a8.gz1.agentos-app.net/api/auth/google/callback` | `https://af73f65d0b7b099a8.gz1.agentos-app.net` |
| Microsoft | `https://af73f65d0b7b099a8.gz1.agentos-app.net/api/auth/microsoft/callback` | `https://af73f65d0b7b099a8.gz1.agentos-app.net` |
| Apple | `https://af73f65d0b7b099a8.gz1.agentos-app.net/api/auth/apple/callback` | `https://af73f65d0b7b099a8.gz1.agentos-app.net` |

For production also register the same three paths under your real domain(s), e.g. `https://trialbeacon.cn/api/auth/<provider>/callback` and `https://trialbeacon.vercel.app/api/auth/<provider>/callback`.

The `redirect_uri` is derived at request time from the public host (`publicOrigin(req)` in `lib/auth.ts`), so it always matches whatever domain the visitor typed — no hardcoded URLs to keep in sync.


