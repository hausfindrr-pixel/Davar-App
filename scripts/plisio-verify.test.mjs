// Regression test for src/lib/plisio/verify.ts's webhook signature check.
// Run with: npm run test:plisio
//
// Plisio's own docs site is unreachable from some environments, so this
// algorithm was reconstructed from Plisio's PHP SDK and cross-checked
// against several independent official plugin implementations (see the
// comment in verify.ts) rather than tested against a live callback —
// Plisio only sends those from an IP-allowlisted production server. These
// test vectors are hand-computed independently of verify.ts's own code (see
// the inline HMAC computation below) so a bug in the implementation can't
// also be baked into the expected values.
import { createHmac } from "node:crypto";
import { verifyPlisioCallback } from "../src/lib/plisio/verify.ts";

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) {
    console.log("PASS:", name);
    pass++;
  } else {
    console.log("FAIL:", name);
    fail++;
  }
}

// Hand-computed: ksort({order_number: "abc123", status: "completed"}) then
// PHP serialize => a:2:{s:12:"order_number";s:6:"abc123";s:6:"status";s:9:"completed";}
const knownGoodHash = createHmac("sha1", "test_secret")
  .update('a:2:{s:12:"order_number";s:6:"abc123";s:6:"status";s:9:"completed";}', "utf8")
  .digest("hex");

check(
  "matches an independently hand-computed HMAC",
  verifyPlisioCallback(
    { order_number: "abc123", status: "completed", verify_hash: knownGoodHash },
    "test_secret",
  ) === true,
);

check(
  "field order in the input object does not affect the result",
  verifyPlisioCallback(
    { verify_hash: knownGoodHash, status: "completed", order_number: "abc123" },
    "test_secret",
  ) === true,
);

check(
  "a tampered field is rejected",
  verifyPlisioCallback(
    { order_number: "abc123", status: "cancelled", verify_hash: knownGoodHash },
    "test_secret",
  ) === false,
);

check(
  "the wrong secret key is rejected",
  verifyPlisioCallback(
    { order_number: "abc123", status: "completed", verify_hash: knownGoodHash },
    "wrong_secret",
  ) === false,
);

check(
  "a missing verify_hash is rejected without throwing",
  verifyPlisioCallback({ order_number: "abc123", status: "completed" }, "test_secret") === false,
);

// tx_urls must be HTML-entity-decoded before hashing (per Plisio's docs on this field).
const rawTxUrls = "https://example.com/tx?a=1&b=2";
const encodedTxUrls = "https://example.com/tx?a=1&amp;b=2";
const txUrlsHash = createHmac("sha1", "test_secret")
  .update(
    `a:2:{s:6:"status";s:9:"completed";s:7:"tx_urls";s:${Buffer.byteLength(rawTxUrls, "utf8")}:"${rawTxUrls}";}`,
    "utf8",
  )
  .digest("hex");

check(
  "tx_urls is html-entity-decoded before hashing",
  verifyPlisioCallback(
    { status: "completed", tx_urls: encodedTxUrls, verify_hash: txUrlsHash },
    "test_secret",
  ) === true,
);

// Non-ASCII values must use UTF-8 byte length, not JS string length.
const nameValue = "café"; // 4 JS chars, 5 UTF-8 bytes (é is 2 bytes)
const nonAsciiHash = createHmac("sha1", "test_secret")
  .update(`a:1:{s:10:"order_name";s:5:"${nameValue}";}`, "utf8")
  .digest("hex");

check(
  "non-ASCII values are length-prefixed by UTF-8 bytes, not JS .length",
  verifyPlisioCallback({ order_name: nameValue, verify_hash: nonAsciiHash }, "test_secret") === true,
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
