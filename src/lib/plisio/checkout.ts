import type { PlanId } from "@/lib/plisio/plans";

/** Calls create-invoice and redirects the browser to Plisio's hosted checkout. */
export async function startCheckout(plan: PlanId, idToken: string): Promise<void> {
  const res = await fetch("/api/plisio/create-invoice", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ plan }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.invoiceUrl) {
    throw new Error(data?.error ?? "Could not start checkout.");
  }
  window.location.href = data.invoiceUrl;
}
