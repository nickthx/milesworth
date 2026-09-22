// DB-free structural tests over the REAL seed dataset (DATA-01/02/03/04).
// Everything runs against in-memory imports from ../src/data — CI holds no
// database credentials by design, and none are needed here.
import { describe, expect, it } from "vitest";

import {
  bonuses,
  programSeedSchema,
  programs,
  redemptionSeedSchema,
  redemptions,
  routes,
  transferBonusSeedSchema,
  transferRouteSeedSchema,
  validateDataset,
} from "../src/data";

// Canonical user-enterable currencies (balance-entry form surface).
const ENTERABLE_SLUGS = [
  "chase-ur",
  "amex-mr",
  "capital-one",
  "citi-ty",
  "bilt",
  "world-of-hyatt",
  "hilton-honors",
  "marriott-bonvoy",
].sort();

describe("dataset validity (DATA-01)", () => {
  it("every program passes its Zod schema", () => {
    const failures = programs
      .map((p) => ({ slug: p.slug, result: programSeedSchema.safeParse(p) }))
      .filter((r) => !r.result.success)
      .map((r) => r.slug);
    expect(failures, `invalid programs: ${failures.join(", ")}`).toEqual([]);
  });

  it("every route passes its Zod schema", () => {
    const failures = routes
      .map((r) => ({
        key: `${r.fromProgramSlug}→${r.toProgramSlug}`,
        result: transferRouteSeedSchema.safeParse(r),
      }))
      .filter((r) => !r.result.success)
      .map((r) => r.key);
    expect(failures, `invalid routes: ${failures.join(", ")}`).toEqual([]);
  });

  it("every bonus passes its Zod schema", () => {
    const failures = bonuses
      .map((b) => ({
        key: `${b.fromProgramSlug}→${b.toProgramSlug}`,
        result: transferBonusSeedSchema.safeParse(b),
      }))
      .filter((b) => !b.result.success)
      .map((b) => b.key);
    expect(failures, `invalid bonuses: ${failures.join(", ")}`).toEqual([]);
  });

  it("every redemption passes its Zod schema", () => {
    const failures = redemptions
      .map((rd) => ({
        slug: rd.slug,
        result: redemptionSeedSchema.safeParse(rd),
      }))
      .filter((r) => !r.result.success)
      .map((r) => r.slug);
    expect(failures, `invalid redemptions: ${failures.join(", ")}`).toEqual([]);
  });

  it("validateDataset accepts the full dataset (cross-refs + uniqueness)", () => {
    expect(() =>
      validateDataset({ programs, routes, bonuses, redemptions }),
    ).not.toThrow();
  });

  it("exactly 8 programs are user-enterable, on the canonical slugs", () => {
    const enterable = programs
      .filter((p) => p.isUserEnterable)
      .map((p) => p.slug)
      .sort();
    expect(enterable).toEqual(ENTERABLE_SLUGS);
  });
});

describe("edge-case routes present (DATA-02 data-side)", () => {
  it("has a Marriott 1:3 route with the 5,000/60,000 block bonus", () => {
    const marriott = routes.filter(
      (r) =>
        r.fromProgramSlug === "marriott-bonvoy" &&
        r.ratioNumerator === 1 &&
        r.ratioDenominator === 3 &&
        r.bonusMilesPerBlock === 5000 &&
        r.bonusBlockPoints === 60000,
    );
    expect(marriott.length).toBeGreaterThanOrEqual(1);
  });

  it("has the Amex MR → Hilton 2:1 route", () => {
    const mrToHilton = routes.find(
      (r) =>
        r.fromProgramSlug === "amex-mr" && r.toProgramSlug === "hilton-honors",
    );
    expect(mrToHilton).toBeDefined();
    expect(mrToHilton?.ratioNumerator).toBe(2);
    expect(mrToHilton?.ratioDenominator).toBe(1);
  });

  it("has a Bilt 1:1 route", () => {
    const bilt = routes.filter(
      (r) =>
        r.fromProgramSlug === "bilt" &&
        r.ratioNumerator === 1 &&
        r.ratioDenominator === 1,
    );
    expect(bilt.length).toBeGreaterThanOrEqual(1);
  });
});

describe("transfer bonuses (DATA-03)", () => {
  const routeKeys = new Set(
    routes.map((r) => `${r.fromProgramSlug}→${r.toProgramSlug}`),
  );

  it("every bonus has endDate on or after startDate", () => {
    for (const b of bonuses) {
      expect(
        b.endDate >= b.startDate,
        `${b.fromProgramSlug}→${b.toProgramSlug} ends before it starts`,
      ).toBe(true);
    }
  });

  it("every bonus percent is between 1 and 100", () => {
    for (const b of bonuses) {
      expect(b.bonusPercent).toBeGreaterThanOrEqual(1);
      expect(b.bonusPercent).toBeLessThanOrEqual(100);
    }
  });

  it("every bonus has a non-empty sourceNote", () => {
    for (const b of bonuses) {
      expect(b.sourceNote.trim().length).toBeGreaterThan(0);
    }
  });

  it("every bonus rides an existing route", () => {
    for (const b of bonuses) {
      const key = `${b.fromProgramSlug}→${b.toProgramSlug}`;
      expect(routeKeys.has(key), `bonus on unknown route ${key}`).toBe(true);
    }
  });
});

describe("provenance (DATA-04 automated portion)", () => {
  // Coverage gate (activated at the plan 02-05 verification gate): Nick's
  // 2026-09-01 pass verified 34 of 36 entries. Raised from 30 to 34 by plan
  // 07-06 (Phase 7 batch 1, 2026-09-21): D7-03 fixed the launch number at
  // N=34 with batch1=0, and Nick kept st-regis-maldives and
  // gritti-palace-venice as drafts, so the floor now equals the achieved
  // verified count. Any verification-coverage regression fails CI.
  it("has ≥34 verified entries covering all 8 enterable programs", () => {
    const verified = redemptions.filter((r) => r.verifiedAt !== null);
    expect(verified.length).toBeGreaterThanOrEqual(34);
    for (const p of programs.filter((pr) => pr.isUserEnterable)) {
      const reachable = verified.some(
        (r) =>
          // direct-use (Hyatt/Hilton/Marriott)
          r.partnerProgramSlug === p.slug ||
          // via an active transfer route from the program
          routes.some(
            (rt) =>
              rt.fromProgramSlug === p.slug &&
              rt.active &&
              rt.toProgramSlug === r.partnerProgramSlug,
          ),
      );
      expect(reachable, `${p.slug} has no verified redemption`).toBe(true);
    }
  });

  it("every verified entry's sourceNote records the verification finding", () => {
    for (const rd of redemptions) {
      if (rd.verifiedAt !== null) {
        expect(
          rd.sourceNote.startsWith("Verified "),
          `${rd.slug} is marked verified but its sourceNote does not record the finding`,
        ).toBe(true);
        expect(
          rd.sourceNote.includes("CLAUDE DRAFT"),
          `${rd.slug} is marked verified but still carries a draft sourceNote`,
        ).toBe(false);
      }
    }
  });

  it("every redemption has a non-empty sourceNote", () => {
    for (const rd of redemptions) {
      expect(
        rd.sourceNote.trim().length,
        `${rd.slug} missing sourceNote`,
      ).toBeGreaterThan(0);
    }
  });

  it("every redemption has a non-empty bookingHint", () => {
    for (const rd of redemptions) {
      expect(
        rd.bookingHint.trim().length,
        `${rd.slug} missing bookingHint`,
      ).toBeGreaterThan(0);
    }
  });

  it("pointsMax, when set, is >= pointsMin", () => {
    for (const rd of redemptions) {
      if (rd.pointsMax !== null) {
        expect(
          rd.pointsMax,
          `${rd.slug} has pointsMax < pointsMin`,
        ).toBeGreaterThanOrEqual(rd.pointsMin);
      }
    }
  });
});
