import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Plisio signs webhook callbacks the way its official PHP SDK/plugins do:
 * remove `verify_hash`, PHP `ksort()` the rest, PHP `serialize()` the
 * result, then HMAC-SHA1 with your secret API key. There's no official
 * Node/TypeScript reference for this — Plisio's own docs site is
 * unreachable from this environment — so this was reconstructed from
 * Plisio's PHP SDK (github.com/Plisio/plisio-api-php) and cross-checked
 * against half a dozen independent official plugin implementations
 * (WooCommerce, PrestaShop, Shopware, WHMCS, ClientExec, Laravel) that all
 * agree on the same algorithm. It has NOT been exercised against a real
 * Plisio callback — Plisio only sends these from an IP-allowlisted
 * production server, so that's only possible once this is deployed. If a
 * real callback fails verification, that mismatch is the first thing to
 * check against Plisio's own docs.
 *
 * PHP's serialize() of an associative array of strings looks like:
 *   a:2:{s:3:"foo";s:3:"bar";s:3:"baz";s:3:"qux";}
 * — "s:<UTF-8 byte length>:"<value>";" for each key then each value, in
 * the array's current order (so: sort first, then serialize).
 */
function phpSerializeString(value: string): string {
  return `s:${Buffer.byteLength(value, "utf8")}:"${value}";`;
}

function phpSerializeStringMap(sortedEntries: [string, string][]): string {
  const body = sortedEntries.map(([k, v]) => phpSerializeString(k) + phpSerializeString(v)).join("");
  return `a:${sortedEntries.length}:{${body}}`;
}

/** Plisio's docs note tx_urls is HTML-entity-encoded in the raw callback body. */
function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * Verifies a Plisio webhook payload's `verify_hash`. `payload` should be
 * the flat set of fields Plisio posted (form or JSON), still including
 * `verify_hash`. Returns false (never throws) for any malformed input.
 */
export function verifyPlisioCallback(
  payload: Record<string, unknown>,
  secretKey: string,
): boolean {
  const receivedHash = payload.verify_hash;
  if (typeof receivedHash !== "string" || receivedHash.length === 0) return false;

  const stringified: Record<string, string> = {};
  for (const key of Object.keys(payload)) {
    if (key === "verify_hash") continue;
    const value = payload[key];
    let str = value === null || value === undefined ? "" : String(value);
    if (key === "tx_urls") str = decodeHtmlEntities(str);
    stringified[key] = str;
  }

  const sortedEntries = Object.keys(stringified)
    .sort()
    .map((key): [string, string] => [key, stringified[key]]);

  const serialized = phpSerializeStringMap(sortedEntries);
  const expectedHex = createHmac("sha1", secretKey).update(serialized, "utf8").digest("hex");

  const expected = Buffer.from(expectedHex, "hex");
  const received = Buffer.from(receivedHash, "hex");
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
