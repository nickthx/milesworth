---
phase: 07-editorial-polish-launch
plan: 06
subsystem: data
tags: [redemptions, seed-data, verification, ci-floor, held-drafts, d7-03]

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
    provides: 34 Nick-verified entries, 2 held Marriott drafts, 02-05-corrections.md ruling log, Neon seeded at 36/34
provides:
  - "Zero-draft execution of batch 1 (batch1=0): dataset unchanged at 36 total / 34 verified / 2 held drafts"
  - "CI floor in tests/seed-data.test.ts raised 30 -> 34 (= V1, the achieved verified count)"
  - "Held-draft ruling (keep as drafts, Nick 2026-09-21) recorded in 02-05-corrections.md and the hotels-file header"
  - "Held-draft dossier (what to check on marriott.com) for any future verification pass"
affects: [07-07, 07-08, 07-10]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Plan step sizes read from Wave 0 literals (batch1) collapse to their zero path; no entries are invented to fill a batch"
    - "Floor follows the data: the CI verified floor is raised only to the count actually on disk, in the same commit as the ruling log"
    - "Reseed only when seed rows change; a ruling that changes no row is a docs/test-only commit and never touches the DB"

key-files:
  created:
    - .planning/phases/07-editorial-polish-launch/07-06-SUMMARY.md
  modified:
    - tests/seed-data.test.ts
    - src/data/redemptions-hotels.ts
    - .planning/phases/02-redemption-database/02-05-corrections.md

key-decisions:
  - "batch1=0 per D7-03: no new redemption drafts, no new destination photos, no new imageSlugs"
  - "Nick (2026-09-21): keep st-regis-maldives and gritti-palace-venice as drafts; batch 1 verified with zero entries; V1 = 34"
  - "Task 1 produced no file changes, so it has no commit; its verification ran and passed on the unchanged tree"
  - "Reseed intentionally skipped: no seed row changed, so Neon already mirrors the files; no .env created, no DB command run"

patterns-established: []

requirements-completed: [DATA-01, DATA-04]

# Metrics
duration: ~25min executor time (excludes the human gate)
completed: 2026-09-21
---

# Phase 07 Plan 06: Batch 1 Verification (Zero-Draft Path) Summary

**Batch 1 was empty by decision D7-03 (N=34, batch1=0): the 36-entry / 34-verified dataset ships as-is, Nick re-ruled the two held Marriott drafts "keep as drafts", and the CI verified floor now equals the achieved count (30 -> 34) with the ruling logged in 02-05-corrections.md — no seed row changed, so Neon needed no reseed.**

## Performance

- **Duration:** ~25 min executor time (npm ci ~2 min, two builds ~3 min each; human gate excluded)
- **Started:** 2026-09-21T19:55:00Z
- **Completed:** 2026-09-21T20:06:00Z
- **Tasks:** 3 (Task 1 auto on the zero-draft path, Task 2 human-verify checkpoint, Task 3 auto)
- **Files modified:** 3 source/test/doc files + this SUMMARY

## Accomplishments

- Roadmap Success Criterion 3 ("the dataset has reached its launch size with all entries Nick-verified") is met at N=34: every rankable entry is Nick-verified, and the two unverified entries are structurally excluded (engine A5 filter + provenance test)
- `tests/seed-data.test.ts` floor equals the seed-file verified count exactly (34), so any coverage regression fails CI
- The held-draft ruling is a diffable git event (`2d6ac53`) and lives in the single ruling log, with a dossier for a future marriott.com pass

## Task Commits

1. **Task 1: Draft batch 1 (zero-draft path)** — no commit (no file changes; verification only)
2. **Task 2: Nick's ruling** — no commit (human gate); checkpoint state recorded in `c23c837` (docs)
3. **Task 3: Raise floor to 34, log ruling, update hotels header** — `2d6ac53` (test)

**Plan metadata:** the `docs(07-06)` commit that finalizes this SUMMARY

## Task 1: Draft batch 1 — zero-draft path

Per 07-01-SUMMARY (D7-03): `N=34`, `batch1=0` (= min(20, 34 - 34)). The plan's Task 1 instruction for `batch1 = 0` is "skip drafting: this task only assembles the held-draft dossier and the SUMMARY states 'no new drafts per D7-03'."

**No new drafts per D7-03.** No entries drafted, no photos sourced, no imageSlugs added; `src/data/redemptions.ts`, `src/data/index.ts` and `src/images/destinations.ts` untouched. `src/data/redemptions-hotels-2.ts` and `src/data/redemptions-flights-americas.ts` were not created — with zero entries there is nothing to put in them, and an empty split file would only add an unused import.

### Draft list (per plan acceptance criteria)

| Slug | Partner | Target program | Status |
|------|---------|----------------|--------|
| (none) | — | — | batch1 = 0 |

### Task 1 verification (run on the unchanged tree)

- `npx vitest run tests/seed-data.test.ts tests/image-manifest.test.ts` -> 2 files, 23/23 passed (floor at its pre-plan value 30; provenance, Zod, cross-refs, image coverage green)
- Dataset count + reachability check (scratchpad `tsx` script, see Deviation 2):
  ```
  36 total, 34 verified, 2 drafts
  drafts: st-regis-maldives, gritti-palace-venice
  partners used: 16; unreachable: none
  ```
  Reachability = every `partnerProgramSlug` is either an enterable program (direct use) or the `toProgramSlug` of an `active` route whose `fromProgramSlug` is enterable.
- `wc -l`: redemptions-flights.ts 256, redemptions-flights-europe.ts 279, redemptions-hotels.ts 378, redemptions.ts 14 — all < 500
- `npm run build` exit 0 (generates the gitignored `next-env.d.ts` that typecheck needs), `npm run typecheck` exit 0, `npm run lint` exit 0
- `git status --short` empty afterwards — Task 1 changed nothing

### Held-draft dossier (kept for a future pass)

Both entries live in `src/data/redemptions-hotels.ts`, `partnerProgramSlug: "marriott-bonvoy"`, `verifiedAt: null`. Neither is ranked or shown.

| Slug | Current draft figures | What to check on marriott.com |
|------|----------------------|-------------------------------|
| `st-regis-maldives` (St. Regis Maldives Vommuli, overwater villa) | 100K–160K pts/night; cashFareCents 280,000 ($2,800/night incl. taxes+service, seaplane excluded); taxesFeesCents 0; `plan_ahead` | Standard-award points for an overwater garden villa on a high-season date (Feb/Mar 2027) and a shoulder date (May/Nov) for the min/max range; cash rate for the same dates incl. taxes/service (seaplane as a separate line); whether 5th-night-free still applies on standard awards |
| `gritti-palace-venice` (The Gritti Palace, Grand Canal) | 90K–140K pts/night; cashFareCents 210,000 ($2,100/night incl. taxes, city tax excluded); taxesFeesCents 0; `plan_ahead` | Standard-award points for a base room on a high-season date (June 2027 / Biennale weekend) and an off-peak date; cash rate incl. taxes (confirm Venice city tax is collected at the property, not in the site rate); awards bookable on marriott.com for the base category |

## Task 2: Nick's ruling

Checkpoint returned with the dossier (commit `c23c837`). Nick's reply, relayed by the orchestrator on 2026-09-21: **"keep as drafts"** for both `st-regis-maldives` and `gritti-palace-venice`; **"batch 1 verified"** (zero entries). **V1 = 34.**

### Per-slug rulings

| Slug | Ruling | verifiedAt after | Action |
|------|--------|------------------|--------|
| (batch-1 entries) | — | — | none — batch1 = 0 |
| st-regis-maldives | keep as draft | `null` (unchanged) | header comment + ruling log only |
| gritti-palace-venice | keep as draft | `null` (unchanged) | header comment + ruling log only |

## Task 3: Apply rulings, raise the floor, reseed (no-op)

Commit `2d6ac53`:

- `tests/seed-data.test.ts` — `toBeGreaterThanOrEqual(30)` -> `toBeGreaterThanOrEqual(34)`; test title `≥34`; comment names Phase 7 batch 1 / plan 07-06 / 2026-09-21 / D7-03 and the keep-as-drafts ruling. `grep -n "toBeGreaterThanOrEqual(34)"` -> line 165. V1 = 34 = seed-file verified count, exactly.
- `src/data/redemptions-hotels.ts` — header comment now states the two held drafts were re-ruled "keep as drafts" by Nick on 2026-09-21 (Phase 7 batch 1) and that the launch dataset is the 34 verified entries per D7-03. No entry data changed.
- `.planning/phases/02-redemption-database/02-05-corrections.md` — new `## Phase 7 batch 1 (2026-09-21)` section: batch1 = 0 per D7-03, both drafts kept, V1 = 34, floor 30 -> 34, reseed no-op, ruling text.

### Reseed: intentionally skipped (no-op)

No seed row changed in this plan (zero drafts added, zero `verifiedAt` set, zero sourceNotes rewritten). Neon was seeded at 02-05 with 36 redemptions / 34 verified and already mirrors the files, so `npm run db:seed` (a destructive delete/insert) was **not** run and the DB-count one-liner was **not** run. The worktree contains no `.env*` file, none was created, and no DB command was executed — so no command output could contain a connection-string fragment (T-07-11). The plan's "Neon matches the repo" truth holds via the 02-05 Task 3 proof (34 verified in DB = 34 in seed), which nothing since has invalidated.

### Full local gate (after the edits)

- `npm test` -> 22 files, 333/333 passed (floor at 34 green)
- `npm run build` exit 0, then `npm run typecheck` exit 0, `npm run lint` exit 0
- `git status --short` clean after the commit; no deletions in `2d6ac53`

## Decisions Made

- batch1 = 0 taken literally: nothing drafted, nothing photographed, no placeholder split files
- Reseed treated as a data-change trigger, not a ritual: skipped because no row changed (and the worktree has no DATABASE_URL — a reseed would have required a human-action checkpoint, which the no-op made unnecessary)
- Held-draft dossier kept in this SUMMARY (not in the seed file) so a future pass has the check list without adding noise to the data

## Deviations from Plan

### Auto-fixed Issues

No code deviations. Process notes:

**1. [Rule 3 - Blocking] Worktree base behind the expected commit**
- **Found during:** startup branch check
- **Issue:** worktree HEAD was `30428ed` (end of Phase 6); merge-base with the expected `38dca22` was `30428ed`, and the Phase 7 planning directory did not exist on disk
- **Fix:** the sanctioned `git reset --hard 38dca22` from the spawn instructions (clean tree, nothing discarded)
- **Files modified:** none

**2. [Rule 3 - Blocking] Plan's `tsx -e` count one-liner does not work as written**
- **Found during:** Task 1 verify
- **Issue:** `npx tsx -e "import('./src/data/index.ts')..."` resolves the barrel as a CJS-shaped namespace (`['default', 'module.exports']`), so `d.redemptions` is undefined; same with `--input-type=module`
- **Fix:** equivalent check written as a scratchpad script (outside the repo) with a static import; output recorded above. No repo change. 07-08 should use a script file rather than the `-e` form.

**3. [Observation] Reseed and DB-count steps skipped** — see "Reseed: intentionally skipped". Not a gap: the plan's reseed exists to make Neon mirror the seed files, and they were already identical.

**4. [Observation] Verify order: build before typecheck** — `next-env.d.ts` is gitignored (07-03 Deviation 3); `npm run build` ran before `npm run typecheck` both times.

## Issues Encountered

- `npm ci` emitted the same dev-only deprecation warnings 07-01 recorded (glob 7, uuid 8, eslint 9.39.5). Nothing installed beyond the lockfile.

## User Setup Required

None. No dashboard, env, or DB action.

## Known Stubs

None — no application code was written.

## Threat Flags

None. T-07-10 (false verification): no `verifiedAt` was set; both drafts stay `null` exactly as ruled. T-07-11: no DB command run, no env file present or created. T-07-05 / T-07-09: no images touched. T-07-22: floor raised only to the achieved count (34), in the same commit as the ruling log.

## Next Phase Readiness (handoff for 07-08 / 07-07 / 07-10)

- **07-08:** `batch2 = 0` per D7-03 — no drafting, no photos. The CI floor is **already at 34**; do not raise it again unless verified rows are actually added. 07-08 still owns the launch-week re-verify of the **8 featured entries** and the dated **amex-mr -> hilton-honors +30% bonus (ends 2026-10-14)**; if that pass changes any row, that is the first point since 02-05 where a reseed is warranted. Use a script file for the count check (Deviation 2).
- **07-07:** nothing here needs deploying on its own — `2d6ac53` is test/comment/docs only and rides along with the wave-4 push.
- **07-10:** dataset ships at 36 total / 34 verified; the two Marriott drafts remain hidden. Dossier above if Nick ever wants to verify them post-launch.

## Self-Check: PASSED

- FOUND: .planning/phases/07-editorial-polish-launch/07-06-SUMMARY.md
- FOUND: tests/seed-data.test.ts (`toBeGreaterThanOrEqual(34)` at line 165)
- FOUND: src/data/redemptions-hotels.ts (header mentions "keep as drafts" ruling)
- FOUND: .planning/phases/02-redemption-database/02-05-corrections.md (`## Phase 7 batch 1 (2026-09-21)`)
- FOUND commits: c23c837, 2d6ac53
- STATE.md / ROADMAP.md / REQUIREMENTS.md untouched; no `.env*` file created; `src/data/index.ts` unchanged; working tree clean before the SUMMARY commit

---
*Phase: 07-editorial-polish-launch*
*Completed: 2026-09-21*
