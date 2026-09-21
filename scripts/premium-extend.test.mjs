// Regression test for src/lib/premium.ts's extendPremiumUntil — the fix
// for the renewal bug found in the Plisio payment-flow audit (Sept 2026):
// renewing while still premium used to reset premiumUntil from "now",
// silently forfeiting whatever time was left. Run with: npm run test:premium
import { extendPremiumUntil } from "../src/lib/premium.ts";

let pass = 0;
let fail = 0;
function check(name, got, want) {
  if (got === want) {
    console.log("PASS:", name);
    pass++;
  } else {
    console.log("FAIL:", name, "— got", got, "want", want);
    fail++;
  }
}

const DAY = 24 * 60 * 60 * 1000;
const now = Date.parse("2026-09-21T00:00:00Z");
const ts = (ms) => ({ toMillis: () => ms });

check("first-time purchase starts from now", extendPremiumUntil(null, 30, now), now + 30 * DAY);

check(
  "a lapsed grant (premiumUntil in the past) renews from now, not from the stale date",
  extendPremiumUntil(ts(now - 10 * DAY), 30, now),
  now + 30 * DAY,
);

check(
  "renewing while still premium extends from the existing premiumUntil, not from now",
  extendPremiumUntil(ts(now + 3 * DAY), 30, now),
  now + 3 * DAY + 30 * DAY,
);

check(
  "premiumUntil exactly equal to now counts as already expired",
  extendPremiumUntil(ts(now), 30, now),
  now + 30 * DAY,
);

check(
  "a yearly renewal extends from a still-future premiumUntil the same way",
  extendPremiumUntil(ts(now + 100 * DAY), 365, now),
  now + 100 * DAY + 365 * DAY,
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
