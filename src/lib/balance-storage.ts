import type { Balances, EnterableProgramSlug } from "@/engine";

import { PARAM_KEY_BY_SLUG } from "./balance-params";

// Browser-storage persistence for INPUT-02 ("balances survive a reload") plus the
// URL-vs-storage precedence rule (A1). Every function here is pure: storage
// I/O is INJECTED (`Pick<Storage, ...>`), never reached for via the browser
// global, so tests/balance-storage.test.ts runs in the node environment with
// a fake storage object and no jsdom.
//
// Pitfall 2 (hydration): callers must invoke readStoredBalances/
// writeStoredBalances from effects ONLY — never during render or inside a
// useState initializer. The server has no storage, so a storage-derived first
// render would mismatch the server HTML. The client island reads in a
// useEffect after mount and pushes the result into the URL via setParams.

/**
 * Versioned storage key. JSON payload is keyed by CANONICAL slug (the stable
 * contract), never by the short URL key — bump the version if the shape
 * changes so stale payloads are discarded by validation, not misread.
 */
export const STORAGE_KEY = "pu:balances:v1";

/** The 8 enterable slugs — derived from the codec map, never re-listed. */
const KNOWN_SLUGS = new Set<string>(Object.keys(PARAM_KEY_BY_SLUG));

/**
 * True only for values the engine accepts: positive safe integers. Same guard
 * as the URL boundary (balance-params) and the engine's sanitizeBalances
 * (T-03-09) — applied a second time here because client storage is a tamperable
 * boundary of its own (T-04-02).
 */
function isValidBalance(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

/**
 * Validate an unknown parsed payload as a Balances object. Field-by-field
 * check; WHOLESALE discard (null) on the first failure — a single unknown key
 * or hostile value means the payload is not ours and nothing is salvaged
 * (T-04-02).
 */
function validateStoredPayload(payload: unknown): Balances | null {
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return null;
  }
  const balances: Balances = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!KNOWN_SLUGS.has(key) || !isValidBalance(value)) {
      return null;
    }
    balances[key as EnterableProgramSlug] = value;
  }
  return balances;
}

/**
 * Read and validate the persisted balances — INPUT-02.
 *
 * Returns null when the key is absent, the JSON is malformed, the payload is
 * not a plain object, any key is not an enterable slug, or any value is not a
 * positive safe integer. Also returns null (and never throws) when storage
 * access itself throws — LinkedIn's in-app WebView and private modes can do
 * this (Pitfall 6 / T-04-03); the caller silently degrades to URL-only
 * behavior. The caught error is never logged or rethrown (T-01-07).
 */
export function readStoredBalances(
  storage: Pick<Storage, "getItem">,
): Balances | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    return validateStoredPayload(JSON.parse(raw));
  } catch {
    // Pitfall 6 / T-01-07: swallow silently — degrade to URL-only behavior.
    return null;
  }
}

/**
 * Persist balances under STORAGE_KEY as JSON keyed by canonical slug —
 * INPUT-02. Only valid entries are written (the same guard as the read side),
 * so a hostile value can never round-trip through storage. Silently no-ops
 * when storage.setItem throws (quota, restricted WebView — T-04-03).
 */
export function writeStoredBalances(
  storage: Pick<Storage, "setItem">,
  balances: Balances,
): void {
  const clean: Balances = {};
  for (const slug of Object.keys(PARAM_KEY_BY_SLUG) as EnterableProgramSlug[]) {
    const value = balances[slug];
    if (isValidBalance(value)) {
      clean[slug] = value;
    }
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch {
    // Pitfall 6 / T-01-07: swallow silently — persistence is best-effort.
  }
}

/** Where the initial balances should come from on first client mount. */
export type InitialBalancesSource =
  | { source: "url" }
  | { source: "storage"; balances: Balances }
  | { source: "account"; balances: Balances }
  | { source: "none" };

/**
 * A1 precedence (pure, so the product rule is unit-tested):
 *
 * 1. URL has any balance → `{ source: "url" }`. The URL already drives the
 *    render; crucially this never suggests writing storage — opening someone
 *    else's share link must not clobber the visitor's own saved balances.
 * 2. URL empty + valid stored balances → `{ source: "storage", balances }`.
 *    The caller hydrates by pushing them into the URL (setParams with
 *    history: "replace") so the page is instantly shareable again.
 * 3. URL empty + storage empty + non-empty `savedBalances` (the signed-in
 *    user's account save, ACCT-01) → the `account` source with those balances. A
 *    fresh device lands on the last explicit save. The caller hydrates
 *    exactly like rule 2 (push into the URL with history: "replace") and
 *    must NOT write storage — storage is written only after an edit (A1), so
 *    a device's own edits (rule 2) keep outranking the account until the
 *    user saves again (T-06-09).
 * 4. All empty → `{ source: "none" }` (fresh visitor; render the empty state).
 *
 * `storedBalances` is the readStoredBalances result (null = nothing usable);
 * `savedBalances` is the account read (null = signed out or nothing saved).
 */
export function resolveInitialBalances(
  urlBalances: Balances,
  storedBalances: Balances | null,
  savedBalances: Balances | null = null,
): InitialBalancesSource {
  if (Object.keys(urlBalances).length > 0) {
    return { source: "url" };
  }
  if (storedBalances !== null && Object.keys(storedBalances).length > 0) {
    return { source: "storage", balances: storedBalances };
  }
  if (savedBalances !== null && Object.keys(savedBalances).length > 0) {
    return { source: "account", balances: savedBalances };
  }
  return { source: "none" };
}
