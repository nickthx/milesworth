# Architecture Research

**Domain:** Curated-data recommendation app (points & miles redemption visualizer) — Next.js App Router + Postgres + optional Clerk auth on Vercel
**Researched:** 2026-08-31
**Confidence:** HIGH (well-trodden architecture class; the domain-specific parts — transfer-path math, cpp valuation — are deterministic and small)

## How Systems Like This Are Typically Structured

Milesworth belongs to a recognizable architecture class: **small curated dataset + deterministic compute engine + read-heavy public frontend + optional persistence**. Close cousins: mortgage/loan comparison calculators, award-travel tools (AwardHacker, older FlyerTalk-era tools), "which card should I get" quizzes, tax estimators, The Points Guy's valuations pages. The defining traits:

1. **The data is the product.** ~80–120 hand-curated rows, updated by a human, versioned like code. There is no user-generated content and no live external data in v1.
2. **The "engine" is a pure function.** `(balances, dataset) → ranked results`. No I/O, no state, fully unit-testable. Systems in this class that put ranking logic in SQL or scatter it across components consistently regret it.
3. **Anonymous-first, persistence-optional.** The core loop never touches the database for user state. Auth bolts on at the edge, late, without restructuring anything.

This class of app is deliberately boring architecturally — the value is in data quality and presentation, not infrastructure. That is the correct posture for a 2–4 week portfolio deadline.

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────────┐
│  CLIENT (browser)                                                   │
│  ┌──────────────┐   ┌───────────────────┐   ┌──────────────────┐   │
│  │ Balance Entry│──▶│ URL params +      │──▶│ Results UI       │   │
│  │ (8 programs) │   │ localStorage      │   │ (ranked cards,   │   │
│  └──────────────┘   │ (source of truth  │   │  dual valuation) │   │
│                     │  for anon users)  │   └────────┬─────────┘   │
│                     └───────────────────┘            │ save/       │
│         ┌────────────────────────────────┐           │ bookmark    │
│         │ ENGINE (pure TS module,        │           │ (opt-in)    │
│         │ isomorphic — runs client-side  │           │             │
│         │ in v1, server-callable for v2) │           │             │
│         └───────────▲────────────────────┘           │             │
├─────────────────────┼────────────────────────────────┼─────────────┤
│  NEXT.JS (Vercel)   │ dataset (cached JSON)          │             │
│  ┌──────────────────┴─────────┐   ┌──────────────────▼──────────┐  │
│  │ Data API                   │   │ User API (route handlers /  │  │
│  │ (server components + ISR-  │   │ server actions, Clerk-      │  │
│  │  cached route: full curated│   │ gated: balances, bookmarks, │  │
│  │  dataset, revalidated on   │   │ goals, deletion)            │  │
│  │  data change)              │   └──────────────┬──────────────┘  │
│  └──────────────▲─────────────┘                  │                 │
├─────────────────┼────────────────────────────────┼─────────────────┤
│  DATA LAYER     │                                │                 │
│  ┌──────────────┴────────────────┐   ┌───────────▼──────────────┐  │
│  │ Curated tables (Postgres):    │   │ User tables (Postgres):  │  │
│  │ programs, transfer_routes,    │   │ users (clerk_id),        │  │
│  │ transfer_bonuses, redemptions │   │ user_balances,           │  │
│  └──────────────▲────────────────┘   │ user_bookmarks,          │  │
│                 │ seed script          │ user_goals              │  │
│  ┌──────────────┴────────────────┐   └──────────────────────────┘  │
│  │ Seed files in repo (TS/JSON)  │                                 │
│  │ — the curation workflow:      │      ┌──────────────────────┐   │
│  │ Claude drafts → Nick corrects │      │ Clerk (hosted auth)  │   │
│  │ → commit → migrate/seed       │      └──────────────────────┘   │
│  └───────────────────────────────┘                                 │
└────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Curated data model** | Programs, transfer routes/ratios, manual bonus overrides, redemptions with award price + cash fare + methodology | Postgres tables via Drizzle (or Prisma); schema is the project's foundation |
| **Seed pipeline** | Version-controlled curation workflow; the only write path for curated data in v1 | Typed seed files in repo (`src/data/seed/*.ts`) + `db:seed` script; typos caught at compile time |
| **Engine** | Transfer-path resolution, eligibility, effective-balance math, cpp/wow-delta computation, hybrid ranking | Pure TypeScript module, zero framework imports, exhaustively unit-tested |
| **Data API** | Serve the full curated dataset (it's ~100 rows — one payload) to the client, cached | Server component props or one ISR/`use cache` route handler returning JSON |
| **Anonymous state** | Balances with zero friction; shareable | URL search params (canonical, shareable) mirrored to localStorage (return visits) |
| **User API** | Save balances/goals/bookmarks, read them back, delete account data | Server actions or route handlers, Clerk middleware-gated, thin CRUD |
| **Auth** | Optional sign-up at the "save" moment only | Clerk components + middleware; never wraps the core flow |
| **Presentation** | Balance entry, ranked results, dual-valuation cards, "almost there" section, methodology notes, v2 teaser | App Router pages + client components; editorial design system |

## Recommended Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Landing + balance entry + results (the core flow, one page)
│   ├── redemption/[slug]/        # Optional detail page per redemption (SEO + share targets)
│   ├── methodology/page.tsx      # Valuation methodology (finance credibility)
│   ├── privacy/page.tsx          # Privacy policy / data rights
│   ├── api/dataset/route.ts      # Cached curated-dataset endpoint (if not passed via RSC props)
│   └── (account)/                # Clerk-gated: saved balances, bookmarks — isolated route group
├── engine/                       # THE pure module — no imports from app/, db/, or React
│   ├── types.ts                  # Balance, Program, TransferRoute, Redemption, RankedResult
│   ├── transfers.ts              # Path resolution: balance → partner program effective points
│   ├── valuation.ts              # cpp, cash-out baseline, wow delta
│   ├── ranking.ts                # Hybrid rank: bookable-now by delta, then almost-there
│   └── engine.test.ts            # The most-tested code in the repo
├── db/
│   ├── schema.ts                 # Drizzle schema — curated tables + user tables
│   ├── queries/                  # Typed data access (getDataset, user CRUD)
│   └── seed/
│       ├── programs.ts           # 8 source programs + partner programs
│       ├── transfers.ts          # Static ratios + manual bonus entries
│       ├── redemptions.ts        # The 80–120 curated entries
│       └── run.ts                # Idempotent seed script (upsert by natural key)
├── components/                   # Balance inputs, redemption cards, sections, teaser
└── lib/                          # URL-state codec, localStorage sync, formatting (currency, points)
```

### Structure Rationale

- **`engine/` as a sealed module:** the single most important boundary in the codebase. It imports nothing from Next.js, React, or the DB — it takes plain data in and returns plain data out. This is what makes it (a) trivially unit-testable against curated fixtures, (b) runnable on client or server without change, and (c) directly reusable as a tool the v2 AI advisor calls ("given these balances, what's bookable?").
- **`db/seed/` as the curation workspace:** curated data lives in the repo as typed TS files, not in a CMS or admin UI. Every correction Nick makes is a reviewed commit; the DB is a deployment target of the seed, not the editing surface. This is the fastest defensible workflow for one curator and doubles as the versioned corpus the v2 knowledge base ingests.
- **One core page:** the entire wow moment happens on `/` — enter balances, see results, no navigation. Detail pages and account pages are satellites.

## Architectural Patterns

### Pattern 1: Isomorphic Pure Engine, Client-Side Execution in v1

**What:** Ship the full curated dataset to the browser once (cached; ~100 rows is a few tens of KB), run matching/ranking client-side so results recompute instantly as the user edits balances. The engine module itself has no environment dependency, so the same code runs server-side later.
**When to use:** Dataset small and public-by-display anyway; interactivity is the product (sliders/inputs → live results).
**Trade-offs:** ✚ Zero-latency recompute, no API round-trips per keystroke, engine reusable server-side for v2. ✚ Trivial to make results shareable (state in URL, compute on load). − Full dataset is inspectable in devtools (acceptable: it renders on screen anyway). − If dataset ever grows 100×, move compute server-side — the module doesn't change.

**Example:**
```typescript
// engine/ranking.ts — pure, deterministic, no I/O
export function rankRedemptions(
  balances: Balance[],          // user's 8 program balances
  dataset: CuratedDataset,      // programs, routes, bonuses, redemptions
  opts: { almostThereThreshold: number } = { almostThereThreshold: 0.75 }
): { bookableNow: RankedResult[]; almostThere: RankedResult[] } {
  const results = dataset.redemptions.map((r) => {
    const path = bestTransferPath(balances, r.partnerProgramId, dataset); // combines sources
    const coverage = path.effectivePoints / r.pointsRequired;
    const wowDelta = r.cashFareEstimate - cashOutBaseline(path.pointsSpent, dataset);
    return { redemption: r, path, coverage, wowDelta, cpp: cpp(r) };
  });
  return {
    bookableNow: results.filter(x => x.coverage >= 1).sort(byWowDeltaDesc),
    almostThere: results.filter(x => x.coverage >= opts.almostThereThreshold && x.coverage < 1)
                        .sort(byCoverageDescThenDelta),
  };
}
```

### Pattern 2: Repo-as-CMS Seed Pipeline (Curated Data as Code)

**What:** Curated tables are written to only by an idempotent seed script reading typed files from the repo. Transfer-bonus overrides are just rows in `seed/transfers.ts` with `startDate`/`endDate`; updating one is an edit + commit + deploy (seed runs in CI/postbuild or manually).
**When to use:** Single curator, <1k rows, data correctness is reputationally load-bearing.
**Trade-offs:** ✚ Type-checked data (a mistyped ratio fails `tsc`), full history via git, code review of every valuation, no admin UI to build or secure. ✚ Fixture data for engine tests is the real data. − Updates require a deploy (~2 min on Vercel — fine for weekly bonus updates). − Doesn't scale to multiple non-technical editors (that's a v3 problem).

**Example:**
```typescript
// db/seed/transfers.ts
export const transferRoutes = [
  { from: "amex-mr", to: "ana-mileage-club", ratio: 1.0, transferTimeDays: 2 },
  { from: "chase-ur", to: "world-of-hyatt",  ratio: 1.0, transferTimeDays: 0 },
] satisfies TransferRouteSeed[];

export const transferBonuses = [  // manual entry, Nick-maintained
  { from: "amex-mr", to: "virgin-atlantic", bonusPct: 30,
    start: "2026-08-15", end: "2026-09-30", source: "amex offer page" },
] satisfies TransferBonusSeed[];
```

### Pattern 3: URL-Canonical Anonymous State with Late-Binding Auth

**What:** Balances encode into URL search params (`/?ur=90000&mr=120000`) as the canonical anonymous state; localStorage mirrors them for return visits. "Save my balances" is the only moment Clerk appears: sign-up → one server action copies current client state into `user_balances`. On later signed-in visits, server state hydrates the client.
**When to use:** Whenever the demo/share path must be frictionless and auth is an upsell, not a requirement.
**Trade-offs:** ✚ Every result screen is a shareable link (huge for the LinkedIn audience — a recruiter clicks and sees a populated app). ✚ The core flow has zero DB dependency, so it can never break because of auth or DB issues. − Two state sources once signed in; resolve with a simple rule (server wins on load, writes go to both). − URL params are visible — fine, balances aren't secrets, but don't put anything else in there.

**Example:**
```typescript
// lib/url-state.ts — tiny codec, no library needed
export function encodeBalances(b: Record<ProgramId, number>): URLSearchParams { /* ... */ }
export function decodeBalances(sp: URLSearchParams): Record<ProgramId, number> { /* ... */ }
// page.tsx reads searchParams server-side for first paint, client updates via router.replace
```

### Pattern 4: Store Inputs, Compute Valuations (never persist derived numbers)

**What:** The `redemptions` table stores raw observed inputs — `pointsRequired`, `taxesFeesCash`, `cashFareEstimate`, `verifiedAt`, `sourceNote`. cpp and wow delta are always computed by the engine, never stored.
**When to use:** Always, in any valuation system. Derived columns drift from their inputs and destroy the "defensible numbers" promise.
**Trade-offs:** ✚ One formula, one methodology page, numbers always internally consistent; changing the cash-out baseline (e.g., 1.0¢ vs 1.25¢ for CSP portal) reprices everything correctly. − Marginally more compute per render (negligible at this scale).

## Data Flow

### Core Anonymous Flow (the wow moment)

```
User enters balances
    ↓
URL params updated (router.replace) + localStorage mirror
    ↓
Engine (client): balances × dataset
    ├─ transfers.ts: for each redemption's partner program,
    │    find all source programs with a route → sum(balance × ratio × (1 + bonus))
    │    (+ direct balance if user holds the partner currency, e.g. Hyatt)
    ├─ valuation.ts: cpp = (cashFare − taxesFees) / pointsRequired;
    │    wowDelta = cashFare − (pointsSpent × cashOutBaseline)
    └─ ranking.ts: coverage ≥ 100% → "bookable now" by wowDelta desc;
         75–99% → "almost there" by proximity, with "you need +23K MR" callout
    ↓
Results UI: ranked cards, dual valuation side-by-side, methodology link
```

### Dataset Flow (curation → client)

```
Claude drafts entry → Nick corrects numbers → commit to db/seed/*
    ↓ (deploy)
seed script upserts Postgres curated tables
    ↓ (build/ISR)
Data API serializes full dataset → cached JSON (revalidate on deploy)
    ↓
Client fetches once per session → feeds engine
```

### Optional Save Flow

```
"Save my balances" → Clerk sign-up/sign-in modal
    ↓
Server action: upsert users(clerk_id) + user_balances + goals
    ↓
Signed-in load: server component reads user_balances → hydrates client state
Bookmark ♡ on card → server action → user_bookmarks(user_id, redemption_id)
Delete account → Clerk webhook/user action → cascade-delete user rows (privacy requirement)
```

### Key Data Flows

1. **Balances → results** is entirely client-side after first load: no network in the hot loop.
2. **Curated data flows one way**: repo → DB → cached API → client. Nothing writes curated tables at runtime.
3. **User data flows through server actions only**, gated by Clerk middleware; the anonymous path never touches these tables.
4. **v2 feed (design-ahead, build-later):** the same `redemptions` rows — especially `notes`, `bookingHint`, `methodologyNote`, `sourceNote` prose fields — become RAG documents for the AI advisor; the engine module becomes a tool the LLM calls. No schema migration needed if these prose fields exist from day one.

## Schema Sketch (informs phase 1)

```
programs            id (slug PK), name, kind ('bank'|'airline'|'hotel'),
                    cashOutBaselineCpp (e.g. 1.0), isUserEnterable (the 8), logo/brand fields
transfer_routes     fromProgramId → toProgramId, ratio (numeric), transferTimeDays, active
transfer_bonuses    routeId, bonusPct, startDate, endDate, sourceNote   -- manual overrides
redemptions         id (slug), partnerProgramId, title, category ('flight'|'hotel'|...),
                    origin, destination, cabin, pointsRequired, taxesFeesCash,
                    cashFareEstimate, seasonality/notes, bookingHint, methodologyNote,
                    sourceNote, verifiedAt, imageRef, featured (bool)
users               id, clerkId (unique), createdAt
user_balances       userId, programId, points, updatedAt
user_goals          userId, freeText / structured region+cabin (stored only in v1)
user_bookmarks      userId, redemptionId, createdAt
```

Notes: use **slugs as natural keys** for curated tables (seed idempotency + readable URLs); `ratio` as numeric not int (Marriott→airlines is 3:1); a redemption prices in exactly **one partner program** — multi-program combination happens in the engine (summing transferable sources into that partner), not in the schema.

## Suggested Build Order

Dependencies run: **schema → engine → anonymous UI → polish → auth/save → data fill**. Each phase produces something demoable.

| Phase | Build | Why this order |
|-------|-------|----------------|
| **1. Data foundation** | Drizzle schema, migrations, seed pipeline, starter dataset (~15 real entries covering all 8 programs) | Everything downstream consumes this shape; getting `transfer_bonuses` and dual-valuation fields right now avoids rework. 15 real entries force the schema to confront reality (Marriott 3:1, Hyatt direct-use, taxes on BA) |
| **2. Engine** | `engine/` module + exhaustive unit tests: transfer paths, bonus application, combined sources, cpp, hybrid ranking, almost-there thresholds | Pure function over phase-1 fixtures; testable before any UI exists. This is where correctness (finance credibility) is won |
| **3. Anonymous core flow** | Balance entry → URL/localStorage state → client engine → ranked results with dual valuation. Deploy to Vercel now | The wow moment end-to-end; everything after this is enhancement. Early deploy de-risks the timeline |
| **4. Editorial polish** | Design system, card layouts, big numbers, almost-there section, methodology page, v2 teaser, share-link UX | Highest LinkedIn-visible ROI; safe to iterate on a working core |
| **5. Optional save** | Clerk integration, save/bookmark/goals server actions, account page, privacy policy + deletion | Deliberately late: bolts onto the edge, touches nothing in the core flow. If timeline slips, v1 ships without it and still lands the demo |
| **6. Data fill + verify** | Grow dataset to 80–120 entries (parallelizable with 4–5), verify numbers, `verifiedAt` stamps | Content work, not engineering; the collaborative Claude-drafts/Nick-corrects loop runs alongside later phases |

Phases 4–6 overlap; 1→2→3 is a strict chain.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–10k users (v1 reality) | Nothing. Curated dataset is statically cacheable; engine runs on visitors' devices; DB only touched by the small signed-in fraction. This architecture is nearly free on Vercel + Neon |
| 10k–100k users | Still nothing structural. CDN-cache the dataset route harder; Neon autoscales user CRUD easily |
| v2 AI advisor | The real "scaling" event is functional, not load: move engine invocation server-side as an LLM tool, embed redemption prose into a vector store, add eligibility-rule tables. The v1 design (pure engine, prose-rich rows) makes this additive |

### Scaling Priorities

1. **First bottleneck: data freshness credibility, not traffic.** Stale transfer bonuses or award prices break trust before any server does. Mitigate with `verifiedAt` displayed on cards and a weekly seed-review habit.
2. **Second: dataset payload size** if entries balloon with imagery/prose — split card-data from detail-data in the API response before moving compute server-side.

## Anti-Patterns

### Anti-Pattern 1: Modeling for Award Search Instead of Curation

**What people do:** Design tables for per-date availability, fare classes, dynamic pricing bands — mimicking ExpertFlyer/Seats.aero.
**Why it's wrong:** That's a different product (live search), explicitly out of scope; it multiplies schema complexity and makes every entry a maintenance liability, killing the 2–4 week timeline.
**Do this instead:** One row = one curated sweet spot with representative numbers (`pointsRequired`, `cashFareEstimate`, `verifiedAt`) and a methodology note admitting they're representative. Curation is the product.

### Anti-Pattern 2: Ranking Logic in SQL or Scattered in Components

**What people do:** `ORDER BY` with computed columns in queries, or cpp math inline in card components.
**Why it's wrong:** The hybrid ranking (two sections, coverage thresholds, bonus-adjusted transfer math) becomes untestable and duplicated; v2 can't reuse it.
**Do this instead:** All math lives in `engine/`; SQL only fetches; components only render engine output.

### Anti-Pattern 3: Auth-Entangled Core Flow

**What people do:** Wrap the app in Clerk's provider requirements such that the results page depends on auth state, or gate "see all results" behind sign-up.
**Why it's wrong:** One Clerk hiccup or one login prompt kills the recruiter demo — the project's explicit no-login-wall constraint.
**Do this instead:** Core route renders with zero auth dependency; Clerk mounts only around the save action and the `(account)` route group.

### Anti-Pattern 4: Building an Admin CMS for One Curator

**What people do:** Spend a week on a protected admin UI for editing redemptions and bonuses.
**Why it's wrong:** One curator who can edit TypeScript doesn't need it; it's a security surface and a timeline sink.
**Do this instead:** Repo-as-CMS (Pattern 2). Revisit only if a non-technical editor joins.

### Anti-Pattern 5: Persisting Derived Valuations

**What people do:** Store `cpp` or `wowDelta` columns computed at seed time.
**Why it's wrong:** They silently drift when inputs change and forbid recalibrating the cash-out baseline — fatal to the "defensible numbers" positioning.
**Do this instead:** Store observed inputs; compute everything in the engine (Pattern 4).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Clerk | Middleware + `<SignInButton>` at the save moment; webhook (user.deleted) for cascade deletion | Keep out of the core route entirely; free tier suffices |
| Neon / Vercel Postgres | Drizzle over serverless driver | Seed script needs the direct (non-pooled) connection string for migrations |
| Vercel | Standard Next.js deploy; ISR/`use cache` for dataset route; revalidate on deploy | Seed can run as a manual script or postbuild step |
| Destination imagery | Static assets in repo or Unsplash-sourced, stored not hotlinked | License notes matter for a public portfolio piece |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| engine ↔ everything | Plain typed data in/out; engine imports nothing from app/db | The load-bearing boundary; enforce with lint rule or convention |
| seed files ↔ DB | One idempotent script, upsert by slug | Only write path for curated tables |
| client state ↔ user API | Server actions, Clerk-gated | Anonymous flow never crosses this boundary |
| v1 data model ↔ v2 advisor | Redemption prose fields → RAG corpus; engine → LLM tool | Design-ahead only: just ensure prose fields exist in v1 schema |

## Sources

- Next.js App Router architecture conventions (server components for data, client components for interactivity, server actions for mutations) — vercel/next.js docs
- Domain analysis: transfer-partner mechanics of the 8 named programs (Amex MR, Chase UR, Citi TY, Capital One, Bilt → airline/hotel partners; Hyatt/Hilton/Marriott as direct + Marriott 3:1 airline transfers), cpp valuation methodology as practiced by TPG/One Mile at a Time
- Comparable systems: AwardHacker (static transfer-ratio matrix), points valuation calculators, curated "sweet spot" listicles as the manual predecessor of this product
- `.planning/PROJECT.md` — requirements, constraints, and key decisions

---
*Architecture research for: Milesworth (credit-card points redemption visualizer)*
*Researched: 2026-08-31*
