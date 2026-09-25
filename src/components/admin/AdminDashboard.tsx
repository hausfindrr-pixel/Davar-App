import { BarChart } from "@/components/admin/BarChart";
import { StatTile } from "@/components/admin/StatTile";
import {
  formatCompactNumber,
  formatCompactUsd,
  formatPercent,
  formatShortDay,
  formatUsd,
} from "@/lib/admin/format";
import type {
  AdminDashboardData,
  AdminExpiringPremiumRow,
  AdminLessonStats,
  AdminPaymentRow,
  AdminWatchUserRow,
} from "@/lib/admin/stats";

type AdminDashboardProps = {
  data: AdminDashboardData;
};

const CARD = "rounded-2xl bg-paper border border-mist p-4 flex flex-col gap-3";
const SECTION_TITLE = "text-sm font-bold text-ink";
const TH = "text-left text-[11px] font-semibold uppercase tracking-wide text-stone px-2 py-1.5";
const TD = "px-2 py-1.5 text-ink align-top";

/** The whole /admin view — summary tiles, two trend charts, a retention
 * cohort table, and detail tables for payments/lessons/Watch usage.
 * Purely a rendering of AdminDashboardData (fetched server-side by
 * app/admin/page.tsx, gated by verifyAdminSession) — no client-side
 * fetching, no interactivity beyond what plain HTML gives for free.
 * Function over polish, per spec: no charting library, no client state. */
export function AdminDashboard({ data }: AdminDashboardProps) {
  const { users, retention, revenue, watch, lessons, prayerCount, ledgerHighlightCount, generatedAtMs } = data;

  const lessonsByRate = [...lessons].sort((a, b) => {
    if (a.completionRate === null) return 1;
    if (b.completionRate === null) return -1;
    return a.completionRate - b.completionRate;
  });

  return (
    <main className="min-h-dvh bg-ivory px-4 py-6 flex flex-col gap-6 max-w-4xl mx-auto">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-ink">Davar Admin</h1>
        <span className="text-xs text-stone">
          Generated {new Date(generatedAtMs).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
        </span>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatTile label="Total signups" value={formatCompactNumber(users.totalUsers)} />
        <StatTile label="Free users" value={formatCompactNumber(users.freeUsers)} />
        <StatTile label="Premium users" value={formatCompactNumber(users.premiumUsers)} />
        <StatTile label="Active today" value={formatCompactNumber(users.active1d)} />
        <StatTile label="Active 7d" value={formatCompactNumber(users.active7d)} />
        <StatTile label="Active 30d" value={formatCompactNumber(users.active30d)} />
        <StatTile label="Total revenue" value={formatCompactUsd(revenue.totalRevenueUsd)} />
        <StatTile
          label="Active subscriptions"
          value={formatCompactNumber(revenue.activePremiumCount)}
          sublabel={`${revenue.premiumByPlan.monthly ?? 0} monthly · ${revenue.premiumByPlan.yearly ?? 0} yearly`}
        />
        <StatTile label="Watch messages" value={formatCompactNumber(watch.totalMessages)} />
        <StatTile label="Watch est. cost" value={formatCompactUsd(watch.estimatedCostUsd)} />
        <StatTile label="Prayer entries" value={formatCompactNumber(prayerCount)} />
        <StatTile label="Ledger highlights" value={formatCompactNumber(ledgerHighlightCount)} />
      </section>

      <section className="grid sm:grid-cols-2 gap-3">
        <BarChart
          title="Signups / day (30d)"
          data={users.signupsByDay.map((d) => ({ date: d.date, value: d.count }))}
          color="var(--color-sage-600)"
          totalLabel={`${users.signupsByDay.reduce((sum, d) => sum + d.count, 0)} total`}
        />
        <BarChart
          title="Revenue / day (30d)"
          data={revenue.revenueByDay.map((d) => ({ date: d.date, value: d.amountUsd }))}
          color="var(--color-clay-600)"
          totalLabel={formatUsd(revenue.revenueByDay.reduce((sum, d) => sum + d.amountUsd, 0))}
        />
      </section>

      <section className={CARD}>
        <h2 className={SECTION_TITLE}>Retention — % of each signup week still active 7d later</h2>
        <div className="flex flex-col gap-2">
          {retention.map((cohort) => {
            const percent = cohort.cohortSize > 0 ? cohort.stillActive7d / cohort.cohortSize : null;
            return (
              <div key={cohort.cohortStart} className="flex items-center gap-3 text-xs">
                <span className="w-16 shrink-0 text-stone">{formatShortDay(cohort.cohortStart)}</span>
                <div className="flex-1 h-1.5 rounded-full bg-mist overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sage-600"
                    style={{ width: `${Math.round((percent ?? 0) * 100)}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-ink tabular-nums">
                  {formatPercent(percent)} of {cohort.cohortSize}
                </span>
              </div>
            );
          })}
          {retention.every((c) => c.cohortSize === 0) ? (
            <span className="text-xs text-stone">No signups yet in this window.</span>
          ) : null}
        </div>
      </section>

      <section className={CARD}>
        <h2 className={SECTION_TITLE}>Lesson completion — lowest first</h2>
        <LessonTable rows={lessonsByRate} />
      </section>

      <section className={CARD}>
        <h2 className={SECTION_TITLE}>Premium subscriptions expiring soonest</h2>
        <ExpiringPremiumTable rows={revenue.expiringPremium.slice(0, 20)} />
      </section>

      <section className={CARD}>
        <h2 className={SECTION_TITLE}>Recent payments</h2>
        <PaymentTable rows={revenue.recentPayments.slice(0, 20)} />
      </section>

      <section className={CARD}>
        <h2 className={SECTION_TITLE}>Failed / underpaid invoices</h2>
        {revenue.problemInvoices.length > 0 ? (
          <PaymentTable rows={revenue.problemInvoices.slice(0, 20)} />
        ) : (
          <span className="text-xs text-stone">None — every recent invoice either paid in full or is still pending.</span>
        )}
      </section>

      <section className={CARD}>
        <h2 className={SECTION_TITLE}>Peter&rsquo;s Watch — highest volume (last 7d)</h2>
        <WatchTopUsersTable rows={watch.topUsersLast7d} />
        <span className="text-xs text-stone">
          {formatCompactNumber(watch.totalInputTokens)} input + {formatCompactNumber(watch.totalOutputTokens)} output
          tokens all-time, at $2/$10 per million (Sonnet 5).
        </span>
      </section>
    </main>
  );
}

function LessonTable({ rows }: { rows: AdminLessonStats[] }) {
  if (rows.length === 0) return <span className="text-xs text-stone">No lessons seeded yet.</span>;
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-mist">
            <th className={TH}>Lesson</th>
            <th className={TH}>Started</th>
            <th className={TH}>Completed</th>
            <th className={TH}>Rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.lessonId} className="border-b border-mist last:border-0">
              <td className={TD}>{row.title}</td>
              <td className={`${TD} tabular-nums`}>{row.starts}</td>
              <td className={`${TD} tabular-nums`}>{row.completions}</td>
              <td className={`${TD} tabular-nums`}>{formatPercent(row.completionRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExpiringPremiumTable({ rows }: { rows: AdminExpiringPremiumRow[] }) {
  if (rows.length === 0) return <span className="text-xs text-stone">No active premium subscriptions.</span>;
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-mist">
            <th className={TH}>User</th>
            <th className={TH}>Plan</th>
            <th className={TH}>Renews / expires</th>
            <th className={TH}>Days left</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.uid} className="border-b border-mist last:border-0">
              <td className={TD}>{row.email ?? row.displayName ?? row.uid}</td>
              <td className={TD}>{row.planId ?? "—"}</td>
              <td className={TD}>{new Date(row.premiumUntilMs).toLocaleDateString("en-US")}</td>
              <td className={`${TD} tabular-nums ${row.expiringSoon ? "text-clay-700 font-semibold" : ""}`}>
                {row.daysRemaining}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentTable({ rows }: { rows: AdminPaymentRow[] }) {
  if (rows.length === 0) return <span className="text-xs text-stone">Nothing yet.</span>;
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-mist">
            <th className={TH}>Date</th>
            <th className={TH}>User</th>
            <th className={TH}>Plan</th>
            <th className={TH}>Amount</th>
            <th className={TH}>Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.orderNumber ?? "row"}_${i}`} className="border-b border-mist last:border-0">
              <td className={TD}>{new Date(row.receivedAtMs).toLocaleDateString("en-US")}</td>
              <td className={TD}>{row.email ?? row.uid ?? "—"}</td>
              <td className={TD}>{row.plan ?? "—"}</td>
              <td className={`${TD} tabular-nums`}>{row.amountUsd !== null ? formatUsd(row.amountUsd) : "—"}</td>
              <td className={TD}>{row.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WatchTopUsersTable({ rows }: { rows: AdminWatchUserRow[] }) {
  if (rows.length === 0) return <span className="text-xs text-stone">No Peter&rsquo;s Watch activity in the last 7 days.</span>;
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-mist">
            <th className={TH}>User</th>
            <th className={TH}>Date</th>
            <th className={TH}>Messages</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.uid}_${row.date}_${i}`} className="border-b border-mist last:border-0">
              <td className={TD}>{row.email ?? row.uid}</td>
              <td className={TD}>{row.date}</td>
              <td className={`${TD} tabular-nums`}>{row.messageCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
