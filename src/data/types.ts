import type { z } from "zod";

import type {
  programSeedSchema,
  redemptionSeedSchema,
  transferBonusSeedSchema,
  transferRouteSeedSchema,
} from "./schemas";

// Seed types, inferred from the Zod schemas in ./schemas. Type-only on
// purpose: the "@/data" barrel re-exports this file, and client components
// (core-experience, balance-form) import that barrel — a runtime import of
// ./schemas here would ship all of Zod to every visitor. The schemas and
// validateDataset are imported from "./schemas" directly by the seed script
// and tests; tests/data-bundle-gate.test.ts pins this split.
export type ProgramSeed = z.infer<typeof programSeedSchema>;
export type TransferRouteSeed = z.infer<typeof transferRouteSeedSchema>;
export type TransferBonusSeed = z.infer<typeof transferBonusSeedSchema>;
export type RedemptionSeed = z.infer<typeof redemptionSeedSchema>;
