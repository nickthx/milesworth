# Phase 3: Valuation & Ranking Engine - Pattern Map

**Mapped:** 2026-09-01
**Files analyzed:** 10 new files (5 engine modules, 4 test files, 1 barrel)
**Analogs found:** 9 / 10 (engine-purity.test.ts has only a partial analog for its fs-reading half)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/engine/types.ts` | model (type definitions) | n/a (types only) | `src/data/types.ts` (type exports) + RESEARCH.md §"Engine result shape" | role-match |
| `src/engine/paths.ts` | service (pure domain fns) | transform | `src/engine/transfers.ts` | exact |
| `src/engine/valuation.ts` | service (pure domain fns) | transform | `src/engine/transfers.ts` | exact |
| `src/engine/ranking.ts` | service (orchestrator) | transform / batch | `src/engine/transfers.ts` (style) + `validateDataset` in `src/data/types.ts` (orchestration shape) | role-match |
| `src/engine/index.ts` | barrel | n/a | `src/data/index.ts` | exact |
| `tests/engine-paths.test.ts` | test | unit | `tests/transfers.test.ts` | exact |
| `tests/engine-valuation.test.ts` | test | unit | `tests/transfers.test.ts` | exact |
| `tests/engine-ranking.test.ts` | test | unit | `tests/transfers.test.ts` + `tests/seed-data.test.ts` (iteration/messages) | exact |
| `tests/engine-purity.test.ts` | test (static gate) | file-I/O (`node:fs` in test only) | `tests/seed-data.test.ts` (structural-gate style) | partial (no existing fs-reading test) |
| `src/engine/transfers.ts` | — FROZEN, do not modify — | — | — | — |

## Pattern Assignments

### `src/engine/paths.ts` and `src/engine/valuation.ts` (service, transform)

**Analog:** `src/engine/transfers.ts` (the frozen Phase 2 module — copy its shape exactly)

**Import pattern** (`src/engine/transfers.ts` line 1) — the ONLY permitted external import form:
```typescript
import type { TransferRouteSeed } from "../data/types";
```
New engine files extend this to whatever seed types they need (`TransferBonusSeed`, `RedemptionSeed`, `ProgramSeed`) — always `import type`, always from `../data/types`. Intra-engine value imports are fine (e.g. `import { computePartnerPoints, applyPromoBonus } from "./transfers"` in paths.ts).

**Module-header comment pattern** (`src/engine/transfers.ts` lines 3-10) — every engine file opens with a purity + integer-math contract comment:
```typescript
// Pure transfer-math engine — Phase 3's foundation (path resolution and the
// v2 advisor build on these exact signatures). This module MUST stay
// framework- and DB-free: the only permitted import is the TransferRouteSeed
// type (type-only) from ../data/types. No next/react/db/app imports, ever —
// the purity gate in tests enforces this boundary.
//
// All arithmetic is integer-only via Math.floor: these numbers are the
// product's finance-credibility claim, so no float drift is tolerated.
```

**Core function pattern** (`src/engine/transfers.ts` lines 12-37) — JSDoc citing the frozen spec + confirmed-assumption IDs and dates, exported named pure function, integer-only arithmetic, null-pair guard for optional bonus fields:
```typescript
/**
 * Convert source-program points into partner points along a transfer route.
 *
 * Semantics (frozen by tests/transfers.test.ts against real seed rows):
 * 1. Floor the source balance to the route's transfer increment
 *    (A1, confirmed 2026-09-01 — e.g. Marriott moves in 3000-point blocks).
 * ...
 */
export function computePartnerPoints(
  route: TransferRouteSeed,
  sourcePoints: number,
): number {
  const transferable =
    Math.floor(sourcePoints / route.incrementPoints) * route.incrementPoints;
  const base = Math.floor(
    (transferable * route.ratioNumerator) / route.ratioDenominator,
  );
  const bonus =
    route.bonusMilesPerBlock !== null && route.bonusBlockPoints !== null
      ? Math.floor(transferable / route.bonusBlockPoints) *
        route.bonusMilesPerBlock
      : 0;
  return base + bonus;
}
```

**Consume, never re-implement** — paths.ts composes the two frozen primitives (`src/engine/transfers.ts` lines 22-25 and 47-52 signatures):
```typescript
export function computePartnerPoints(route: TransferRouteSeed, sourcePoints: number): number
export function applyPromoBonus(basePartnerPoints: number, bonusPercent: number): number
```
The A4 doc comment on `applyPromoBonus` (lines 39-46) states the composition rule paths.ts must encode structurally: "Callers pass the base conversion (without block bonus) when a promo applies; the engine never compounds both." RESEARCH.md Pattern 2 shows the branch (`{ ...route, bonusMilesPerBlock: null, bonusBlockPoints: null }` for the base-only conversion under a promo).

**Bonus-window comparison** — copy the lexical string-compare style already used in `tests/seed-data.test.ts` line 129 (`b.endDate >= b.startDate`) and `src/data/types.ts` line 60. Active check is `b.startDate <= asOf && asOf <= b.endDate`; never `new Date()`.

---

### `src/engine/ranking.ts` (service, orchestrator)

**Analog (style):** `src/engine/transfers.ts` (header, purity, integer math — as above)
**Analog (orchestration shape):** `validateDataset` in `src/data/types.ts` lines 147-213 — the repo's one existing "take a whole Dataset, iterate collections, aggregate results" function:
```typescript
export function validateDataset(d: Dataset): void {
  const issues: string[] = [];
  // ... iterate d.programs / d.routes / d.bonuses / d.redemptions,
  // build Sets keyed by slug / "from→to" route key ...
  const routeKeys = new Set<string>();
  for (const r of d.routes) {
    const key = `${r.fromProgramSlug}→${r.toProgramSlug}`;
    ...
  }
}
```
Reuse two conventions from it: the `Dataset` input shape (`{ programs, routes, bonuses, redemptions }` — engine `types.ts` should mirror this as its dataset argument type, lines 98-103) and the `"from→to"` route-key string format (line 170) — RESEARCH.md's `routeKey` field (`"amex-mr→hilton-honors"`) already matches it.

**Filtering pattern** — draft/inactive exclusion mirrors the reachability check in `tests/seed-data.test.ts` lines 160-177: `redemptions.filter((r) => r.verifiedAt !== null)`, `routes.some((rt) => rt.fromProgramSlug === p.slug && rt.active && ...)`. The engine applies the same two predicates (`verifiedAt !== null`, `active === true`) internally.

---

### `src/engine/types.ts` (model, type definitions)

**Analog:** `src/data/types.ts` — but invert its mechanism: data types are `z.infer` from Zod schemas (lines 93-96); engine types must be **plain hand-written interfaces** (zero runtime imports — a value import of zod would fail the purity gate). Copy from data/types.ts:
- The unit-comment convention on every money/scale field (line 17: `// 100 = 1.0 cents/pt; null for partner-only programs.`; line 54: `// 30 = +30% on the base-converted amount.`)
- The confirmed-assumption doc comments naming ruling + date (lines 40-49)
- The `Dataset` interface shape (lines 98-103) as the engine's dataset input type

Starting shape is prescribed in RESEARCH.md §"Engine result shape" (`TransferPath`, `RankedResult`, `EngineOptions` — planner refines). Note `TransferPath.activeBonus: TransferBonusSeed | null` means types.ts itself does `import type { TransferBonusSeed, RedemptionSeed } from "../data/types"`.

---

### `src/engine/index.ts` (barrel)

**Analog:** `src/data/index.ts` (whole file, 14 lines) — header comment explains what consumes the barrel and warns about hazards, then `export * from` lines:
```typescript
// Barrel for the curated seed dataset — consumed by scripts/seed.ts (02-04)
// and the seed-data tests. ...
export * from "./types";
export * from "./programs";
export * from "./transfers";
export * from "./redemptions";
```
Engine version: `export * from "./types" | "./transfers" | "./paths" | "./valuation" | "./ranking"` with a header naming Phase 4 UI and the v2 advisor as the consumers. Watch the same collision hazard the data barrel documents: `src/engine/transfers.ts` and `src/data/transfers.ts` share a filename — consumers importing both must alias.

---

### `tests/engine-paths.test.ts`, `tests/engine-valuation.test.ts`, `tests/engine-ranking.test.ts` (test, unit)

**Analog:** `tests/transfers.test.ts` — copy its structure wholesale.

**Import pattern** (lines 1-5): vitest named imports, REAL seed data, types, engine under test:
```typescript
import { describe, expect, it } from "vitest";

import { routes } from "../src/data/transfers";
import type { TransferRouteSeed } from "../src/data/types";
import { applyPromoBonus, computePartnerPoints } from "../src/engine/transfers";
```
(Ranking tests will also want `bonuses`, `programs`, `redemptions` — import from `../src/data` like `tests/seed-data.test.ts` lines 6-16 does.)

**Real-row fixture rationale comment** (lines 7-15) — every test file opens by stating it runs against real seed rows and citing the confirmed assumptions it freezes:
```typescript
// Every expectation below runs against REAL rows from src/data/transfers.ts —
// not inline fixtures — so a data-entry typo in a seed row (e.g. the Marriott
// bonusBlockPoints) fails CI exactly like a math regression would (DATA-02).
```

**Fixture-lookup helper with loud failure** (lines 17-27) — copy `findRoute` verbatim; add sibling helpers (`findRedemption`, `findBonus`) in the same shape:
```typescript
function findRoute(from: string, to: string): TransferRouteSeed {
  const route = routes.find(
    (r) => r.fromProgramSlug === from && r.toProgramSlug === to,
  );
  if (!route) {
    throw new Error(
      `expected seed route ${from}→${to} is missing from src/data/transfers.ts`,
    );
  }
  return route;
}
```

**Test-case pattern** (lines 29-45) — nested `describe` per function/route, `it` titles that state the full hand-computed arithmetic, underscore numeric literals, inline comment showing the derivation:
```typescript
describe("Marriott Bonvoy → airline (1:3, 3000-pt increment, 5K per 60K block)", () => {
  const marriott = findRoute("marriott-bonvoy", "alaska-mileage-plan");

  it("59,000 Bonvoy → 19,000 miles (floors to 57,000 transferable; no full 60K block)", () => {
    // A1: 59,000 floors to 57,000 (19 × 3,000) → base 19,000; 57,000 < 60,000
    // so zero block bonus.
    expect(computePartnerPoints(marriott, 59_000)).toBe(19_000);
  });
});
```

**Descriptive assertion messages** (from `tests/seed-data.test.ts`, e.g. lines 151, 176) — for loops over collections, pass a message as `expect`'s second arg:
```typescript
expect(reachable, `${p.slug} has no verified redemption`).toBe(true);
```

**Real fixture rows verified present in the dataset** (use these, per RESEARCH.md hand-computed anchors):
- `marriott-bonvoy → alaska-mileage-plan`: 1:3, increment 3000, 5000/60000 block bonus (inverse math: 60K miles ⇒ 150,000 Bonvoy, not 180,000)
- `bilt → alaska-mileage-plan`: 1:1, increment 1000 (cheapest-path fixture vs Marriott)
- `amex-mr → hilton-honors`: ratioNumerator 2 / ratioDenominator 1 (`src/data/transfers.ts` lines 54-60)
- Live bonus row (`src/data/transfers.ts` lines 152-162): amex-mr→hilton-honors, `bonusPercent: 30`, `startDate: "2026-09-01"`, `endDate: "2026-10-14"` — pin `asOf: "2026-09-15"` (active) and `"2026-10-15"` (inactive)
- Baselines for wow-delta tests (`src/data/programs.ts`): chase-ur 100, amex-mr 60, capital-one 50, citi-ty 100, bilt 10, hotels `null` (null ⇒ cash-out value 0)

---

### `tests/engine-purity.test.ts` (test, static gate — file-I/O)

**Analog (partial):** `tests/seed-data.test.ts` — structural-gate style: header comment explaining what invariant the suite enforces and why (lines 1-3), plain `describe`/`it` with failure messages naming the offender. No existing test reads source files with `node:fs`, so the fs half is new (planner uses RESEARCH.md Pattern 8: read every file in `src/engine/`, extract import statements, assert each is intra-engine relative or `import type ... from "../data/types"`; forbid `next`, `react`, value-`zod`, `drizzle`, `@neondatabase`, `../db`, `@/db`, `../app`, `server-only`, `node:*`).

**Config compatibility** (`vitest.config.ts`, whole file): node environment, includes `tests/**/*.test.ts` — a `node:fs`-using test needs no config change. The comment at `src/engine/transfers.ts` lines 5-7 ("the purity gate in tests enforces this boundary") is the contract this test executes.

## Shared Patterns

### Purity boundary (all engine files)
**Source:** `src/engine/transfers.ts` lines 1-10
Type-only imports from `../data/types`; intra-engine relative imports only; no framework/DB/node imports; module-header comment restating the rule. Note (from RESEARCH.md): `import type` from `../data/types` is safe despite that file importing zod at runtime — type-only imports erase at compile time.

### Integer-only finance math (paths, valuation, ranking)
**Source:** `src/engine/transfers.ts` lines 8-10, 26-36
`Math.floor` everywhere; money in cents; cpp as `cppX100` integers (same scale as `cashOutBaselineCppX100`, `src/data/programs.ts` line 17 comment). The single sanctioned float is `coverage` (display-only, per RESEARCH.md result shape).

### Confirmed-assumption provenance comments (all files)
**Source:** `src/engine/transfers.ts` lines 15-20, 42-46; `src/data/types.ts` lines 40-49; `src/data/programs.ts` lines 16, 48-51
Any line of code encoding a Nick ruling cites the assumption ID and date: `// A4 (CONFIRMED by Nick 2026-09-01): ...`. Phase 3's new decisions (A1 cheapest-path, A2 conservative gating, per RESEARCH Assumptions Log) get the same treatment once ratified.

### TDD against real seed rows (all test files)
**Source:** `tests/transfers.test.ts` (whole file)
RED→GREEN commits; expectations hand-computed and written in the `it` title; fixtures are real dataset rows found via throwing helpers, never inline duplicates of seed data.

### Route-key string format (paths, ranking, tests)
**Source:** `src/data/types.ts` line 170; `tests/seed-data.test.ts` line 123
`` `${fromProgramSlug}→${toProgramSlug}` `` (Unicode arrow) — already used in validation and tests; `TransferPath.routeKey` should match.

### `satisfies` for typed data literals (test fixtures if any synthetic rows are needed)
**Source:** `src/data/programs.ts` line 171 (`] satisfies ProgramSeed[];`), `src/data/transfers.ts` line 162
The A4 stacking test needs a synthetic route carrying both a block bonus and a promo (no real row has both — RESEARCH Pitfall 3); build it with the `route()`-helper style of `src/data/transfers.ts` lines 16-34 (spread defaults + overrides) and type it `satisfies TransferRouteSeed`.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — (none fully missing) | | | `tests/engine-purity.test.ts` is the only partial: its describe/assert style follows `tests/seed-data.test.ts`, but no existing test reads source files via `node:fs` — implement that half from RESEARCH.md Pattern 8. |

## Metadata

**Analog search scope:** `src/engine/`, `src/data/`, `src/db/`, `src/lib/`, `tests/`, `vitest.config.ts`
**Files scanned:** 12 source files + 3 test files globbed; 8 read in full or targeted
**Pattern extraction date:** 2026-09-01
