import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { verifyAdminSession } from "@/lib/admin/session";
import { getAdminDashboardData } from "@/lib/admin/stats";

// This page's whole point is a fresh, per-request server-side auth check
// (see verifyAdminSession) — it must never be statically rendered or
// cached, for the same person's data or anyone else's.
export const dynamic = "force-dynamic";

/**
 * The authoritative gate for /admin. src/proxy.ts already bounced a
 * signed-out visitor at the edge (cookie presence only), but that's just
 * an optimistic pre-filter — this is the real check: verify the session
 * cookie server-side and confirm this uid's own users/{uid} doc has
 * isAdmin === true, redirecting to "/" before any admin data is fetched
 * or rendered if either fails. A non-admin hitting this URL directly, with
 * or without a stolen/forged cookie value, never sees anything past this
 * line.
 */
export default async function AdminPage() {
  const session = await verifyAdminSession();
  if (!session) redirect("/");

  const data = await getAdminDashboardData();
  return <AdminDashboard data={data} />;
}
