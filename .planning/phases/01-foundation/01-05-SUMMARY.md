---
phase: 01-foundation
plan: 05
subsystem: database
tags: [drizzle, neon, postgres, server-components, deployment]

# Dependency graph
requires:
  - phase: 01-foundation (01-02)
    provides: D-04 homepage shell (wordmark, pitch, in-progress note) to extend
  - phase: 01-foundation (01-04)
    provides: Vercel project linked with Git auto-deploy + DATABASE_URL in all envs and .env.development.local
provides:
  - Drizzle layer wired to Neon over drizzle-orm/neon-http (lazy-init client in src/db/index.ts)
  - health_check placeholder table live in Neon, pushed via drizzle-kit push (D-16)
  - Homepage server component queries health_check and renders "infrastructure: live" from real DB data
  - Verified production deployment at https://milesworth.vercel.app (200, noindex, git auto-deployed)
affects: [phase-02-data, phase-04-ui, deployment]

# Tech tracking
tech-stack:
  added: [drizzle-orm@0.45.x, "@neondatabase/serverless@1.1.x", drizzle-kit@0.31.x (dev), tsx (dev)]
  patterns:
    - "drizzle(neon(DATABASE_URL)) via drizzle-orm/neon-http — lazily initialized behind a Proxy so module import never throws at build time"
    - "CLI env loading via guarded process.loadEnvFile('.env.development.local') — no dotenv dependency"
    - "Public error handling: try/catch renders fixed neutral strings, never the caught error (T-01-07)"

key-files:
  created: [src/db/index.ts, drizzle.config.ts, scripts/db-check.ts]
  modified: [src/db/schema.ts, src/app/page.tsx, package.json, package-lock.json]

key-decisions:
  - "Neon client is lazy-initialized (Proxy) so `next build` succeeds without DATABASE_URL in the build shell; connection resolves at first query (request time)"
  - "Homepage is force-dynamic in Phase 1 to prove the live DB path per D-16; Phase 2+ moves to cached reads"

patterns-established:
  - "DB access: import { db, healthCheck } from '@/db'; queries wrapped in try/catch on public pages"
  - "drizzle-kit push for schema iteration (no generated migrations yet)"

requirements-completed: [PLAT-01]

# Metrics
duration: 6min
completed: 2026-09-01
---

# Phase 01 Plan 05: Database Wiring + Production Verification Summary

**Full data path proven end-to-end: schema.ts → drizzle-kit push → Neon → server-component query rendering "infrastructure: live" on the auto-deployed production URL milesworth.vercel.app**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-09-01T01:35:31Z
- **Completed:** 2026-09-01T01:41:29Z
- **Tasks:** 3/3
- **Files modified:** 7

## Accomplishments

- Installed the plan-locked DB stack: drizzle-orm ^0.45.2, @neondatabase/serverless ^1.1.0, drizzle-kit ^0.31.10, tsx (no @vercel/postgres, no Prisma)
- `health_check` placeholder table (id, status default "ok", checked_at) — the only table, per D-16; pushed to Neon with `drizzle-kit push` (no --force needed)
- Round trip proven twice via `scripts/db-check.ts`: insert + select exits 0, "health_check rows: 2, latest status: ok" — no connection details in output (T-01-08)
- Homepage server component (`force-dynamic`) queries `db.select().from(healthCheck).limit(1)` in try/catch; success renders "infrastructure: live", failure renders neutral "infrastructure: warming up" (T-01-07); D-04 content untouched
- Push to main auto-deployed production in ~58s (Building 6s after push; `milesworth-git-main-*` alias confirms Git-integration source; CI run 33459593383 green)
- Production verified: `https://milesworth.vercel.app/` → HTTP 200, body contains "Milesworth", `<meta name="robots" content="noindex, nofollow"/>`, and the exact success text "infrastructure: live" — production DATABASE_URL works through the server component

## Task Commits

| Task | Name | Commit |
| ---- | ---- | ------ |
| 1 | Drizzle deps, health_check schema, client, config | 80f400f |
| 2 | Push schema to Neon + round-trip proof | (no repo files — remote DB state only) |
| 3 | Server component query + production deploy verification | 6cf759b |

## Files Created/Modified

- `src/db/schema.ts` — replaced stub with `healthCheck` pgTable ("health_check")
- `src/db/index.ts` — lazy neon-http Drizzle client + schema re-export
- `drizzle.config.ts` — postgresql dialect, guarded `loadEnvFile`
- `scripts/db-check.ts` — round-trip proof (prints count + status only)
- `src/app/page.tsx` — force-dynamic, DB status line added to shell
- `package.json` / `package-lock.json` — four new packages

## Decisions Made

- Lazy client init (Proxy) instead of eager `export const db = drizzle(neon(...))` — see deviation below
- No other decisions; discretionary choices followed plan defaults

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Lazy-initialized the Neon client so `next build` doesn't throw at module evaluation**
- **Found during:** Task 3 (`npm run build` failed: "No database connection string was provided to neon()")
- **Issue:** Plan specified module-scope `drizzle(neon(process.env.DATABASE_URL!))`. `next build` evaluates page modules during "Collecting page data" but does not load `.env.development.local`, so `neon()` threw at import time and the build exited 1 locally (Vercel builds would pass since env is present there, masking the fragility)
- **Fix:** `src/db/index.ts` wraps client creation in a memoized Proxy — `db` keeps the exact same call-site API (`db.select().from(...)`), but the connection string is read at first query (request time), not import time
- **Files modified:** src/db/index.ts
- **Commit:** 6cf759b

## Issues Encountered

None beyond the deviation above. `vercel inspect` (CLI v57) does not print git commit metadata, so Git-integration provenance was confirmed via the `milesworth-git-main-nick-whitsetts-projects.vercel.app` alias (only created for Git deploys), deploy creation 6s after the push, and the deployed body containing content that only exists in commit 6cf759b.

## Known Stubs

- `src/app/page.tsx` — "In progress — launching soon" note and the health-check status line are intentional Phase 1 shell content (D-04/D-16); Phase 4 replaces the shell with the balance-entry flow, Phase 2 replaces `health_check` with the real schema. Neither blocks this plan's goal.

## Next Phase Readiness

- All three Phase 1 success criteria observably true: public URL serves the built app (200 + content + noindex), Neon connected through Drizzle both locally and in production, push-to-main auto-deploy with green CI
- Phase 2 can replace `src/db/schema.ts` with the real tables (programs, transfer_routes, transfer_bonuses, redemptions) and reuse the established push + db-check pattern
- No blockers

## Self-Check: PASSED

- src/db/schema.ts exists with `export const healthCheck` — FOUND
- src/db/index.ts exists with "neon-http" — FOUND
- drizzle.config.ts exists — FOUND
- scripts/db-check.ts exists — FOUND
- src/app/page.tsx contains `from(healthCheck)` — FOUND
- Commit 80f400f — FOUND in git log
- Commit 6cf759b — FOUND in git log

---
*Phase: 01-foundation*
*Completed: 2026-09-01*
