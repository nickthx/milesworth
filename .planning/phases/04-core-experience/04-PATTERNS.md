# Phase 4: Core Experience - Pattern Map

**Mapped:** 2026-09-01
**Files analyzed:** 14 new/modified files (2 modified, 8 new source, 4 new tests)
**Analogs found:** 11 / 14 (3 files depend on new deps/browser APIs with no in-repo analog — RESEARCH.md patterns govern those)

Sources: file list extracted from `04-RESEARCH.md` "Recommended Project Structure" + Wave 0 test gaps; interaction/visual contracts from `04-UI-SPEC.md`.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/layout.tsx` (modify: add `NuqsAdapter`) | config/layout | request-response | itself | exact (in-place edit) |
| `src/app/page.tsx` (replace placeholder) | route (server component) | request-response | itself (current Phase 1 version) | exact (structure + error precedent carry over; DB import deleted) |
| `src/components/core-experience.tsx` | component (client island) | transform (URL state → engine → render) | `src/components/ui/label.tsx` ("use client") + RESEARCH Pattern 2 | partial — only existing client component; state logic from RESEARCH |
| `src/components/balance-form.tsx` | component | request-response (controlled inputs) | `src/components/ui/input.tsx` + `label.tsx` | role-match |
| `src/components/result-card.tsx` | component | transform (RankedResult → markup) | `src/components/ui/card.tsx` + `src/app/page.tsx` (token usage) | role-match |
| `src/components/almost-there.tsx` | component | transform | same as result-card | role-match |
| `src/lib/balance-params.ts` | utility (codec) | transform | `src/data/programs.ts` (`satisfies` const) + `src/engine/ranking.ts` (`sanitizeBalances`) | role-match |
| `src/lib/balance-storage.ts` | utility | file-I/O (localStorage) + transform (precedence fn) | `src/engine/ranking.ts` (`sanitizeBalances` validation style) | partial — validation yes, storage I/O no analog |
| `src/lib/format.ts` | utility (display formatters) | transform | `src/engine/valuation.ts` | exact (pure-fn-with-JSDoc house style) |
| `src/lib/path-display.ts` | utility | transform | `src/engine/valuation.ts` + `src/engine/ranking.ts` (route lookup) | exact |
| `tests/balance-params.test.ts` | test | — | `tests/engine-ranking.test.ts` | exact |
| `tests/balance-storage.test.ts` | test | — | `tests/engine-ranking.test.ts` | exact |
| `tests/format.test.ts` | test | — | `tests/engine-ranking.test.ts` | exact |
| `tests/path-display.test.ts` | test | — | `tests/engine-ranking.test.ts` | exact |

Note: `<EmptyState/>` and `<BookableNow/>` may be inlined in `core-experience.tsx` or split out — either way they follow the result-card/almost-there component patterns below. Keep every file under 500 lines (CLAUDE.md).

## Pattern Assignments

### `src/app/layout.tsx` (config/layout, modify in place)

**Analog:** itself — `src/app/layout.tsx`

**Current body wrap** (lines 28-39) — the only change is wrapping `{children}` in `<NuqsAdapter>` (from `nuqs/adapters/next/app`) inside `<body>`; preserve everything else verbatim:

```tsx
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
```

**Preserve** (lines 5-26): the Fraunces `axes: ["opsz"]` config (D-13 — carries the wow numbers), and `robots: { index: false, follow: false }` (D-03 noindex gate — removal is a Phase 7 task, not this phase).

---

### `src/app/page.tsx` (route/server component, full replacement)

**Analog:** itself — current Phase 1 placeholder at `src/app/page.tsx`

**What gets DELETED** (lines 1-8, 13-23): the `drizzle-orm` + `@/db` imports, `export const dynamic = "force-dynamic"`, and the DB count query. RESEARCH anti-patterns forbid both `@/db` in the guest flow and `force-dynamic` (awaiting `searchParams` makes the route dynamic implicitly).

**Error-handling precedent to carry forward** (lines 20-23) — the T-01-07 comment style and neutral-fallback rule bind all Phase 4 error states (UI-SPEC error copy: "Something went wrong showing your results. Refresh the page to try again."):

```typescript
  } catch {
    // T-01-07: never render the caught error — it can embed connection details.
    // Neutral fallback set above.
  }
```

**Editorial token usage to reuse** (lines 26-33) — this is the repo's only example of the cream/ink/terracotta + display-type vocabulary; the new page hero uses the same classes (per UI-SPEC: `text-display-xl` only for the single page-level hero, clamping to `text-display` below `md`):

```tsx
    <main className="flex flex-1 flex-col items-center justify-center bg-cream px-6 text-center">
      <h1 className="font-display text-display text-ink sm:text-display-xl">
        Milesworth
      </h1>
      <p className="mt-6 max-w-md text-lg leading-8 text-ink/70">
        See what your credit card points are actually worth.
      </p>
      <p className="mt-12 text-sm tracking-wide text-terracotta uppercase">
```

**New shape** (no in-repo nuqs analog — copy RESEARCH.md Pattern 1 verbatim): `async function Home({ searchParams }: { searchParams: Promise<SearchParams> })` → `await loadBalanceParams(searchParams)` → derive `asOf = new Date().toISOString().slice(0, 10)` server-side → render `<CoreExperience asOf={asOf} ... />`.

**Comment convention** (repo-wide, visible at lines 5-11): every non-obvious decision carries its decision ID (`D-xx`, `T-xx`, `A-xx`, Pitfall n) in a comment. New files should annotate A1 (precedence), A2 (conservative hero), Pitfall 5 (no `Date` object), etc. the same way.

---

### `src/components/core-experience.tsx` (client island)

**Analog:** `src/components/ui/label.tsx` — the repo's only `"use client"` file (line 1: `"use client"` as first line, before imports). Everything else comes from RESEARCH.md Pattern 2 (useQueryStates + `rankRedemptions` in `useMemo`) — copy it directly.

**Import discipline** (from `src/engine/index.ts` lines 4-7 and `src/data/index.ts` lines 5-9 — both barrels carry this warning):

```typescript
// Name-collision hazard: src/engine/transfers.ts and src/data/transfers.ts
// share a filename (engine FUNCTIONS vs seed ARRAYS). Consumers importing
// from both barrels must alias one side — never re-export data values here.
```

→ Import ONLY from `@/engine` and `@/data` barrels (never `@/engine/transfers` or `@/data/transfers` directly). The client tree imports exactly: `@/data`, `@/engine`, `@/lib/*`, `@/components/*`, `nuqs`, `react-number-format`, `react`. Never `@/db` or `drizzle-orm` (Pitfall 8; verification greps for this).

**Engine call signature** (from `tests/engine-ranking.test.ts` lines 18-22 — exact working usage against the real dataset):

```typescript
const dataset: EngineDataset = { programs, routes, bonuses, redemptions };

function rank(balances: Balances, asOf = "2026-09-15", options?: EngineOptions) {
  return rankRedemptions({ balances, dataset, asOf, options });
}
```

**Engine output contract** (from `src/engine/types.ts` lines 176-179): `RankedResults = { bookableNow: RankedResult[]; almostThere: RankedResult[] }` — both pre-sorted; the UI renders in array order and never re-sorts (UI-SPEC Interaction Contract).

---

### `src/components/balance-form.tsx` (component, 8 formatted inputs)

**Analog:** `src/components/ui/input.tsx` + `src/components/ui/label.tsx` (wrap, don't rebuild)

**Input consumption** — pass shadcn `Input` as `customInput` to `NumericFormat` (RESEARCH Pattern 3). The Input's own classes (`src/components/ui/input.tsx` line 11) give `h-8` — UI-SPEC requires ≥ 44px touch targets for the 8 balance inputs, so override height via `className` (Input merges via `cn`, line 10-13):

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn("h-8 w-full min-w-0 rounded-lg border border-input ...", className)}
```

**Program list source** (from `src/data/programs.ts` lines 10-19) — the 8 enterable programs come from filtering `programs` on `isUserEnterable`, names for labels from `.name`; slugs are the fixed contract typed by `EnterableProgramSlug` (`src/engine/types.ts` lines 41-49):

```typescript
export const programs = [
  // ── The 8 user-enterable programs (canonical slugs, fixed contract) ──────
  {
    slug: "chase-ur",
    name: "Chase Ultimate Rewards",
    kind: "bank",
    isUserEnterable: true,
    cashOutBaselineCppX100: 100,
  },
```

**Label pairing** (`src/components/ui/label.tsx` lines 8-22): use vendored `Label` (radix `LabelPrimitive.Root`) with `htmlFor` per input — 14px/600 Inter per UI-SPEC typography table.

---

### `src/components/result-card.tsx` (component, wow card)

**Analog:** `src/components/ui/card.tsx` (structure) + `src/app/page.tsx` lines 26-33 (token vocabulary, excerpted above)

**Card composition** (from `src/components/ui/card.tsx` exports, lines 95-103): `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` are all available; `Card` accepts `size="sm" | "default"` and merges `className`. Note `CardTitle` (lines 36-47) already uses `font-heading` (= Fraunces via `globals.css` line 13) — redemption titles get Fraunces for free. Hand-rolled Tailwind sections are equally sanctioned per CLAUDE.md ("for purely editorial sections, hand-rolled Tailwind is fine and often better") — use `Card` for the container, hand-rolled layout inside.

**Every number on the card is a pre-computed field on `RankedResult`** (`src/engine/types.ts` lines 115-158). The card renders, never computes:

```typescript
export interface RankedResult {
  /** Carries availabilityRating, verifiedAt, bookingHint for display. */
  redemption: RedemptionSeed;
  /** The A1-cheapest path (minimum raw requiredSourcePoints). */
  chosenPath: TransferPath;
  /** Every other viable path, for transparency (cheap at ≤46 routes). */
  alternatePaths: TransferPath[];
  pointsNeeded: { min: number; max: number | null };
  cppX100: ValueRange;
  effectiveCppX100: ValueRange;
  wowDeltaCents: ValueRange;
  coverage: number;
  pointsAway: number | null;
}
```

Field → UI mapping: hero = `heroDelta(result)` from `src/lib/format.ts` (terracotta, `text-display`, Fraunces); balance-tag chip = `chosenPath.fromProgramSlug` → program name (ink/muted, NOT terracotta); path line = `formatTransferPath(...)` from `src/lib/path-display.ts`; booking guidance = `redemption.bookingHint` verbatim (RANK-05, guaranteed non-empty by `redemptionSeedSchema` — `src/data/types.ts` line 79); stamp = `redemption.verifiedAt` through the pure date formatter; bonus badge = `chosenPath.activeBonus` (terracotta — one of the three sanctioned accent uses).

**Framing split** (Pitfall 10 / UI-SPEC copy contract): look up the source program via `chosenPath.fromProgramSlug`; `cashOutBaselineCppX100 === null` (Hyatt/Hilton/Bonvoy — `src/data/programs.ts` lines 55-75) → "Pure travel value" copy; otherwise (incl. Bilt's 0.1¢ stand-in, lines 44-54) → "vs. ~{cashOut} cashing out".

---

### `src/components/almost-there.tsx` (component)

**Analog:** same as result-card. `pointsAway` is non-null and denominated in `chosenPath.fromProgramSlug`'s currency — proven by `tests/engine-ranking.test.ts` lines 61-68:

```typescript
    const result = mustFind(almostThere, "st-regis-bora-bora");
    expect(result.chosenPath.requiredSourcePoints).toBe(100_000);
    // pointsAway = requiredSourcePoints − balance, in the chosen path's currency.
    expect(result.pointsAway).toBe(20_000);
```

Callout copy (UI-SPEC): "You're {formatted points} {program name} points away" — points formatter from `src/lib/format.ts`, program name from the dataset. Stays ink/muted (accent reserved).

---

### `src/lib/balance-params.ts` (utility/codec)

**Analog for the const-map shape:** `src/data/programs.ts` line 173 — the `satisfies` pattern that keeps literal types while enforcing the contract:

```typescript
] satisfies ProgramSeed[];
```

→ RESEARCH Pattern 1 already uses the same idiom: `as const satisfies Record<EnterableProgramSlug, string>` for `PARAM_KEY_BY_SLUG`. The `EnterableProgramSlug` union (`src/engine/types.ts` lines 41-49) makes a missing/misspelled slug a compile error.

**Analog for `paramsToBalances` validation:** `src/engine/ranking.ts` lines 35-43 — copy this exact guard (the codec applies it at the URL boundary; the engine re-applies it as defense in depth, T-03-09):

```typescript
function sanitizeBalances(balances: Balances): Balances {
  const sanitized: Partial<Record<string, number>> = {};
  for (const [slug, value] of Object.entries(balances)) {
    if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
      sanitized[slug] = value;
    }
  }
  return sanitized as Balances;
}
```

nuqs wiring (`createLoader`, `parseAsInteger` from `nuqs/server`) has no in-repo analog — copy RESEARCH.md Pattern 1 verbatim. This file must be importable by both server (`page.tsx`) and client (`core-experience.tsx`): no `"use client"`, no browser APIs.

---

### `src/lib/balance-storage.ts` (utility, localStorage + precedence)

**Analog for module shape/JSDoc:** `src/engine/valuation.ts` (see format.ts below). **Analog for hostile-input validation:** `sanitizeBalances` above — stored JSON is re-validated field-by-field against `EnterableProgramSlug` keys and positive safe integers; discard wholesale on any failure.

No localStorage usage exists anywhere in the repo (verified by search) — follow RESEARCH Pattern 4 + Pitfalls 2/6: all storage access behind try/catch, effects-only (never in render or `useState` initializers), versioned key `pu:balances:v1`, JSON keyed by canonical slug (not short URL key). Structure the precedence logic (`resolveInitialBalances`) and validation as pure functions with storage I/O injected, so tests run in node without jsdom (RESEARCH Validation Architecture).

---

### `src/lib/format.ts` (utility, display formatters)

**Analog:** `src/engine/valuation.ts` — the house style for pure helpers: one exported function per concept, JSDoc explaining the finance rule + which requirement it serves, guard clauses degrading to a safe value, integer arithmetic until the last step. Copy the shape of lines 12-39:

```typescript
/**
 * Cents-per-point of a redemption in partner points, as integer cppX100
 * (100 = 1.0 cents/pt) — VAL-02.
 * ...
 * Returns 0 when partnerPoints ≤ 0 or any input is non-finite.
 */
export function cppX100(
  cashFareCents: number,
  taxesFeesCents: number,
  partnerPoints: number,
): number {
  if (
    !Number.isFinite(cashFareCents) ||
    !Number.isFinite(taxesFeesCents) ||
    !Number.isFinite(partnerPoints) ||
    partnerPoints <= 0
  ) {
    return 0;
  }
  return Math.round(((cashFareCents - taxesFeesCents) * 100) / partnerPoints);
}
```

**`heroDelta` has a ready-made in-repo reference** — `conservativeWow` exists identically in `src/engine/ranking.ts` lines 86-89 and `tests/engine-ranking.test.ts` lines 44-47; the UI helper is the same expression over the result's `ValueRange`:

```typescript
/** A2 conservative ranking key: wow delta at pointsMax (atMin for fixed charts). */
function conservativeWow(r: RankedResult): number {
  return r.wowDeltaCents.atMax ?? r.wowDeltaCents.atMin;
}
```

Formatters per UI-SPEC number rules: currency via `Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })`; cpp via `(cppX100 / 100).toFixed(1) + "¢"`; verified stamp via pure string split of the ISO date — NO `Date` object (Pitfall 5). `verifiedAt` is `z.iso.date()` (`src/data/types.ts` line 84), so `YYYY-MM-DD` split is safe.

---

### `src/lib/path-display.ts` (utility)

**Analog:** `src/engine/valuation.ts` (module style) + `src/engine/ranking.ts` lines 66-71 for the route-lookup idiom:

```typescript
  const route = dataset.routes.find(
    (r) =>
      r.active &&
      r.fromProgramSlug === path.fromProgramSlug &&
      r.toProgramSlug === partnerProgramSlug,
  );
```

**Input contract** (`src/engine/types.ts` lines 74-99): `TransferPath.routeKey` is `` `${from}→${to}` `` with the Unicode arrow (repo-wide contract — same key format built in `src/data/types.ts` line 170: `` const key = `${r.fromProgramSlug}→${r.toProgramSlug}` ``), and is absent for `kind: "direct"`. Ratio fields come from `TransferRouteSeed.ratioNumerator/ratioDenominator` (`src/data/types.ts` lines 25-26). RESEARCH Pattern 5 provides the full function — copy it, output per UI-SPEC: "via {From} → {To} {ratio}" / "Use your {Program} points directly".

---

### `tests/*.test.ts` (4 new files)

**Analog:** `tests/engine-ranking.test.ts` — copy the file's conventions exactly (lines 1-22):

```typescript
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
```

Conventions to replicate: **relative imports** (`../src/...`, not `@/` — vitest config has no alias assumption to lean on; every existing test file imports relatively), real-dataset fixtures for `path-display` tests (assert against actual seed routes, e.g. "via Amex Membership Rewards → Hilton Honors 2:1"), pinned dates (never the clock — and note the Amex→Hilton bonus window ends 2026-10-14 when hand-computing expected values), numeric literals with `_` separators (`80_000`), small named helpers with loud failure messages (`mustFind`, lines 28-38), and descriptive `it` strings embedding concrete numbers. Test file style header comment explains the fixture strategy. Run per-file via `npx vitest run tests/<file>.test.ts`; suite via `npm test` (90 tests green pre-phase).

For `balance-storage.test.ts`: inject a fake storage object into the pure functions — no jsdom (node environment per `vitest.config.ts`).

## Shared Patterns

### Barrel-only imports + collision hazard
**Source:** `src/engine/index.ts` lines 4-7, `src/data/index.ts` lines 5-9
**Apply to:** every new source file
Always `import { ... } from "@/engine"` / `"@/data"` (or relative `../src/data` in tests) — never deep-import `transfers.ts` from either side. Path alias is `@/* → ./src/*` (`tsconfig.json`).

### Neutral error fallback (T-01-07)
**Source:** `src/app/page.tsx` lines 13-23
**Apply to:** page, client island, storage module
Never render or log a caught error's contents; set a neutral message and move on. UI-SPEC error copy: "Something went wrong showing your results. Refresh the page to try again." Storage failures degrade silently to URL-only behavior (no error UI).

### Decision-ID comments
**Source:** pervasive — e.g. `src/app/layout.tsx` line 5 (`D-13`), `src/app/page.tsx` line 21 (`T-01-07`), `src/engine/types.ts` lines 24-35 (A1/A2/A3/A5/A7)
**Apply to:** all new files
Annotate encoded rulings at the point of use: A1 (URL-vs-storage precedence), A2 (conservative hero — cite Pitfall 4), Pitfall 5 (no `Date`), Pitfall 6 (storage guard).

### Integer-until-render arithmetic
**Source:** `src/engine/valuation.ts` header comment (lines 3-10)
**Apply to:** format.ts, all card rendering
All engine values are integer cents / cppX100. The UI does zero arithmetic except the final `/100` inside a formatter. Any other math in the UI layer is the RESEARCH anti-pattern ("re-computing anything the engine returns").

### Determinism: time is an input
**Source:** `src/engine/types.ts` lines 186-192 (`asOf` JSDoc: "The engine never reads the clock"), `src/engine/ranking.ts` line 23
**Apply to:** page.tsx (sole `new Date()` call site, server-side), core-experience (reuses the `asOf` prop for every recompute — Pitfall 7), all tests (pinned dates)

### Component/file conventions
**Source:** `src/components/ui/*.tsx`, `src/app/*.tsx`
**Apply to:** all new components
kebab-case filenames; named function components with named exports; props typed inline (`React.ComponentProps<...>` extension in ui/, plain interfaces fine in app components); `cn` from `@/lib/utils` for conditional classes; `"use client"` as the literal first line when needed (`label.tsx` line 1). Radix imports come from the single `radix-ui` package (e.g. `import { Label as LabelPrimitive } from "radix-ui"` — label.tsx line 4), not per-component `@radix-ui/*` packages. Prettier runs with `prettier-plugin-tailwindcss` (class sorting); match `npm run format` output. App-authored files use semicolons (page/layout style) — follow that, not the semicolon-free vendored shadcn style.

### Design tokens (do not invent values)
**Source:** `src/app/globals.css` lines 52-64
**Apply to:** all components
`--color-cream #faf7f2`, `--color-ink #262119`, `--color-terracotta #c05f33`, `--text-display` (3rem/1.1/-0.02em), `--text-display-xl` (4.5rem/1.05/-0.025em); `--font-display`/`--font-heading` = Fraunces, `--font-sans` = Inter (lines 11-13). Terracotta is reserved for exactly three uses (hero deltas, "Copy my link" CTA, bonus badge) per UI-SPEC. No new color values this phase.

## No Analog Found

Files/aspects with no in-repo match — planner uses RESEARCH.md patterns (all verified against Context7/official docs there):

| File / Aspect | Role | Reason | Governing Pattern |
|---------------|------|--------|-------------------|
| nuqs wiring (`NuqsAdapter`, `createLoader`, `useQueryStates`) | URL state | nuqs is a new dependency this phase | RESEARCH Patterns 1-2 + Pitfalls 1, 3 |
| `react-number-format` usage (`NumericFormat` + `customInput`) | formatted input | new dependency this phase | RESEARCH Pattern 3 |
| localStorage I/O + hydration-safe effects | browser storage | no browser-storage code exists in repo | RESEARCH Pattern 4 + Pitfalls 2, 6 |

Install first (one task, before any dependent file): `npm install nuqs@2.10.1 react-number-format@5.4.5` (both slopcheck [OK], no postinstall scripts).

## Metadata

**Analog search scope:** `src/app`, `src/components/ui`, `src/engine`, `src/data`, `src/lib`, `src/db`, `tests`, `globals.css`, `package.json`, `tsconfig.json`, `.prettierrc`
**Files scanned:** 20 (all read fully or in targeted ranges)
**Pattern extraction date:** 2026-09-01
