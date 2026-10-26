import { z } from "zod";

// Seed-boundary validation (T-02-04): hand-written Zod v4 schemas whose object
// keys exactly mirror the camelCase Drizzle property names in src/db/schema.ts,
// so db.insert(table).values(seedArray) needs no field mapping. Runtime rules
// TypeScript can't express live here: positive integers, date ordering, slug
// formats, and (in validateDataset) cross-referential integrity. A bad transfer
// ratio should fail the seed/test run, not ship.

const slug = z.string().regex(/^[a-z0-9-]+$/, "slug must be kebab-case");

export const programSeedSchema = z.object({
  slug,
  name: z.string().min(1),
  kind: z.enum(["bank", "airline", "hotel"]),
  isUserEnterable: z.boolean(),
  // 100 = 1.0 cents/pt; null for partner-only programs.
  cashOutBaselineCppX100: z.number().int().positive().nullable(),
});

export const transferRouteSeedSchema = z
  .object({
    fromProgramSlug: slug,
    toProgramSlug: slug,
    ratioNumerator: z.number().int().positive(),
    ratioDenominator: z.number().int().positive(),
    incrementPoints: z.number().int().positive(),
    // Structural block bonus (Marriott: 5000 miles per 60000 points).
    bonusMilesPerBlock: z.number().int().positive().nullable(),
    bonusBlockPoints: z.number().int().positive().nullable(),
    transferTimeDays: z.number().int().min(0).nullable(),
    active: z.boolean(),
    notes: z.string().nullable(),
  })
  .refine(
    (r) => (r.bonusMilesPerBlock === null) === (r.bonusBlockPoints === null),
    { message: "bonus fields must be set together" },
  );

// Assumption A4 (CONFIRMED by Nick 2026-09-01 at the DATA-04 checkpoint):
// promotional transfer bonuses multiply the base-converted amount and do NOT
// stack with structural block bonuses (Marriott 5K/60K). The engine applies
// whichever applies to the route, never both compounded. The live Amex→Hilton
// promo math (1,000 MR → 2,600 Hilton = 2.0 × 1.30) matches this model exactly.
//
// Cash-fare benchmark convention (CONFIRMED by Nick 2026-09-01; Phase 3's
// methodology page inherits this verbatim): cashFareCents uses discounted
// realistic retail fares for economy and business benchmarks, and
// undiscounted retail fares for First class.
export const transferBonusSeedSchema = z
  .object({
    fromProgramSlug: slug,
    toProgramSlug: slug,
    // 30 = +30% on the base-converted amount.
    bonusPercent: z.number().int().min(1).max(100),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    sourceNote: z.string().min(1),
  })
  .refine((b) => b.endDate >= b.startDate, {
    message: "bonus endDate must be on or after startDate",
  });

export const redemptionSeedSchema = z
  .object({
    slug,
    partnerProgramSlug: slug,
    title: z.string().min(1),
    category: z.enum(["flight", "hotel", "other"]),
    origin: z.string().nullable(),
    destination: z.string().nullable(),
    cabin: z.string().nullable(),
    pointsMin: z.number().int().positive(),
    // null = fixed-price program/chart.
    pointsMax: z.number().int().positive().nullable(),
    taxesFeesCents: z.number().int().min(0),
    cashFareCents: z.number().int().positive(),
    availabilityRating: z.enum(["wide_open", "plan_ahead", "hard_to_find"]),
    bookingHint: z.string().min(1),
    methodologyNote: z.string().nullable(),
    // Pitfall 1: provenance is non-negotiable.
    sourceNote: z.string().min(1),
    // null = draft, not shippable (DATA-04).
    verifiedAt: z.iso.date().nullable(),
    imageSlug: z.string().nullable(),
    featured: z.boolean(),
    notes: z.string().nullable(),
  })
  .refine((r) => r.pointsMax === null || r.pointsMax >= r.pointsMin, {
    message: "pointsMax must be >= pointsMin",
  });

// Seed types live in ./types (type-only, zero runtime) so the "@/data" barrel
// that client components import never pulls Zod into the browser bundle.
import type {
  ProgramSeed,
  RedemptionSeed,
  TransferBonusSeed,
  TransferRouteSeed,
} from "./types";

interface Dataset {
  programs: ProgramSeed[];
  routes: TransferRouteSeed[];
  bonuses: TransferBonusSeed[];
  redemptions: RedemptionSeed[];
}

function parseAll(
  issues: string[],
  label: string,
  schema: z.ZodType,
  items: unknown[],
  describe: (item: unknown, index: number) => string,
): void {
  items.forEach((item, index) => {
    const result = schema.safeParse(item);
    if (!result.success) {
      const detail = result.error.issues
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; ");
      issues.push(`${label} ${describe(item, index)}: ${detail}`);
    }
  });
}

function slugOf(item: unknown, index: number): string {
  if (item && typeof item === "object" && "slug" in item) {
    return `"${String((item as { slug: unknown }).slug)}" (index ${index})`;
  }
  return `at index ${index}`;
}

function routeKeyOf(item: unknown, index: number): string {
  if (
    item &&
    typeof item === "object" &&
    "fromProgramSlug" in item &&
    "toProgramSlug" in item
  ) {
    const r = item as { fromProgramSlug: unknown; toProgramSlug: unknown };
    return `${String(r.fromProgramSlug)}→${String(r.toProgramSlug)} (index ${index})`;
  }
  return `at index ${index}`;
}

// Dataset-level validation: Zod-parse every element (aggregating all issues),
// then enforce cross-references and uniqueness. Error messages name the
// offending entity but never include env/connection values. Consumed by the
// seed script (plan 02-04) and the seed-data tests (plan 02-05).
export function validateDataset(d: Dataset): void {
  const issues: string[] = [];

  parseAll(issues, "program", programSeedSchema, d.programs, slugOf);
  parseAll(issues, "route", transferRouteSeedSchema, d.routes, routeKeyOf);
  parseAll(issues, "bonus", transferBonusSeedSchema, d.bonuses, routeKeyOf);
  parseAll(issues, "redemption", redemptionSeedSchema, d.redemptions, slugOf);

  if (issues.length > 0) {
    throw new Error(
      `seed dataset failed validation:\n- ${issues.join("\n- ")}`,
    );
  }

  // Uniqueness: program slugs, route (from,to) pairs, redemption slugs.
  const programSlugs = new Set<string>();
  for (const p of d.programs) {
    if (programSlugs.has(p.slug)) {
      issues.push(`duplicate program slug "${p.slug}"`);
    }
    programSlugs.add(p.slug);
  }

  const routeKeys = new Set<string>();
  for (const r of d.routes) {
    const key = `${r.fromProgramSlug}→${r.toProgramSlug}`;
    if (routeKeys.has(key)) {
      issues.push(`duplicate route ${key}`);
    }
    routeKeys.add(key);
  }

  const redemptionSlugs = new Set<string>();
  for (const rd of d.redemptions) {
    if (redemptionSlugs.has(rd.slug)) {
      issues.push(`duplicate redemption slug "${rd.slug}"`);
    }
    redemptionSlugs.add(rd.slug);
  }

  // Cross-references: routes and redemptions must point at known programs;
  // bonuses must ride an existing route.
  for (const r of d.routes) {
    if (
      !programSlugs.has(r.fromProgramSlug) ||
      !programSlugs.has(r.toProgramSlug)
    ) {
      issues.push(
        `route references unknown program: ${r.fromProgramSlug}→${r.toProgramSlug}`,
      );
    }
  }

  for (const b of d.bonuses) {
    const key = `${b.fromProgramSlug}→${b.toProgramSlug}`;
    if (!routeKeys.has(key)) {
      issues.push(`bonus references unknown route: ${key}`);
    }
  }

  for (const rd of d.redemptions) {
    if (!programSlugs.has(rd.partnerProgramSlug)) {
      issues.push(
        `redemption "${rd.slug}" references unknown program "${rd.partnerProgramSlug}"`,
      );
    }
  }

  if (issues.length > 0) {
    throw new Error(
      `seed dataset failed validation:\n- ${issues.join("\n- ")}`,
    );
  }
}
