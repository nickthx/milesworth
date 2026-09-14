---
phase: 01-foundation
plan: 04
subsystem: infra
tags: [vercel, neon, postgres, env-vars, deployment]

# Dependency graph
requires:
  - phase: 01-foundation (01-03)
    provides: GitHub repo nickthx/milesworth with origin remote wired
provides:
  - Vercel project "milesworth" linked locally (.vercel/project.json) and Git-connected — push to main auto-deploys production
  - Neon Postgres provisioned via Vercel Marketplace with DATABASE_URL (+ DATABASE_URL_UNPOOLED) injected into Production, Preview, and Development
  - .env.development.local pulled locally (gitignored) containing DATABASE_URL for drizzle.config.ts / Next.js
affects: [01-05, database, deployment, phase-07-domain]

# Tech tracking
tech-stack:
  added: [vercel-cli@57 (global tool, not a dependency), neon-postgres (marketplace integration)]
  patterns: [env vars flow Vercel → local via `vercel env pull` (never hand-copied), secrets live only in gitignored .env* files]

key-files:
  created: [.vercel/project.json (gitignored), .env.development.local (gitignored), .env.local (gitignored, OIDC token from vercel link)]
  modified: []

key-decisions:
  - "Project name milesworth on team nick-whitsetts-projects; free *.vercel.app subdomain only (D-02, no custom domain)"
  - "Git auto-deploy is unconditional — no required checks or deploy gating (D-06)"
  - "DATABASE_URL sourced exclusively from the Neon Marketplace injection and pulled via `vercel env pull` — never copied by hand"

patterns-established:
  - "Secret hygiene: assert presence of env keys by regex only (^DATABASE_URL=), never echo values"
  - "Local env file for dev is .env.development.local via `vercel env pull` — the file 01-05's drizzle.config.ts loads"

requirements-completed: [PLAT-01]

# Metrics
duration: 3min
completed: 2026-09-01
---

# Phase 01 Plan 04: Vercel + Neon Provisioning Summary

**Vercel project "milesworth" linked with GitHub push-to-main auto-deploy, Neon Postgres installed via Marketplace, and DATABASE_URL flowing both in Vercel envs and a gitignored local .env.development.local**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-09-01T01:29:38Z
- **Completed:** 2026-09-01T01:32:30Z
- **Tasks:** 3/3 (checkpoint pre-satisfied)
- **Files modified:** 0 tracked (3 gitignored artifacts created)

## Accomplishments

- Linked the repo to Vercel project `nick-whitsetts-projects/milesworth` via `vercel link --yes` (.vercel/project.json created, gitignored)
- Confirmed GitHub repo `nickthx/milesworth` is connected for auto-deploy — `vercel git connect` reported "already connected to your project", so every push to main deploys production (D-01, D-06)
- Neon Marketplace integration verified installed: `vercel env ls` shows DATABASE_URL and DATABASE_URL_UNPOOLED for Production, Preview, and Development
- Pulled development env vars locally with `vercel env pull .env.development.local`; file contains a `DATABASE_URL=` line (value never printed)
- Secret hygiene proven: `git check-ignore` passes for `.vercel/project.json`, `.env.local`, and `.env.development.local`; `git ls-files` contains no `.env*` match
- No custom domain configured — app serves only the free *.vercel.app subdomain per D-02

## Task Commits

No per-task code commits exist for this plan: every artifact the plan produces (`.vercel/project.json`, `.env.local`, `.env.development.local`) is intentionally gitignored, and dashboard/integration state lives in Vercel/Neon, not the repo. This matches the plan's threat model (T-01-04: an env file committed once is permanently leaked).

**Plan metadata:** committed with this SUMMARY (docs: complete plan)

## Files Created/Modified

- `.vercel/project.json` (gitignored) — local link to the Vercel project
- `.env.local` (gitignored) — VERCEL_OIDC_TOKEN written by `vercel link`
- `.env.development.local` (gitignored) — development env vars incl. DATABASE_URL, pulled via `vercel env pull`

## Decisions Made

None beyond plan — followed plan as specified (project name "milesworth" was already the plan's suggested discretionary choice).

## Deviations from Plan

None - plan executed exactly as written. Two notes, neither a deviation:

1. **Task 2 checkpoint (blocking human-action) was pre-satisfied.** The Vercel project and Neon integration had been created ~4h before this execution (DATABASE_URL already present in all three environments), so the browser consent flow required no pause. Checkpoint acceptance criteria verified via `vercel env ls` before proceeding.
2. **`vercel git connect` exited 1** with "nickthx/milesworth is already connected to your project" — the desired end state, treated as success.

## Issues Encountered

None. `vercel whoami` confirmed auth as `whitty6417-4095` up front, so no auth gate was raised.

## User Setup Required

None remaining — the Neon Marketplace install (the plan's one human step) is already complete and verified.

## Next Phase Readiness

- DATABASE_URL flows locally and in production — plan 01-05 can wire Drizzle and `drizzle-kit push` immediately using `.env.development.local`
- Push-to-main auto-deploy is live; phase success criteria 1–2 infrastructure half is done
- No blockers

## Self-Check: PASSED

- .env.development.local exists with DATABASE_URL= line (gitignored) — FOUND
- .vercel/project.json exists (gitignored) — FOUND
- `git ls-files` contains no .env* match — VERIFIED
- DATABASE_URL present in Production, Preview, Development via `vercel env ls` — VERIFIED

---
*Phase: 01-foundation*
*Completed: 2026-09-01*
