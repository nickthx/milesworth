# Project Research Summary

**Project:** Milesworth — credit-card points redemption visualizer
**Domain:** Curated-data recommendation app (small hand-curated dataset + deterministic compute engine + read-heavy public frontend + optional persistence)
**Researched:** 2026-08-31
**Confidence:** HIGH

## Executive Summary

Milesworth fills a genuine market gap: every existing tool asks "where do you want to go?" (point.me, Seats.aero) or tracks cards (Travel Freely, AwardWallet); none takes multi-program balances as input and answers "here is the most jaw-dropping thing your points buy, with the cash-value receipt." The architecture class is deliberately boring — ~80–120 curated Postgres rows, a pure TypeScript ranking engine, an anonymous-first Next.js frontend — and that is correct for a 2–4 week portfolio deadline. The value is data quality and editorial presentation, not infrastructure.

Recommended approach: Next.js 16 App Router (pin >=16.3.3 for the Aug 2026 security fixes; note `middleware.ts` is now `proxy.ts`) + Tailwind v4 + shadcn/ui, Drizzle ORM over Neon Postgres (installed via Vercel Marketplace — "Vercel Postgres" no longer exists), Clerk v7 for optional-save auth (public-by-default middleware), and nuqs for URL-canonical balance state so every result screen is a shareable link with a dynamic OG card via built-in `next/og`. Curated data lives in the repo as typed, Zod-validated TS seed files ("repo-as-CMS") — no admin UI in v1. The engine is a sealed pure module (`(balances, dataset) -> ranked results`), exhaustively unit-tested, isomorphic so v2's AI advisor can call it server-side unchanged.

The two existential risks are both credibility, not engineering: (1) stale or wrong numbers — 2026 has already seen Marriott, Hyatt, Aeroplan devaluations and a Bilt relaunch, and LLM-drafted entries will confidently contain pre-devaluation data; (2) transfer math done naively — Marriott's 3:1 + 5K/60K step bonus and Amex->Hilton 1:2 are exactly the entries an expert audience checks first. Mitigation is schema-level (`verified_at`, `availability_rating`, structured ratio + bonus rules, per-program cash-out baselines) and process-level (Nick verifies every entry against live 2026 sources; a 25–30-verified-entry gate before ranking work). Third risk: the launch moment itself is a mobile LinkedIn WebView session — mobile-first build and a pre-launch OG/Lighthouse/WebView checklist are phase gates, not polish.

## Key Findings

### Recommended Stack

All versions verified against npm on 2026-08-31. Full details, install commands, and version-compatibility matrix in STACK.md.

**Core technologies:**
- **Next.js 16.3.x (App Router) + React 19.2 + TypeScript 5**: framework — server-rendered content pages, `opengraph-image.tsx` convention, `proxy.ts` (not `middleware.ts`)
- **Tailwind CSS 4.3 + shadcn/ui**: styling — CSS-first `@theme` tokens fit the editorial design system; shadcn only for accessible primitives (dialogs, forms), hand-rolled Tailwind for editorial sections
- **Drizzle ORM 0.45 + @neondatabase/serverless 1.1 + Neon (Vercel Marketplace)**: data — no engine binary, sub-500ms cold starts, `drizzle-kit push` for solo iteration, auto DB branching per preview deploy
- **Clerk @clerk/nextjs 7.8**: optional auth — `clerkMiddleware()` protects nothing by default; only `/saved` and save actions are gated
- **nuqs 2.10**: URL-canonical balance state (`/results?ur=90000&mr=50000`) — the shareable-results mechanism, no DB write, server-readable for SSR
- **zod 4.5**: validate balance inputs at the boundary AND the curated dataset in the seed script (a bad ratio fails the build)
- **next/og, next/image, next/font (built in)**: OG share cards, statically imported destination imagery (never hotlink Unsplash), self-hosted display serif + UI sans

**Do NOT use:** `@vercel/postgres` (sunset), Prisma classic engine (cold starts), NextAuth (Clerk decided), `@vercel/og` package (built in), `middleware.ts` filename (won't run on Next 16), Pages Router, CSS-in-JS, localStorage as the share mechanism.

### Expected Features

**Must have (table stakes):**
- Multi-program balance entry (8 programs), guest-first, no login wall — the premise; blank = 0, results from first nonzero balance
- Cents-per-point valuation on every result, TPG-consistent formula — a points tool without cpp reads as amateur
- Transparent methodology page + per-entry "Verified [Month Year]" stamps — the first skeptical question is "where did $4,500 come from?"
- Transfer-partner mapping with ratios shown per result ("via Chase UR -> Hyatt 1:1")
- How-to-book static guidance per entry (2–4 lines) — a dream with no path feels like a brochure
- Mobile-responsive UI — LinkedIn traffic is majority mobile
- Privacy policy + working account deletion (legal trigger once Clerk stores emails/balances)

**Should have (differentiators):**
- Balance-first ranked "wow" feed — the core inversion no competitor does; ranked by dollar delta (cash value − cash-out value)
- Dual valuation side-by-side with the delta as hero stat ("cash-out: $900 -> this flight: ~$4,500")
- "Almost there" section with points-away callouts — turns dead ends into aspiration; natural v2 advisor hook
- Curated sweet-spot DB with expert voice — the moat and the single largest work item
- Manual transfer-bonus field surfaced in results — domain currency signal
- Editorial travel aesthetic + destination imagery — the screenshot that travels on LinkedIn
- Optional Clerk save (balances, goals, bookmarks) + v2 advisor tease

**Defer (v1.x / v2+):**
- Per-result generated share images (v1 ships good OG tags), combined-currency pooling, bonus-adjusted cpp, admin/refresh tooling -> v1.x on triggers
- AI card advisor, goal-personalized ranking, eligibility rules -> v2
- **Anti-features (hold the line):** live award availability, balance auto-sync/credential handling, card recommendations, 30+ program coverage, auto-updating fares, native app, user-submitted content

### Architecture Approach

One core page delivers the whole wow moment: enter balances -> URL params update -> pure client-side engine ranks the cached dataset -> dual-valuation cards. Curated data flows one way (repo seed files -> Postgres -> cached JSON -> client); user data flows only through Clerk-gated server actions; the anonymous path never touches user tables or auth. Build order is a strict chain schema -> engine -> anonymous UI, then polish/auth/data-fill overlap.

**Major components:**
1. **`engine/` (pure TS module)** — transfer-path resolution, cpp/wow-delta valuation, hybrid ranking; imports nothing from Next/React/DB; the most-tested code in the repo; becomes the v2 LLM tool unchanged
2. **`db/seed/` (repo-as-CMS)** — typed seed files (programs, transfer routes, dated bonus rows, redemptions); idempotent upsert-by-slug script is the only write path for curated tables; every correction is a reviewed commit
3. **Data API** — full dataset (~100 rows, tens of KB) served once per session via RSC props or ISR/`use cache` route; anonymous results never hit Postgres at request time (also neutralizes Neon free-tier cold starts)
4. **Anonymous state** — URL params canonical (nuqs), localStorage mirror for return visits; server-rendered first paint from `searchParams`, instant client recompute on edits
5. **User API + Clerk** — thin CRUD server actions (balances, goals, bookmarks, cascade deletion), mounted only at the save moment and `(account)` route group

**Schema essentials (get right in phase 1):** slugs as natural keys; `programs.cashOutBaselineCpp` per program (never a flat 1 cent); transfer routes as structured `{numerator, denominator, bonus_rule (step function), increment}` — not a single float; redemptions store raw inputs only (`pointsRequired` as range for dynamic programs, `taxesFeesCash`, `cashFareEstimate`, `verifiedAt`, `availability_rating`, `bookingHint`, prose notes for the v2 RAG corpus) — cpp/delta always computed, never persisted.

### Critical Pitfalls

1. **Stale valuation data destroys credibility** — 2026 devaluations (Marriott, Hyatt, Aeroplan +20–67%, Bilt relaunch) mean any entry researched >6 months ago is suspect, and Claude-drafted entries will confidently cite pre-devaluation numbers. Avoid: `verified_at` + `source_note` on every entry from day one, Nick's pass is a verification gate against live 2026 sources (not a copyedit), display the date on cards, use ranges for dynamically priced programs.
2. **Naive transfer math** — `balance x ratio` fails on Marriott 3:1 + 5K per 60K (120K Bonvoy -> 50K miles, not 40K), Amex->Hilton 1:2, Bilt->Accor 3:2, and bonus composition on non-1:1 routes. Avoid: structured route model + unit tests for the known edge cases (Marriott 59K/60K/120K, MR->Hilton, stacked 30% bonus) before any UI consumes numbers.
3. **"Bookable now" overpromise** — the app cannot verify availability; ANA F via Virgin is famously near-impossible. Avoid: never use the word "bookable"; per-entry `availability_rating` enum set by Nick, shown on cards; rank by delta x attainability; CTAs say "how to search for this."
4. **Attackable cpp methodology** — retail-F fares inflate cpp; a flat 1-cent cash-out misstates the delta per program (Amex 0.6c statement credit vs Chase 1.0–1.5c). Avoid: decide the numerator convention and per-program baselines BEFORE drafting entries (entries encode the convention); Nick signs off on methodology wording.
5. **DB build is the schedule sink** — 80–120 verified entries is 15–40 hours of unparallelizable domain work on the critical path. Avoid: demo-complete at 25–30 verified entries covering all 8 programs; breadth is a post-launch drip; every program must yield 2–3 matches at common balance bands before adding depth.
6. **Demo breaks on mobile LinkedIn WebView at launch** — the highest-value session (recruiter tap) is the least-tested path. Avoid: design balance entry and cards at 390px first, `inputmode="numeric"`, LCP < 2.5s budget, pre-launch gate: LinkedIn Post Inspector + WebView walkthrough + Lighthouse mobile.
7. **v2 scope creep** — the advisor is the interesting problem and pulls work forward ("goals affect ranking a little"). Avoid: reject by default any v1 task mentioning AI/recommend/eligibility/availability; the tease is static copy timeboxed to hours; store goals, don't use them.
8. **Legal handling as a footer link** — boilerplate policy that misrepresents actual data handling is worse than none for a finance-credibility pitch. Avoid: 30-min data inventory -> short true policy; deletion built the same phase as save (app rows + Clerk user, tested end-to-end); balances never in logs/analytics; anonymous balances never persisted server-side.

### Contradictions Resolved

- **URL state: nuqs vs hand-rolled codec.** STACK.md recommends nuqs; ARCHITECTURE.md sketches a "no library needed" codec. **Sided with STACK.md (nuqs)** — typed parsers, server-readable, `NuqsAdapter` is one line; hand-rolling saves a dependency but re-derives solved problems (debounced replace, parse safety). Cost is near zero, and STACK.md verified version compatibility.
- **Where the engine runs.** STACK.md describes server-side ranking on the results page; ARCHITECTURE.md prescribes client-side execution. **Not actually a conflict — adopt the hybrid both docs enable:** the engine is pure/isomorphic; server-render the first paint from `searchParams` (shareable links + OG cards work with zero JS), recompute client-side as the user edits balances (zero-latency, no API round-trips). This is the plan of record.
- **Transfer-rate schema.** STACK.md sketches `transfer_rates` with a nullable `bonus_rate`; ARCHITECTURE.md has a `ratio` numeric + dated `transfer_bonuses` table; PITFALLS.md demands `{numerator, denominator, bonus_rule, increment}` with step-function support. **Sided with PITFALLS.md's richer model layered on ARCHITECTURE.md's dated-bonus-rows table** — the simple float survives early testing and then fails exactly on the entries experts check (Marriott 5K/60K). PITFALLS has the domain-specific evidence.
- **"Bookable now" section label.** ARCHITECTURE.md's engine returns `bookableNow`; PITFALLS.md forbids "bookable" in user-facing language and requires an availability field ARCHITECTURE's schema lacks. **Sided with PITFALLS.md:** keep the internal code name if convenient, but UI copy uses honest tiers, and `availability_rating` is added to the redemptions schema in phase 1.
- **Launch dataset size.** FEATURES.md's MVP list says 80–120 entries; PITFALLS.md and ARCHITECTURE.md say start with ~15, gate ranking at 25–30 verified, launch at 30–40+ if needed. **Sided with PITFALLS/ARCHITECTURE:** 80–120 is the target, not the launch blocker — "launch with 40 verified + 'growing weekly' copy" beats slipping the window or shipping unverified data (which recreates Pitfall 1).
- **"Almost there" threshold.** ARCHITECTURE uses >=75% coverage; FEATURES says within 25–30%; PITFALLS says cap at 25–50% above balance. Consistent in spirit — **make it an engine parameter (default ~0.75 coverage), tune with real data.**

## Implications for Roadmap

Based on research, suggested phase structure (ARCHITECTURE.md's build order, with PITFALLS.md's gates attached):

### Phase 1: Data Foundation + Walking Skeleton
**Rationale:** Everything downstream consumes the schema; getting `verified_at`, `availability_rating`, structured ratios, per-program baselines, and prose fields right now is free — retrofitting is painful. An early deploy makes "deployed and shrinking the gap" the default state (anti-scope-creep).
**Delivers:** Drizzle schema + migrations, Neon via Vercel Marketplace, seed pipeline, ~15 real verified entries covering all 8 programs (forces schema to confront Marriott 3:1+bonus, Hyatt direct-use, taxes), deployed hello-world on Vercel.
**Addresses:** Curated DB foundation (FEATURES P1).
**Avoids:** Pitfalls 1, 3 (schema fields), 5 (DB work starts immediately), 7 (walking skeleton).

### Phase 2: Valuation Engine
**Rationale:** Pure function over phase-1 fixtures — testable before any UI exists. This is where finance credibility is won or lost. The cpp numerator convention and per-program cash-out baselines must be decided HERE, before mass entry drafting, because entries encode the convention.
**Delivers:** `engine/` module (transfers, valuation, ranking) + exhaustive unit tests: Marriott 59K/60K/120K, MR->Hilton 1:2, Bilt->Accor 3:2, stacked bonus on non-1:1, combined sources, almost-there thresholds.
**Uses:** Pure TS, zod; no framework imports (the load-bearing boundary).
**Avoids:** Pitfalls 2 and 4 entirely; enables v2 reuse.

### Phase 3: Anonymous Core Flow
**Rationale:** The wow moment end-to-end; everything after is enhancement. Deploy immediately.
**Delivers:** Balance entry (mobile-first, `inputmode="numeric"`, blank=0) -> nuqs URL state + localStorage mirror -> server-rendered first paint + client recompute -> ranked results with dual valuation, availability tags, transfer paths, verified dates.
**Uses:** nuqs, cached dataset (ISR/`use cache` — no Postgres on the anonymous path), engine from phase 2.
**Implements:** Anonymous state + Data API components.
**Avoids:** Pitfall 6 (mobile-first mandate starts here), Neon cold-start trap.

### Phase 4: Editorial Polish + Share Surface
**Rationale:** Highest LinkedIn-visible ROI; safe to iterate on a working core.
**Delivers:** Design system (`@theme` tokens, display serif + sans via next/font), destination imagery (statically imported, optimized), "almost there" section, methodology page, v2 teaser (static, timeboxed), `opengraph-image.tsx` share cards, copy-link UX, empty/edge states (0-balance, single-program, 5M points).
**Addresses:** Editorial aesthetic, dual-valuation presentation, methodology (FEATURES P1s).
**Avoids:** Pitfall 4 (methodology page ships in v1, not v1.x), UX pitfalls (rounding, jargon, empty states).

### Phase 5: Optional Save + Legal
**Rationale:** Deliberately late — bolts onto the edge, touches nothing in the core flow. If timeline slips, v1 ships without it and still lands the demo.
**Delivers:** Clerk v7 (`proxy.ts`, public-by-default matcher), save/bookmark/goals server actions (user derived from session, never payload), account page, end-to-end deletion (Postgres rows + Clerk user), data inventory -> privacy policy, save prompt only after results render.
**Uses:** Clerk, Drizzle user tables.
**Avoids:** Pitfall 8 (deletion built with save, not later) and auth-entangled core flow (test wow flow in incognito).

### Phase 6: Data Fill + Pre-Launch Hardening
**Rationale:** Content work parallelizable with phases 4–5; the hardening checklist is a phase GATE, because a broken mobile debut is unrecoverable (only pitfall with no recovery strategy).
**Delivers:** Dataset grown toward 80–120 verified entries (each program yields 2–3 matches at 50K/100K/200K bands; Bilt entries reflect the 2026 Cardless era); exit criteria: LinkedIn WebView walkthrough, OG validated in Post Inspector, Lighthouse mobile >=90, LCP <2.5s, no-login flow verified in incognito, deletion tested, "Looks Done But Isn't" checklist from PITFALLS.md cleared.
**Avoids:** Pitfalls 1, 5, 6.

### Phase Ordering Rationale

- 1 -> 2 -> 3 is a strict dependency chain (schema -> engine -> UI); 4–6 overlap and can interleave.
- Data curation starts in phase 1 and never stops — it is the true backlog, not a phase (Pitfall 5). Gate: ranking work waits for 25–30 verified entries.
- Auth last preserves the guarantee that the core demo path can never break because of Clerk or the DB.
- Methodology decisions (phase 2) precede mass data entry because entries encode the cpp convention.
- Every phase ends deployed — the walking skeleton from phase 1 makes scope creep visible immediately.

### Research Flags

Phases likely needing deeper attention during planning:
- **Phase 2:** the cpp numerator convention and per-program cash-out baselines are product decisions Nick must make explicitly (finance-background sign-off), not defaults to code around.
- **Phase 6:** entry verification requires live 2026 program sources per entry — Claude drafts will contain stale numbers by construction; plan Nick's verification hours realistically (15–40 hrs total across the project).

Phases with standard patterns (skip research-phase):
- **Phases 1, 3, 5:** Drizzle+Neon, nuqs, Clerk optional-auth are all verified, well-documented 2026 patterns with exact versions and code in STACK.md.
- **Phase 4:** editorial design is taste work, not research work; OG image generation is a built-in Next.js convention.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against npm + official docs on 2026-08-31; Drizzle-vs-Prisma rationale is MEDIUM-HIGH (third-party benchmarks, consistent) |
| Features | HIGH (landscape) / MEDIUM (weighting) | Competitor feature sets verified via current reviews; user-expectation weighting inferred from positioning, not primary research |
| Architecture | HIGH | Well-trodden architecture class; domain math is deterministic and small |
| Pitfalls | HIGH | Owner has active churner domain expertise; volatile facts (2026 devaluations, Bilt 2.0) verified against 2026 sources |

**Overall confidence:** HIGH

### Gaps to Address

- **Ranking-quality validation:** the wow-delta ranking has no user validation; ship the simple version, tune thresholds (almost-there coverage, delta x attainability weighting) against real entries in phase 3–4.
- **cpp numerator convention:** research surfaces the debate (retail-F vs realistic-fare) but the call is Nick's — make it an explicit phase-2 decision with sign-off.
- **drizzle-zod + zod v4 compatibility:** unverified; hand-written zod schemas avoid the question (STACK.md's recommendation).
- **Neon free-tier autosuspend behavior at launch:** mitigated by caching the dataset off the request path, but verify cold-start behavior during phase 6 hardening.

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` — versions (npm registry 2026-08-31), Next 16.3 security floor, Vercel Postgres sunset, Clerk v7 + proxy.ts, integration patterns
- `.planning/research/ARCHITECTURE.md` — architecture class, pure-engine pattern, repo-as-CMS, build order, schema sketch
- `.planning/research/PITFALLS.md` — 2026 devaluations (NerdWallet, Aeroplan/Marriott/Bilt sources), transfer-math edge cases, phase-mapped mitigations
- `.planning/research/FEATURES.md` — competitor landscape (point.me, Seats.aero, TPG, Travel Freely via current reviews), MVP definition, anti-features

### Secondary (MEDIUM confidence)
- Drizzle-vs-Prisma 2026 comparisons (Makerkit, Bytebase, TurboStarter) — cold-start/bundle rationale
- User-expectation weighting in FEATURES.md — inferred from tool positioning and community commentary

---
*Research completed: 2026-08-31*
*Ready for roadmap: yes*
