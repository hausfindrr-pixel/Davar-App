/**
 * Shared between src/app/api/auth/session/route.ts (mints/clears it),
 * src/lib/admin/session.ts (the authoritative server-side verification),
 * and src/proxy.ts (a cheap presence-only pre-filter) — kept in its own
 * file, with no other imports, so proxy.ts and this constant's other
 * consumers never have to pull in firebase-admin just to know the cookie's
 * name.
 */
export const SESSION_COOKIE_NAME = "session";
