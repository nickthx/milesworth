import { describe, expect, it } from "vitest";

import { bonuses, programs, redemptions, routes } from "../src/data";
import { rankRedemptions } from "../src/engine/ranking";
import type {
  Balances,
  EngineDataset,
  EngineOptions,
  RankedResult,
} from "../src/engine/types";

// End-to-end ranking tests against the REAL dataset from src/data — not inline
// fixtures — so a seed typo fails CI exactly like a ranking regression would.
// asOf values are pinned (never the clock): "2026-09-15" sits inside the live
// Amex→Hilton +30% window (2026-09-01 → 2026-10-14); "2026-10-15" is the first
// day after it.

const dataset: EngineDataset = { programs, routes, bonuses, redemptions };

// Same real programs/routes/redemptions with NO promo rows. Tests that assert
// base-rate partition arithmetic ("via chase-ur 1:1") use this so they do not
// shift with whichever dated promos happen to cover the pinned asOf — plan
// 07-08 added Chase UR → Marriott +70% (2026-09-15 → 2026-10-15) and other
// launch-week bonuses, which legitimately change the live-dataset answer.
const baseDataset: EngineDataset = { ...dataset, bonuses: [] };

function rank(balances: Balances, asOf = "2026-09-15", options?: EngineOptions) {
  return rankRedemptions({ balances, dataset, asOf, options });
}

function rankBase(
  balances: Balances,
  asOf = "2026-09-15",
  options?: EngineOptions,
) {
  return rankRedemptions({ balances, dataset: baseDataset, asOf, options });
}

function findIn(list: RankedResult[], slug: string): RankedResult | undefined {
  return list.find((r) => r.redemption.slug === slug);
}

function mustFind(list: RankedResult[], slug: string): RankedResult {
  const result = findIn(list, slug);
  if (!result) {
    throw new Error(
      `expected redemption "${slug}" in the partition but it is absent — got [${list
        .map((r) => r.redemption.slug)
        .join(", ")}]`,
    );
  }
  return result;
}

function slugsOf(list: RankedResult[]): string[] {
  return list.map((r) => r.redemption.slug);
}

/** A2 conservative ranking key: wow delta at pointsMax, or atMin for fixed charts. */
function conservativeWow(r: RankedResult): number {
  return r.wowDeltaCents.atMax ?? r.wowDeltaCents.atMin;
}

describe("rankRedemptions partitioning (A2 conservative gate, 0.75 default threshold)", () => {
  it("chase-ur 80,000 puts park-hyatt-tokyo (75,000 Hyatt via 1:1) in bookableNow with coverage ≥ 1 and pointsAway null", () => {
    const { bookableNow } = rank({ "chase-ur": 80_000 });
    const result = mustFind(bookableNow, "park-hyatt-tokyo");
    expect(result.chosenPath.kind).toBe("transfer");
    expect(result.chosenPath.fromProgramSlug).toBe("chase-ur");
    expect(result.chosenPath.routeKey).toBe("chase-ur→world-of-hyatt");
    expect(result.chosenPath.requiredSourcePoints).toBe(75_000);
    expect(result.coverage).toBeGreaterThanOrEqual(1);
    expect(result.pointsAway).toBeNull();
  });

  it("chase-ur 80,000 puts st-regis-bora-bora (100,000 Bonvoy via chase-ur 1:1) in almostThere with pointsAway exactly 20,000", () => {
    const { bookableNow, almostThere } = rankBase({ "chase-ur": 80_000 });
    expect(findIn(bookableNow, "st-regis-bora-bora")).toBeUndefined();
    const result = mustFind(almostThere, "st-regis-bora-bora");
    expect(result.chosenPath.requiredSourcePoints).toBe(100_000);
    // pointsAway = requiredSourcePoints − balance, in the chosen path's currency.
    expect(result.pointsAway).toBe(20_000);
    expect(result.coverage).toBe(0.8);
  });

  it("coverage exactly at the 0.75 default threshold is INCLUDED in almostThere (chase-ur 75,000 vs 100,000 needed)", () => {
    const { almostThere } = rankBase({ "chase-ur": 75_000 });
    const result = mustFind(almostThere, "st-regis-bora-bora");
    expect(result.coverage).toBe(0.75);
    expect(result.pointsAway).toBe(25_000);
  });

  it("the live Chase UR → Marriott +70% promo (2026-09-15 → 2026-10-15) lifts st-regis-bora-bora into bookableNow for chase-ur 80,000", () => {
    // 80,000 UR × 1.70 = 136,000 Bonvoy ≥ the 100,000 conservative need.
    // Same balance is almostThere on the base-rate dataset (test above) and
    // again the day before the window opens.
    const live = rank({ "chase-ur": 80_000 });
    const result = mustFind(live.bookableNow, "st-regis-bora-bora");
    expect(result.coverage).toBeGreaterThanOrEqual(1);
    expect(result.pointsAway).toBeNull();
    const before = rank({ "chase-ur": 80_000 }, "2026-09-14");
    expect(findIn(before.bookableNow, "st-regis-bora-bora")).toBeUndefined();
    expect(mustFind(before.almostThere, "st-regis-bora-bora").coverage).toBe(0.8);
  });

  it("coverage exactly 1 lands in bookableNow (chase-ur 75,000 covers park-hyatt-tokyo's 75,000 exactly)", () => {
    const { bookableNow } = rank({ "chase-ur": 75_000 });
    const result = mustFind(bookableNow, "park-hyatt-tokyo");
    expect(result.coverage).toBe(1);
    expect(result.pointsAway).toBeNull();
  });

  it("coverage ~0.62 is excluded by default but appears with almostThereThreshold 0.5 (ritz-carlton-kyoto)", () => {
    // ritz-carlton-kyoto needs 130,000 Bonvoy conservatively; 80,000 chase-ur
    // gives coverage ≈ 0.615 — below the 0.75 default, above the 0.5 override.
    const byDefault = rankBase({ "chase-ur": 80_000 });
    expect(findIn(byDefault.bookableNow, "ritz-carlton-kyoto")).toBeUndefined();
    expect(findIn(byDefault.almostThere, "ritz-carlton-kyoto")).toBeUndefined();

    const widened = rankBase({ "chase-ur": 80_000 }, "2026-09-15", {
      almostThereThreshold: 0.5,
    });
    const result = mustFind(widened.almostThere, "ritz-carlton-kyoto");
    expect(result.coverage).toBeCloseTo(80_000 / 130_000, 10);
    expect(result.pointsAway).toBe(50_000);
  });

  it("redemptions whose partner no held program reaches are absent from both partitions (ANA direct is Amex-only)", () => {
    // ana-business-tokyo-roundtrip's partner (ana-mileage-club) is reachable
    // only from amex-mr or marriott-bonvoy — never from a chase-ur balance.
    const { bookableNow, almostThere } = rank({ "chase-ur": 5_000_000 });
    expect(findIn(bookableNow, "ana-business-tokyo-roundtrip")).toBeUndefined();
    expect(findIn(almostThere, "ana-business-tokyo-roundtrip")).toBeUndefined();
  });
});

describe("rankRedemptions sorting", () => {
  it("bookableNow is sorted by conservative wowDeltaCents (atMax ?? atMin) descending, ties by slug ascending (bilt 80,000)", () => {
    const { bookableNow } = rank({ bilt: 80_000 });
    expect(bookableNow.length).toBeGreaterThan(1);
    for (let i = 1; i < bookableNow.length; i++) {
      const prev = bookableNow[i - 1];
      const curr = bookableNow[i];
      const wPrev = conservativeWow(prev);
      const wCurr = conservativeWow(curr);
      expect(
        wPrev > wCurr ||
          (wPrev === wCurr && prev.redemption.slug < curr.redemption.slug),
        `bookableNow[${i - 1}] "${prev.redemption.slug}" (wow ${wPrev}) must sort before "${curr.redemption.slug}" (wow ${wCurr})`,
      ).toBe(true);
    }
  });

  it("the flagship reveal: bilt 80,000 tops out at ANA First via Virgin with a hand-computed 1,352,700-cent wow delta", () => {
    // 72,500 Virgin points needed (fixed chart) → 73,000 Bilt via 1:1/1,000-pt
    // increments. Wow = 1,400,000 − 40,000 − floor(73,000 × 10 / 100) =
    // 1,352,700 cents (Bilt's ratified 0.1¢/pt cash-out baseline).
    const { bookableNow, almostThere } = rank({ bilt: 80_000 });
    expect(bookableNow[0].redemption.slug).toBe("ana-first-tokyo-via-virgin");
    expect(bookableNow[0].chosenPath.requiredSourcePoints).toBe(73_000);
    expect(bookableNow[0].wowDeltaCents.atMin).toBe(1_352_700);
    expect(bookableNow[0].wowDeltaCents.atMax).toBeNull();
    // JAL business via Alaska (Bilt is the only bank path): wow = 450,000 −
    // 5,000 − floor(60,000 × 10 / 100) = 439,000.
    const jal = mustFind(bookableNow, "jal-business-tokyo-via-alaska");
    expect(jal.wowDeltaCents.atMin).toBe(439_000);
    // Only lufthansa-first-via-aeroplan (coverage 80/90 ≈ 0.889) is almost-there.
    expect(slugsOf(almostThere)).toEqual(["lufthansa-first-via-aeroplan"]);
    expect(almostThere[0].pointsAway).toBe(10_000);
  });

  it("almostThere sorts by coverage descending (lufthansa 0.889 before st-regis-bora-bora 0.8; chase-ur 80,000)", () => {
    const { almostThere } = rankBase({ "chase-ur": 80_000 });
    expect(slugsOf(almostThere)).toEqual([
      "lufthansa-first-via-aeroplan",
      "st-regis-bora-bora",
    ]);
    expect(almostThere[0].pointsAway).toBe(10_000);
    expect(almostThere[1].pointsAway).toBe(20_000);
  });
});

describe("rankRedemptions result fields", () => {
  it("carries chosen path, both-end valuations, and redemption passthrough (conrad-maldives via the live Amex→Hilton promo)", () => {
    const { bookableNow } = rank({ "amex-mr": 120_000 }, "2026-09-15");
    const result = mustFind(bookableNow, "conrad-maldives");

    // Chosen path: 200,000 Hilton conservatively → 77,000 MR under the +30%
    // promo (154,000 base × 1.30 = 200,200; 76,000 fails).
    expect(result.chosenPath.kind).toBe("transfer");
    expect(result.chosenPath.fromProgramSlug).toBe("amex-mr");
    expect(result.chosenPath.routeKey).toBe("amex-mr→hilton-honors");
    expect(result.chosenPath.requiredSourcePoints).toBe(77_000);
    expect(result.chosenPath.activeBonus).not.toBeNull();
    expect(result.chosenPath.activeBonus!.bonusPercent).toBe(30);
    expect(result.alternatePaths).toEqual([]);

    // pointsNeeded passthrough of the redemption's range.
    expect(result.pointsNeeded).toEqual({ min: 160_000, max: 200_000 });

    // Partner-point cpp (VAL-02): (220,000 − 0) × 100 / points.
    expect(result.cppX100.atMin).toBe(138); // 22,000,000 / 160,000 = 137.5 → 138
    expect(result.cppX100.atMax).toBe(110); // 22,000,000 / 200,000 = 110

    // Source-point cpp (VAL-05): atMax over the conservative 77,000 MR;
    // atMin over the re-derived 62,000 MR for pointsMin (2×62,000×1.3 = 161,200).
    expect(result.effectiveCppX100.atMax).toBe(286); // 22,000,000 / 77,000 → 286
    expect(result.effectiveCppX100.atMin).toBe(355); // 22,000,000 / 62,000 → 355

    // Wow delta with Amex's 0.6¢/pt baseline: 220,000 − floor(spent × 60/100).
    expect(result.wowDeltaCents.atMax).toBe(173_800); // 220,000 − 46,200
    expect(result.wowDeltaCents.atMin).toBe(182_800); // 220,000 − 37,200

    expect(result.coverage).toBeCloseTo(120_000 / 77_000, 10);
    expect(result.pointsAway).toBeNull();

    // Redemption passthrough for Phase 4 display.
    expect(result.redemption.availabilityRating).toBe("plan_ahead");
    // conrad-maldives is featured: re-confirmed in launch week (07-08).
    expect(result.redemption.verifiedAt).toBe("2026-09-21");
    expect(result.redemption.bookingHint.length).toBeGreaterThan(0);
  });

  it("fixed-chart rows (pointsMax null) report atMax null across all three ranges (JAL via Bilt)", () => {
    const { bookableNow } = rank({ bilt: 80_000 });
    const jal = mustFind(bookableNow, "jal-business-tokyo-via-alaska");
    expect(jal.pointsNeeded).toEqual({ min: 60_000, max: null });
    // (450,000 − 5,000) × 100 / 60,000 = 741.67 → 742 at both cpp figures
    // (the 1:1 path spends exactly the partner amount).
    expect(jal.cppX100.atMin).toBe(742);
    expect(jal.cppX100.atMax).toBeNull();
    expect(jal.effectiveCppX100.atMin).toBe(742);
    expect(jal.effectiveCppX100.atMax).toBeNull();
    expect(jal.wowDeltaCents.atMin).toBe(439_000);
    expect(jal.wowDeltaCents.atMax).toBeNull();
  });
});

describe("VAL-05 end-to-end: the live Amex→Hilton bonus auto-adjusts everything", () => {
  it("inside the window the bonus lowers requiredSourcePoints, raises effectiveCppX100, and surfaces on the result; after endDate it vanishes", () => {
    // Same input, two asOf dates straddling the promo's 2026-10-14 endDate —
    // asserted by DIRECT comparison of the two calls (VAL-05).
    const during = mustFind(
      rank({ "amex-mr": 120_000 }, "2026-09-15").bookableNow,
      "conrad-maldives",
    );
    const after = mustFind(
      rank({ "amex-mr": 120_000 }, "2026-10-15").bookableNow,
      "conrad-maldives",
    );

    // Bonus surfaced ↔ absent.
    expect(during.chosenPath.activeBonus).not.toBeNull();
    expect(during.chosenPath.activeBonus!.bonusPercent).toBe(30);
    expect(after.chosenPath.activeBonus).toBeNull();

    // Lower source cost during the promo.
    expect(during.chosenPath.requiredSourcePoints).toBeLessThan(
      after.chosenPath.requiredSourcePoints,
    );
    expect(during.chosenPath.requiredSourcePoints).toBe(77_000);
    expect(after.chosenPath.requiredSourcePoints).toBe(100_000);

    // Higher per-source-point value during the promo (conservative end).
    expect(during.effectiveCppX100.atMax!).toBeGreaterThan(
      after.effectiveCppX100.atMax!,
    );
    expect(during.effectiveCppX100.atMax).toBe(286); // 22,000,000 / 77,000
    expect(after.effectiveCppX100.atMax).toBe(220); // 22,000,000 / 100,000

    // Partner-point cpp is redemption-intrinsic — identical in both calls.
    expect(during.cppX100).toEqual(after.cppX100);
  });
});

// 5,000,000 points in every enterable program — makes every reachable
// redemption bookable, so anything absent is absent by RULE, not by balance.
const maxBalances: Balances = {
  "chase-ur": 5_000_000,
  "amex-mr": 5_000_000,
  "capital-one": 5_000_000,
  "citi-ty": 5_000_000,
  bilt: 5_000_000,
  "world-of-hyatt": 5_000_000,
  "hilton-honors": 5_000_000,
  "marriott-bonvoy": 5_000_000,
};

describe("draft exclusion (A5 fail-closed, T-03-10)", () => {
  it("the two known verifiedAt:null drafts never appear in any partition, even with max balances everywhere", () => {
    const { bookableNow, almostThere } = rank(maxBalances);
    for (const draftSlug of ["st-regis-maldives", "gritti-palace-venice"]) {
      expect(
        findIn(bookableNow, draftSlug),
        `draft "${draftSlug}" (verifiedAt: null) must never reach bookableNow`,
      ).toBeUndefined();
      expect(
        findIn(almostThere, draftSlug),
        `draft "${draftSlug}" (verifiedAt: null) must never reach almostThere`,
      ).toBeUndefined();
    }
  });
});

describe("hostile balances (Pitfall 6, T-03-09)", () => {
  it("empty balances produce empty partitions", () => {
    const { bookableNow, almostThere } = rank({});
    expect(bookableNow).toEqual([]);
    expect(almostThere).toEqual([]);
  });

  it("negative, NaN, Infinity, and zero balances are all treated as absent", () => {
    const hostileValues = [-5, Number.NaN, Number.POSITIVE_INFINITY, 0];
    for (const value of hostileValues) {
      const { bookableNow, almostThere } = rank({ "chase-ur": value });
      expect(
        bookableNow,
        `chase-ur balance ${value} must not produce bookableNow results`,
      ).toEqual([]);
      expect(
        almostThere,
        `chase-ur balance ${value} must not produce almostThere results`,
      ).toEqual([]);
    }
  });

  it("a huge (but safe-integer) 5,000,000 balance produces results with no NaN/Infinity anywhere", () => {
    const { bookableNow, almostThere } = rank({ "chase-ur": 5_000_000 });
    expect(bookableNow.length).toBeGreaterThan(0);
    for (const result of [...bookableNow, ...almostThere]) {
      const slug = result.redemption.slug;
      const numericFields: [string, number | null][] = [
        ["cppX100.atMin", result.cppX100.atMin],
        ["cppX100.atMax", result.cppX100.atMax],
        ["effectiveCppX100.atMin", result.effectiveCppX100.atMin],
        ["effectiveCppX100.atMax", result.effectiveCppX100.atMax],
        ["wowDeltaCents.atMin", result.wowDeltaCents.atMin],
        ["wowDeltaCents.atMax", result.wowDeltaCents.atMax],
        ["coverage", result.coverage],
        ["chosenPath.requiredSourcePoints", result.chosenPath.requiredSourcePoints],
        ["pointsAway", result.pointsAway],
      ];
      for (const [name, value] of numericFields) {
        if (value !== null) {
          expect(
            Number.isFinite(value),
            `"${slug}" ${name} must be finite, got ${value}`,
          ).toBe(true);
        }
      }
    }
  });
});

describe("availabilityRating passthrough", () => {
  it("every returned result carries one of the three known availability ratings", () => {
    const validRatings = ["wide_open", "plan_ahead", "hard_to_find"];
    const { bookableNow, almostThere } = rank(maxBalances);
    for (const result of [...bookableNow, ...almostThere]) {
      expect(
        validRatings,
        `"${result.redemption.slug}" must pass through a known availabilityRating, got "${result.redemption.availabilityRating}"`,
      ).toContain(result.redemption.availabilityRating);
    }
  });
});

describe("determinism (T-03-11: purity in behavior, not just imports)", () => {
  it("two identical rankRedemptions calls produce deeply equal output", () => {
    const first = rank(maxBalances, "2026-09-15");
    const second = rank(maxBalances, "2026-09-15");
    expect(first).toEqual(second);
  });
});
