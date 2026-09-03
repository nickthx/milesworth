import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  PARAM_KEY_BY_SLUG,
  balanceParsers,
  balancesToParams,
  paramsToBalances,
} from "../src/lib/balance-params";
import type { Balances } from "../src/engine/types";

// INPUT-03 codec tests: the URL query string is an attacker-controllable
// boundary (T-04-01), so the codec is exercised with hostile values (0,
// negative, fractional, unsafe-huge, unknown keys) alongside the happy-path
// round-trip. Fixtures use realistic balances (90_000 Amex MR is the
// CLAUDE.md canonical example); the engine re-sanitizes downstream
// (T-03-09 defense in depth), but the codec must already drop junk here.

/** All 8 canonical slugs paired with their short URL keys (A3). */
const SHORT_KEY_CASES = [
  ["chase-ur", "ur"],
  ["amex-mr", "mr"],
  ["capital-one", "c1"],
  ["citi-ty", "ty"],
  ["bilt", "bilt"],
  ["world-of-hyatt", "hyatt"],
  ["hilton-honors", "hilton"],
  ["marriott-bonvoy", "bonvoy"],
] as const;

/** A full 8-program Balances object of positive safe integers. */
const FULL_BALANCES: Balances = {
  "chase-ur": 90_000,
  "amex-mr": 50_000,
  "capital-one": 75_000,
  "citi-ty": 60_000,
  bilt: 25_000,
  "world-of-hyatt": 40_000,
  "hilton-honors": 120_000,
  "marriott-bonvoy": 100_000,
};

describe("PARAM_KEY_BY_SLUG (A3 short keys)", () => {
  it("maps all 8 canonical slugs to their locked short keys", () => {
    for (const [slug, shortKey] of SHORT_KEY_CASES) {
      expect(PARAM_KEY_BY_SLUG[slug]).toBe(shortKey);
    }
    expect(Object.keys(PARAM_KEY_BY_SLUG)).toHaveLength(8);
  });

  it("exposes a parser for every short key (balanceParsers covers ur…bonvoy)", () => {
    for (const [, shortKey] of SHORT_KEY_CASES) {
      expect(balanceParsers).toHaveProperty(shortKey);
    }
    expect(Object.keys(balanceParsers)).toHaveLength(8);
  });
});

describe("paramsToBalances (URL → Balances, hostile input dropped)", () => {
  it("maps { ur: 90_000, mr: 50_000 } to { chase-ur: 90_000, amex-mr: 50_000 }", () => {
    expect(paramsToBalances({ ur: 90_000, mr: 50_000 })).toEqual({
      "chase-ur": 90_000,
      "amex-mr": 50_000,
    });
  });

  it("maps every one of the 8 short keys back to its canonical slug", () => {
    for (const [slug, shortKey] of SHORT_KEY_CASES) {
      expect(paramsToBalances({ [shortKey]: 12_345 })).toEqual({
        [slug]: 12_345,
      });
    }
  });

  it("omits keys with null values (nuqs emits null for absent params)", () => {
    expect(paramsToBalances({ ur: null, mr: 50_000 })).toEqual({
      "amex-mr": 50_000,
    });
  });

  it("drops 0 (key omitted, not set to 0)", () => {
    const result = paramsToBalances({ ur: 0, mr: 50_000 });
    expect(result).toEqual({ "amex-mr": 50_000 });
    expect(result).not.toHaveProperty("chase-ur");
  });

  it("drops negative values (-500)", () => {
    expect(paramsToBalances({ ur: -500 })).toEqual({});
  });

  it("drops fractional values (1.5)", () => {
    expect(paramsToBalances({ ur: 1.5 })).toEqual({});
  });

  it("drops unsafe-huge values (> Number.MAX_SAFE_INTEGER)", () => {
    expect(paramsToBalances({ ur: Number.MAX_SAFE_INTEGER + 1 })).toEqual({});
  });

  it("drops implausible balances above the 10,000,000 ceiling (T-05-08)", () => {
    expect(paramsToBalances({ ur: 10_000_001 })).toEqual({});
    expect(paramsToBalances({ ur: Number.MAX_SAFE_INTEGER })).toEqual({});
    // The ceiling itself is still a valid balance.
    expect(paramsToBalances({ ur: 10_000_000 })).toEqual({
      "chase-ur": 10_000_000,
    });
  });

  it("returns {} for an empty params object", () => {
    expect(paramsToBalances({})).toEqual({});
  });
});

describe("balancesToParams (Balances → URL params)", () => {
  it("emits null for all 8 short keys when balances is empty (nuqs clears keys)", () => {
    const params = balancesToParams({});
    expect(Object.keys(params)).toHaveLength(8);
    for (const [, shortKey] of SHORT_KEY_CASES) {
      expect(params[shortKey]).toBeNull();
    }
  });

  it("emits the value under the short key and null for absent slugs", () => {
    const params = balancesToParams({ "chase-ur": 90_000 });
    expect(params.ur).toBe(90_000);
    expect(params.mr).toBeNull();
    expect(params.bonvoy).toBeNull();
  });

  it("emits null (not the value) for invalid values so they never reach the URL", () => {
    const params = balancesToParams({
      "chase-ur": -1,
      "amex-mr": 2.5,
      "capital-one": 0,
    } as Balances);
    expect(params.ur).toBeNull();
    expect(params.mr).toBeNull();
    expect(params.c1).toBeNull();
  });
});

describe("round-trip (INPUT-03 shareable-link contract)", () => {
  it("paramsToBalances(balancesToParams(b)) deep-equals b for a full 8-program object", () => {
    expect(paramsToBalances(balancesToParams(FULL_BALANCES))).toEqual(
      FULL_BALANCES,
    );
  });
});

describe("server-safety (importable from server components)", () => {
  const source = readFileSync(
    join(__dirname, "..", "src", "lib", "balance-params.ts"),
    "utf8",
  );

  it('contains no "use client" directive', () => {
    expect(source).not.toContain('"use client"');
  });

  it('imports only the server-safe "nuqs/server" entry, never bare "nuqs"', () => {
    expect(source).toContain('from "nuqs/server"');
    expect(source).not.toMatch(/from\s+["']nuqs["']/);
  });

  it("references no browser globals (window/document/localStorage/navigator)", () => {
    for (const global of ["window", "document", "localStorage", "navigator"]) {
      expect(source).not.toContain(global);
    }
  });
});
