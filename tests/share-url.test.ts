import { afterEach, describe, expect, it, vi } from "vitest";

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

// 07-REVIEW WR-01: SITE_URL is normalized to an origin at module load, so the
// env override cannot leak a trailing slash (or a path, or a blank value) into
// every share link, the sitemap, and robots.txt. The constants are evaluated
// on import, so each case stubs the env, resets the module registry, and
// re-imports a fresh copy.
describe("SITE_URL normalization (WR-01)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function load(value: string | undefined) {
    vi.resetModules();
    if (value === undefined) {
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    } else {
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", value);
    }
    const site = await import("../src/lib/site");
    const share = await import("../src/lib/share-url");
    return { ...site, ...share };
  }

  it("strips a trailing slash from the override so no // follows the scheme", async () => {
    const { SITE_URL: url, SITE_HOST: host, shareUrl: build } = await load(
      "https://example.com/",
    );
    expect(url).toBe("https://example.com");
    expect(host).toBe("example.com");
    const link = build({ "chase-ur": 90_000 });
    expect(link).toBe("https://example.com/?ur=90000");
    expect(link.slice("https://".length)).not.toContain("//");
    expect(new URL(link).pathname).toBe("/");
  });

  it("drops any path from the override", async () => {
    const { SITE_URL: url } = await load("https://example.com/some/path");
    expect(url).toBe("https://example.com");
  });

  it("falls back to the default when the env var is present but blank", async () => {
    const blank = await load("   ");
    expect(blank.SITE_URL).toBe("https://milesworth.vercel.app");
    const unset = await load(undefined);
    expect(unset.SITE_URL).toBe("https://milesworth.vercel.app");
    expect(unset.SITE_HOST).toBe("milesworth.vercel.app");
  });

  it("still throws at module load for a malformed override", async () => {
    await expect(load("not a url")).rejects.toThrow();
  });
});
