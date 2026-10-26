import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The "@/data" barrel ships to every visitor (core-experience, balance-form).
// Zod and the seed schemas must stay out of everything it re-exports, or the
// browser bundle regains ~85 KB gzipped. Seed script and tests import
// src/data/schemas.ts directly instead.
const BARREL_FILES = [
  "index.ts",
  "types.ts",
  "programs.ts",
  "transfers.ts",
  "redemptions.ts",
  "redemptions-flights.ts",
  "redemptions-flights-europe.ts",
  "redemptions-hotels.ts",
];

// A value (non-type) import or re-export of zod or ./schemas.
const VALUE_IMPORT =
  /^\s*(import|export)\s+(?!type\b)[^;]*from\s+["'](zod|\.\/schemas)["']/m;

describe("data barrel bundle gate", () => {
  it.each(BARREL_FILES)("%s has no runtime import of zod or ./schemas", (f) => {
    const src = readFileSync(join(__dirname, "../src/data", f), "utf8");
    expect(src).not.toMatch(VALUE_IMPORT);
  });

  it("the regex catches a value import (self-test)", () => {
    expect('import { z } from "zod";').toMatch(VALUE_IMPORT);
    expect('export * from "./schemas";').toMatch(VALUE_IMPORT);
    expect('import type { z } from "zod";').not.toMatch(VALUE_IMPORT);
  });
});
