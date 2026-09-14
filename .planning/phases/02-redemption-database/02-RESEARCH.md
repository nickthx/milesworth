# Phase 2: Redemption Database - Research

**Researched:** 2026-09-01
**Domain:** Drizzle/Postgres schema design + typed-seed-file curation pipeline (points & miles transfer-route domain model)
**Confidence:** HIGH

## Summary

Phase 2 turns the Phase 1 skeleton's placeholder `health_check` table into the product's real substance: four curated tables (`programs`, `transfer_routes`, `transfer_bonuses`, `redemptions`), authored as typed TypeScript seed files validated by Zod, pushed to Neon with `drizzle-kit push`, and loaded by a single idempotent `npm run db:seed` command. Almost every technical decision is already locked by prior project research (Drizzle 0.45 + neon-http, repo-as-CMS seed pipeline, structured ratio model per PITFALLS.md); this research fills in the concrete Drizzle mechanics, resolves two document contradictions (seed file location, where transfer math lives), and flags the one hidden coupling: `src/app/page.tsx` imports and queries `healthCheck`, so dropping that table without touching the homepage breaks the build.

The three things the planner must get right: (1) the **transfer-route model** — `{numerator, denominator, incrementPoints, bonusMilesPerBlock, bonusBlockPoints}` as integers, never a float ratio, with the three named edge cases (Marriott 3:1 + 5K/60K, Amex→Hilton 1:2, Bilt 1:1) proven by unit tests over the actual seed data before the phase closes; (2) the **verification gate** — every entry carries `verifiedAt` (nullable date) + `sourceNote`, drafts seed with `verifiedAt: null`, and DATA-04 requires a human checkpoint where Nick verifies 30+ entries against live 2026 sources (Claude-drafted numbers WILL contain pre-devaluation values by construction); (3) **idempotency** — the seed script must fully rebuild curated tables from the repo in one command, including removing rows deleted from seed files, which upsert-only approaches miss.

The only new runtime dependency this phase is `zod` (4.5.4, slopcheck `[OK]`, no postinstall script). Everything else — drizzle-orm, drizzle-kit, tsx, vitest — is already installed and proven end-to-end by Phase 1.

**Primary recommendation:** Author data in `src/data/*.ts` (per project CLAUDE.md), validate with hand-written Zod schemas + cross-referential refinements, seed via `scripts/seed.ts` using delete-then-insert inside `db.batch()` (neon-http has no interactive transactions), put the pure `computePartnerPoints()` transfer math in `src/engine/transfers.ts` now so Phase 3 extends rather than duplicates it, and gate phase completion on a Nick-verification checkpoint.

## Project Constraints (from CLAUDE.md)

Actionable directives from the project CLAUDE.md files that bind this phase:

| Directive | Source | Phase 2 impact |
|-----------|--------|----------------|
| Schema in `src/db/schema.ts`; curated data as typed TS validated by Zod; seed script `scripts/seed.ts` run via tsx; `drizzle-kit push` workflow | milesworth CLAUDE.md (Data layer shape, Dev tools) | Fixes file locations — seed data authoring lives in `src/data/` (CLAUDE.md names `src/data/redemptions.ts`), not `src/db/seed/` as ARCHITECTURE.md sketched |
| "a bad transfer ratio should fail the build, not ship" — Zod validates the curated dataset in the seed script | milesworth CLAUDE.md (zod row) | Zod parse of seed data must run in tests (CI) as well as in the seed script |
| Tables: `programs`, `redemptions`, `transfer_rates` (nullable `bonus_rate` + `bonus_note`), `users`, `bookmarks` | milesworth CLAUDE.md (Data layer shape) | Superseded in detail by PITFALLS.md's richer route model (see SUMMARY.md "Contradictions Resolved" — structured ratio won). Table NAMES follow ARCHITECTURE.md (`transfer_routes`, `transfer_bonuses`); `users`/`bookmarks` are Phase 6, do NOT create them now |
| Store data (slugs, verified dates); reference images by stable `imageSlug` string, not file paths | milesworth CLAUDE.md (Image handling) | `redemptions.imageSlug` column, no paths in DB |
| Keep files under 500 lines | RuFlo CLAUDE.md | Split redemption seed data across multiple files if it grows (e.g., `redemptions-flights.ts` / `redemptions-hotels.ts`) — fine at 30 entries, plan for 120 |
| Use `/tests` for test files; ALWAYS run tests after code changes; verify build before committing | RuFlo CLAUDE.md | Vitest config already only picks up `tests/**/*.test.ts` — engine/seed tests go in `tests/`, NOT `src/engine/engine.test.ts` as ARCHITECTURE.md sketched |
| NEVER commit secrets/.env; never echo connection strings | RuFlo CLAUDE.md + Phase 1 T-01-08 pattern | Seed script output = row counts only, never `DATABASE_URL` |
| Typed interfaces for public APIs; input validation at system boundaries | RuFlo CLAUDE.md | Seed boundary is a system boundary — Zod parse before any DB write |
| No admin UI, no CMS — repo-as-CMS is the decided pattern | ARCHITECTURE.md Anti-Pattern 4, PROJECT out-of-scope | Reject any task that builds editing UI |

**Note:** No `02-CONTEXT.md` exists (discuss-phase has not run for Phase 2), so there are no additional user-locked decisions beyond the above and ROADMAP/REQUIREMENTS.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | Curated DB of 80–120 redemptions (program, partner, transfer ratio, points cost, representative cash fare, taxes/fees, verified date, booking notes) maintained as typed seed files — Phase 2 delivers the structure + ≥30 verified entries | Schema design (Pattern 1), seed-file shape (Pattern 2), coverage test strategy (Validation Architecture); 30-entry gate per PITFALLS.md Pitfall 5 |
| DATA-02 | Transfer routes modeled structurally (ratio + bonus rule + increment) handling Marriott 3:1+5K/60K, Amex→Hilton 1:2 edge cases | Integer numerator/denominator + block-bonus columns (Pattern 1); `computePartnerPoints()` pure function + hand-computed unit-test table (Code Examples); edge-case math worked out below |
| DATA-03 | Transfer bonuses as manual override entries with start/end dates, editable in seed data without schema changes | `transfer_bonuses` table with `bonusPercent`, `startDate`, `endDate`, `sourceNote` (Pattern 1); composition rule (bonus multiplies base-converted amount) documented with worked examples |
| DATA-04 | Content drafted collaboratively, verified by Nick before launch — no unverified entry ships | `verifiedAt` nullable + `sourceNote` required columns; draft-vs-verified workflow (Pattern 3); planner must include a human-verify checkpoint for the 30 entries; Claude-draft staleness warning (Pitfall 1) |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Schema definition (4 curated tables) | Database / Storage (`src/db/schema.ts`) | — | Drizzle schema is the single source of DB shape; pushed via drizzle-kit |
| Curated data authoring | Repo source files (`src/data/*.ts`) | — | Repo-as-CMS: typed TS files are the editing surface; DB is a deployment target |
| Seed validation (Zod + edge-case math) | Build/CI tier (tsx script + vitest) | — | Bad data fails before any DB write; no runtime validation needed (data is static) |
| Seed execution (idempotent rebuild) | Script tier (`scripts/seed.ts` → Neon) | Database | Only write path for curated tables; runs locally/manually, never at request time |
| Transfer math (`computePartnerPoints`) | Pure TS (`src/engine/transfers.ts`) | — | Engine tier owns all math per ARCHITECTURE.md; Phase 2 needs it for seed validation, Phase 3 extends it — one implementation, zero drift |
| Homepage DB status line | Frontend server (RSC, `src/app/page.tsx`) | Database | Currently queries `healthCheck` — MUST be updated in this phase when the table is replaced (see Runtime State Inventory) |
| Entry verification (DATA-04) | Human (Nick) | — | Cannot be automated; planner models it as a checkpoint task |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.45.2 (installed) | Schema + queries + upsert | Already wired in Phase 1; `pgTable`, `pgEnum`, composite PKs, `onConflictDoUpdate` all supported [VERIFIED: Context7 /drizzle-team/drizzle-orm-docs] |
| drizzle-kit | ^0.31.10 (installed, dev) | `drizzle-kit push` schema sync | Phase 1 established push workflow; replacing `health_check` with 4 tables is a destructive push (prompts, or `--force`) [VERIFIED: installed + Phase 1 summary] |
| @neondatabase/serverless | ^1.1.0 (installed) | HTTP driver | Already wired via lazy Proxy in `src/db/index.ts` [VERIFIED: codebase] |
| zod | 4.5.4 — **NEW install** | Seed-data validation at the boundary | Stack-locked in project CLAUDE.md; v4.5.4 current on npm (published 2026-08-29), no postinstall script [VERIFIED: npm registry + slopcheck OK] |
| tsx | ^4.23.13 (installed, dev) | Run `scripts/seed.ts` | Established by `scripts/db-check.ts` pattern [VERIFIED: codebase] |
| vitest | ^4.1.11 (installed, dev) | Edge-case + seed-validation tests | Config exists (`tests/**/*.test.ts`, node env) [VERIFIED: codebase] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-zod | 0.8.3 | Generate Zod schemas from Drizzle tables | **Optional — recommend skipping.** Peer deps now confirm zod v4 support (`^3.25.0 \|\| ^4.0.0`) [VERIFIED: npm registry], which resolves SUMMARY.md's open compatibility question — but hand-written schemas are still better here: seed validation needs cross-table refinements and business rules that generated insert-schemas don't express. STACK.md already recommended hand-written. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Delete-then-insert in `db.batch()` | Upsert-by-slug (`onConflictDoUpdate`) + prune pass | Upsert preserves rows and is gentler, but needs a second "delete where slug not in seed" pass per table to be truly idempotent; at ≤ a few hundred rows, full rebuild is simpler and provably converges. Either satisfies success criterion 4 — see Pattern 4 for the recommendation |
| neon-http driver for seed script | `drizzle-orm/neon-serverless` (WebSocket Pool) just for the script | WebSocket driver gives real interactive transactions, but adds a dependency (`ws`) and a second driver path for marginal gain; `db.batch()` covers the atomicity need [CITED: orm.drizzle.team — neon-http is for "single, non-interactive transactions"; use neon-serverless only if interactive transactions required] |
| Integer money/ratio columns | Postgres `numeric` columns | Drizzle returns `numeric` as strings by default (mode juggling); integer cents / integer numerator-denominator give exact math with zero decoding — the right call for a finance-credibility app |
| Hand-rolled seed data | drizzle-seed package (0.3.1) | **Do not use** — drizzle-seed generates deterministic FAKE data; this phase is about real curated data. Its name will tempt task authors; it is the wrong tool |

**Installation:**
```bash
npm install zod
```

**Version verification:** `npm view zod version` → 4.5.4 (2026-08-29) [VERIFIED: npm registry, 2026-09-01]. All other packages already in package.json at locked versions.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| zod | npm | ~6 yrs (v4 line current, 4.5.4 published 2026-08-29) | tens of M/wk | github.com/colinhacks/zod | [OK] | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

`slopcheck install zod` ran successfully (verdict `[OK]`, 1/1 scanned; the tool's subsequent attempt to spawn `npm install` failed on Windows — no install occurred, which is fine since the planner's task does the install). `npm view zod scripts.postinstall` → empty (no install-time script). drizzle-zod and drizzle-seed were registry-checked but are NOT recommended for install (see above).

## Architecture Patterns

### System Architecture Diagram

```
  AUTHORING (repo)                 VALIDATION                     DATABASE (Neon)
┌──────────────────────┐   ┌──────────────────────────┐   ┌───────────────────────────┐
│ src/data/            │   │ scripts/seed.ts (tsx)    │   │ programs                  │
│  programs.ts         │──▶│  1. import seed modules  │──▶│ transfer_routes  (FK→prog)│
│  transfers.ts        │   │  2. Zod parse + cross-   │   │ transfer_bonuses (FK→route│
│  redemptions*.ts     │   │     ref refinements      │   │                    pair)  │
│  types.ts (TS types) │   │     — FAIL FAST, no DB   │   │ redemptions      (FK→prog)│
└──────────┬───────────┘   │     write on any error   │   └──────────▲────────────────┘
           │               │  3. db.batch([delete     │              │ drizzle-kit push
           │ same data     │     children→parents,    │   ┌──────────┴────────────────┐
           ▼               │     insert parents→      │   │ src/db/schema.ts          │
┌──────────────────────┐   │     children])           │   │ (4 pgTables + pgEnums)    │
│ tests/ (vitest, CI)  │   │  4. print row counts     │   └───────────────────────────┘
│  transfers.test.ts   │   │     (never conn string)  │
│  seed-data.test.ts   │   └──────────────────────────┘   ┌───────────────────────────┐
│  — parse real seed   │                                  │ src/app/page.tsx (RSC)    │
│  — edge-case math    │   src/engine/transfers.ts        │ status line — MUST switch │
│  — coverage: 8 progs,│   computePartnerPoints()         │ from healthCheck query to │
│    ≥30 verified      │   (pure, used by tests+seed      │ a curated-table query     │
└──────────────────────┘    validation; Phase 3 extends)  └───────────────────────────┘
```

Data flows one way: repo files → validation → Neon. Nothing writes curated tables at runtime; the app (Phase 3+) only reads.

### Recommended Project Structure

```
src/
├── data/                    # AUTHORING LAYER (per project CLAUDE.md — resolves ARCHITECTURE.md's db/seed/ sketch)
│   ├── types.ts             # Seed-source TS types + Zod schemas (ProgramSeed, TransferRouteSeed, ...)
│   ├── programs.ts          # 8 enterable programs + partner programs (satisfies ProgramSeed[])
│   ├── transfers.ts         # transfer routes (structural) + transfer bonuses (dated manual rows)
│   └── redemptions.ts       # the curated entries (split into multiple files when >~400 lines)
├── db/
│   ├── schema.ts            # REPLACE health_check with the 4 real tables
│   └── index.ts             # unchanged (lazy neon-http client)
├── engine/
│   └── transfers.ts         # computePartnerPoints() — pure, no imports from db/ or app/
scripts/
└── seed.ts                  # idempotent rebuild; npm run db:seed
tests/
├── transfers.test.ts        # DATA-02 edge cases (hand-computed expected values)
└── seed-data.test.ts        # Zod parse of real seed files + coverage assertions (no DB needed)
```

### Pattern 1: Structured Transfer-Route Schema (integers only)

**What:** Every quantity is an integer with an explicit unit — no floats, no Postgres `numeric`. Ratio = `ratioNumerator` partner units per `ratioDenominator` source points. Structural bonus (Marriott) = `bonusMilesPerBlock` per `bonusBlockPoints` transferred. Promotional bonuses live in a separate dated table.
**When to use:** Locked decision (SUMMARY.md contradiction resolution sided with PITFALLS.md's model).

```typescript
// src/db/schema.ts — Source: drizzle-orm 0.45 pg-core API [VERIFIED: Context7]
import { pgTable, pgEnum, text, integer, boolean, date, serial, primaryKey, foreignKey } from "drizzle-orm/pg-core";

export const programKind = pgEnum("program_kind", ["bank", "airline", "hotel"]);
export const availabilityRating = pgEnum("availability_rating", ["wide_open", "plan_ahead", "hard_to_find"]);
export const redemptionCategory = pgEnum("redemption_category", ["flight", "hotel", "other"]);

export const programs = pgTable("programs", {
  slug: text("slug").primaryKey(),                        // natural key: "chase-ur", "world-of-hyatt", "ana-mileage-club"
  name: text("name").notNull(),
  kind: programKind("kind").notNull(),
  isUserEnterable: boolean("is_user_enterable").notNull().default(false),  // true for exactly the 8
  cashOutBaselineCppX100: integer("cash_out_baseline_cpp_x100"),           // 100 = 1.0¢/pt; null for partner-only programs
});

export const transferRoutes = pgTable("transfer_routes", {
  fromProgramSlug: text("from_program_slug").notNull().references(() => programs.slug),
  toProgramSlug: text("to_program_slug").notNull().references(() => programs.slug),
  ratioNumerator: integer("ratio_numerator").notNull(),    // partner units gained
  ratioDenominator: integer("ratio_denominator").notNull(),// per source points spent (Marriott→air: 1/3; MR→Hilton: 2/1; Bilt→air: 1/1)
  incrementPoints: integer("increment_points").notNull(),  // transfer block size in source points
  bonusMilesPerBlock: integer("bonus_miles_per_block"),    // Marriott: 5000; null elsewhere
  bonusBlockPoints: integer("bonus_block_points"),         // Marriott: 60000; null elsewhere
  transferTimeDays: integer("transfer_time_days"),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
}, (t) => [primaryKey({ columns: [t.fromProgramSlug, t.toProgramSlug] })]);

export const transferBonuses = pgTable("transfer_bonuses", {
  id: serial("id").primaryKey(),
  fromProgramSlug: text("from_program_slug").notNull(),
  toProgramSlug: text("to_program_slug").notNull(),
  bonusPercent: integer("bonus_percent").notNull(),        // 30 = +30% on the base-converted amount
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  sourceNote: text("source_note").notNull(),               // where Nick saw it (DATA-03)
}, (t) => [foreignKey({ columns: [t.fromProgramSlug, t.toProgramSlug],
                        foreignColumns: [transferRoutes.fromProgramSlug, transferRoutes.toProgramSlug] })]);

export const redemptions = pgTable("redemptions", {
  slug: text("slug").primaryKey(),                         // "ana-business-tokyo-via-virgin"
  partnerProgramSlug: text("partner_program_slug").notNull().references(() => programs.slug),
  title: text("title").notNull(),
  category: redemptionCategory("category").notNull(),
  origin: text("origin"), destination: text("destination"), cabin: text("cabin"),
  pointsMin: integer("points_min").notNull(),              // range framing per Pitfall 1
  pointsMax: integer("points_max"),                        // null = fixed-price program/chart
  taxesFeesCents: integer("taxes_fees_cents").notNull(),   // money = integer cents, always
  cashFareCents: integer("cash_fare_cents").notNull(),     // representative realistic fare (methodology: Phase 3 sign-off)
  availabilityRating: availabilityRating("availability_rating").notNull(),
  bookingHint: text("booking_hint").notNull(),             // 2–4 lines, RANK-05 consumes this
  methodologyNote: text("methodology_note"),
  sourceNote: text("source_note").notNull(),               // Pitfall 1: non-negotiable
  verifiedAt: date("verified_at"),                         // NULL = draft, not shippable (DATA-04)
  imageSlug: text("image_slug"),                           // stable string, mapped to imports later (CLAUDE.md)
  featured: boolean("featured").notNull().default(false),
  notes: text("notes"),                                    // v2 RAG corpus prose
});
```

**Anti-Patterns to Avoid:**
- **Float `ratio` column:** fails Marriott and composes wrong with bonuses — the exact expert-checkable error class (PITFALLS Pitfall 2)
- **Storing cpp or wow-delta:** derived values are always computed by the engine, never persisted (ARCHITECTURE Anti-Pattern 5)
- **Creating `users`/`bookmarks` tables now:** Phase 6 owns them; adding them early is scope creep with zero payoff
- **Availability-search fields** (dates, fare classes, inventory): different product, explicitly out of scope (ARCHITECTURE Anti-Pattern 1)
- **"bookable" as an enum value or copy string:** use the honest availability tiers above (PITFALLS Pitfall 3)

### Pattern 2: Typed Seed Files with Zod + Cross-Referential Refinement

**What:** Seed source arrays use `satisfies XSeed[]` for compile-time safety; a Zod parse at seed/test time adds runtime rules TypeScript can't express (positive integers, date ordering, slug cross-references, coverage rules).

```typescript
// src/data/types.ts — hand-written Zod (STACK.md decision; drizzle-zod unnecessary)
import { z } from "zod";

export const programSeedSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  kind: z.enum(["bank", "airline", "hotel"]),
  isUserEnterable: z.boolean(),
  cashOutBaselineCppX100: z.number().int().positive().nullable(),
});

export const transferRouteSeedSchema = z.object({
  fromProgramSlug: z.string(),
  toProgramSlug: z.string(),
  ratioNumerator: z.number().int().positive(),
  ratioDenominator: z.number().int().positive(),
  incrementPoints: z.number().int().positive(),
  bonusMilesPerBlock: z.number().int().positive().nullable(),
  bonusBlockPoints: z.number().int().positive().nullable(),
  transferTimeDays: z.number().int().min(0).nullable(),
  active: z.boolean(),
  notes: z.string().nullable(),
}).refine((r) => (r.bonusMilesPerBlock === null) === (r.bonusBlockPoints === null),
  { message: "bonus fields must be set together" });

// Dataset-level validation: cross-references + coverage (run in seed script AND tests)
export function validateDataset(d: { programs: ProgramSeed[]; routes: TransferRouteSeed[];
                                     bonuses: TransferBonusSeed[]; redemptions: RedemptionSeed[] }) {
  const slugs = new Set(d.programs.map((p) => p.slug));
  for (const r of d.routes) {
    if (!slugs.has(r.fromProgramSlug) || !slugs.has(r.toProgramSlug))
      throw new Error(`route references unknown program: ${r.fromProgramSlug}→${r.toProgramSlug}`);
  }
  for (const rd of d.redemptions)
    if (!slugs.has(rd.partnerProgramSlug))
      throw new Error(`redemption ${rd.slug} references unknown program`);
  // DATA-04 / success criterion 3: every enterable program reachable by ≥1 VERIFIED redemption
  // (direct for hotel currencies, or via an active route for bank currencies)
}
```

### Pattern 3: Draft-vs-Verified Workflow (DATA-04)

**What:** Claude drafts entries directly into seed files with `verifiedAt: null` and a `sourceNote` naming what must be checked. Nick verifies against live 2026 sources, corrects numbers, sets `verifiedAt: "2026-09-XX"`. Everything seeds to the DB (drafts included — visible in drizzle studio, versioned in git), but downstream dataset queries (Phase 3/4) filter `verifiedAt IS NOT NULL`. The phase-completion test asserts ≥30 verified entries covering all 8 programs.
**Why this shape:** Keeps one editing surface, makes verification a diffable git event, and makes "no unverified entry ships" enforceable by a WHERE clause plus a test — not by discipline.
**Planner note:** Nick's verification is a `checkpoint:human-verify` task; it is the phase's schedule long pole (PITFALLS Pitfall 5: this is 15–40 hrs of unparallelizable domain work across the milestone — the 30-entry tranche is the first slice). Claude-drafted award prices will be stale by construction (training lag vs 2026 devaluations: Marriott +5–10%, Hyatt, Aeroplan +20–67%, Bilt 2.0 relaunch) — drafts are scaffolding for Nick, never facts.

### Pattern 4: Idempotent One-Command Seed (success criterion 4)

**What:** `npm run db:seed` → `tsx scripts/seed.ts`: validate everything, then rebuild curated tables with delete-then-insert in FK-safe order inside a single `db.batch()` call.
**Why delete-then-insert over upsert:** upsert-by-slug alone is NOT idempotent for removals (a redemption deleted from the seed file survives in the DB). Full rebuild converges to exactly the repo state every run. At ≤ ~300 rows this costs milliseconds.
**Driver constraint [CITED: orm.drizzle.team/docs — Neon connection page]:** the neon-http driver does not support interactive transactions (`db.transaction(async tx => ...)`) — it is "for single, non-interactive transactions." It DOES support `db.batch([...])`, which sends all statements in one request [VERIFIED: Context7, batch API added v0.29.4, `db.execute` in batch since v0.30.3]. Recommend `db.batch()` for the rebuild; if batch atomicity proves awkward in practice, sequential awaits are an acceptable fallback because the script converges on re-run (idempotent by construction) and curated tables have no runtime writers to race.

```typescript
// scripts/seed.ts — sketch (follow scripts/db-check.ts conventions: guarded loadEnvFile, no secrets in output)
try { process.loadEnvFile(".env.development.local"); } catch { /* env already set */ }

async function main() {
  const { programs: programData, routes, bonuses, redemptions: redemptionData } = await import("../src/data");
  validateDataset({ programs: programData, routes, bonuses, redemptions: redemptionData }); // throws before any write
  const { db, programs, transferRoutes, transferBonuses, redemptions } = await import("../src/db");

  await db.batch([
    db.delete(transferBonuses),          // children first
    db.delete(redemptions),
    db.delete(transferRoutes),
    db.delete(programs),                 // parents last
    db.insert(programs).values(programData),          // parents first
    db.insert(transferRoutes).values(routes),
    db.insert(transferBonuses).values(bonuses),
    db.insert(redemptions).values(redemptionData),
  ]);
  console.log(`seeded: ${programData.length} programs, ${routes.length} routes, ` +
              `${bonuses.length} bonuses, ${redemptionData.length} redemptions ` +
              `(${redemptionData.filter((r) => r.verifiedAt).length} verified)`);
}
main().catch((e) => { console.error("seed failed:", e instanceof Error ? e.message : String(e)); process.exit(1); });
```

Add npm scripts: `"db:push": "drizzle-kit push"`, `"db:seed": "tsx scripts/seed.ts"`.

### Pattern 5: Transfer Math as a Pure Engine Function (shared with Phase 3)

**What:** Success criterion 2 requires edge cases to "compute correctly in seed validation" — which needs a compute function. Rather than writing throwaway math in a test and re-implementing it in Phase 3's engine, put `computePartnerPoints()` in `src/engine/transfers.ts` now. It is pure TS (imports nothing from db/app — the engine boundary holds), Phase 2's tests exercise it against real seed rows, and Phase 3 builds path-resolution on top of it.
**Planner discretion:** if keeping Phase 2 strictly data-only is preferred, the same function can live in `src/data/` and move in Phase 3 — but the engine location avoids the move and any drift.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Runtime data validation | Custom validators/assert chains | zod 4.5.x | Locked stack; error aggregation, typed inference, refinements |
| Schema migration SQL | Hand-written DDL | drizzle-kit push | Established Phase 1 workflow; push diffs schema.ts against live DB |
| DB browsing during curation | Any admin/view UI | `npx drizzle-kit studio` | Zero-build local DB browser; the repo is the editing surface |
| Env loading in scripts | dotenv dependency | `process.loadEnvFile()` (Node 22+) | Phase 1 established pattern; Node 24.11 present |
| Decimal/money arithmetic | Float dollars, `numeric` parsing | Integer cents / integer x100 conventions | Exact math, no string decoding, no float drift — finance credibility |
| Fake seed data | — | (nothing) — do NOT reach for drizzle-seed | This phase seeds REAL curated data; drizzle-seed generates fakes |

**Key insight:** everything infrastructural in this phase already exists and is proven (driver, push workflow, script conventions, test runner). The genuinely new work is domain modeling + data curation — spend the phase's complexity budget on getting the route model and the 30 entries right, not on pipeline machinery.

## Runtime State Inventory

This phase replaces the live schema, so a state audit applies:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Neon DB: `health_check` table with ~2+ rows (Phase 1 round-trip proofs). Preview-branch DBs (Neon auto-branches per Vercel preview) also carry it | `drizzle-kit push` will propose dropping `health_check` + creating 4 tables — a **destructive push** (interactive prompt; `--force` for non-interactive). Data loss is intended and harmless. Preview branches re-sync from main's schema on next branch creation — no action |
| Live service config | Vercel project (auto-deploy from main), Neon Marketplace integration | None — no schema-name coupling in either |
| Code coupling | `src/app/page.tsx` is `force-dynamic` and queries `db.select().from(healthCheck)`; `src/db/index.ts` re-exports schema; `scripts/db-check.ts` inserts into healthCheck | **MUST update in this phase or the build breaks** (schema.ts drops the `healthCheck` export). Recommend: homepage status line becomes a curated-table query (e.g., `SELECT count(*) FROM redemptions WHERE verified_at IS NOT NULL` → "N verified redemptions live") — a better proof-of-life than health_check; `scripts/db-check.ts` gets retired or repointed. Alternative (minimal churn): keep the `health_check` table alongside the new tables and defer cleanup — decide at plan time |
| Secrets/env vars | `DATABASE_URL` via Neon Marketplace + `.env.development.local` (present) | None — unchanged |
| Build artifacts | None (no compiled artifacts carry table names) | None — verified: only src/, scripts/, tests/ reference schema |

## Common Pitfalls

### Pitfall 1: Claude-drafted entries confidently contain stale numbers
**What goes wrong:** Award prices/ratios drafted from training data predate 2026 devaluations (Marriott +5–10%, Hyatt worst-ever, Aeroplan June 2026 +20–67%, Bilt 2.0/Cardless relaunch with new partners) [CITED: .planning/research/PITFALLS.md with 2026 sources].
**Why it happens:** LLM training lag; drafts state pre-devaluation numbers with full confidence.
**How to avoid:** Drafts always seed with `verifiedAt: null` + a `sourceNote` naming what to check. Nick's pass is a verification gate against live sources, not a copyedit. Dynamic-priced programs (Delta/United/Marriott/Hilton) use `pointsMin`/`pointsMax` ranges, never a single number.
**Warning signs:** any entry marked verified without a 2026 source in `sourceNote`; Bilt entries listing pre-2026 partners; single-point prices for dynamic programs.

### Pitfall 2: Simple-multiplier transfer math survives testing, fails in public
**What goes wrong:** `balance × ratio` is right for ~80% of routes and wrong for exactly the famous ones (Marriott 5K/60K, MR→Hilton 1:2).
**How to avoid:** the structured route model (Pattern 1) + the hand-computed test table (Code Examples) run against the ACTUAL seed rows, not fixtures — so a data-entry typo in the Marriott row fails CI.
**Warning signs:** ratio stored as one number anywhere; tests using synthetic routes instead of real seed data.

### Pitfall 3: "Idempotent" seed that isn't
**What goes wrong:** upsert-only seeding leaves deleted entries in the DB; partial failures leave FK-orphaned halves.
**How to avoid:** full rebuild in dependency order inside `db.batch()`; validation throws before the first write; rerunning always converges (Pattern 4).
**Warning signs:** seed script with inserts but no deletion/prune strategy; `db.transaction()` on the neon-http driver (throws — not supported).

### Pitfall 4: Schema drops `healthCheck` and breaks the homepage/build
**What goes wrong:** `page.tsx` imports `healthCheck`; replacing schema.ts without touching the homepage fails typecheck/build, or silently degrades the deployed proof-of-life line.
**How to avoid:** plan an explicit task that migrates the homepage status query in the same plan that changes schema.ts (see Runtime State Inventory).

### Pitfall 5: Encoding valuation methodology into Phase 2 data prematurely
**What goes wrong:** `cashFareCents` values silently encode a numerator convention (retail-F vs realistic fare) and `cashOutBaselineCppX100` values encode cash-out assumptions — both are Nick's explicit Phase 3 methodology decisions (SUMMARY.md research flag).
**How to avoid:** Phase 2 creates the COLUMNS and seeds provisional values with `methodologyNote`/`sourceNote` marking the convention used ("discounted-business fare, Google Flights 2026-09-XX"); the convention decision gets made before mass drafting (it's needed for the first 30 anyway) — surface this to Nick at the verification checkpoint, and record the chosen convention so Phase 3's methodology page matches the data.

### Pitfall 6: drizzle-kit push prompts hang automation
**What goes wrong:** dropping `health_check` triggers push's interactive data-loss confirmation; an agent-run push stalls or aborts.
**How to avoid:** run push with `--force` for this known-destructive change (or run interactively at a checkpoint). Subsequent pushes in the phase (column tweaks) are additive and prompt-free.

## Code Examples

### Edge-case math table (DATA-02 / success criterion 2) — hand-computed expected values

```typescript
// src/engine/transfers.ts — pure function, no db/app imports
export function computePartnerPoints(route: TransferRouteSeed, sourcePoints: number): number {
  const transferable = Math.floor(sourcePoints / route.incrementPoints) * route.incrementPoints;
  const base = Math.floor((transferable * route.ratioNumerator) / route.ratioDenominator);
  const bonus = route.bonusBlockPoints && route.bonusMilesPerBlock
    ? Math.floor(transferable / route.bonusBlockPoints) * route.bonusMilesPerBlock
    : 0;
  return base + bonus;
}

// Promotional bonus composition (DATA-03): applies to the base-converted amount, NOT the source points
// 30% on MR→Virgin (1:1) → 1.3/MR;  30% on MR→Hilton (2:1) → 2.6/MR  [PITFALLS.md rule]
export function applyPromoBonus(basePartnerPoints: number, bonusPercent: number): number {
  return Math.floor(basePartnerPoints * (100 + bonusPercent) / 100);
}
```

```typescript
// tests/transfers.test.ts — expected values, hand-computed:
// Marriott→airline: num=1, den=3, increment=3000 [ASSUMED — Nick verifies increment], bonus 5000/60000
//   120,000 Bonvoy → base 40,000 + 2 blocks × 5,000 = 50,000 miles      (the famous check)
//    60,000 Bonvoy → base 20,000 + 1 × 5,000        = 25,000 miles
//    59,000 Bonvoy → transferable 57,000 (3K increment) → base 19,000, no bonus = 19,000
// Amex MR→Hilton: num=2, den=1, increment=1000 [ASSUMED]
//    60,000 MR     → 120,000 Hilton
// Bilt→airline 1:1: num=1, den=1, increment=1000 [ASSUMED]
//    25,000 Bilt   → 25,000 miles
// Promo composition: 30% on MR→Hilton: applyPromoBonus(computePartnerPoints(mrToHilton, 10_000), 30) = 26,000
```

Note: the 59K Marriott expectation depends on the increment assumption (PITFALLS.md sketches ~19.6K assuming no increment). **Lock exact expected values with Nick at plan/verify time** — the test's job is to freeze whatever rule Nick confirms.

### Seed data shape (authoring ergonomics)

```typescript
// src/data/programs.ts
export const programs = [
  { slug: "chase-ur",        name: "Chase Ultimate Rewards", kind: "bank",  isUserEnterable: true,  cashOutBaselineCppX100: 100 },
  { slug: "amex-mr",         name: "Amex Membership Rewards", kind: "bank", isUserEnterable: true,  cashOutBaselineCppX100: 60 },  // [ASSUMED] baselines — Nick methodology sign-off
  { slug: "world-of-hyatt",  name: "World of Hyatt",          kind: "hotel", isUserEnterable: true, cashOutBaselineCppX100: null },
  { slug: "ana-mileage-club", name: "ANA Mileage Club",       kind: "airline", isUserEnterable: false, cashOutBaselineCppX100: null },
  // ... 8 enterable total (Chase UR, Amex MR, Capital One, Citi TY, Bilt, Hyatt, Hilton, Marriott) + partner programs
] satisfies ProgramSeed[];
```

### Coverage test (success criterion 3)

```typescript
// tests/seed-data.test.ts — pure data test, no DB connection
it("has ≥30 verified entries covering all 8 enterable programs", () => {
  const verified = redemptions.filter((r) => r.verifiedAt !== null);
  expect(verified.length).toBeGreaterThanOrEqual(30);
  for (const p of programs.filter((p) => p.isUserEnterable)) {
    const reachable = verified.some((r) =>
      r.partnerProgramSlug === p.slug ||                                   // direct-use (Hyatt/Hilton/Marriott)
      routes.some((rt) => rt.fromProgramSlug === p.slug && rt.active &&
                          rt.toProgramSlug === r.partnerProgramSlug));     // via transfer
    expect(reachable, `${p.slug} has no verified redemption`).toBe(true);
  }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| drizzle-zod incompatible with zod v4 (open question in SUMMARY.md) | drizzle-zod 0.8.3 peers `^3.25.0 \|\| ^4.0.0` | verified 2026-09-01 | Compatibility no longer blocks it — but hand-written schemas remain the recommendation for refinement power |
| dotenv for script env | `process.loadEnvFile()` built-in | Node 20.12+/21.7+ | Already the Phase 1 pattern; keep it |
| Prisma-style migration files from day one | `drizzle-kit push` while schema iterates; switch to `generate` pre-launch | project decision (STACK.md) | Phase 2 stays on push; generated migrations are a Phase 7-adjacent hardening task, not now |
| Bilt "the 1:1 program" | Bilt 2.0 (Cardless era, 2026): mostly 1:1 with exceptions (Accor 3:2, I Prefer 1:2) | Feb 2026 | Bilt seed rows must reflect the 2026 partner list [CITED: PITFALLS.md 2026 sources] |

**Deprecated/outdated:** nothing in this phase's toolchain; all packages current per Phase 1 install (2026-09-01).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Marriott transfers in 3,000-point increments with 5K bonus miles per 60K transferred, ratio 3:1 | Code Examples | Test expected-values wrong; Nick locks exact rule at verification checkpoint (structural columns handle any variant) |
| A2 | Transfer increments for bank programs ≈1,000 points (Amex/Chase/Citi/Bilt); Capital One possibly smaller | Code Examples | Cosmetic ("X points away" precision); Nick verifies per route |
| A3 | Per-program cash-out baselines (Chase 1.0¢, Amex 0.6¢, Capital One 0.5¢, Citi 1.0¢, Bilt ~0, hotels n/a) | Seed data shape | These encode methodology — explicitly provisional until Nick's Phase 3 sign-off; column supports any values |
| A4 | Promotional transfer bonuses multiply the base-converted amount and do not stack with Marriott's structural block bonus | Code Examples | Composition bug on a rare combination; rule is documented in seed types so Nick can veto; also flagged as Open Question 2 |
| A5 | 2026 partner lists for the 8 programs (which airlines/hotels each reaches) | Seed drafting | Wrong routes in drafts — caught by the DATA-04 verification gate by design; drafts never ship |
| A6 | `db.batch()` on neon-http executes as a single atomic unit | Pattern 4 | Partial seed on mid-batch failure — mitigated because re-running converges; fallback to sequential awaits documented |

## Open Questions (RESOLVED)

1. **Homepage status line replacement** — swap the `healthCheck` query for a verified-redemptions count (recommended: better proof-of-life, retires the placeholder) or keep `health_check` alongside the new tables (minimal churn)?
   - What we know: something MUST change in `page.tsx` or the build breaks.
   - Recommendation: planner picks the count-query option unless keeping Phase 2 diff minimal matters more.
   - RESOLVED: count-query option adopted — 02-01 Task 1 replaces the `healthCheck` query with a verified-redemptions count.
2. **Promo-bonus × structural-bonus stacking** — if a promotional bonus ever appeared on a route that also has a block bonus, which does it apply to?
   - What we know: no such route is known to exist today (Marriott outbound promos are rare/nonexistent).
   - Recommendation: implement A4's rule, document it in `src/data/types.ts`, ask Nick at the checkpoint; do not build configurability for a hypothetical.
   - RESOLVED: A4 rule implemented and documented in `src/data/types.ts` (02-03), routed to Nick's verification checkpoint (02-05); no configurability built for the hypothetical.
3. **Exact 59K-Marriott expected value** (increment-dependent, see A1) — lock with Nick before the test is written, or write the test from whatever rule Nick states and treat that as the frozen spec.
   - RESOLVED: frozen-spec approach — A1's rule is encoded in the tests (02-03 Task 1) and updatable at the 02-05 verification checkpoint if Nick states a different rule.
4. **Where the first 30 entries concentrate** — coverage rule says every program × common balance band should match something (PITFALLS: each of 8 programs ≥2 matches at a 60K balance is the later "looks done" bar). Entry selection is Nick's call during the collaboration; the coverage test enforces the floor (≥30 verified, all 8 reachable).
   - RESOLVED: routed to Nick's checkpoint as planned — entry concentration stays Nick's call; the coverage floor (≥30 verified, all 8 programs reachable) is CI-enforced (02-04, activated in 02-05).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | tsx scripts, loadEnvFile | ✓ | 24.11.0 | — |
| npm | zod install, scripts | ✓ | bundled | — |
| tsx | scripts/seed.ts | ✓ | 4.23.13 | — |
| drizzle-kit | schema push | ✓ | 0.31.10 | — |
| vitest | edge-case/coverage tests | ✓ | 4.1.11 (config present) | — |
| DATABASE_URL (local) | push + seed against Neon | ✓ | `.env.development.local` present | `vercel env pull` re-fetches |
| Neon reachability | push + seed | ✓ (proven by Phase 1 round trip 2026-09-01) | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none. The only install action is `npm install zod`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 |
| Config file | `vitest.config.ts` (env: node, include: `tests/**/*.test.ts`) |
| Quick run command | `npx vitest run tests/transfers.test.ts` |
| Full suite command | `npm test` (vitest run) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Seed files parse (Zod) and carry all required fields; DB rebuild loads them | unit + script | `npx vitest run tests/seed-data.test.ts`; `npm run db:seed` exits 0 with row counts | ❌ Wave 0 |
| DATA-02 | Edge-case transfer math correct (Marriott 120K/60K/59K, MR→Hilton, Bilt, promo composition) against real seed rows | unit | `npx vitest run tests/transfers.test.ts` | ❌ Wave 0 |
| DATA-03 | Bonus rows validate (dates ordered, route exists, percent sane); adding one is a data-only edit | unit | `npx vitest run tests/seed-data.test.ts` | ❌ Wave 0 |
| DATA-04 | ≥30 entries with non-null `verifiedAt` covering all 8 enterable programs | unit (coverage assertion) + **manual-only gate** (Nick verifies content truth — cannot be automated) | `npx vitest run tests/seed-data.test.ts` + checkpoint:human-verify | ❌ Wave 0 |
| SC-4 | Idempotency: seeding twice yields identical row counts/content | script check | run `npm run db:seed` twice; second run exits 0, counts identical | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/transfers.test.ts tests/seed-data.test.ts`
- **Per wave merge:** `npm test && npm run typecheck && npm run build`
- **Phase gate:** full suite green + `npm run db:seed` idempotency check + Nick verification checkpoint complete before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/transfers.test.ts` — covers DATA-02 (edge-case table)
- [ ] `tests/seed-data.test.ts` — covers DATA-01/03/04 automated portions (Zod parse of real seed files, cross-refs, coverage floor)
- [ ] Framework install: none needed (vitest configured; existing `tests/smoke.test.ts` proves the harness)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth in this phase (Phase 6) |
| V3 Session Management | no | — |
| V4 Access Control | no | Curated tables have no runtime write path; the only writer is the local seed script with DATABASE_URL |
| V5 Input Validation | yes | Zod at the seed boundary (the phase's only data ingress); all values from repo-controlled files, no user input |
| V6 Cryptography | no | — |
| Secrets handling | yes | Established T-01-08 pattern: never echo `DATABASE_URL`; seed script prints row counts only; `.env.development.local` stays untracked |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection | Tampering | Drizzle parameterized query builder throughout; no raw SQL string interpolation in seed script |
| Connection string leakage in logs/CI | Information disclosure | Error handlers print `err.message` class only (Phase 1 convention); CI has no DATABASE_URL (tests are DB-free) |
| Supply chain (new package) | Tampering | zod verified: registry age, no postinstall, slopcheck [OK] |

## Sources

### Primary (HIGH confidence)
- Context7 `/drizzle-team/drizzle-orm-docs` — upsert `onConflictDoUpdate` (composite targets), Neon HTTP batch API (v0.29.4+, raw execute v0.30.3+), neon-http vs neon-serverless transaction guidance
- npm registry (2026-09-01) — zod 4.5.4 (published 2026-08-29, no postinstall), drizzle-zod 0.8.3 peer deps, drizzle-seed 0.3.1
- Codebase [VERIFIED by read]: `src/db/schema.ts`, `src/db/index.ts`, `drizzle.config.ts`, `scripts/db-check.ts`, `src/app/page.tsx` coupling, `vitest.config.ts`, `package.json`
- `.planning/research/ARCHITECTURE.md` — schema sketch, repo-as-CMS pattern, anti-patterns
- `.planning/research/PITFALLS.md` — transfer-math edge cases with 2026-cited domain sources (Marriott 5K/60K, Amex→Hilton 1:2, Bilt 2.0 partners, devaluation timeline)
- `.planning/research/SUMMARY.md` — contradiction resolutions (structured ratio model, seed-file decisions)
- `.planning/phases/01-foundation/01-05-SUMMARY.md` — established DB patterns, lazy client, push workflow, T-01-08

### Secondary (MEDIUM confidence)
- Neon/Drizzle guidance that HTTP batch executes non-interactively in one request; atomicity treated as probable but with a documented convergent-rerun fallback (A6)

### Tertiary (LOW confidence)
- Training-data domain facts on transfer increments and partner lists — all tagged [ASSUMED], all gated behind Nick's DATA-04 verification by design

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — one new package, verified three ways; everything else installed and proven
- Architecture: HIGH — schema model prescribed by prior HIGH-confidence project research; Drizzle mechanics verified via Context7
- Pitfalls: HIGH — domain pitfalls carry 2026 citations from PITFALLS.md; the schema-coupling pitfall verified directly in the codebase
- Domain data values (ratios/increments/baselines): LOW by design — the phase's own verification gate (DATA-04) exists precisely because these must be human-verified against live sources

**Research date:** 2026-09-01
**Valid until:** ~2026-10-01 for tooling claims (stable stack); domain data claims are only ever as valid as their `verifiedAt` stamps
