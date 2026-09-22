---
phase: 07-editorial-polish-launch
plan: 06
subsystem: data
tags: [redemptions, seed-data, verification, ci-floor, held-drafts, d7-03]
status: checkpoint

# Dependency graph
requires:
  - phase: 07-editorial-polish-launch
    plan: 01
    provides: D7-03 N=34, batch1=0, batch2=0 (literal keys in 07-01-SUMMARY.md)
  - phase: 07-editorial-polish-launch
    plan: 03
    provides: src/images/destinations.ts manifest + 20 WebPs covering every imageSlug in use
  - phase: 02-redemption-database
    plan: 05
    provides: 34 Nick-verified entries, 2 held Marriott drafts, 02-05-corrections.md ruling log
provides:
  - "Zero-draft execution of batch 1 (batch1=0): dataset unchanged at 36 total / 34 verified / 2 held drafts"
  - "Held-draft dossier for st-regis-maldives and gritti-palace-venice (what Nick checks on marriott.com)"
  - "Pending (Task 3, after Nick's ruling): CI floor raised 30 -> V1, corrections-log entry, hotels-file header update"
affects: [07-07, 07-08, 07-10]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Plan step sizes read from Wave 0 literals (batch1) collapse to their zero path; no entries are invented to fill a batch"

key-files:
  created:
    - .planning/phases/07-editorial-polish-launch/07-06-SUMMARY.md
  modified: []

key-decisions:
  - "batch1=0 per D7-03: no new redemption drafts, no new destination photos, no new imageSlugs"
  - "Task 1 produced no file changes, so it has no commit; its verification ran and passed on the unchanged tree"
  - "Reseed is deferred to Task 3 and is a no-op if Nick keeps both held drafts (seed files identical to what Neon holds)"

patterns-established: []

requirements-completed: []

# Metrics
duration: ~15min executor time to the checkpoint (excludes the human gate)
completed: null
---

# Phase 07 Plan 06: Batch 1 Verification (Zero-Draft Path) Summary

**Batch 1 is empty by decision D7-03 (N=34, batch1=0): the 36-entry / 34-verified dataset ships as-is, and this plan's only open item is Nick's ruling on the two held Marriott drafts, after which Task 3 raises the CI floor from 30 to the achieved verified count.**

## Status: CHECKPOINT (Task 2 of 3)

Execution paused at Task 2 (`checkpoint:human-verify`, `gate="blocking"`). Auto mode is off (`workflow.auto_advance: false`, `_auto_chain_active: false`), so the checkpoint is not auto-approved. Tasks 1 and 2 are covered below; Task 3 runs after Nick's ruling.

## Performance

- **Duration:** ~15 min executor time to the checkpoint (npm ci ~2 min, build ~3 min)
- **Started:** 2026-09-21T19:55:00Z
- **Completed:** pending (Task 3 not yet run)
- **Tasks:** 1 of 3 complete (Task 1 auto, zero-draft path); Task 2 checkpoint open; Task 3 pending
- **Files modified:** 0 source files (this SUMMARY only)

## Task 1: Draft batch 1 — zero-draft path

Per 07-01-SUMMARY (D7-03): `N=34`, `batch1=0` (= min(20, 34 - 34)). The plan's Task 1 instruction for `batch1 = 0` is "skip drafting: this task only assembles the held-draft dossier and the SUMMARY states 'no new drafts per D7-03'."

**No new drafts per D7-03.** No entries were drafted, no photos sourced, no imageSlugs added, `src/data/redemptions.ts` and `src/data/index.ts` untouched. `src/data/redemptions-hotels-2.ts` and `src/data/redemptions-flights-americas.ts` were not created — with zero entries there is nothing to put in them, and an empty split file would only add an unused import.

### Draft list (per plan acceptance criteria)

| Slug | Partner | Target program | Status |
|------|---------|----------------|--------|
| (none) | — | — | batch1 = 0 |

### Task 1 verification (run on the unchanged tree)

- `npx vitest run tests/seed-data.test.ts tests/image-manifest.test.ts` -> 2 files, 23/23 passed (floor still at 30; provenance, Zod, cross-refs, image coverage green)
- Dataset count one-liner (run as a scratchpad `tsx` script because `tsx -e` + dynamic import of the barrel returned a CJS-shaped namespace with no named exports):
  ```
  36 total, 34 verified, 2 drafts
  drafts: st-regis-maldives, gritti-palace-venice
  partners used: 16; unreachable: none
  ```
  Reachability = every `partnerProgramSlug` is either an enterable program (direct use) or the `toProgramSlug` of an `active` route whose `fromProgramSlug` is enterable.
- `wc -l`: redemptions-flights.ts 256, redemptions-flights-europe.ts 279, redemptions-hotels.ts 378, redemptions.ts 14 — all < 500
- `npm run build` exit 0 (generates the gitignored `next-env.d.ts` needed by typecheck), `npm run typecheck` exit 0, `npm run lint` exit 0
- `git status --short` empty after all of the above — Task 1 changed nothing, so it has **no commit**

### Held-draft dossier (for Task 2)

Both entries live in `src/data/redemptions-hotels.ts` (lines 306-329 and 354-377), `partnerProgramSlug: "marriott-bonvoy"`, `verifiedAt: null`, sourceNote `DRAFT — ... needs a manual marriott.com check before verification.` Neither is ranked or shown today (engine A5 filter).

| Slug | Current draft figures | What Nick checks on marriott.com |
|------|----------------------|----------------------------------|
| `st-regis-maldives` (St. Regis Maldives Vommuli, overwater villa) | pointsMin 100,000 / pointsMax 160,000 per night; cashFareCents 280,000 ($2,800/night incl. taxes+service, seaplane excluded); taxesFeesCents 0; `plan_ahead` | 1. Standard-award points per night for an overwater garden villa on a representative high-season date (e.g. a Feb/Mar 2027 stay) and a shoulder date (May or Nov) — gives the min/max range. 2. Cash rate for the same dates incl. taxes/service charge (confirm seaplane is a separate line). 3. Whether 5th-night-free still applies on standard awards (bookingHint claim). |
| `gritti-palace-venice` (The Gritti Palace, Grand Canal) | pointsMin 90,000 / pointsMax 140,000 per night; cashFareCents 210,000 ($2,100/night incl. taxes, city tax excluded); taxesFeesCents 0; `plan_ahead` | 1. Standard-award points per night for a base room on a representative high-season date (e.g. a June 2027 or Biennale weekend) and an off-peak date — min/max range. 2. Cash rate for the same dates incl. taxes (Venice city tax is collected at the property — confirm it is excluded from the site rate). 3. That awards are bookable on marriott.com for the base category (bookingHint claim). |

Ruling options per slug (plan Task 2 step 3): supply the figures + the check date (Task 3 sets `verifiedAt`, rewrites the sourceNote to `Verified <date> — <finding>`), or "keep as drafts".

**Note for Nick:** D7-03 fixed N=34 as the launch number and 07-01 says "ship the dataset as-is". Keeping both as drafts is fully consistent with that decision and costs nothing; verifying them is optional and would lift the shipped count to 35 or 36. This checkpoint asks for one line: figures, or "keep as drafts".

## Task 2: Nick's ruling (open)

Checkpoint returned to the orchestrator. Batch 1 has zero entries to verify; the only items awaiting a ruling are the two held drafts above.

## Task 3: Apply rulings, raise floor, reseed (pending)

What the continuation agent does under each outcome:

- **Both kept as drafts (V1 = 34):** `tests/seed-data.test.ts` line 162 `toBeGreaterThanOrEqual(30)` -> `toBeGreaterThanOrEqual(34)` with the comment naming Phase 7 batch 1 and the date; append `## Phase 7 batch 1 (<date>)` to `.planning/phases/02-redemption-database/02-05-corrections.md` recording batch1=0 and the held-draft ruling; update the `redemptions-hotels.ts` header comment to state the held drafts were re-ruled. **Reseed is a no-op** — no seed row changes, so Neon already mirrors the files; do not run `npm run db:seed` (destructive delete/insert) for nothing. The plan's DB-count assertion is satisfied by the 02-05 proof (34 verified in DB = 34 in seed).
- **One or both verified (V1 = 35 or 36):** apply figures + `verifiedAt`, rewrite sourceNote, raise floor to V1, corrections-log entry, hotels header update, then reseed twice + DB count one-liner. **The worktree has no `.env*` file** (DATABASE_URL absent), and executors must not create or copy env files — that path returns a `human-action` checkpoint for Nick to run the reseed, or the orchestrator runs it after merge in the main checkout where `.env.development.local` exists.

Either way: full local gate (`npm test`, typecheck, lint, build), commit only — 07-07 Task 1 pushes and deploys.

## Deviations from Plan

### Auto-fixed Issues

None to code. Process notes:

**1. [Rule 3 - Blocking] Worktree base behind the expected commit**
- **Found during:** startup branch check
- **Issue:** worktree HEAD was `30428ed` (end of Phase 6); merge-base with the expected `38dca22` was `30428ed`, not `38dca22`, and the Phase 7 planning directory did not exist on disk
- **Fix:** the sanctioned `git reset --hard 38dca22` from the spawn instructions (clean tree, nothing discarded)
- **Files modified:** none

**2. [Rule 3 - Blocking] Plan's `tsx -e` count one-liner does not work as written**
- **Found during:** Task 1 verify
- **Issue:** `npx tsx -e "import('./src/data/index.ts')..."` resolves the barrel as a CJS-shaped namespace (`['default', 'module.exports']`), so `d.redemptions` is undefined; same with `--input-type=module`
- **Fix:** equivalent check written as a scratchpad script (outside the repo) with a static import; output recorded above. No repo change.

**3. [Observation] Verify order: build before typecheck** — `next-env.d.ts` is gitignored (07-03 Deviation 3); ran `npm run build` before `npm run typecheck`. No change.

## Issues Encountered

- `npm ci` emitted the same dev-only deprecation warnings 07-01 recorded (glob 7, uuid 8, eslint 9.39.5). Nothing installed beyond the lockfile.

## User Setup Required

- Nick's ruling on `st-regis-maldives` and `gritti-palace-venice` (see dossier). No dashboard or env action.
- If Nick verifies either draft, the reseed needs `DATABASE_URL` — not available in this worktree; see Task 3 notes.

## Known Stubs

None — no code was written.

## Threat Flags

None. T-07-10 (false verification): no `verifiedAt` was set; the two drafts stay `null` until Nick rules. T-07-11: no DB command was run, so no connection-string output. T-07-05 / T-07-09: no images touched. T-07-22: floor unchanged pending Task 3 (it will be raised in the same commit as any data change).

## Self-Check: PASSED

- FOUND: .planning/phases/07-editorial-polish-launch/07-06-SUMMARY.md
- Commits: none for Task 1 (no file changes — verified by empty `git status --short`); this SUMMARY's `docs(07-06)` commit is the only commit at the checkpoint
- STATE.md / ROADMAP.md / REQUIREMENTS.md untouched; no `.env*` file created; `src/data/index.ts` unchanged

---
*Phase: 07-editorial-polish-launch*
*Status: checkpoint at Task 2 — awaiting Nick's held-draft ruling*
