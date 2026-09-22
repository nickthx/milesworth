import type { TransferBonusSeed, TransferRouteSeed } from "./types";

// Transfer-route graph (DATA-02 structural model) + dated promo bonuses
// (DATA-03 manual-override rows). Every quantity is an integer; ratio is
// ratioNumerator partner units per ratioDenominator source points.
// All 46 routes were confirmed structurally in Nick's DATA-04 verification
// pass (2026-09-01): assumptions A1 (Marriott 3:1, 3,000-pt increment,
// 5K/60K block bonus) and A2 (1,000-pt bank increments as a conservative
// simplification — Capital One allows finer, so 1,000 never overstates the
// transferable amount) are both confirmed. Bilt routes reflect the 2026
// "Bilt 2.0" (Cardless-era) partner reality — all 7 modeled routes confirmed
// surviving at 1:1 (exceptions like Accor 3:2 are not modeled).

// Standard-route helper: 1:1 ratio, 1000-point increment (A2, confirmed
// 2026-09-01), no block bonus. Edge cases override explicitly below.
function route(
  fromProgramSlug: string,
  toProgramSlug: string,
  overrides: Partial<TransferRouteSeed> = {},
): TransferRouteSeed {
  return {
    fromProgramSlug,
    toProgramSlug,
    ratioNumerator: 1,
    ratioDenominator: 1,
    incrementPoints: 1000,
    bonusMilesPerBlock: null,
    bonusBlockPoints: null,
    transferTimeDays: null,
    active: true,
    notes: null,
    ...overrides,
  };
}

export const routes = [
  // ── Chase Ultimate Rewards ───────────────────────────────────────────────
  route("chase-ur", "world-of-hyatt", { transferTimeDays: 0 }),
  route("chase-ur", "united-mileageplus", { transferTimeDays: 0 }),
  route("chase-ur", "virgin-atlantic", { transferTimeDays: 0 }),
  route("chase-ur", "air-france-flying-blue", { transferTimeDays: 0 }),
  route("chase-ur", "british-airways-avios", { transferTimeDays: 0 }),
  route("chase-ur", "singapore-krisflyer", { transferTimeDays: 1 }),
  route("chase-ur", "emirates-skywards", { transferTimeDays: 0 }),
  route("chase-ur", "air-canada-aeroplan", { transferTimeDays: 0 }),
  route("chase-ur", "marriott-bonvoy", {
    transferTimeDays: 2,
    notes: "UR→Bonvoy is 1:1 but usually poor value; kept for completeness.",
  }),

  // ── Amex Membership Rewards ──────────────────────────────────────────────
  // MANDATORY edge case (DATA-02): MR→Hilton transfers at 1:2 (2 Hilton
  // points per 1 MR) — modeled as ratioNumerator 2 / ratioDenominator 1.
  route("amex-mr", "hilton-honors", {
    ratioNumerator: 2,
    ratioDenominator: 1,
    incrementPoints: 1000,
    transferTimeDays: 0,
    notes: "1 MR → 2 Hilton points. Verified 2026-09-01 — the 1:2 rate is current.",
  }),
  route("amex-mr", "ana-mileage-club", {
    transferTimeDays: 2,
    notes: "ANA transfers take ~48h and are irreversible; 1:1 rate.",
  }),
  route("amex-mr", "virgin-atlantic", { transferTimeDays: 0 }),
  route("amex-mr", "air-france-flying-blue", { transferTimeDays: 0 }),
  route("amex-mr", "british-airways-avios", { transferTimeDays: 0 }),
  route("amex-mr", "delta-skymiles", { transferTimeDays: 0 }),
  route("amex-mr", "singapore-krisflyer", { transferTimeDays: 1 }),
  route("amex-mr", "avianca-lifemiles", { transferTimeDays: 0 }),
  route("amex-mr", "air-canada-aeroplan", { transferTimeDays: 0 }),
  route("amex-mr", "cathay-asia-miles", { transferTimeDays: 1 }),
  route("amex-mr", "emirates-skywards", { transferTimeDays: 0 }),
  route("amex-mr", "marriott-bonvoy", { transferTimeDays: 1 }),

  // ── Capital One Miles ────────────────────────────────────────────────────
  route("capital-one", "air-canada-aeroplan", { transferTimeDays: 0 }),
  route("capital-one", "air-france-flying-blue", { transferTimeDays: 0 }),
  route("capital-one", "british-airways-avios", { transferTimeDays: 0 }),
  route("capital-one", "avianca-lifemiles", { transferTimeDays: 0 }),
  route("capital-one", "singapore-krisflyer", { transferTimeDays: 1 }),
  route("capital-one", "turkish-miles-smiles", { transferTimeDays: 0 }),
  route("capital-one", "cathay-asia-miles", { transferTimeDays: 1 }),
  route("capital-one", "emirates-skywards", { transferTimeDays: 0 }),
  route("capital-one", "virgin-atlantic", {
    transferTimeDays: 1,
    notes: "Capital One reaches Virgin Atlantic via Virgin Red; 1:1 effective rate.",
  }),

  // ── Citi ThankYou Points ─────────────────────────────────────────────────
  route("citi-ty", "air-france-flying-blue", { transferTimeDays: 0 }),
  route("citi-ty", "avianca-lifemiles", { transferTimeDays: 0 }),
  route("citi-ty", "cathay-asia-miles", { transferTimeDays: 1 }),
  route("citi-ty", "emirates-skywards", { transferTimeDays: 0 }),
  route("citi-ty", "singapore-krisflyer", { transferTimeDays: 1 }),
  route("citi-ty", "turkish-miles-smiles", { transferTimeDays: 0 }),
  route("citi-ty", "virgin-atlantic", { transferTimeDays: 0 }),

  // ── Bilt Rewards (Bilt 2.0 — all 7 routes confirmed 1:1, 2026-09-01) ─────
  // MANDATORY edge case (DATA-02): at least one Bilt→airline route at 1:1.
  route("bilt", "alaska-mileage-plan", {
    ratioNumerator: 1,
    ratioDenominator: 1,
    incrementPoints: 1000,
    transferTimeDays: 0,
    notes:
      "Verified 2026-09-01 — Alaska (Atmos Rewards) survived the Cardless-era partner changes; Bilt is the ONLY bank-program path to Alaska. 1:1.",
  }),
  route("bilt", "world-of-hyatt", { transferTimeDays: 0 }),
  route("bilt", "united-mileageplus", {
    transferTimeDays: 0,
    notes: "Verified 2026-09-01 — United remains a Bilt partner post-Bilt 2.0. 1:1.",
  }),
  route("bilt", "air-france-flying-blue", { transferTimeDays: 0 }),
  route("bilt", "air-canada-aeroplan", { transferTimeDays: 0 }),
  route("bilt", "virgin-atlantic", { transferTimeDays: 0 }),
  route("bilt", "british-airways-avios", { transferTimeDays: 0 }),

  // ── Marriott Bonvoy → airlines ───────────────────────────────────────────
  // MANDATORY edge case (DATA-02): 3 Bonvoy → 1 mile (ratio 1/3), transfers
  // in 3000-point increments, plus a structural block bonus of 5000 miles per
  // 60000 points transferred (A1, confirmed 2026-09-01). The 5K/60K bonus
  // excludes AA/LifeMiles/Delta, and United gets 10K/60K instead — neither
  // exception is modeled in seed routes; Alaska and ANA both confirmed
  // eligible for the standard 5K/60K bonus.
  route("marriott-bonvoy", "alaska-mileage-plan", {
    ratioNumerator: 1,
    ratioDenominator: 3,
    incrementPoints: 3000,
    bonusMilesPerBlock: 5000,
    bonusBlockPoints: 60000,
    transferTimeDays: 3,
    notes:
      "Verified 2026-09-01 — 3:1 with 5K bonus miles per full 60K transferred; Alaska (Atmos Rewards) confirmed bonus-eligible.",
  }),
  route("marriott-bonvoy", "ana-mileage-club", {
    ratioNumerator: 1,
    ratioDenominator: 3,
    incrementPoints: 3000,
    bonusMilesPerBlock: 5000,
    bonusBlockPoints: 60000,
    transferTimeDays: 7,
    notes:
      "Verified 2026-09-01 — 3:1 with 5K/60K block bonus; ANA confirmed bonus-eligible. ANA transfers are slow (~1 week).",
  }),
] satisfies TransferRouteSeed[];

// DATA-03: promotional transfer bonuses are dated manual rows — adding or
// editing one is a data-only change, never a schema change. Per Assumption A4
// (confirmed 2026-09-01, documented in types.ts) a promo bonus multiplies the
// base-converted amount and does not stack with structural block bonuses.
export const bonuses = [
  {
    fromProgramSlug: "amex-mr",
    toProgramSlug: "hilton-honors",
    bonusPercent: 30,
    startDate: "2026-09-01",
    endDate: "2026-10-14",
    sourceNote:
      "Verified 2026-09-21 — re-confirmed live in launch week (first verified 2026-09-01): Amex MR→Hilton Honors 30% transfer bonus (effective 1:2.6 with the 1:2 base rate), Sept 1–Oct 14 2026 per Amex/point.me/AwardWallet.",
  },
] satisfies TransferBonusSeed[];
