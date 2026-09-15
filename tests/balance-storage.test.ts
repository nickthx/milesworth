import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  STORAGE_KEY,
  readStoredBalances,
  resolveInitialBalances,
  writeStoredBalances,
} from "../src/lib/balance-storage";
import type { Balances } from "../src/engine/types";

// INPUT-02 persistence tests: localStorage is a tamperable client-side
// boundary (T-04-02), so reads are validated field-by-field and discarded
// WHOLESALE on any failure — no partial salvage. Storage I/O is injected
// (fake objects below), so these tests run in the node environment with no
// jsdom. Throwing variants model LinkedIn's in-app WebView (Pitfall 6 /
// T-04-03), where storage access itself can throw.

/** Minimal in-memory fake implementing the injected Storage surface. */
function fakeStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    dump: () => Object.fromEntries(store),
  };
}

const throwingGetter = {
  getItem: (): string | null => {
    throw new Error("SecurityError: storage disabled (restricted WebView)");
  },
};

const throwingSetter = {
  setItem: (): void => {
    throw new Error("QuotaExceededError");
  },
};

const VALID_BALANCES: Balances = {
  "chase-ur": 90_000,
  "amex-mr": 50_000,
  "world-of-hyatt": 40_000,
};

describe("STORAGE_KEY", () => {
  it('is the versioned key "pu:balances:v1"', () => {
    expect(STORAGE_KEY).toBe("pu:balances:v1");
  });
});

describe("readStoredBalances (T-04-02: validate field-by-field, discard wholesale)", () => {
  it("returns the parsed Balances when JSON is valid and every field passes", () => {
    const storage = fakeStorage({
      [STORAGE_KEY]: JSON.stringify(VALID_BALANCES),
    });
    expect(readStoredBalances(storage)).toEqual(VALID_BALANCES);
  });

  it("returns null when the key is absent", () => {
    expect(readStoredBalances(fakeStorage())).toBeNull();
  });

  it("returns null on malformed JSON", () => {
    const storage = fakeStorage({ [STORAGE_KEY]: "{not json!" });
    expect(readStoredBalances(storage)).toBeNull();
  });

  it("returns null when the JSON is not a plain object (array)", () => {
    const storage = fakeStorage({ [STORAGE_KEY]: "[90000]" });
    expect(readStoredBalances(storage)).toBeNull();
  });

  it("returns null when ANY key is unknown — no partial salvage of the valid chase-ur entry", () => {
    const storage = fakeStorage({
      [STORAGE_KEY]: JSON.stringify({ "chase-ur": 90_000, "evil-slug": 1 }),
    });
    expect(readStoredBalances(storage)).toBeNull();
  });

  it("returns null when any value is a non-number (string '90000')", () => {
    const storage = fakeStorage({
      [STORAGE_KEY]: JSON.stringify({ "chase-ur": "90000" }),
    });
    expect(readStoredBalances(storage)).toBeNull();
  });

  it("returns null when any value is negative", () => {
    const storage = fakeStorage({
      [STORAGE_KEY]: JSON.stringify({ "chase-ur": 90_000, "amex-mr": -5 }),
    });
    expect(readStoredBalances(storage)).toBeNull();
  });

  it("returns null when any value is fractional (1.5)", () => {
    const storage = fakeStorage({
      [STORAGE_KEY]: JSON.stringify({ "chase-ur": 1.5 }),
    });
    expect(readStoredBalances(storage)).toBeNull();
  });

  it("returns null when any value exceeds Number.MAX_SAFE_INTEGER", () => {
    const storage = fakeStorage({
      [STORAGE_KEY]: JSON.stringify({ "chase-ur": 2 ** 53 }),
    });
    expect(readStoredBalances(storage)).toBeNull();
  });

  it("returns null when any value is zero (positive integers only)", () => {
    const storage = fakeStorage({
      [STORAGE_KEY]: JSON.stringify({ "chase-ur": 0 }),
    });
    expect(readStoredBalances(storage)).toBeNull();
  });

  it("returns null and does NOT throw when storage.getItem throws (Pitfall 6 WebView guard)", () => {
    expect(() => readStoredBalances(throwingGetter)).not.toThrow();
    expect(readStoredBalances(throwingGetter)).toBeNull();
  });
});

describe("writeStoredBalances", () => {
  it('writes JSON keyed by canonical slug under "pu:balances:v1"', () => {
    const storage = fakeStorage();
    writeStoredBalances(storage, VALID_BALANCES);
    expect(JSON.parse(storage.dump()[STORAGE_KEY])).toEqual(VALID_BALANCES);
  });

  it("round-trips through readStoredBalances", () => {
    const storage = fakeStorage();
    writeStoredBalances(storage, VALID_BALANCES);
    expect(readStoredBalances(storage)).toEqual(VALID_BALANCES);
  });

  it("silently no-ops when storage.setItem throws (T-04-03)", () => {
    expect(() =>
      writeStoredBalances(throwingSetter, VALID_BALANCES),
    ).not.toThrow();
  });
});

describe("resolveInitialBalances (A1 precedence: URL > storage > account > none; account hydrates only when URL and storage are both empty)", () => {
  /** Balances the signed-in user last saved to their account (ACCT-01). */
  const SAVED: Balances = { "amex-mr": 50_000 };

  it('URL non-empty → { source: "url" } even when storage also has balances', () => {
    expect(
      resolveInitialBalances({ "chase-ur": 90_000 }, VALID_BALANCES),
    ).toEqual({ source: "url" });
  });

  it('URL non-empty + empty storage → { source: "url" }', () => {
    expect(resolveInitialBalances({ "amex-mr": 50_000 }, null)).toEqual({
      source: "url",
    });
  });

  it('URL empty + valid stored → { source: "storage", balances }', () => {
    expect(resolveInitialBalances({}, VALID_BALANCES)).toEqual({
      source: "storage",
      balances: VALID_BALANCES,
    });
  });

  it('URL empty + null stored → { source: "none" }', () => {
    expect(resolveInitialBalances({}, null)).toEqual({ source: "none" });
  });

  it('URL empty + stored is an empty object → { source: "none" } (nothing to hydrate)', () => {
    expect(resolveInitialBalances({}, {})).toEqual({ source: "none" });
  });

  it('URL empty + null stored + saved account balances → { source: "account", balances }', () => {
    expect(resolveInitialBalances({}, null, SAVED)).toEqual({
      source: "account",
      balances: SAVED,
    });
  });

  it('URL empty + valid stored + saved → { source: "storage" } (a device\'s own edits outrank the last explicit save)', () => {
    expect(resolveInitialBalances({}, VALID_BALANCES, SAVED)).toEqual({
      source: "storage",
      balances: VALID_BALANCES,
    });
  });

  it('URL non-empty + null stored + saved → { source: "url" } (a share link still wins)', () => {
    expect(resolveInitialBalances({ "chase-ur": 1 }, null, SAVED)).toEqual({
      source: "url",
    });
  });

  it('URL empty + null stored + saved is an empty object → { source: "none" }', () => {
    expect(resolveInitialBalances({}, null, {})).toEqual({ source: "none" });
  });

  it('URL empty + null stored + null saved → { source: "none" }', () => {
    expect(resolveInitialBalances({}, null, null)).toEqual({ source: "none" });
  });

  it("sign-in after mount: the prop flipping null → saved (URL and storage still empty) resolves to account, so the island's second effect applies it", () => {
    // Before the modal sign-in the island resolved to "none"; the mount
    // effect is one-shot, so a second, prop-driven effect in
    // core-experience.tsx re-runs this exact resolver when savedBalances
    // arrives and hydrates only when it answers "account".
    expect(resolveInitialBalances({}, null, null)).toEqual({ source: "none" });
    expect(resolveInitialBalances({}, null, SAVED)).toEqual({
      source: "account",
      balances: SAVED,
    });
    // A share link or the device's own stored edits still win after sign-in.
    expect(resolveInitialBalances({ "chase-ur": 1 }, null, SAVED)).toEqual({
      source: "url",
    });
    expect(resolveInitialBalances({}, VALID_BALANCES, SAVED)).toEqual({
      source: "storage",
      balances: VALID_BALANCES,
    });
  });
});

describe("purity (storage I/O is injected — module references no browser global)", () => {
  const source = readFileSync(
    join(__dirname, "..", "src", "lib", "balance-storage.ts"),
    "utf8",
  );

  it("never references the localStorage global", () => {
    expect(source).not.toContain("localStorage");
  });

  it('contains the versioned storage key "pu:balances:v1"', () => {
    expect(source).toContain("pu:balances:v1");
  });
});
