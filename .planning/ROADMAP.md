# Roadmap: Milesworth

## Overview

Build bottom-up in horizontal layers: stand up the production skeleton on Vercel first, then the curated data layer (the product's substance), then the pure valuation/ranking engine on top of it, then the user-facing core experience that makes the wow moment land, then the credibility and account layers, and finish with an editorial design pass and a launch-hardening gate for the LinkedIn debut.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation** - Next.js 16 + Neon + CI skeleton deployed to production Vercel (completed 2026-09-01)
- [ ] **Phase 2: Redemption Database** - Schema, typed seed files, and the verified curated dataset
- [ ] **Phase 3: Valuation & Ranking Engine** - Pure TypeScript engine: transfer paths, cpp math, wow delta, hybrid ranking
- [x] **Phase 4: Core Experience** - Balance entry → ranked results flow, shareable URLs, guest-first
- [x] **Phase 5: Credibility Layer** - Methodology page, OG cards, v2 advisor tease (completed 2026-09-03)
- [x] **Phase 6: Accounts & Legal** - Optional Clerk save, bookmarks, goals, privacy/deletion (completed 2026-09-15)
- [ ] **Phase 7: Editorial Polish & Launch** - Design system pass, mobile/WebView hardening, launch gate

## Phase Details

### Phase 1: Foundation

**Goal**: A deployed, production-grade skeleton — every later phase ships onto live infrastructure from day one
**Depends on**: Nothing (first phase)
**Requirements**: PLAT-01
**Success Criteria** (what must be TRUE):

  1. A Next.js 16 (App Router) app with Tailwind v4 + shadcn/ui builds clean and deploys to a public Vercel URL
  2. Neon Postgres (via Vercel Marketplace) is connected through Drizzle with env vars flowing locally and in production
  3. Pushing to main auto-deploys; lint, typecheck, and test commands run green

**Plans**: 5 plans

Plans:

- [x] 01-01-PLAN.md — Scaffold Next.js 16 + toolchain (Vitest, Prettier, typecheck) + D-14 directory skeleton
- [x] 01-02-PLAN.md — shadcn/ui set, Fraunces+Inter @theme tokens, D-04 homepage with noindex
- [x] 01-03-PLAN.md — GitHub remote + advisory CI workflow (lint/typecheck/test green checks)
- [x] 01-04-PLAN.md — Vercel project + Git auto-deploy + Neon Marketplace integration + env pull (human checkpoint)
- [x] 01-05-PLAN.md — Drizzle wiring, health_check push to Neon, server-component query, production deploy verification

### Phase 2: Redemption Database

**Goal**: The curated dataset exists as structured, verified data — the substance every other layer reads
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):

  1. Schema models programs, transfer routes (ratio + bonus rule + increment), transfer bonuses (dated manual overrides), and redemptions (points, cash fare, taxes/fees, verified date, booking notes)
  2. Transfer-route edge cases compute correctly in seed validation: Marriott 3:1 with 5K-per-60K bonus, Amex→Hilton 1:2, Bilt 1:1
  3. At least 30 Nick-verified entries covering all 8 programs load from typed seed files (path to 80–120 established, no unverified entry marked shippable)
  4. Seed files rebuild the database idempotently with one command

**Plans**: 5 plans

Plans:

- [x] 02-01-PLAN.md — Schema swap: 4 curated tables + Zod seed boundary, migrate healthCheck consumers, [BLOCKING] drizzle-kit push
- [x] 02-02-PLAN.md — Author typed seed data: 8+partner programs, structural routes (Marriott/Amex-Hilton/Bilt edge cases), draft bonuses, 35-40 draft redemptions
- [x] 02-03-PLAN.md — Pure engine transfer math (TDD): computePartnerPoints + applyPromoBonus vs real seed rows, purity gate
- [x] 02-04-PLAN.md — Idempotent one-command seed pipeline (db.batch rebuild) + DB-free structural test suite
- [x] 02-05-PLAN.md — DATA-04 gate: Nick verifies ≥30 entries (human checkpoint), coverage test activates, reseed Neon

### Phase 3: Valuation & Ranking Engine

**Goal**: A sealed, pure TypeScript engine that turns balances + dataset into ranked, valued redemptions — framework-free so it later becomes the v2 advisor's tool
**Depends on**: Phase 2
**Requirements**: VAL-02, VAL-05
**Success Criteria** (what must be TRUE):

  1. Given balances, the engine returns bookable-now redemptions ranked by wow delta plus an "almost there" set with points-away amounts
  2. Cpp follows TPG convention — (cash fare − taxes/fees) ÷ points × 100 — verified by unit tests against hand-computed examples
  3. Active transfer bonuses auto-adjust effective points cost and cpp
  4. The engine resolves the cheapest transfer path when multiple held programs reach the same partner
  5. The engine module imports nothing from Next.js, React, or the database layer

**Plans**: 4 plans

Plans:

**Wave 1**
- [x] 03-01-PLAN.md — Ratify A1/A2/Bilt baseline (checkpoint), engine type contracts, executable purity gate

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 03-02-PLAN.md — paths.ts (TDD): active-bonus windows, A4-safe conversion, binary-search inverse math, A1 cheapest path
- [x] 03-03-PLAN.md — valuation.ts (TDD): TPG cppX100 + effectiveCppX100, per-program-baseline wow delta

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 03-04-PLAN.md — ranking.ts orchestrator (TDD): partition/sort/threshold, VAL-05 end-to-end, hardening, public barrel

### Phase 4: Core Experience

**Goal**: The end-to-end guest flow — enter balances, see the wow, share the link
**Depends on**: Phase 3
**Requirements**: INPUT-01, INPUT-02, INPUT-03, RANK-01, RANK-02, RANK-03, RANK-04, RANK-05, VAL-01, VAL-04
**Success Criteria** (what must be TRUE):

  1. User enters balances for the 8 programs with formatted inputs and sees ranked results without logging in
  2. Each result leads with the dollar delta and shows cash fare + cpp side by side, its transfer path, which balance it uses, booking guidance, and a "Verified [date]" stamp
  3. The "Almost there" section shows near-miss redemptions with "you're X points away" callouts
  4. Balances survive a page reload (localStorage) and a shared URL reproduces the same results in a fresh browser

**Plans**: 4 plans

Plans:

**Wave 1** *(parallel)*
- [x] 04-01-PLAN.md — Install nuqs + react-number-format; URL param codec + localStorage precedence layer with hostile-input tests (INPUT-02/03)
- [x] 04-02-PLAN.md — Display formatters (heroDelta, currency/cpp/date) + transfer-path strings, tested against real seed routes (VAL-01/04, RANK-04)

**Wave 2** *(blocked on Wave 1)*
- [x] 04-03-PLAN.md — Presentational components: 8-input balance form, wow result card, almost-there section (INPUT-01, RANK-01..05, VAL-01/04)

**Wave 3** *(blocked on Wave 2)*
- [x] 04-04-PLAN.md — Page composition: NuqsAdapter, dynamic server page, client island (engine + storage + Copy-my-link + empty states), human walkthrough checkpoint

### Phase 5: Credibility Layer

**Goal**: The numbers are defensible and the product markets itself when shared
**Depends on**: Phase 4
**Requirements**: VAL-03, PLAT-03, PLAT-04
**Success Criteria** (what must be TRUE):

  1. A methodology page explains fare sourcing, taxes/fees treatment, and the dynamic-award-pricing disclaimer, linked from results
  2. Shared links unfurl with proper OG tags and a branded OG image (verified in a link-preview inspector)
  3. A "coming soon" tease for the v2 AI card-roadmap advisor is present with an interest hook

**Plans**: 5 plans

Plans:

- [x] 05-01-PLAN.md — Foundations: vitest @ alias, vendored OG fonts, buildShareContent + interestSchema pure modules with tests
- [x] 05-02-PLAN.md — /methodology static page rendering engine-sourced numbers, SiteFooter, results link (VAL-03)
- [x] 05-03-PLAN.md — /og ImageResponse route, metadataBase, generateMetadata per share link (PLAT-03)
- [x] 05-04-PLAN.md — interest_signups schema + drizzle-kit push, joinAdvisorWaitlist action, AdvisorTease form (PLAT-04)
- [x] 05-05-PLAN.md — Mount footer + tease, deploy, curl probes, LinkedIn Post Inspector + waitlist row human-verify

### Phase 6: Accounts & Legal

**Goal**: Optional persistence bolts on without touching the guest flow
**Depends on**: Phase 4
**Requirements**: ACCT-01, ACCT-02, ACCT-03, ACCT-04
**Success Criteria** (what must be TRUE):

  1. User can sign up via Clerk and their balances save to their profile; the core flow still works fully logged out
  2. Signed-in user can bookmark redemptions and record travel goals, and both persist across sessions
  3. Privacy policy and consent are in place; a user can delete their account and data

**Plans**: 7 plans

Plans:

- [x] 06-01-PLAN.md — Wave 0: fix drizzle-kit push churn (FK name + PK order), install @clerk/nextjs, fill VALIDATION.md; human gates: TTY push + Clerk keys/Dashboard consent-on/self-serve-delete-off
- [x] 06-02-PLAN.md — users/user_balances/bookmarks/travel_goals schema + [BLOCKING] push + no-op gate; account-validation Zod boundary + tests; account precedence branch in resolveInitialBalances
- [x] 06-03-PLAN.md — src/proxy.ts (public by default, /og excluded), ClerkProvider inside body, SiteHeader, static /privacy page + test, footer link
- [x] 06-04-PLAN.md — Server Actions (saveBalances, setBookmark, addGoal, deleteGoal, deleteAccount DB→Clerk), account-data read module, mocked action tests, guest-flow-gate test
- [x] 06-05-PLAN.md — / reads auth() → island props; account precedence; Save CTA beside Copy my link; bookmark toggle on both result tiers
- [x] 06-06-PLAN.md — /account page: saved balances + restore link, bookmarks, goals add/remove, Delete my account dialog → signOut
- [x] 06-07-PLAN.md — Local gates, deploy by push, production curl probes (/privacy, /account, /og cache), human end-to-end walkthrough, VALIDATION sign-off

### Phase 7: Editorial Polish & Launch

**Goal**: The app earns the "production quality" bar on the device that matters — a recruiter's phone inside LinkedIn's browser
**Depends on**: Phase 5, Phase 6
**Requirements**: PLAT-02, PLAT-05
**Success Criteria** (what must be TRUE):

  1. Editorial travel design system (light, magazine-like, destination imagery, big numbers) is applied consistently across all pages
  2. The full flow works in LinkedIn's in-app browser and on small screens, verified by a real-device pass
  3. Lighthouse mobile scores are launch-worthy and the dataset has reached its launch size with all entries Nick-verified

**Plans**: TBD

Plans:

- [ ] 07-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 (5 and 6 both depend only on Phase 4 and may interleave)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 5/5 | Complete    | 2026-09-01 |
| 2. Redemption Database | 0/TBD | Not started | - |
| 3. Valuation & Ranking Engine | 0/TBD | Not started | - |
| 4. Core Experience | 0/4 | Planned | - |
| 5. Credibility Layer | 5/5 | Complete    | 2026-09-03 |
| 6. Accounts & Legal | 7/7 | Complete    | 2026-09-15 |
| 7. Editorial Polish & Launch | 0/TBD | Not started | - |
