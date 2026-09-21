import { describe, expect, it } from "vitest";

import { MAX_BALANCE, PARAM_KEY_BY_SLUG } from "../src/lib/balance-params";
import { shareUrl, toShareQuery } from "../src/lib/share-url";
import { SITE_URL } from "../src/lib/site";
import type { Balances } from "../src/engine/types";

// PLAT-02 canonical share URL (RESEARCH Pattern 4, T-07-02): "Copy my link"
// must build from SITE_URL + the eight short keys only — never from
// window.location.href — so a Clerk dev-instance handoff (`__clerk_db_jwt`),
// a tracking param, or a hash fragment can never ride along into a public
// post. Pure helper: these tests run in the node environment with no jsdom.

const CANONICAL_KEYS = new Set<string>(Object.values(PARAM_KEY_BY_SLUG));

/** Every URL the helper can emit must be SITE_URL-rooted and short-key-only. */
function assertCanonical(url: string): void {
  const parsed = new URL(url);
  expect(url.startsWith(`${SITE_URL}/`)).toBe(true);
  expect(parsed.pathname).toBe("/");
  expect(parsed.hash).toBe("");
  expect(url).not.toContain("#");
  expect(url).not.toContain("__clerk_db_jwt");
  expect(url).not.toContain("utm_");
  for (const key of parsed.searchParams.keys()) {
    expect(CANONICAL_KEYS.has(key), `foreign key ${key}`).toBe(true);
  }
}

const CASES: Array<[label: string, balances: Balances, expected: string]> = [
  [
    "three balances in seed key order",
    { "chase-ur": 90_000, "amex-mr": 50_000, "world-of-hyatt": 40_000 },
    `${SITE_URL}/?ur=90000&mr=50000&hyatt=40000`,
  ],
  [
    "key order follows PARAM_KEY_BY_SLUG regardless of object key order",
    { "world-of-hyatt": 40_000, "chase-ur": 90_000 },
    `${SITE_URL}/?ur=90000&hyatt=40000`,
  ],
  ["empty balances", {}, `${SITE_URL}/`],
  [
    "invalid values drop (negative, fractional, above MAX_BALANCE)",
    { "chase-ur": -5, "amex-mr": 1.5, bilt: MAX_BALANCE * 2_000 },
    `${SITE_URL}/`,
  ],
];

describe("shareUrl", () => {
  for (const [label, balances, expected] of CASES) {
    it(label, () => {
      const url = shareUrl(balances);
      expect(url).toBe(expected);
      assertCanonical(url);
    });
  }

  it("is rooted at SITE_URL, not a hardcoded host", () => {
    expect(shareUrl({ "chase-ur": 1 })).toBe(`${SITE_URL}/?ur=1`);
  });

  it("never carries a Clerk handoff token, a tracking param, or a hash", () => {
    // Even a hostile Balances-shaped object with foreign keys cannot leak:
    // balancesToParams iterates the canonical slug list only.
    const hostile = {
      "chase-ur": 90_000,
      __clerk_db_jwt: "abc",
      utm_source: "linkedin",
    } as unknown as Balances;
    const url = shareUrl(hostile);
    expect(url).toBe(`${SITE_URL}/?ur=90000`);
    assertCanonical(url);
  });

  it("emits at most one key per enterable program", () => {
    const all: Balances = {
      "chase-ur": 1,
      "amex-mr": 2,
      "capital-one": 3,
      "citi-ty": 4,
      bilt: 5,
      "world-of-hyatt": 6,
      "hilton-honors": 7,
      "marriott-bonvoy": 8,
    };
    const parsed = new URL(shareUrl(all));
    expect([...parsed.searchParams.keys()]).toEqual([...CANONICAL_KEYS]);
    assertCanonical(parsed.toString());
  });
});

describe("toShareQuery", () => {
  it("returns the bare query without a leading ?", () => {
    expect(
      toShareQuery({
        "chase-ur": 90_000,
        "amex-mr": 50_000,
        "world-of-hyatt": 40_000,
      }),
    ).toBe("ur=90000&mr=50000&hyatt=40000");
  });

  it('returns "" for empty balances', () => {
    expect(toShareQuery({})).toBe("");
  });
});
