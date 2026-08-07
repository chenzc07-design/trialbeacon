/**
 * Constants shared between the server (auth library) and the client
 * (UI components). Keep this file dependency-free so it can be imported
 * from either side without dragging in `node:crypto` or `next/headers`.
 */
export const FREE_FOLLOW_LIMIT = 1;
export const ALERT_FREE_LIMIT = 1;
export const SESSION_TTL_DAYS = 60;
export const CODE_TTL_MIN = 10;
export const SESSION_COOKIE = 'tb_session';

/* ----------------------------------------------------- discussion-list quota */

/**
 * Free-tier daily generation caps. A "generation" is one discussion-list
 * PDF / printable export. Anonymous visitors get one per day; signed-in
 * visitors get three.
 */
export const FREE_DAILY_GENS = 1;
export const SIGNED_DAILY_GENS = 3;

/**
 * Records-per-list caps (one generation can only include so many records).
 * Free plans (anonymous OR signed-in) hold up to 5 records; a single-unlock
 * credit or an active Pro subscription raises that to 10. The free cap is
 * deliberately uniform so the "Free limit reached (5 records)" copy is always
 * accurate and the upsell triggers at the same point for every free visitor.
 */
export const FREE_GEN_LIMIT = 5;
export const SIGNED_GEN_LIMIT = 5;

/**
 * Pro (Discussion List Pro) and single-unlock caps. Both unlock a full list
 * of up to 10 records. Pro additionally removes the daily generation cap for
 * the subscription month, but still never packs more than 10 records/list.
 */
export const PRO_GEN_LIMIT = 10;
export const SINGLE_UNLOCK_RECORDS = 10;

/** ~32 days — a monthly subscription window with a small grace margin. */
export const PRO_MONTH_MS = 32 * 24 * 60 * 60 * 1000;

/**
 * Pseudonymous id used for visitors with no session. Their daily generation
 * count and any single-unlock credits are stored under this uid in the same
 * signed `tb_prefs` cookie the signed-in flow uses — no new storage.
 */
export const ANON_UID = 'anon';
