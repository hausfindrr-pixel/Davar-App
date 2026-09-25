import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/admin/sessionCookie";

/**
 * Optimistic, cheap pre-filter for /admin — only checks whether the
 * session cookie is *present*, never verifies it (that needs the Admin
 * SDK, which is deliberately kept out of Proxy — see the Next.js
 * authentication guide's Optimistic vs. Secure checks). This exists purely
 * so a signed-out visitor bounces at the edge instead of reaching the page
 * at all. The actual authorization decision — is this cookie valid, and is
 * this uid an admin — is re-verified independently, server-side, by
 * verifyAdminSession() (src/lib/admin/session.ts) inside app/admin/page.tsx
 * itself; that check, not this one, is what a non-admin with a stolen or
 * forged cookie value would actually fail.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE_NAME)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
