// Regression test for src/lib/plisio/amountCheck.ts — the overpay/underpay
// tolerance decision added after a real incident (Sept 2026): a Solana
// payment overpaid by ~6% went through Plisio's "mismatch" status and never
// reached "completed", so the webhook correctly did nothing under the old
// all-or-nothing logic, silently stranding a customer who had genuinely
// paid enough. Run with: npm run test:plisio-amount
import { isMismatchAmountSufficient, parseAmount } from "../src/lib/plisio/amountCheck.ts";

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

const TOLERANCE = 0.05;
const MONTHLY = 6.99;

check("exact match is sufficient", isMismatchAmountSufficient(MONTHLY, 6.99, TOLERANCE), true);

check(
  "a real overpayment (the actual incident: ~6% over) is sufficient",
  isMismatchAmountSufficient(MONTHLY, 7.4, TOLERANCE),
  true,
);

check(
  "a tiny rounding shortfall within tolerance is still sufficient",
  isMismatchAmountSufficient(MONTHLY, 6.95, TOLERANCE),
  true,
);

check(
  "exactly at the tolerance boundary is sufficient",
  isMismatchAmountSufficient(MONTHLY, MONTHLY - TOLERANCE, TOLERANCE),
  true,
);

check(
  "a cent past the tolerance boundary is NOT sufficient",
  isMismatchAmountSufficient(MONTHLY, MONTHLY - TOLERANCE - 0.01, TOLERANCE),
  false,
);

check("a real, meaningful underpayment is NOT sufficient", isMismatchAmountSufficient(MONTHLY, 3.5, TOLERANCE), false);

check("a null (unparseable/missing) amount is NEVER treated as sufficient", isMismatchAmountSufficient(MONTHLY, null, TOLERANCE), false);

check("parseAmount reads a valid numeric string", parseAmount("7.40"), 7.4);
check("parseAmount returns null for null input", parseAmount(null), null);
check("parseAmount returns null for garbage input", parseAmount("not-a-number"), null);
check("parseAmount handles a whole-number string", parseAmount("59.99"), 59.99);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
