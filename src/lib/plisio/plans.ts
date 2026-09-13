export type PlanId = "monthly" | "yearly";

export const PLANS: Record<PlanId, { amount: string; label: string; days: number }> = {
  monthly: { amount: "6.99", label: "Davar Premium — Monthly", days: 30 },
  yearly: { amount: "59.99", label: "Davar Premium — Yearly", days: 365 },
};

export function isPlanId(value: unknown): value is PlanId {
  return value === "monthly" || value === "yearly";
}
