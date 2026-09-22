---
phase: 07-editorial-polish-launch
plan: 08
subsystem: data
tags: [redemptions, seed-data, verification, launch-week-recheck, transfer-bonus, ci-floor, bookkeeping, d7-03]

# Dependency graph
requires:
  - phase: 07-editorial-polish-launch
    plan: 01
    provides: D7-03 N=34, batch1=0, batch2=0
  - phase: 07-editorial-polish-launch
    plan: 06
    provides: V1=34, CI floor already 34, held Marriott drafts kept, count-script pattern (no tsx -e)
  - phase: 07-editorial-polish-launch
    plan: 05
    provides: footer "Photos via Unsplash" credit + design-system gate regex
  - phase: 02-redemption-database
    plan: 05
    provides: 34 Nick-verified entries, 02-05-corrections.md ruling log, transfers.ts bonus row shape
provides:
  - "Launch-week re-check: all 8 featured entries re-confirmed unchanged and re-stamped verifiedAt 2026-09-21"
  - "Amex MR -> Hilton Honors +30% (2026-09-01 -> 2026-10-14) re-confirmed live; sourceNote re-stamped"
  - "4 additional Nick-verified transfer bonuses in src/data/transfers.ts (bonuses 1 -> 5); 4 skipped for unmodeled partners"
  - "CI floor confirmed at N=34 (V2 = 34); launch-floor comment in tests/seed-data.test.ts"
  - "Pitfall 13 bookkeeping corrected: DATA-02/03/04 ticked, DATA-01 annotated, ROADMAP Phase 2/3 complete, STATE deferred row resolved"
  - "Footer photo credit reconciled (no-op): 20 manifest credits all Unsplash == 'Photos via Unsplash'"
affects: [07-10]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Featured entries carry a launch-week re-verification date; sourceNote keeps the first-verified date in parentheses so provenance is not lost"
    - "Engine tests that assert base-rate arithmetic run on a promo-free copy of the real dataset (rankBase) so dated promo rows never silently shift them; live-promo behaviour gets its own explicit test"
    - "Bonuses are added only on modeled routes — never invent a program to host a promo"

key-files:
  created:
    - .planning/phases/07-editorial-polish-launch/07-08-SUMMARY.md
  modified:
    - src/data/redemptions-flights.ts
    - src/data/redemptions-flights-europe.ts
    - src/data/redemptions-hotels.ts
    - src/data/transfers.ts
    - tests/seed-data.test.ts
    - tests/engine-ranking.test.ts
    - .planning/phases/02-redemption-database/02-05-corrections.md
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/STATE.md

key-decisions:
  - "batch2 = 0 per D7-03: no drafts, no photos, no new split files; V2 = 34 = N and the CI floor stays 34 (already there since 07-06)"
  - "Nick (2026-09-21): featured 8 ALL UNCHANGED, re-stamped verifiedAt 2026-09-21; Hilton bonus LIVE as stored; N = 34 stands"
  - "Nick-directed scope addition: 4 of 8 listed transfer bonuses added (both endpoints modeled); Iberia, Aer Lingus and JAL Mileage Bank bonuses skipped rather than inventing programs"
  - "engine-ranking base-rate tests moved to a promo-free dataset copy instead of re-pinning asOf, so the file's 'real dataset' philosophy survives future promo rows"
  - "Reseed deferred to the orchestrator in the main checkout (worktree has no DATABASE_URL); expected counts recorded below"

patterns-established:
  - "rankBase() helper in tests/engine-ranking.test.ts for promo-independent partition assertions"

requirements-completed: [DATA-04, PLAT-05]

# Metrics
duration: ~45min executor time (excludes the human gate)
completed: 2026-09-21
---

# Phase 07 Plan 08: Batch 2 + Launch-Week Re-check Summary

**Batch 2 was empty by decision D7-03 (N=34): Nick re-confirmed all eight featured entries and the Amex→Hilton +30% bonus unchanged in launch week (re-stamped 2026-09-21), added four more program-verified transfer bonuses to `transfers.ts`, and the stale Phase 2/3 planning bookkeeping now matches the repo — V2 = 34 = N, CI floor 34, Neon reseed pending in the main checkout.**

## Performance

- **Duration:** ~45 min executor time (npm ci ~2 min, two builds ~3 min each; human gate excluded)
- **Started:** 2026-09-21T20:08:00Z
- **Completed:** 2026-09-21T20:30:00Z
- **Tasks:** 3 (Task 1 auto on the zero-draft path, Task 2 human-verify checkpoint, Task 3 auto)
- **Files modified:** 10 (3 seed files, transfers.ts, 2 test files, corrections log, 3 planning docs) + this SUMMARY

## Accomplishments

- Every recruiter-facing entry (the teaser `ana-business-tokyo-roundtrip`, the OG top result, the first eight cards) now shows "Verified 2026-09-21" — a launch-week date, not a three-week-old one — with every figure re-confirmed by Nick
- The transfer-bonus table reflects what is actually live on program sites in launch week (5 dated rows), so the "+X% transfer bonus through …" badge and bonus-adjusted cpp fire for Chase UR → Marriott/Aeroplan, Amex → BA Avios and Citi → LifeMiles balances, not just Amex → Hilton
- Roadmap Success Criterion 3 (dataset half) is CI-enforced at exactly N=34 and the REQUIREMENTS/ROADMAP/STATE ledgers say Phase 2 and 3 are done
- The dataset launch gate is closed with no fabricated verification: every date and figure in this plan came from Nick's checkpoint reply

## Task Commits

1. **Task 1: Draft batch 2 (zero-draft path) + dossier** — `a715a65` (docs; SUMMARY draft with the re-check dossier, no seed changes)
2. **Task 2: Nick's ruling** — no commit (human gate)
3. **Task 3a: Featured re-stamp + Hilton bonus re-confirmation + ruling log** — `a0fba1f` (feat)
4. **Task 3b: 4 new transfer bonuses + ranking-test adjustments** — `eab42b2` (feat)
5. **Task 3c: Pitfall 13 bookkeeping** — `606ecdb` (docs)

**Plan metadata:** the `docs(07-08)` commit that finalizes this SUMMARY

## Task 1: Draft batch 2 — zero-draft path

Per 07-01-SUMMARY (D7-03): `N=34`, `batch1=0`, `batch2=0`. **No new drafts per D7-03.** No entries drafted, no photos sourced, no imageSlugs added; `src/data/redemptions-hotels-2.ts` and `src/data/redemptions-flights-americas.ts` were not created. No batch-1 entry needed re-drafting (batch 1 was empty); the two Marriott drafts stay held per Nick's 2026-09-21 ruling (not re-opened).

Verification on the unchanged tree: `vitest` seed+image 23/23; count script 36 total / 34 verified / 2 drafts / 8 featured (all verified; teaser = `ana-business-tokyo-roundtrip`); split files 14/256/279/380 lines; `npm run build`, `typecheck`, `lint` exit 0; `git status` clean. The dossier (stored figures + what to re-check per featured slug, bonus dates) was committed in `a715a65` and is preserved in that commit's version of this file.

### Draft list

| Slug | Partner | Target program | Status |
|------|---------|----------------|--------|
| (none) | — | — | batch2 = 0 |

## Task 2: Nick's rulings (2026-09-21, relayed by the orchestrator)

1. Batch 2: none — confirmed.
2. Featured 8: **ALL UNCHANGED**; re-stamp `verifiedAt: 2026-09-21` on all 8, update sourceNote date wording.
3. Amex MR → Hilton Honors +30%: **LIVE as stored** (through 2026-10-14); re-stamp its sourceNote to 2026-09-21.
4. **N = 34 stands.**
5. Scope addition (user-directed): add the full set of active transfer bonuses Nick verified on program transfer pages this morning — only where both endpoints already exist; skip and list the rest.

Resume signal: "batch 2 verified".

### Featured re-check table

| Slug | Points | Cash / taxes | Ruling | verifiedAt before → after |
|------|--------|--------------|--------|---------------------------|
| ana-business-tokyo-roundtrip | 75K–90K RT | $9,000 / $600 | unchanged | 2026-09-01 → **2026-09-21** |
| ana-first-tokyo-via-virgin | 72.5K OW | $14,000 / $400 | unchanged | 2026-09-01 → **2026-09-21** |
| jal-business-tokyo-via-alaska | 60K OW | $4,500 / $50 | unchanged | 2026-09-01 → **2026-09-21** |
| singapore-first-777-frankfurt | 156K OW | $14,000 / $250 | unchanged | 2026-09-01 → **2026-09-21** |
| emirates-first-dubai | 136K–188K OW | $18,000 / $1,000 | unchanged | 2026-09-01 → **2026-09-21** |
| park-hyatt-tokyo | 35K–75K/night | $1,300 / $0 | unchanged | 2026-09-01 → **2026-09-21** |
| conrad-maldives | 160K–200K/night | $2,200 / $0 | unchanged | 2026-09-01 → **2026-09-21** |
| st-regis-bora-bora | 70K–100K/night | $2,000 / $0 | unchanged | 2026-09-01 → **2026-09-21** |

Each sourceNote now opens `Verified 2026-09-21 — re-confirmed unchanged in launch week (first verified 2026-09-01): …` followed by the original finding verbatim. No pointsMin/pointsMax/cashFareCents/taxesFeesCents changed. The 26 non-featured verified entries keep `2026-09-01`.

### Bonus ruling

Amex MR → Hilton Honors: live as stored. `bonusPercent 30`, `2026-09-01 → 2026-10-14` unchanged; sourceNote now `Verified 2026-09-21 — re-confirmed live in launch week (first verified 2026-09-01): …`.

## Task 3: Apply rulings, bonuses, floor, footer, bookkeeping

### 3a. Re-stamp (`a0fba1f`)

- `src/data/redemptions-flights.ts`, `redemptions-flights-europe.ts`, `redemptions-hotels.ts`: 8 × `verifiedAt` + sourceNote as above; header comments name the re-confirmed featured entries and the 2026-09-21 date
- `src/data/transfers.ts`: Hilton bonus sourceNote re-stamped
- `tests/seed-data.test.ts`: floor stays `toBeGreaterThanOrEqual(34)` (line 167); added comment `// launch floor N=34 per D7-03, verified 2026-09-21 (plan 07-08: batch2=0, the 8 featured entries re-confirmed unchanged in launch week, V2 = 34).`
- `.planning/phases/02-redemption-database/02-05-corrections.md`: new `## Phase 7 batch 2 + launch-week re-check (2026-09-21)` section (rulings, scope addition, skipped bonuses, reseed note)
- V2 (count script) = **34 verified of 36 total = N**. Split files 259/282/383 lines.

### 3b. Transfer bonuses added (`eab42b2`) — Nick-directed scope addition

Rule applied: add only where the source program and the partner are both already modeled (`src/data/programs.ts` + a `routes` entry); `startDate` = 2026-09-21 where Nick's list gave only an end date; `sourceNote` = "Verified 2026-09-21 — Nick, program transfer pages"; `bonusPercent` integer per `bonuses[0]` / the zod schema (`int().min(1).max(100)`).

| From → To | % | startDate | endDate | Route |
|-----------|---|-----------|---------|-------|
| amex-mr → british-airways-avios | 30 | 2026-09-21 | 2026-09-27 | `route("amex-mr", "british-airways-avios")` |
| chase-ur → air-canada-aeroplan | 20 | 2026-09-21 | 2026-09-30 | `route("chase-ur", "air-canada-aeroplan")` |
| chase-ur → marriott-bonvoy | 70 | 2026-09-15 | 2026-10-15 | `route("chase-ur", "marriott-bonvoy")` |
| citi-ty → avianca-lifemiles | 25 | 2026-09-20 | 2026-10-24 | `route("citi-ty", "avianca-lifemiles")` |

`bonuses` now has 5 rows. The `transfers.ts` bonuses comment documents the launch-week pass and the not-added rule.

#### Bonuses not added

| Bonus (as listed by Nick) | Reason |
|---------------------------|--------|
| Amex MR → Iberia Avios +30% (ends 2026-09-27) | No `iberia` program; Avios is modeled only as `british-airways-avios`. Not invented. |
| Amex MR → Aer Lingus Avios +30% (ends 2026-09-27) | No `aer-lingus` program; same Avios note. Not invented. |
| Capital One → JAL Mileage Bank +30% (ends 2026-09-30) | No `jal-mileage-bank` program or `capital-one` → JAL route; JAL awards are modeled only via Alaska (`jal-business-tokyo-via-alaska`). |
| Citi ThankYou → JAL Mileage Bank +30% (2026-09-20 → 2026-10-24) | Same — no JAL Mileage Bank program/route. |

If Nick wants these, they need new `programs` rows + routes (a data change, but a modeling decision beyond this plan's scope).

#### Test adjustments in the same commit

`npm test` after adding the bonuses failed 5 tests in `tests/engine-ranking.test.ts`, all legitimate consequences of the new data:

- Four tests assert base-rate partitioning "via chase-ur 1:1" with `asOf` pinned to 2026-09-15 — the first day of the new Chase UR → Marriott +70% window, which correctly lifts `st-regis-bora-bora` (100K Bonvoy) and `ritz-carlton-kyoto` (130K) into `bookableNow` for an 80K UR balance. Fix: a `baseDataset = { ...dataset, bonuses: [] }` + `rankBase()` helper; those four tests now assert base-rate math on the real programs/routes/redemptions without promo rows. A new test asserts the live-promo behaviour explicitly (bookableNow on 2026-09-15, almostThere at coverage 0.8 on 2026-09-14).
- One test pinned `conrad-maldives.verifiedAt` to `"2026-09-01"`; updated to `"2026-09-21"` (featured re-stamp). This is a consequence of 3a, but the file was only touched once so it rides in `eab42b2`.

`npm test` → 24 files, **355/355** passed (354 + the new promo test). `engine-paths.test.ts` bonus-window assertions (Hilton 2026-09-01 / 10-14 / 10-15, marriott→alaska none) unchanged and green.

### 3c. Footer photo credit (no-op, T-07-14 / UI-SPEC A7)

- `grep -o 'source: "[A-Za-z]*"' src/images/destinations.ts | sort | uniq -c` → `21 source: "Unsplash"` — 20 photo credits (tokyo … venice) plus the type union on line 45; zero `"Pexels"` values. 20 WebPs in `src/images/destinations/`.
- `src/components/site-footer.tsx` line 36: `Photos via Unsplash` — matches the set exactly; unchanged.
- `tests/design-system-gate.test.ts` credit regex `/Photos via (Unsplash( and Pexels)?|Pexels)/` passes (gate 3/3 files, 66 tests green with transfers + seed-data).

### 3d. Bookkeeping (`606ecdb`) — Pitfall 13, content corrections only

Every line changed (for the orchestrator to reconcile after merge; no progress bar, position, status or session fields were touched):

| File | Line | Before → After |
|------|------|----------------|
| `.planning/REQUIREMENTS.md` | 29 | `- [ ] **DATA-01**: …in the repo` → same text + ` — launch size N=34 per D7-03; 80–120 target carried forward` (box stays `[ ]`, N < 80) |
| `.planning/REQUIREMENTS.md` | 30 | `- [ ] **DATA-02**` → `- [x] **DATA-02**` |
| `.planning/REQUIREMENTS.md` | 31 | `- [ ] **DATA-03**` → `- [x] **DATA-03**` |
| `.planning/REQUIREMENTS.md` | 32 | `- [ ] **DATA-04**` → `- [x] **DATA-04**` |
| `.planning/ROADMAP.md` | 15 | `- [ ] **Phase 2: Redemption Database** - …dataset` → `- [x] …dataset (completed 2026-09-01)` |
| `.planning/ROADMAP.md` | 16 | `- [ ] **Phase 3: Valuation & Ranking Engine** - …ranking` → `- [x] …ranking (completed 2026-09-01)` |
| `.planning/ROADMAP.md` | 209 | `\| 2. Redemption Database \| 0/TBD \| Not started \| - \|` → `\| 2. Redemption Database \| 5/5 \| Complete    \| 2026-09-01 \|` |
| `.planning/ROADMAP.md` | 210 | `\| 3. Valuation & Ranking Engine \| 0/TBD \| Not started \| - \|` → `\| 3. Valuation & Ranking Engine \| 4/4 \| Complete    \| 2026-09-01 \|` |
| `.planning/STATE.md` | 124 | Deferred Items row Status `deferred` → `resolved (07-08: N=34 verified)` |

Dates: Phase 2 from `02-05-SUMMARY.md` frontmatter `completed: "2026-09-01"`; Phase 3 from `03-04-SUMMARY.md` frontmatter `completed: "2026-09-01"`. Plan counts: 5 PLAN / 5 SUMMARY in `02-*`, 4 / 4 in `03-*`. `grep -c "\[x\] \*\*DATA-04\*\*" .planning/REQUIREMENTS.md` → 1. REQUIREMENTS line 80 (traceability table) maps DATA-01..04 to Phase 2 with no status column — unchanged.

### Reseed: REQUIRED — deferred to the orchestrator

Seed rows changed in this plan (8 `verifiedAt`/sourceNote rows, the Hilton bonus sourceNote, 4 new bonus rows), so Neon no longer mirrors the files. This worktree has no `.env*` file; none was created and no DB command was run (T-07-11: no connection-string fragment could appear in any output).

**Reseed required — orchestrator runs `npm run db:seed` x2 + DB count in main checkout after merge.** Expected post-seed counts (identical on both runs):

| Table | Expected |
|-------|----------|
| redemptions | **36** total, **34** with `verifiedAt` not null |
| transfer_bonuses | **5** |
| transfer_routes | 46 (unchanged) |
| programs | 21 (unchanged) |

Seed-script output line to expect: `… 5 bonuses, 36 redemptions …`. The DB verified-count check (plan Task 3 one-liner, or an equivalent script file) must print `34 verified in DB, 34 in seed`. Production picks up the code/test changes when 07-10 pushes origin/main; Neon is shared, so the reseed is live immediately.

### Full local gate (after all commits)

- `npm test` → 24 files, 355/355 passed
- `npm run build` exit 0, then `npm run typecheck` exit 0, `npm run lint` exit 0
- `npx vitest run tests/transfers.test.ts tests/seed-data.test.ts tests/design-system-gate.test.ts` → 66/66
- `git status --short` clean; no deletions in any commit

## Decisions Made

- batch2 = 0 taken literally; V2 = 34 = N; CI floor untouched at 34 (raising it again would be a no-op; the comment records the launch-floor rationale)
- Featured sourceNotes keep the original finding and the first-verified date in parentheses so the 2026-09-01 provenance is not erased by the re-stamp
- Unmodeled-partner bonuses skipped rather than adding programs — inventing `iberia` / `aer-lingus` / `jal-mileage-bank` rows would be a modeling decision (routes, cash-out baselines, enterability) outside a data-only plan
- Base-rate ranking tests decoupled from live promo windows via `rankBase()` rather than re-pinning `asOf`, so the next dated promo does not break them again

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree base behind the expected commit**
- **Found during:** startup branch check
- **Issue:** HEAD was `30428ed`; merge-base with the expected `9bee33a` was `30428ed`
- **Fix:** sanctioned `git reset --hard 9bee33a` from the spawn instructions (clean tree, nothing discarded)
- **Files modified:** none

**2. [Rule 3 - Blocking] Plan's `tsx -e` count one-liner unusable**
- **Found during:** Task 1 verify
- **Issue:** CJS namespace with no named exports (07-06 Deviation 2)
- **Fix:** scratchpad script with a static import (outside the repo). No repo change.

**3. [Rule 1 - Bug] Ranking tests broken by the new promo rows**
- **Found during:** Task 3b `npm test`
- **Issue:** 4 base-rate partition tests pinned to 2026-09-15 assumed no Chase UR promo; 1 test pinned conrad-maldives `verifiedAt` to 2026-09-01
- **Fix:** `rankBase()` promo-free dataset for base-rate tests, new explicit live-promo test, `verifiedAt` pin updated
- **Files modified:** `tests/engine-ranking.test.ts`
- **Commit:** `eab42b2`

### User-directed scope change

**4. [Nick-directed] Full active transfer-bonus set added to `transfers.ts`** — 4 added, 4 skipped (see "Bonuses not added"). Committed separately as `eab42b2` per the orchestrator's instruction.

### Process notes

- **Reseed not run** (no env in worktree) — recorded above with expected counts; the orchestrator owns it.
- **Verify order:** build before typecheck (`next-env.d.ts` is gitignored).
- **Prettier:** `prettier --check` reports the touched seed/test files as unclean, but they were already unclean at the base commit (verified against `git show 9bee33a:…`); `npm run lint` (the project gate) passes. Not reformatted — out of scope.

## Issues Encountered

- `npm ci` emitted the same dev-only deprecation warnings as 07-01/07-06 (glob 7, uuid 8, eslint 9.39.5). Nothing installed beyond the lockfile.

## User Setup Required

Reseed in the main checkout after merge (see "Reseed: REQUIRED"). No dashboard or env action.

## Known Stubs

None — no application code was written.

## Threat Flags

None. T-07-10: every `verifiedAt` and every bonus figure came from Nick's checkpoint reply; nothing was inferred. T-07-11: no DB command, no env file present or created. T-07-22: floor = 34 = V2, asserted by the count script before and after the edits. T-07-23: featured badges and the bonus badge carry launch-week dates. T-07-SC: nothing installed. No new network endpoints, auth paths, file access patterns, or schema changes.

## Next Phase Readiness (handoff for 07-10)

- Dataset ships at 36 total / 34 verified (N=34), featured 8 stamped 2026-09-21; 5 bonus rows; CI floor 34
- **Orchestrator must reseed Neon in the main checkout** before the launch push (expected 36/34 redemptions, 5 bonuses)
- The Amex → BA Avios bonus ends 2026-09-27 and Chase → Aeroplan ends 2026-09-30 — both expire on their own (engine is date-bounded); no action needed at expiry
- `.planning` tracking lines changed are listed in 3d for reconciliation after merge

## Self-Check: PASSED

- FOUND: .planning/phases/07-editorial-polish-launch/07-08-SUMMARY.md
- FOUND: tests/seed-data.test.ts (`toBeGreaterThanOrEqual(34)` at line 167, launch-floor comment above it)
- FOUND: src/data/transfers.ts (5 bonus rows; Hilton sourceNote re-stamped 2026-09-21)
- FOUND: src/data/redemptions-flights.ts / -flights-europe.ts / -hotels.ts (8 × `verifiedAt: "2026-09-21"`)
- FOUND: tests/engine-ranking.test.ts (`rankBase`, promo test, verifiedAt pin 2026-09-21)
- FOUND: .planning/phases/02-redemption-database/02-05-corrections.md (`## Phase 7 batch 2 + launch-week re-check (2026-09-21)`)
- FOUND: .planning/REQUIREMENTS.md (`[x] **DATA-04**` count 1), ROADMAP.md Phase 2/3 `[x]`, STATE.md deferred row `resolved`
- FOUND commits: a715a65, a0fba1f, eab42b2, 606ecdb
- No `.env*` file created; no `git push`; `src/components/site-header.tsx` and `config/lighthouserc.cjs` untouched; working tree clean before the SUMMARY commit

---
*Phase: 07-editorial-polish-launch*
*Completed: 2026-09-21*
