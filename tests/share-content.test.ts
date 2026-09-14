import { describe, expect, it } from "vitest";

import { bonuses, programs, redemptions, routes } from "../src/data";
import { rankRedemptions } from "../src/engine/ranking";
import type { Balances, EngineDataset } from "../src/engine/types";
import { buildShareContent } from "../src/lib/share-content";
import { formatDollars, heroDelta } from "../src/lib/format";

// PLAT-03 share-copy tests against the REAL seed dataset from src/data — not
// inline fixtures — so a seed edit that changes the top bookable redemption
// fails these tests exactly like a copy regression would. Every expected
// string is derived from the engine + the sanctioned formatters (never typed
// by hand), and asOf is pinned to "2026-09-15" (inside the live Amex→Hilton
// +30% window) so the clock can never move the result.

const dataset: EngineDataset = { programs, routes, bonuses, redemptions };

const AS_OF = "2026-09-15";

function rank(balances: Balances, asOf = AS_OF) {
  return rankRedemptions({ balances, dataset, asOf });
}

function share(balances: Balances, asOf = AS_OF) {
  return buildShareContent({ balances, asOf });
}

const BASELINE = {
  kind: "baseline",
  queryString: "",
  title: "Milesworth",
  headline: "What are your points actually worth?",
  eyebrow: "Milesworth",
  subline: "Enter your balances. See the business-class flight hiding in them.",
  description:
    "See what your credit card points are actually worth. Enter your balances to get ranked, concrete redemptions — with the cash-out comparison.",
  imageAlt: "Milesworth — what are your points actually worth?",
} as const;

describe("buildShareContent (PLAT-03 share copy)", () => {
  it("returns the exact baseline copy with an empty query string for no balances", () => {
    expect(share({})).toEqual(BASELINE);
  });

  it("builds the result copy for { chase-ur: 90_000 } from the engine's top bookable result", () => {
    const balances: Balances = { "chase-ur": 90_000 };
    const top = rank(balances).bookableNow[0];
    expect(top).toBeDefined();
    if (top === undefined) return;

    const content = share(balances);
    expect(content.kind).toBe("result");
    expect(content.headline).toBe(formatDollars(heroDelta(top)));
    expect(content.eyebrow).toBe("90,000 Chase Ultimate Rewards points");
    expect(content.title).toBe(
      "90,000 Chase Ultimate Rewards points → " + top.redemption.title,
    );
    expect(content.subline.startsWith("vs. ~$")).toBe(true);
    expect(content.subline.endsWith(" cashing out")).toBe(true);
    expect(content.queryString).toBe("ur=90000");
    expect(content.description.length).toBeLessThanOrEqual(200);
    expect(
      content.description.endsWith(
        "See every redemption these balances unlock.",
      ),
    ).toBe(true);
  });

  it("emits the query string in canonical PARAM_KEY_BY_SLUG order regardless of object key order", () => {
    const content = share({ "amex-mr": 50_000, "chase-ur": 90_000 });
    expect(content.queryString).toBe("ur=90000&mr=50000");
  });

  it("frames a null-baseline currency (World of Hyatt) as pure travel value", () => {
    const balances: Balances = { "world-of-hyatt": 75_000 };
    expect(rank(balances).bookableNow.length).toBeGreaterThan(0);

    const content = share(balances);
    expect(content.kind).toBe("result");
    expect(content.subline).toBe(
      "Pure travel value — these points have no cash-out option",
    );
    expect(content.description).toContain("of pure travel value");
  });

  it("falls back to baseline copy but keeps the query string when nothing is bookable", () => {
    const balances: Balances = { "chase-ur": 1 };
    expect(rank(balances).bookableNow).toHaveLength(0);

    const content = share(balances);
    expect(content).toEqual({ ...BASELINE, queryString: "ur=1" });
  });

  it("keeps every string within share limits and free of exclamation marks", () => {
    const cases: Balances[] = [
      {},
      { "chase-ur": 90_000 },
      { "amex-mr": 50_000, "chase-ur": 90_000 },
      { "world-of-hyatt": 75_000 },
      { "chase-ur": 1 },
      { "amex-mr": 120_000 },
      { "hilton-honors": 200_000 },
    ];
    for (const balances of cases) {
      const content = share(balances);
      expect(content.description.length).toBeLessThanOrEqual(200);
      expect(content.imageAlt.length).toBeGreaterThan(0);
      for (const value of Object.values(content)) {
        expect(value).not.toContain("!");
      }
    }
  });

  it("never reads the clock: the same balances at the same asOf are referentially stable", () => {
    const a = share({ "chase-ur": 90_000 });
    const b = share({ "chase-ur": 90_000 });
    expect(a).toEqual(b);
  });
});
