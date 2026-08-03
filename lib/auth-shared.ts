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
