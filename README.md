# TrialBeacon

A neutral, traceable index of publicly listed cancer clinical trials, guideline indexes and regulatory notices from official sources in the **United States**, **Europe** and **China**.

> Trusted updates from official sources. Nothing more.

## What it is

- A calm, mobile-first link aggregator.
- No recommendations. No rankings. No medical advice.
- Every entry links back to the official page in one click.

## Features (free tier)

- Browse 10 cancer types, each with US / EU / CN records side by side.
- "After Conservative / Palliative Care" view — filters official records whose own text mentions advanced, metastatic, recurrent or later-line disease or supportive care.
- Change Tracker (last 7 / 14 days: newly listed, updated, closed).
- Plain keyword search over titles and identifiers.
- Weekly email alerts: subscribe to up to 3 cancer types, one email per week, links only.
- One-click unsubscribe at `/unsubscribe` (no confirmation step, removed immediately).
- Global disclaimer on every page and in every email.
- Six UI languages (English, 中文, Français, Deutsch, 日本語, 한국어) — auto-detected, freely switchable.

## Languages (i18n)

Six locales are supported: `en`, `zh`, `fr`, `de`, `ja`, `ko`.

- **Auto-detection** — `middleware.ts` parses the browser/OS `Accept-Language` header on the
  first request and writes a `tb_locale` cookie (1 year, `SameSite=lax`).
- **Manual switching** — the language selector in the header (desktop and mobile menu) writes the
  cookie and refreshes the route; the choice always wins over the header afterwards.
- **No URL segments** — locale lives in a cookie, so every route, sitemap entry and SSG path
  stays exactly as it was. `<html lang>` is set per request.
- **Where the strings live** — `lib/messages/{en,zh,fr,de,ja,ko}.ts`. `en.ts` is the source of
  truth and exports the `Messages` type; the other five must satisfy it, so a missing key is a
  build error.
- **Server vs client** — server components call `getServerMessages()` (`lib/i18n-server.ts`);
  client components read `useI18n()` from `components/I18nProvider.tsx`. Pure helpers
  (`t`, `interp`, `lookup`, locale constants) live in `lib/i18n-runtime.ts` so client bundles
  never pull in all six dictionaries.
- **Interpolation** — `t(m, 'key', { n })` supports `{name}` placeholders and `{n|one|many}`
  pluralisation. Dates are formatted with `toLocaleDateString(locale)`.

Adding a language: create `lib/messages/<code>.ts` typed as `Messages`, then add the code to
`LOCALES` and its endonym to `LOCALE_NAMES` in `lib/i18n-runtime.ts`.

## Imagery

Deliberately restrained — no stock photos of patients, no clinical imagery that could read as
promotional or distressing.

| Asset | Purpose |
| --- | --- |
| `public/hero-photo.png` | Abstract navy/white background behind the home hero, layered under a radial white scrim so the headline keeps AA contrast. |
| `public/hero-bg.svg` | Vector concentric-ring fallback for the same slot. |
| `public/regions-illustration.svg` | US / EU / CN nodes converging on the beacon mark — used on `/about`. |
| `public/og-image.svg` | 1200×630 social card wired into `openGraph` + Twitter metadata. |
| `public/favicon.svg` | Beacon mark. |
| `public/page-hero-bg.png` | Shared banner background for all inner pages, rendered by `components/PageHero.tsx` with a left-to-right white scrim. |
| `components/CancerIcon.tsx` | Ten symbolic (non-anatomical) line icons, one per cancer type — used on the type index and detail pages. |
| `components/Motifs.tsx` | Small decorative line motifs (beacon, mail, compass, document, RSS, shield, filter) used in page banners and the 404 page. |

## SEO

- `app/sitemap.ts` generates `sitemap.xml` for all public routes (home, cancer types, per-type pages, tools, about).
- `app/robots.ts` allows crawlers everywhere except `/api/` and `/unsubscribe`.
- JSON-LD structured data: a site-wide `WebSite` + `Organization` graph in `app/layout.tsx`, plus a per-type `CollectionPage` on every cancer page.
- Set `SITE_URL` (defaults to `https://trialbeacon.example.com`) to write correct absolute URLs.

## Weekly digest job

`app/api/cron/digest` runs the weekly email once a week (protect with `CRON_SECRET`).
With no email provider configured it runs in dry-run mode and returns the rendered
payloads, so the pipeline can be verified end to end before any address is contacted.

```
# vercel.json
{ "crons": [{ "path": "/api/cron/digest", "schedule": "0 8 * * 1" }] }
```

Configure delivery with `EMAIL_PROVIDER` (resend | postmark), `EMAIL_API_KEY`,
`EMAIL_FROM`. Double opt-in is wired through the per-subscription `token`.

## Architecture

- Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS.
- ClinicalTrials.gov public API v2 is queried server-side with 1-hour ISR caching.
- A verified snapshot of real records (snapshot date 2026-07-30) acts as the fallback so the site never appears empty.
- Curated official links to EMA, CTIS, ESMO, CDE, NMPA, ChiCTR, FDA, NCCN are kept in `lib/data/regional.ts`.
- Subscription store is abstracted behind `SubscriptionStore` — swap the file-based adapter for Postgres / SQLite / Resend without changing routes.
- Weekly digest template in `lib/email.ts`.

## Run

```
pnpm install
pnpm dev          # http://localhost:3000
pnpm build && pnpm start
```

Set `TRIALBEACON_DATA_DIR` to relocate the subscription store.

## Deploy

- Vercel, Cloudflare Pages (Node), or any Node host. The app is self-contained; no external services required for the free tier.
- Optional: connect Resend / Postmark / SES to `lib/email.ts` and run a weekly cron route for the digest.

## Security note

The lockfile currently resolves `next@15.1.6`. When deploying, upgrade Next.js to the
latest patched 15.x (see `next` release notes, CVE-2025-66478) to clear the advisory:

```
pnpm add next@latest   # or a specific patched 15.x line
```

The app code does not rely on any version-specific APIs, so the upgrade is low risk.

## Source list

| Region | Source | URL |
|---|---|---|
| US | ClinicalTrials.gov | https://clinicaltrials.gov/ |
| US | FDA oncology approvals | https://www.fda.gov/drugs/resources-information-approved-drugs/oncology-cancer-hematologic-malignancies-approval-notifications |
| US | NCCN Guidelines | https://www.nccn.org/guidelines/category_1 |
| EU | EMA medicines | https://www.ema.europa.eu/en/medicines |
| EU | CTIS public register | https://euclinicaltrials.eu/ctis-public/search |
| EU | ESMO Guidelines | https://www.esmo.org/guidelines |
| CN | CDE 受理品种信息 | https://www.cde.org.cn/main/xxgk/listpage/9f9c74c73e0f8f56a8bfbc646055026d |
| CN | NMPA 药品 | https://www.nmpa.gov.cn/yaopin/index.html |
| CN | ChiCTR | https://www.chictr.org.cn/ |
| CN | chinadrugtrials.org.cn | https://www.chinadrugtrials.org.cn/index.html |

## Disclaimer

TrialBeacon does not provide medical advice and does not recommend, rank or evaluate any treatment or trial. Discuss anything you find with your doctor, and always rely on the original official page.
