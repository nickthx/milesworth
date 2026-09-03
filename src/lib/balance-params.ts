import { createLoader, parseAsInteger } from "nuqs/server"; // server-safe entry — never bare "nuqs"

import type { Balances, EnterableProgramSlug } from "@/engine";

// URL param codec for the shareable-results contract (INPUT-03). This module
// is the ONE source of truth for the balance query params: the server page
// consumes loadBalanceParams (createLoader) and the client island consumes
// balanceParsers (useQueryStates) — same parsers, one definition.
//
// Deliberately server-importable: no client directive, no browser globals,
// and only the "nuqs/server" entry (the bare entry pulls in client hooks).
// tests/balance-params.test.ts enforces all three with a source scan.

/**
 * Canonical slug → short URL key (A3, locked before launch: changing these
 * breaks previously shared links). Matches CLAUDE.md's canonical example
 * `?ur=90000&mr=50000`. The `satisfies` constraint makes a misspelled or
 * missing slug a compile error.
 */
export const PARAM_KEY_BY_SLUG = {
  "chase-ur": "ur",
  "amex-mr": "mr",
  "capital-one": "c1",
  "citi-ty": "ty",
  bilt: "bilt",
  "world-of-hyatt": "hyatt",
  "hilton-honors": "hilton",
  "marriott-bonvoy": "bonvoy",
} as const satisfies Record<EnterableProgramSlug, string>;

/** The short-key union ("ur" | "mr" | … | "bonvoy"). */
type ShortKey = (typeof PARAM_KEY_BY_SLUG)[EnterableProgramSlug];

/** Parsed URL params as nuqs returns them: number when present, null when absent. */
type BalanceParams = Record<ShortKey, number | null>;

const SLUGS = Object.keys(PARAM_KEY_BY_SLUG) as EnterableProgramSlug[];

/**
 * One integer parser per short key. Passed to useQueryStates on the client
 * and to createLoader below for the server page — a single parser map keeps
 * the two sides from drifting (RESEARCH Pattern 1).
 */
export const balanceParsers = Object.fromEntries(
  SLUGS.map((slug) => [PARAM_KEY_BY_SLUG[slug], parseAsInteger]),
) as Record<ShortKey, typeof parseAsInteger>;

/**
 * Server-side loader: `await loadBalanceParams(searchParams)` in app/page.tsx
 * (accepts the Promise directly — searchParams is a Promise in Next 15+/16).
 */
export const loadBalanceParams = createLoader(balanceParsers);

/**
 * Plausible ceiling for a real points balance (T-05-08). Nothing above this
 * is an enterable balance — it is only a way to mint unbounded distinct /og
 * cache keys (`ur=9007199254740991`, `ur=9007199254740990`, …), each of which
 * would be a CDN miss and a fresh ~1s Satori render at origin. Ten million
 * points is an order of magnitude above the largest realistic single-program
 * balance, so the cap costs no legitimate user anything.
 */
const MAX_BALANCE = 10_000_000;

/**
 * True only for values the engine accepts: positive safe integers within the
 * plausible ceiling. Replicates the engine's sanitizeBalances guard at the URL
 * boundary (T-04-01); the engine re-applies it downstream — defense in depth,
 * T-03-09.
 */
function isValidBalance(value: number | null | undefined): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0 &&
    value <= MAX_BALANCE
  );
}

/**
 * Decode parsed URL params (short keys) into a Balances object (canonical
 * slugs). Hostile values — null, 0, negative, fractional, unsafe-huge —
 * are dropped (key omitted, never coerced to 0).
 */
export function paramsToBalances(
  params: Partial<Record<ShortKey, number | null>>,
): Balances {
  const balances: Balances = {};
  for (const slug of SLUGS) {
    const value = params[PARAM_KEY_BY_SLUG[slug]];
    if (isValidBalance(value)) {
      balances[slug] = value;
    }
  }
  return balances;
}

/**
 * Encode a Balances object into the full short-key param shape for nuqs
 * setParams. Every short key is present: `number` when the slug holds a
 * valid balance, `null` otherwise (nuqs convention — null clears the key
 * from the URL). Invalid values encode as null so they never reach the URL.
 */
export function balancesToParams(balances: Balances): BalanceParams {
  const params = {} as BalanceParams;
  for (const slug of SLUGS) {
    const value = balances[slug];
    params[PARAM_KEY_BY_SLUG[slug]] = isValidBalance(value) ? value : null;
  }
  return params;
}
