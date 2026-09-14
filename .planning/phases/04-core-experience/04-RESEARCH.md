# Phase 4: Core Experience - Research

**Researched:** 2026-09-01
**Domain:** Next.js 16 App Router guest flow — URL-state balance entry, client-side ranking UI, shareable results
**Confidence:** HIGH

## Summary

Phase 4 is almost entirely a composition problem, not an invention problem. Everything hard already exists: the sealed engine (`rankRedemptions` in `src/engine`) turns `{ balances, dataset, asOf }` into `{ bookableNow, almostThere }` with every field the UI needs (wow delta, dual valuation ranges, chosen path, alternates, pointsAway, verifiedAt passthrough), and the dataset is importable, in-memory TypeScript (`src/data`) with 34 Nick-verified redemptions live. The phase adds exactly two npm packages — `nuqs` 2.10.1 (URL state, INPUT-03) and `react-number-format` 5.4.5 (formatted inputs, INPUT-01) — both slopcheck-verified `[OK]`, plus pure display helpers and the page composition.

The ratified milestone architecture (`.planning/research/ARCHITECTURE.md`, Pattern 1) locks the shape: **one core page** — the entire wow moment happens on `/` with the engine running isomorphically. The dataset ships in the client bundle (sanctioned: "full dataset is inspectable in devtools — acceptable: it renders on screen anyway"), results recompute instantly as the user edits balances, and the URL is the share mechanism. One important simplification vs. the original architecture sketch: since Phase 2 kept seed data as importable TS files, the "cached JSON data API" hop is unnecessary — both server and client import `programs/routes/bonuses/redemptions` directly from `@/data`. The DB is not touched anywhere in the guest flow (the Phase 1 homepage DB query gets deleted along with the placeholder page).

The two genuinely fiddly areas are (1) the three-way state dance between URL params, localStorage, and React state — precedence rules and hydration safety are specified below and should be encoded as a pure, unit-testable decision function — and (2) honest display of the engine's `ValueRange` shapes (the hero number must be the same conservative figure the ranking sorted on, or the finance-credibility claim breaks). `[VERIFIED: codebase + Context7 + nextjs.org docs]`

**Primary recommendation:** Build a single dynamic route at `/`: server component awaits `searchParams`, parses balances with a shared nuqs parser map, derives `asOf`, and renders a client island that owns balances via `useQueryStates` (shallow, default), syncs localStorage in effects, and calls `rankRedemptions` in a `useMemo`. Install only `nuqs@2.10.1` and `react-number-format@5.4.5`.

## Project Constraints (from CLAUDE.md)

Actionable directives from `C:\Users\geoca\milesworth\CLAUDE.md` and `C:\Users\geoca\CLAUDE.md` that bind this phase:

- **Stack is locked:** Next.js 16.3.4 App Router, Tailwind v4 (`@theme` tokens in `globals.css`, no `tailwind.config.js`), shadcn/ui for primitives, TypeScript strict. Do not introduce CSS-in-JS or Pages Router patterns.
- **nuqs 2.10.x is the designated shareable-results mechanism** — "Balances live in the URL (`/results?ur=90000&mr=50000`) … Requires wrapping the app in `NuqsAdapter` in `app/layout.tsx`." Research below confirms and refines this.
- **localStorage is NOT the primary share/persistence mechanism** — URL params first (per "What NOT to Use" table); localStorage is the returning-guest convenience layer only (INPUT-02).
- **`motion` (12.x per CLAUDE.md; 13.1.1 is current on npm) is optional** and reserved "for the one moment that matters: the valuation-delta reveal. Use sparingly … Skip everywhere else." Recommendation: defer to Phase 7 polish; do not install in Phase 4.
- **File organization:** source in `src/`, tests in `tests/`, nothing in repo root. Keep files under 500 lines.
- **Editorial design:** Fraunces (`--font-display`, with `opsz` axis — chosen specifically to carry the big dollar numbers) + Inter; `cream`/`ink`/`terracotta` tokens and `text-display`/`text-display-xl` sizes already exist in `globals.css`. Phase 4 builds structure with these tokens; the full design pass is Phase 7.
- **Testing:** ALWAYS run tests after changes; verify build before committing. Vitest is the framework.
- **Security:** validate input at system boundaries; never render caught errors (T-01-07 precedent in `src/app/page.tsx`).
- **Design reference repos** (user global CLAUDE.md): `~/design-repos/launch-ui`, `~/design-repos/shadcn-ui-landing-page`, `~/design-repos/magicui` — prefer adapting existing hero/card patterns over building from scratch.

## User Constraints

No CONTEXT.md exists for this phase (user proceeded without discuss-phase). The binding constraints are the roadmap success criteria, REQUIREMENTS.md, CLAUDE.md (above), and the ratified milestone architecture decision:

- **`.planning/research/ARCHITECTURE.md` Pattern 1 (ratified at milestone level):** "One core page: the entire wow moment happens on `/` — enter balances, see results, no navigation." Client-side engine execution with dataset shipped to the browser. Treat as a locked architectural precedent unless the planner surfaces a concrete reason to revise.
- **STATE.md decision:** "Engine must be pure TS, no framework/DB imports — it becomes the v2 advisor's tool." Phase 4 consumes the engine barrel only; it must never re-implement any math.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INPUT-01 | 8-program formatted balance inputs, no login | `react-number-format` `NumericFormat` with `customInput={Input}` (shadcn), `thousandSeparator`, `allowNegative={false}`, `decimalScale={0}`, `inputMode="numeric"` — Pattern 3. Program list/names come from `src/data/programs.ts` (`isUserEnterable`), typed by `EnterableProgramSlug` from the engine. |
| INPUT-02 | Balances persist in localStorage | localStorage read/write in `useEffect` only (hydration-safe), try/catch-wrapped (LinkedIn WebView), validated on read — Pattern 4 + Pitfalls 2, 6. |
| INPUT-03 | Balances encode into the URL; shared link reproduces results | nuqs `useQueryStates` (client) + `createLoader` (server) over one shared parser map; short param keys (`ur`, `mr`, …) per CLAUDE.md example — Patterns 1–2. Route is dynamic (page awaits `searchParams`), so SSR renders real results for shared links. |
| RANK-01 | Bookable-now list ranked by wow delta | `rankRedemptions(...).bookableNow` — already sorted by conservative wow delta desc. UI renders in engine order, never re-sorts. |
| RANK-02 | "Almost there" with "you're X points away" | `rankRedemptions(...).almostThere` — `pointsAway` is non-null, denominated in the chosen path's source currency; format with program name: "You're 20,000 Chase Ultimate Rewards points away." |
| RANK-03 | Tag which balance each result uses; cheapest path when multiple reach the partner | `RankedResult.chosenPath.fromProgramSlug` (A1-cheapest, engine-resolved); `alternatePaths` available for transparency. |
| RANK-04 | Explicit transfer path display ("via Chase UR → World of Hyatt 1:1") | `chosenPath.routeKey` (`"from→to"` Unicode-arrow format) + route lookup in `dataset.routes` for `ratioNumerator:ratioDenominator`; `kind: "direct"` renders "use your X points directly" — pure `formatTransferPath` helper, Pattern 5. |
| RANK-05 | 2–4 line how-to-book guidance | `redemption.bookingHint` (required, non-empty by seed schema) — render verbatim on the card. |
| VAL-01 | Dual valuation side by side, dollar delta as hero | `wowDeltaCents` (hero, conservative end `atMax ?? atMin` — the exact ranking key), `cashFareCents`, `cppX100`/`effectiveCppX100` ranges — display rules in Pattern 6 + Pitfall 4. |
| VAL-04 | "Verified [date]" stamp | `redemption.verifiedAt` (ISO date string; engine already filters `null` drafts fail-closed per A5). Format WITHOUT `new Date()` — Pitfall 5. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Balance input + formatting | Browser / Client | — | Interactive form; `react-number-format` is client-only |
| URL ↔ balance state | Browser / Client | Frontend Server (SSR) | nuqs `useQueryStates` client-side; same parser map read server-side via `createLoader` for SSR of shared links |
| localStorage persistence | Browser / Client | — | Storage API exists only in the browser; effects-only access |
| Ranking computation | Isomorphic (pure engine) | — | `src/engine` is framework-free by CI-enforced purity gate; runs in the client island per-edit and on the server for the initial render |
| Dataset supply | Build-time import | — | `src/data` typed TS arrays bundle into both server and client output; no DB, no API route |
| Results rendering (cards, sections) | Browser / Client (SSR'd) | Frontend Server (SSR) | Client component, but server-rendered on this dynamic route — results appear in initial HTML for shared links `[CITED: nextjs.org/docs/app/api-reference/functions/use-search-params]` |
| `asOf` date derivation | Frontend Server (SSR) | — | Server derives request-time date and passes as prop — keeps the engine deterministic and avoids client/server date mismatch (Pitfall 7) |
| Database | — (not used) | — | Guest flow never touches Neon; DB reads return in Phase 6 (accounts). `@/db` must not be imported anywhere in this flow (Pitfall 8) |

## Standard Stack

### Core (already installed — consume, don't add)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `src/engine` barrel | in-repo | All ranking/valuation math | Sealed Phase 3 module; `rankRedemptions` is the single entry point `[VERIFIED: codebase]` |
| `src/data` barrel | in-repo | Programs, routes, bonuses, redemptions arrays | 34 verified redemptions live; `validateDataset` guards integrity `[VERIFIED: codebase — grep counts 34 verified / 3 draft]` |
| next | 16.3.4 | App Router, dynamic SSR | Installed `[VERIFIED: package.json]` |
| shadcn/ui (`components/ui`) | vendored | Input, Label, Card, Button, Dialog present | Installed Phase 1 `[VERIFIED: codebase]` |
| Tailwind v4 tokens | 4.x | `cream/ink/terracotta`, `font-display`, `text-display[-xl]` | Defined in `globals.css` `@theme` `[VERIFIED: codebase]` |
| vitest | 4.1.11 | Tests (node env, `tests/**`) | Installed `[VERIFIED: package.json + vitest.config.ts]` |

### New this phase
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nuqs | 2.10.1 | Type-safe URL query state (INPUT-03) | Designated in CLAUDE.md; first-class Next 16 App Router adapter, shared server/client parsers `[VERIFIED: npm registry — 2.10.1 latest, confirmed via Context7 /47ng/nuqs; slopcheck OK]` |
| react-number-format | 5.4.5 | Formatted numeric inputs (INPUT-01) | 10-year-old standard (created 2016); solves the cursor-position problem hand-rolled formatting always gets wrong; `customInput` composes with shadcn `Input` `[VERIFIED: npm registry — 5.4.5 latest, API confirmed via Context7 /s-yadav/react-number-format; slopcheck OK]` |

**Installation:**
```bash
npm install nuqs@2.10.1 react-number-format@5.4.5
```

Version verification performed 2026-09-01: `npm view nuqs version` → 2.10.1; `npm view react-number-format version` → 5.4.5. Neither package has a `postinstall` script `[VERIFIED: npm registry]`.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| One-page client compute (`/`) | Separate `/results` server-rendered route | Cleaner "reveal" navigation and simpler SSR — but contradicts the ratified ARCHITECTURE.md "one core page" pattern and loses zero-latency recompute on edit. Only revisit if the single page gets crowded; the hybrid below already gives SSR'd shared links. |
| react-number-format | Hand-rolled `Intl.NumberFormat` + controlled input | Cursor jumps on mid-string edits are a notorious rabbit hole; a formatted-input library is exactly the "don't hand-roll" case. Hand-roll only if adding a dep were forbidden. |
| Short URL keys (`ur`, `mr`, `c1`, `ty`, `bilt`, `hyatt`, `hilton`, `bonvoy`) | Full slugs as keys (`chase-ur=90000`) | Full slugs need no mapping table but make ugly long share URLs. CLAUDE.md's own example uses short keys (`?ur=90000&mr=50000`). Either works; short keys recommended — the mapping lives in one codec file. |
| Server-passed `asOf` prop | Client `new Date()` | Client date is timezone-dependent and can mismatch the SSR-computed tree at hydration. Server-derived `asOf` keeps one deterministic input per request. |
| motion (animation) | CSS transitions / nothing | Defer install to Phase 7; Phase 4 ships the structure. (Note: motion latest is 13.1.1, not 12.x as CLAUDE.md states — verify peer deps at install time in Phase 7.) `[VERIFIED: npm registry]` |

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| nuqs | npm | ~2.8 yrs (created 2023-11) | high (ecosystem standard) | github.com/47ng/nuqs | [OK] | Approved |
| react-number-format | npm | ~10 yrs (created 2016-04) | very high | github.com/s-yadav/react-number-format | [OK] | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

slopcheck 0.6.1 ran successfully (`python -m slopcheck install nuqs react-number-format` → both `[OK]`, 2 scanned / 2 OK). The tool's follow-on `npm install` subprocess failed on Windows and installed nothing — the planner's install task performs the real install. `npm view <pkg> scripts.postinstall` is empty for both `[VERIFIED: npm registry]`.

## Architecture Patterns

### System Architecture Diagram

```
                       shared link / fresh visit / reload
                                     │
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │ app/page.tsx (server component, dynamic — awaits       │
        │ searchParams)                                          │
        │  1. loadBalanceParams(searchParams) → initialBalances  │
        │  2. asOf = request-time ISO date (server clock)        │
        │  3. hadUrlBalances = any param present                 │
        └───────────────┬────────────────────────────────────────┘
                        │ props: { asOf, hadUrlBalances }
                        ▼
        ┌────────────────────────────────────────────────────────┐
        │ <CoreExperience /> ("use client" — SSR'd on this       │
        │ dynamic route, so results ship in initial HTML)        │
        │                                                        │
        │  useQueryStates(balanceParsers) ◄──► URL (?ur=90000…)  │
        │        │ shallow updates (default), history: replace   │
        │        ▼                                               │
        │  balances ──► useMemo(rankRedemptions({balances,       │
        │                 dataset: import from "@/data",         │
        │                 asOf }))                               │
        │        │                                               │
        │        ├──► <BalanceForm/>   8 × NumericFormat inputs  │
        │        ├──► <BookableNow/>   ranked wow cards          │
        │        ├──► <AlmostThere/>   pointsAway callouts       │
        │        └──► <EmptyState/>    no balances entered       │
        │                                                        │
        │  useEffect: localStorage sync (Pattern 4 precedence)   │
        └────────────────────────────────────────────────────────┘

  Data flow: src/data (typed TS, bundled) ──► engine ──► UI.
  Postgres is NOT in this diagram by design — the guest flow never
  queries it. Copy Link button = navigator.clipboard on current URL.
```

A shared URL traces: request → dynamic SSR parses params → engine runs on server → full results in HTML → hydration → edits recompute client-side with zero network.

### Recommended Project Structure
```
src/
├── app/
│   ├── layout.tsx            # + <NuqsAdapter> wrap (nuqs/adapters/next/app)
│   └── page.tsx              # replaces Phase 1 placeholder; server: parse params, asOf
├── components/
│   ├── core-experience.tsx   # "use client" island: state + engine call + composition
│   ├── balance-form.tsx      # 8 formatted inputs (INPUT-01)
│   ├── result-card.tsx       # hero delta, dual valuation, path, hint, stamp (VAL-01/04, RANK-03/04/05)
│   ├── almost-there.tsx      # RANK-02 section
│   └── ui/                   # existing shadcn primitives
└── lib/
    ├── balance-params.ts     # nuqs parser map + short-key ↔ EnterableProgramSlug codec (server+client)
    ├── balance-storage.ts    # localStorage read/write + pure precedence/validation fns
    ├── format.ts             # centsToDollars, cppX100 display, points, ISO-date "Verified" stamp
    └── path-display.ts       # TransferPath + dataset → human-readable path strings
tests/
    ├── balance-params.test.ts
    ├── balance-storage.test.ts
    ├── format.test.ts
    └── path-display.test.ts
```

### Pattern 1: Shared nuqs parser map (server + client, one source of truth)

**What:** Define the balance param parsers once in `src/lib/balance-params.ts`, imported by both the server page (via `createLoader`) and the client island (via `useQueryStates`).
**When to use:** Always — this is INPUT-03's backbone.

```typescript
// src/lib/balance-params.ts
// Source: Context7 /47ng/nuqs — createLoader + shared parsers pattern
import { createLoader, parseAsInteger } from "nuqs/server"; // server-safe entry
import type { Balances, EnterableProgramSlug } from "@/engine";

// Short URL keys per CLAUDE.md's canonical example (?ur=90000&mr=50000)
export const PARAM_KEY_BY_SLUG = {
  "chase-ur": "ur",
  "amex-mr": "mr",
  "capital-one": "c1",
  "citi-ty": "ty",
  bilt: "bilt",
  "world-of-hyatt": "hyatt",
  "hilton-honors": "hilton",
  "marriott-bonvoy": "bonvoy",
} as const satisfies Record<EnterableProgramSlug, string>;

export const balanceParsers = Object.fromEntries(
  Object.values(PARAM_KEY_BY_SLUG).map((k) => [k, parseAsInteger]),
);
// paramsToBalances(parsed): drop null/<=0/non-integers, map keys back to slugs
// (engine sanitizes again — defense in depth, T-03-09)

export const loadBalanceParams = createLoader(balanceParsers);
```

```typescript
// src/app/page.tsx (server component — awaiting searchParams makes the route
// dynamic, so the client island SSRs with real URL values)
// Source: Context7 /47ng/nuqs (NUQS-500 doc: searchParams is a Promise in Next 15+)
import { loadBalanceParams } from "@/lib/balance-params";
import type { SearchParams } from "nuqs/server";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await loadBalanceParams(searchParams);
  const asOf = new Date().toISOString().slice(0, 10); // server clock, once per request
  return <CoreExperience asOf={asOf} initialParams={params} />;
}
```

`[VERIFIED: Context7 /47ng/nuqs]` — `createLoader` accepts the `searchParams` promise; `NuqsAdapter` from `nuqs/adapters/next/app` must wrap children in `app/layout.tsx` (Next.js ≥14.2 supported).

### Pattern 2: Client island — useQueryStates + engine in useMemo

```typescript
// src/components/core-experience.tsx
"use client";
// Source: Context7 /47ng/nuqs (useQueryStates with shared parsers)
import { useQueryStates } from "nuqs";
import { useMemo } from "react";
import { balanceParsers, paramsToBalances } from "@/lib/balance-params";
import { bonuses, programs, redemptions, routes } from "@/data";
import { rankRedemptions } from "@/engine";

export function CoreExperience({ asOf }: { asOf: string }) {
  // Defaults: shallow=true (no server round-trip per keystroke),
  // history="replace" (typing never spams the back button) — both nuqs defaults.
  const [params, setParams] = useQueryStates(balanceParsers);
  const balances = paramsToBalances(params);

  const results = useMemo(
    () =>
      rankRedemptions({
        balances,
        dataset: { programs, routes, bonuses, redemptions },
        asOf,
      }),
    [params, asOf], // engine is pure + fast (~37 redemptions × ≤46 routes)
  );
  // render <BalanceForm/>, <BookableNow/>, <AlmostThere/> from `results`
}
```

Because the route is dynamically rendered, `useSearchParams` (which nuqs uses internally) "will be available on the server during the initial server render of the Client Component" — shared links get full results in the initial HTML, no Suspense build error `[CITED: nextjs.org/docs/app/api-reference/functions/use-search-params]`.

### Pattern 3: Formatted balance input (INPUT-01)

```tsx
// src/components/balance-form.tsx (inside "use client" tree)
// Source: Context7 /s-yadav/react-number-format — NumericFormat + customInput
import { NumericFormat } from "react-number-format";
import { Input } from "@/components/ui/input";

<NumericFormat
  customInput={Input}          // shadcn Input keeps the design system
  value={balances["chase-ur"] ?? ""}
  thousandSeparator=","
  allowNegative={false}
  decimalScale={0}             // whole points only
  inputMode="numeric"          // mobile numeric keypad (LinkedIn WebView)
  placeholder="0"
  onValueChange={({ floatValue }, sourceInfo) => {
    if (sourceInfo.source !== "event") return; // ignore prop-driven echoes
    setParams({ ur: floatValue && floatValue > 0 ? Math.floor(floatValue) : null });
    // null clears the key from the URL — absent key = no balance
  }}
/>
```

`[VERIFIED: Context7]` — `onValueChange` receives `{ formattedValue, value, floatValue }` plus `sourceInfo.source: 'event' | 'prop'`; `customInput` forwards remaining props to the wrapped component.

### Pattern 4: URL ↔ localStorage precedence (INPUT-02 + INPUT-03 interplay)

Encode as a pure function (`resolveInitialBalances`) so it is unit-testable in node:

1. **URL has any balance param → URL wins.** Do NOT auto-write to localStorage — opening someone else's share link must not clobber the visitor's own saved balances.
2. **URL empty + localStorage has valid balances → hydrate from localStorage** in a `useEffect` after mount, and push into the URL via `setParams(..., { history: "replace" })` so the page is instantly shareable again.
3. **User edits any input → write the full balance set to localStorage** (now it's theirs) and to the URL (via nuqs, automatic).
4. All localStorage access wrapped in try/catch (private WebView modes throw); all read values re-validated (positive safe integers keyed by known slugs) before use. Store under one versioned key, e.g. `pu:balances:v1`, as JSON keyed by canonical slug (not short URL key — slugs are the stable contract).

This satisfies success criterion 4 both ways: reload with URL params reproduces via the URL; returning to a bare `/` reproduces via localStorage. `[ASSUMED — standard React pattern; precedence rules are a product decision, see Assumptions Log A1]`

### Pattern 5: Path + tag display (RANK-03/04) from engine output

```typescript
// src/lib/path-display.ts — pure, testable
import type { TransferPath } from "@/engine";
import type { ProgramSeed, TransferRouteSeed } from "@/data/types";

export function formatTransferPath(
  path: TransferPath,
  routes: TransferRouteSeed[],
  programsBySlug: Map<string, ProgramSeed>,
): string {
  const from = programsBySlug.get(path.fromProgramSlug)?.name ?? path.fromProgramSlug;
  if (path.kind === "direct") return `Use your ${from} points directly`;
  // routeKey format is `${from}→${to}` (Unicode arrow) — the repo-wide contract
  const [fromSlug, toSlug] = path.routeKey!.split("→");
  const route = routes.find(
    (r) => r.fromProgramSlug === fromSlug && r.toProgramSlug === toSlug,
  )!;
  const to = programsBySlug.get(toSlug)?.name ?? toSlug;
  return `via ${from} → ${to} ${route.ratioNumerator}:${route.ratioDenominator}`;
}
```

`TransferPath` carries `routeKey` but not the ratio — the UI looks the route up in the dataset (46 routes; a `Map` keyed by routeKey is fine). `chosenPath.fromProgramSlug` is the RANK-03 balance tag; `activeBonus !== null` surfaces the promo chip (VAL-05 display, already engine-computed). `[VERIFIED: codebase — src/engine/types.ts]`

### Pattern 6: Honest ValueRange display (VAL-01)

Engine contract (A2, ratified): ranking and bookability gate on the **conservative** end — `atMax ?? atMin`. For dynamic awards `wowDeltaCents.atMin ≥ atMax` (fewer points → higher value); for fixed charts all `atMax` are `null`.

- **Hero number = `wowDeltaCents.atMax ?? wowDeltaCents.atMin`** — the exact figure the ranking sorted on. Never lead with the optimistic end of a range the ranking didn't use.
- Fixed chart (`atMax === null`): single figures throughout.
- Dynamic award: hero is conservative; optionally show "as low as {pointsNeeded.min} points / up to ${atMin delta}" as secondary copy.
- Side-by-side block: cash fare (`cashFareCents`), cpp (`effectiveCppX100` — the promo-honest through-path figure; `cppX100` is the partner-point figure for the methodology-minded), and the delta.
- All arithmetic stays integer until render: `(cents / 100)` formatted with `Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })`; cpp as `(cppX100 / 100).toFixed(1) + "¢"`. `[VERIFIED: codebase — engine types JSDoc]`

### Anti-Patterns to Avoid
- **Re-sorting or re-computing anything the engine returns:** the UI renders `bookableNow`/`almostThere` in array order. Any UI-side sort/filter/math re-implementation breaks the CI-verified finance claim.
- **Importing `@/db` anywhere in the guest flow:** pulls Drizzle/Neon into the client bundle or forces a DB dependency the flow doesn't have. The Phase 1 homepage DB query is deleted, not migrated.
- **Importing from `src/engine/transfers` or `src/data/transfers` directly:** filename collision hazard documented in both barrels — always import from `@/engine` and `@/data` barrels, aliasing on conflict.
- **`export const dynamic = "force-dynamic"`:** unnecessary — awaiting `searchParams` already makes the route dynamic (and Next docs now prefer `connection()` if forcing were needed).
- **Reading localStorage during render or in `useState` initializers:** hydration mismatch (Pitfall 2).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Thousands-separator input | Controlled input + manual format/parse | `react-number-format` | Caret position after mid-string edits, paste handling, IME, mobile keypads — years of edge cases `[VERIFIED: Context7]` |
| URL ↔ state sync | `useRouter` + `URLSearchParams` plumbing | nuqs `useQueryStates`/`createLoader` | Batched updates, browser rate-limit throttling, server/client shared parsers, typed round-trip `[VERIFIED: Context7]` |
| Ranking/valuation math in UI | Any cpp/delta/pointsAway computation | `rankRedemptions` output fields | Engine is TDD-frozen against hand-computed anchors; UI duplication guarantees drift |
| Currency/number display | String concatenation | `Intl.NumberFormat` | Built-in, locale-correct, zero deps |
| Accessible form primitives | Custom inputs/labels | Existing shadcn `Input`, `Label`, `Card` | Already vendored in `components/ui` |

**Key insight:** every "hard" number on screen already exists as an integer field on `RankedResult`. Phase 4's entire logic surface is codecs and formatters — all of which can be pure functions with node-env unit tests.

## Common Pitfalls

### Pitfall 1: Missing `NuqsAdapter` in root layout
**What goes wrong:** every nuqs hook throws at runtime.
**Why:** nuqs 2.x requires the framework adapter (`nuqs/adapters/next/app`) wrapping children.
**How to avoid:** first task touching layout adds `<NuqsAdapter>` inside `<body>`. `[VERIFIED: Context7]`

### Pitfall 2: localStorage hydration mismatch
**What goes wrong:** server HTML (no storage) differs from first client render (storage-hydrated) → React hydration error or flickering values.
**How to avoid:** first render uses only URL-derived state (identical on server and client); localStorage read happens in `useEffect` and flows through `setParams`. Never `useState(() => localStorage.getItem(...))`.
**Warning signs:** "Hydration failed" console errors; inputs flashing from empty to filled.

### Pitfall 3: `searchParams` is a Promise in Next 15+/16
**What goes wrong:** treating the page's `searchParams` prop as a plain object type-checks against stale examples but breaks.
**How to avoid:** `searchParams: Promise<SearchParams>` and `await loadBalanceParams(searchParams)` — nuqs loaders accept the promise directly. `[VERIFIED: Context7 — NUQS-500 doc]`

### Pitfall 4: Hero number diverges from ranking key
**What goes wrong:** UI shows the optimistic `atMin` delta while the list is sorted by conservative `atMax` — cards appear "out of order," and the site overpromises on exactly the dynamic-award programs where overpromising hurts most (the rejected alternative in the A2 ruling).
**How to avoid:** one shared `heroDelta(result)` helper returning `wowDeltaCents.atMax ?? wowDeltaCents.atMin`; unit-test that rendering order matches descending hero values for a real ranked output.

### Pitfall 5: `new Date("2026-09-01")` off-by-one on the Verified stamp
**What goes wrong:** bare ISO dates parse as UTC midnight; in US timezones `toLocaleDateString` renders the previous day — and can differ between server render and client hydration.
**How to avoid:** format `verifiedAt` with a pure string helper (split on `-`, map month names). No `Date` object, no timezone, no hydration risk. Same rule for bonus end dates if displayed.

### Pitfall 6: localStorage throws in restricted WebViews
**What goes wrong:** LinkedIn's in-app browser (the launch-critical session, per STATE.md) or private modes can throw on access; an unguarded call crashes the whole island.
**How to avoid:** all storage access behind try/catch in `balance-storage.ts`; on failure, silently degrade to URL-only behavior (INPUT-03 still fully works). `[ASSUMED — WebView storage restrictions vary; the guard is cheap either way]`

### Pitfall 7: Client-derived `asOf` breaks determinism and hydration
**What goes wrong:** if the client island calls `new Date()` for the engine's `asOf`, the server-rendered results (server clock/UTC) can differ from the hydrated results (user's local date) around midnight or bonus boundaries — e.g., the live Amex→Hilton +30% window ending 2026-10-14 flips `effectiveCppX100` from 286 to 220.
**How to avoid:** server derives `asOf` once per request and passes it as a prop; every client recompute reuses it. Results changing across the bonus end date between visits is correct VAL-05 behavior, not a bug.

### Pitfall 8: Dataset/bundle contamination
**What goes wrong:** importing `@/db` (Drizzle + Neon driver) or heavyweight modules into the client tree bloats or breaks the bundle; conversely, importing `zod`-touching modules is fine (data barrel imports zod at runtime — acceptable, zod 4 is small, and the arrays are needed anyway).
**How to avoid:** the client island imports only `@/data`, `@/engine`, `@/lib/*`, `react-number-format`, `nuqs`. A grep check in verification: no `@/db` or `drizzle` import under `src/components/` or `src/app/page.tsx` after the placeholder removal.

### Pitfall 9: Zero-balance / empty states unhandled
**What goes wrong:** fresh visitor with no params sees an empty results area (engine returns empty arrays) — reads as broken, kills the demo.
**How to avoid:** explicit empty state when `balances` is empty (invite copy, maybe `featured` redemptions as a teaser — `RedemptionSeed.featured` exists for this); distinct state when balances exist but both tiers are empty ("enter more programs" nudge). Both are cheap; both must be designed, not defaulted.

### Pitfall 10: Hotel-currency wow framing
**What goes wrong:** Hyatt/Hilton/Marriott have `cashOutBaselineCppX100: null` → engine treats cash-out value as 0 → wow delta equals the full redemption value. Presenting that as "vs. cashing out" is misleading for currencies with no cash-out path.
**How to avoid:** card copy varies by source program: bank points get "vs. ~$X cashing out"; hotel-point-funded results get neutral framing ("pure travel value — these points have no cash-out option"). Bilt's ratified 0.1¢ stand-in gets the bank framing. See Assumptions Log A2.

## Code Examples

Covered inline in Architecture Patterns 1–6 (all sourced from Context7 `/47ng/nuqs`, Context7 `/s-yadav/react-number-format`, nextjs.org docs, and the repo's own engine/data contracts).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `searchParams` as plain object | `Promise<SearchParams>` awaited in page | Next 15 (2024) | Type signatures + `await` in page.tsx `[VERIFIED: Context7]` |
| `force-dynamic` to opt into dynamic rendering | Awaiting `searchParams` / `connection()` | Next 15/16 | Phase 4 page is dynamic implicitly `[CITED: nextjs.org useSearchParams doc]` |
| nuqs 1.x (`next-usequerystate`) | nuqs 2.x with `NuqsAdapter` + `nuqs/server` | 2024 | Adapter required in layout; server entry avoids "use client" leakage `[VERIFIED: Context7]` |
| `throttleMs` option | `limitUrlUpdates: throttle(ms)/debounce(ms)` | nuqs 2.x | Only relevant if `shallow: false` were used (it isn't here) `[VERIFIED: Context7]` |

**Deprecated/outdated:** none relevant beyond the CLAUDE.md "What NOT to Use" table (already enforced in Phases 1–3).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | URL-vs-localStorage precedence rules (share link never clobbers stored balances; editing claims ownership) | Pattern 4 | Wrong precedence = shared links overwrite a returning user's numbers, or stored balances never restore. Product-behavior call — cheap to flip, worth a one-line confirmation with Nick at plan review |
| A2 | Hotel-currency cards should use neutral "pure travel value" framing instead of "vs. cashing out" | Pitfall 10 | Copy/credibility nuance; engine math unaffected. Nick may prefer consistent framing |
| A3 | Short URL param keys (`ur`, `mr`, `c1`, `ty`, `bilt`, `hyatt`, `hilton`, `bonvoy`) | Pattern 1 | Purely cosmetic; changing later breaks previously shared links, so lock before launch |
| A4 | LinkedIn WebView may restrict localStorage (guard needed) | Pitfall 6 | If wrong, the try/catch is harmless dead code |
| A5 | Featured-redemption teaser as the empty state | Pitfall 9 | Design discretion; any explicit empty state satisfies the requirement |

## Open Questions (RESOLVED)

Both questions were ratified by the approved 04-UI-SPEC (Checker Sign-Off: PASS) and are implemented in plans 04-03/04-04.

1. **Does Phase 4 include a "Copy link" affordance?**
   - What we know: INPUT-03 only requires that the URL encodes balances; the address bar already satisfies it. Phase 5 owns OG/unfurl polish.
   - Recommendation: ship a small `navigator.clipboard.writeText(location.href)` button now (trivial, completes the share story for the demo); Phase 5 makes shared links unfurl well.
   - RESOLVED: recommendation adopted — 04-UI-SPEC Copywriting Contract specifies the "Copy my link" primary CTA (clipboard copy of the current URL, "Link copied" confirmation swap, 44px touch target, sanctioned terracotta use #2). Built in plan 04-04.
2. **How much editorial styling lands in Phase 4 vs Phase 7?**
   - What we know: PLAT-05 (design system across all pages) is Phase 7; but the wow reveal is this phase's success criterion and the tokens (Fraunces `opsz`, `text-display-xl`, cream/ink/terracotta) already exist.
   - Recommendation: Phase 4 builds real structure with existing tokens — big Fraunces hero deltas, card layout, section hierarchy — and defers imagery, animation, and fine typography to Phase 7. Don't ship gray boxes; don't chase pixel-perfection either.
   - RESOLVED: recommendation adopted — 04-UI-SPEC locks the Phase 4 scope to existing tokens (typography table, color reserved list, spacing scale) with real card/section structure; imagery, animation, and fine typography stay in Phase 7. Implemented in plans 04-03/04-04.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js + npm | install/build/test | ✓ | proven by Phase 1–3 builds | — |
| npm registry access | `npm install nuqs react-number-format` | ✓ | verified via `npm view` this session | — |
| Neon Postgres | — | n/a | — | Not used by this phase (guest flow is DB-free) |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 (environment: node) |
| Config file | `vitest.config.ts` (includes `tests/**/*.test.ts`) |
| Quick run command | `npx vitest run tests/<file>.test.ts` |
| Full suite command | `npm test` (90 tests green pre-phase) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INPUT-03 | Param codec round-trips: Balances → URL params → Balances; drops junk (negative, non-integer, unknown keys) | unit | `npx vitest run tests/balance-params.test.ts` | ❌ Wave 0 |
| INPUT-02 | Precedence fn: URL-wins / storage-hydrate / edit-claims; storage read rejects malformed JSON and hostile values | unit | `npx vitest run tests/balance-storage.test.ts` | ❌ Wave 0 |
| VAL-01 / VAL-04 | Formatters: cents→"$4,500", cppX100→"2.2¢", ISO date→"Verified Sep 1, 2026" (no Date object), heroDelta = atMax ?? atMin | unit | `npx vitest run tests/format.test.ts` | ❌ Wave 0 |
| RANK-03 / RANK-04 | `formatTransferPath` against real seed routes ("via Amex Membership Rewards → Hilton Honors 2:1"; direct case) | unit | `npx vitest run tests/path-display.test.ts` | ❌ Wave 0 |
| RANK-01 / RANK-02 / RANK-05 | Ranking math + partitions + pointsAway + bookingHint passthrough | unit (existing) | `npx vitest run tests/engine-ranking.test.ts` | ✅ (18 tests, Phase 3) |
| INPUT-01 + end-to-end flow | Formatted typing, reload persistence, share-link reproduction in a fresh browser, empty states | manual-only | human checkpoint: dev-server walkthrough + one incognito shared-URL check | — (justification: no component/e2e harness installed; the interactive surface is thin and the logic beneath it is fully unit-tested; adding jsdom + @testing-library would be new unverified deps for marginal coverage on a 2–4 week timeline) |
| build integrity | Client bundle free of `@/db`/drizzle; page compiles dynamic | build + grep | `npm run build` && grep check in verification | ✅ (build script) |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/<touched-area>.test.ts`
- **Per wave merge:** `npm test && npm run typecheck && npm run lint`
- **Phase gate:** `npm test` + `npm run build` green, plus the manual flow checkpoint, before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/balance-params.test.ts` — INPUT-03 codec
- [ ] `tests/balance-storage.test.ts` — INPUT-02 precedence/validation (pure fns; no jsdom needed if storage I/O is injected)
- [ ] `tests/format.test.ts` — VAL-01/VAL-04 display helpers
- [ ] `tests/path-display.test.ts` — RANK-03/RANK-04 helpers
- No framework install needed — node environment covers all pure-helper suites.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Guest-only phase; Clerk arrives in Phase 6 |
| V3 Session Management | no | No sessions; state is URL + localStorage |
| V4 Access Control | no | All data public-by-display (curated dataset renders on screen) |
| V5 Input Validation | yes | Three boundaries: `NumericFormat` constraints (UI), `parseAsInteger` + codec dropping (URL), validated localStorage reads — and the engine's own T-03-09 sanitization as the final backstop. Never trust stored JSON shape |
| V6 Cryptography | no | Nothing secret in this flow |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Hostile URL params (huge/negative/NaN/array-valued) | Tampering | `parseAsInteger` → codec drops non-positive/unsafe → engine sanitize (already CI-tested with five hostile-balance cases) |
| Poisoned localStorage JSON | Tampering | try/catch parse + per-field validation against `EnterableProgramSlug` keys and positive safe integers; discard wholesale on failure |
| XSS via rendered data | Tampering/Info | All strings are repo-curated seed fields rendered through JSX auto-escaping; no `dangerouslySetInnerHTML` anywhere in the phase |
| Error-detail leakage | Info disclosure | Follow T-01-07 precedent: never render caught errors; neutral fallbacks only |
| DB credential exposure in client bundle | Info disclosure | Guest flow imports no `@/db`; verification greps the client tree |

## Sources

### Primary (HIGH confidence)
- Codebase: `src/engine/types.ts`, `src/engine/index.ts`, `src/data/*` (34 verified / 3 draft counted), `src/data/programs.ts` baselines, `src/app/layout.tsx`, `src/app/page.tsx`, `globals.css` tokens, `vitest.config.ts`, `package.json`
- `.planning/phases/03-valuation-ranking-engine/03-04-SUMMARY.md` + `03-PATTERNS.md` — engine surface, A1/A2/A5 rulings, barrel collision hazard
- `.planning/research/ARCHITECTURE.md` — ratified one-page client-side execution pattern
- Context7 `/47ng/nuqs` — NuqsAdapter, createLoader/createSearchParamsCache, shared parsers, shallow/history/limitUrlUpdates options
- Context7 `/s-yadav/react-number-format` — NumericFormat props, onValueChange payload, customInput
- nextjs.org/docs/app/api-reference/functions/use-search-params (fetched 2026-09-01, doc version 16.3.4) — dynamic-route SSR availability of useSearchParams; Suspense requirement applies only to prerendered routes
- npm registry (2026-09-01): nuqs 2.10.1, react-number-format 5.4.5, motion 13.1.1; creation dates, repos, empty postinstall
- slopcheck 0.6.1 run: nuqs [OK], react-number-format [OK]

### Secondary (MEDIUM confidence)
- CLAUDE.md stack research (2026-08-31 npm snapshot) — corroborates nuqs version and short-key URL example

### Tertiary (LOW confidence)
- LinkedIn WebView localStorage restrictions — training knowledge, unverified (mitigation is a no-cost guard either way)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — both new packages verified on registry + Context7 + slopcheck; everything else already in-repo
- Architecture: HIGH — engine/data contracts read directly from source; nuqs server/client split and dynamic-SSR behavior verified against Context7 and official Next.js docs
- Pitfalls: HIGH for framework mechanics (adapter, Promise searchParams, hydration); MEDIUM for product-behavior calls (precedence, hotel framing) — flagged in Assumptions Log

**Research date:** 2026-09-01
**Valid until:** ~2026-10-01 (stable stack; one dated caveat — the live Amex→Hilton bonus window ends 2026-10-14, which any hand-checked expected values in tests/demos must account for)
