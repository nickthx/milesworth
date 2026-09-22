import type { Balances } from "@/engine";
import { balancesToParams } from "@/lib/balance-params";
import { SITE_URL } from "@/lib/site";

// The canonical share URL (PLAT-02, RESEARCH Pattern 4, T-07-02). "Copy my
// link" and the share metadata both build from SITE_URL plus the eight short
// keys — never from the live address-bar location — so whatever is in the
// address bar (a Clerk dev-instance `__clerk_db_jwt` handoff, a `utm_`
// tracking param, a hash fragment) can never ride along into a public post.
//
// Deliberately server-importable: no client directive, no browser globals
// (same rule as balance-params.ts). tests/design-system-gate.test.ts scans
// this file for any browser-global reference.

/**
 * Canonical query string: balancesToParams iterates PARAM_KEY_BY_SLUG order
 * and emits null for absent/invalid balances, so filtering nulls and feeding
 * URLSearchParams yields the locked `ur=…&mr=…` ordering regardless of the
 * caller's object key order. Returns "" for an empty balance set.
 */
export function toShareQuery(balances: Balances): string {
  const present = Object.entries(balancesToParams(balances)).filter(
    (entry): entry is [string, number] => entry[1] !== null,
  );
  return new URLSearchParams(
    present.map(([key, value]) => [key, String(value)]),
  ).toString();
}

/** `${SITE_URL}/?ur=…` — or the bare `${SITE_URL}/` when nothing is entered. */
export function shareUrl(balances: Balances): string {
  const query = toShareQuery(balances);
  return query === "" ? `${SITE_URL}/` : `${SITE_URL}/?${query}`;
}
