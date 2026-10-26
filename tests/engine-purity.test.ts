// Executable purity gate over src/engine/ (phase success criterion 5):
// the engine imports nothing from Next.js, React, zod (value), Drizzle, the
// db layer, or node builtins, and never reads the clock. This test replaces
// the manual grep gate from plan 02-03 so the boundary can never silently
// regress in Phase 4+ — it enumerates src/engine dynamically, so every future
// engine file (paths/valuation/ranking/index) is covered from its first
// commit with no test change.
//
// Note: `import type ... from "../data/types"` is the ONE permitted external
// specifier. src/data/types.ts is itself type-only (the Zod schemas live in
// src/data/schemas.ts), and type-only imports erase at compile time — nothing
// of zod reaches the engine's emitted code.
//
// node:fs / node:path are permitted in tests (this file), never in the engine.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ENGINE_DIR = join(__dirname, "..", "src", "engine");

// Every static import/export-from specifier: `import ... from "x"` and
// `export ... from "x"`.
const SPECIFIER_RE = /(?:import|export)\s[^;]*?from\s+["']([^"']+)["']/g;

// The one permitted external specifier — and it must be type-only.
const DATA_TYPES_SPECIFIER = "../data/types";
const TYPE_ONLY_RE = /import\s+type\s/;

// Denylist: framework, validation, DB, node builtins, app layer (substring
// or path-segment match against the raw specifier).
const FORBIDDEN_PATTERNS = [
  "next",
  "react",
  "zod",
  "drizzle",
  "@neondatabase",
  "server-only",
  "node:",
  "/db",
  "../app",
  "@/",
];

interface EngineFile {
  name: string;
  source: string;
}

function loadEngineFiles(): EngineFile[] {
  return readdirSync(ENGINE_DIR)
    .filter((name) => name.endsWith(".ts"))
    .map((name) => ({
      name,
      source: readFileSync(join(ENGINE_DIR, name), "utf8"),
    }));
}

interface FoundSpecifier {
  file: string;
  specifier: string;
  statement: string;
}

function extractSpecifiers(files: EngineFile[]): FoundSpecifier[] {
  const found: FoundSpecifier[] = [];
  for (const { name, source } of files) {
    for (const match of source.matchAll(SPECIFIER_RE)) {
      found.push({ file: name, specifier: match[1], statement: match[0] });
    }
  }
  return found;
}

describe("engine purity (success criterion 5)", () => {
  const files = loadEngineFiles();
  const specifiers = extractSpecifiers(files);

  it("finds engine files to guard (sanity)", () => {
    expect(
      files.map((f) => f.name),
      "src/engine must contain at least transfers.ts and types.ts",
    ).toEqual(expect.arrayContaining(["transfers.ts", "types.ts"]));
  });

  it("only allows intra-engine imports or type-only ../data/types", () => {
    const violations = specifiers
      .filter((s) => {
        if (s.specifier.startsWith("./")) return false; // intra-engine
        if (s.specifier === DATA_TYPES_SPECIFIER) {
          return !TYPE_ONLY_RE.test(s.statement); // must be `import type`
        }
        return true; // anything else is forbidden
      })
      .map(
        (s) =>
          `${s.file} imports "${s.specifier}" — only "./" or a type-only "${DATA_TYPES_SPECIFIER}" import is allowed`,
      );
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("imports nothing matching a forbidden pattern (framework/db/node)", () => {
    const violations = specifiers
      .filter((s) =>
        FORBIDDEN_PATTERNS.some((pattern) => s.specifier.includes(pattern)),
      )
      .map((s) => {
        const hits = FORBIDDEN_PATTERNS.filter((p) => s.specifier.includes(p));
        return `${s.file} imports "${s.specifier}" — forbidden (${hits.join(", ")})`;
      });
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("never reads the clock (asOf is an input — determinism guard)", () => {
    const violations = files
      .filter(
        (f) => f.source.includes("Date.now(") || f.source.includes("new Date("),
      )
      .map(
        (f) =>
          `${f.name} contains Date.now(/new Date( — the engine must take asOf as an input, never read the clock`,
      );
    expect(violations, violations.join("\n")).toEqual([]);
  });
});
