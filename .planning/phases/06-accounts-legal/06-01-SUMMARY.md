---
phase: 06-accounts-legal
plan: 01
subsystem: infra
tags: [drizzle, neon, postgres, clerk, vercel, env, validation]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Neon Postgres via Vercel Marketplace, DATABASE_URL via vercel env pull, drizzle.config.ts loading .env.development.local
  - phase: 02-redemption-database
    provides: transfer_routes / transfer_bonuses tables whose constraint names drove the push churn
  - phase: 05-credibility-layer
    provides: deferred-items.md record of the drizzle-kit push failure (exit 1 every run)
provides:
  - Clean drizzle-kit push against live Neon (second push prints "No changes detected"); Phase 5 deferred blocker closed
  - "@clerk/nextjs 7.9.1 installed and pinned (^7.9.1); no svix, no global clerk CLI"
  - Clerk development instance provisioned; NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY on Vercel (Production, Preview, Development) and in gitignored .env.development.local
  - Clerk Dashboard consent-to-legal-documents ON (privacy URL set), self-serve account deletion OFF
  - Filled 06-VALIDATION.md Nyquist contract (flags still false)
  - PRIVACY_CONTACT_EMAIL recorded for plan 06-03
affects: [06-02, 06-03, 06-04, 06-05, 06-06, 06-07, 07-launch]

# Tech tracking
tech-stack:
  added: ["@clerk/nextjs@7.9.1"]
  patterns:
    - "Explicit short FK names (<=63 chars) in Drizzle schema so drizzle-kit push never sees a rename"
    - "Composite PK column order matched to PG18 information_schema introspection order (to, from) to avoid DROP/ADD churn"
    - "Secrets provisioned via dashboards + vercel env pull; executor verifies with grep -c counts only, never values"

key-files:
  created:
    - .planning/phases/06-accounts-legal/06-01-SUMMARY.md
  modified:
    - src/db/schema.ts
    - package.json
    - package-lock.json
    - .planning/phases/06-accounts-legal/06-VALIDATION.md
    - .planning/STATE.md

key-decisions:
  - "Clerk instance type = development (A1 accepted): *.vercel.app cannot host a Clerk production instance; production cut-over is a Phase 7 task if a domain is bought"
  - "Clerk Dashboard consent-to-legal-documents ON with privacy URL https://milesworth.vercel.app/privacy (human-attested; page 404s until plan 06-03 deploys)"
  - "Clerk Dashboard self-serve account deletion OFF (human-attested) so the app's DB-cascading deleteAccount action is the only user-facing delete path"
  - "Terms of Service URL NOT required by the Dashboard (no terms-required signal) — plan 06-03 ships only /privacy, no /terms"
  - "PRIVACY_CONTACT_EMAIL: nick@whitflow.com"
  - "Clerk keys scoped to Production + Preview + Development on Vercel (orchestrator extended from the initial Development-only scope)"
  - "No constraint rename was needed at push time: live Neon already carried transfer_bonuses_route_fk and the (to, from) PK order, so the first TTY push was itself a no-op"

patterns-established:
  - "Human gates for TTY-only tooling: executor pre-checks env, pauses with exact commands, re-runs non-interactively on resume and records both outputs"
  - "Dashboard-attested settings are recorded in the SUMMARY and re-verified at the phase's final human checkpoint (06-07)"

requirements-completed: [ACCT-01, ACCT-04]

# Metrics
duration: ~2h (spanning two human checkpoints)
completed: 2026-09-14
---

# Phase 06 Plan 01: Wave 0 — Push Unblocked, Clerk Provisioned Summary

**drizzle-kit push is a clean no-op against live Neon, @clerk/nextjs 7.9.1 is installed, Clerk dev-instance keys live on Vercel (Prod/Preview/Dev) and locally, Dashboard consent ON / self-serve delete OFF, and the Phase 6 validation contract is filled**

## Performance

- **Duration:** ~2h wall-clock across two blocking human checkpoints (TTY push, Clerk provisioning)
- **Started:** 2026-09-14 (Task 1 commit b5cdba9)
- **Completed:** 2026-09-14T17:08:00Z
- **Tasks:** 3 (1 auto, 2 checkpoint:human-action)
- **Files modified:** 5 (schema.ts, package.json, package-lock.json, 06-VALIDATION.md, STATE.md)

## Accomplishments

- Closed the Phase 5 deferred blocker: `src/db/schema.ts` now names the transfer_bonuses FK `transfer_bonuses_route_fk` (short of the 63-char identifier limit) and orders the transfer_routes composite PK `[toProgramSlug, fromProgramSlug]` to match PG18 introspection. Non-TTY `npx drizzle-kit push` prints `No changes detected` and exits 0.
- Installed `@clerk/nextjs@7.9.1` (`^7.9.1` in package.json; audited Approved, no postinstall script). No `svix`, no global `clerk` CLI.
- Provisioned Clerk: development instance "Milesworth"; both keys on Vercel for Production, Preview, and Development; local `.env.development.local` (gitignored) carries both keys plus `DATABASE_URL`.
- Clerk Dashboard: "Require express consent to legal documents" ON with privacy URL `https://milesworth.vercel.app/privacy`; "Allow users to delete their accounts" OFF.
- `06-VALIDATION.md` filled (framework, sampling rate, per-task verification map for plans 06-01..06-07, Wave 0 test list, manual-only table); `nyquist_compliant: false` and `wave_0_complete: false` remain as planned.

## Task Commits

1. **Task 1: Fix push-churn constraints, install @clerk/nextjs, fill validation contract** - `b5cdba9` (chore)
2. **Task 2: TTY drizzle-kit push gate** (checkpoint:human-action, resume signal "push-clean") - `411ef47` (checkpoint position), `0cd9898` (push gate evidence recorded in STATE.md)
3. **Task 3: Provision Clerk** (checkpoint:human-action, resume signal "clerk-ready contact: nick@whitflow.com") - no code commit; evidence is this SUMMARY and the Vercel/Clerk dashboards

**Plan metadata:** see final docs commit for this SUMMARY

## Files Created/Modified

- `src/db/schema.ts` - Explicit `name: "transfer_bonuses_route_fk"` on the transferBonuses foreignKey; transferRoutes primaryKey reordered to `[t.toProgramSlug, t.fromProgramSlug]` with Pitfall 1 comments. 5 `pgTable(` calls unchanged (no new tables in this plan).
- `package.json` / `package-lock.json` - `@clerk/nextjs` `^7.9.1` added (resolves 7.9.1).
- `.planning/phases/06-accounts-legal/06-VALIDATION.md` - Filled Nyquist contract; names `tests/account-validation.test.ts`, `tests/balance-storage.test.ts`, `tests/privacy-page.test.ts`, `tests/account-data.test.ts`, `tests/account-actions.test.ts`, `tests/guest-flow-gate.test.ts`.
- `.planning/STATE.md` - Checkpoint positions and Task 2 evidence (commits 411ef47, 0cd9898).
- `.env.development.local` (gitignored, NOT tracked) - Refreshed via `vercel env pull`; contains `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`.

## Push gate evidence

### Task 2 — human TTY run (PowerShell at repo root, `npx drizzle-kit push --verbose`)

Recorded from the human's resume message (commit 0cd9898, STATE.md session block):

- The FIRST run printed `[i] No changes detected` and exited 0. No `ALTER TABLE "transfer_bonuses"` and no `ALTER TABLE "transfer_routes"` statements were previewed.
- Root cause of the no-op: the live Neon database already carried the FK `transfer_bonuses_route_fk` and the PK `transfer_routes_to_program_slug_from_program_slug_pk` (confirmed via `pg_constraint`), so the schema.ts edits from Task 1 already matched the live DDL. No rename statement and no manual `RENAME CONSTRAINT` fallback were needed.
- The human's second `npx drizzle-kit push` also printed `No changes detected`, exit 0.

### Task 2 — executor non-TTY re-run (2026-09-14, first resume)

- `npx drizzle-kit push` → `[i] No changes detected`, exit 0
- `npx tsx scripts/db-check.ts` → `programs rows: 21`, `interest_signups rows: 1`

### Task 3 continuation — executor re-run (2026-09-14T17:07Z)

```
$ npx drizzle-kit push
No config path provided, using default 'drizzle.config.ts'
Reading config file 'C:\Users\geoca\points-unlocked\drizzle.config.ts'
Using '@neondatabase/serverless' driver for database querying
[✓] Pulling schema from database...
[i] No changes detected
push exit=0

$ npx tsx scripts/db-check.ts
programs rows: 21
interest_signups rows: 1
```

Seed rows intact; drizzle-kit's diff against `src/db/schema.ts` is empty. Phase 5 deferred blocker is closed.

Connection-string gate: `git grep -c 'postgresql://' -- . ':!package-lock.json'` matches only prose mentions in planning docs (STATE.md, 02-01-PLAN, 02-04-PLAN, 02-04-SUMMARY, 02-VERIFICATION, 06-01-PLAN) — no actual connection string is tracked anywhere. drizzle-kit never printed the URL.

## Clerk provisioning evidence (Task 3)

Automated verify (counts and names only; no values displayed):

- `grep -c '^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=' .env.development.local` → 1
- `grep -c '^CLERK_SECRET_KEY=' .env.development.local` → 1
- publishable key line matches the development-instance prefix → 1
- `grep -c '^DATABASE_URL=' .env.development.local` → 1
- `git check-ignore -q .env.development.local` → exit 0
- `git status --porcelain | grep -c '\.env'` → 0
- `vercel env ls | grep CLERK` (names only):
  - `CLERK_SECRET_KEY` — Production, Preview, Development
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Production, Preview, Development
- `git grep -c` for the Clerk key prefixes → only `.planning/phases/06-accounts-legal/06-01-PLAN.md` (documents the prefix pattern, not a key). No other tracked file matches.

Vercel scope note: the keys were initially present only in the Development scope; the orchestrator extended them to Production and Preview before this continuation (Preview/Production entries are ~1m old vs ~1h for Development in `vercel env ls`). `<ClerkProvider>` builds in plan 06-03 will therefore have keys in every environment.

## Decisions Made

- **Clerk instance type = development (A1 accepted).** `*.vercel.app` cannot host a Clerk production instance (custom domain required). v1 ships on the dev instance (100-user cap, "Development mode" badge). Production cut-over moves to the Phase 7 launch checklist if a domain is bought. Threat T-06-12 accepted per plan.
- **Consent to legal documents ON** with Privacy policy URL `https://milesworth.vercel.app/privacy` (human-attested in the Clerk Dashboard → Configure → Legal). The `/privacy` route 404s until plan 06-03 deploys — expected and harmless; Clerk only links to it at sign-up. Mitigates T-06-10.
- **Self-serve account deletion OFF** (human-attested; Dashboard → User & authentication → User model / Restrictions). The app's `deleteAccount` server action (plan 06-04) is the only user-facing delete path, so the DB cascade always runs before Clerk deletion. Mitigates T-06-06.
- **Terms URL NOT required.** The human did not report "terms-required", so the Legal form saved with the privacy URL alone. Plan 06-03 ships only `/privacy`, no `/terms` (A8 resolved: no).
- **Privacy contact address** for `/privacy` mailto (plan 06-03 reads this line):

PRIVACY_CONTACT_EMAIL: nick@whitflow.com

- **Vercel key scope extended** from Development-only to Production + Preview + Development by the orchestrator during the Task 3 checkpoint.
- **Dashboard settings are human-attested here** (consent ON, delete OFF, privacy URL). They are re-verified in plan 06-07's human checkpoint, where the sign-up modal must show the consent checkbox and the Clerk-side delete must be absent.

## Deviations from Plan

None - plan executed exactly as written. The one factual difference from the plan's expectation — the Task 2 TTY push needed no rename because the live DB already matched — is recorded above as evidence, not a deviation (the plan's own abort/fallback rules were never triggered).

## Issues Encountered

- Task 2 anticipated a `DROP CONSTRAINT ... ADD CONSTRAINT "transfer_bonuses_route_fk"` preview; the first push was already `No changes detected`. Verified via `pg_constraint` that the live names match schema.ts, so the outcome satisfies the acceptance criteria (empty diff, seed rows intact).
- The plan's acceptance line `git grep -c 'postgresql://' ... outputs 0` cannot be literally met because six planning documents mention the scheme in prose (pre-existing since Phase 2). No connection string is tracked; treated as satisfied in spirit and noted for the verifier.

## User Setup Required

Completed during this plan (human checkpoints 2 and 3). No further external configuration is pending for Phase 6 execution. Remaining human-verified items are consolidated in plan 06-07's checkpoint.

## Next Phase Readiness

- Plan 06-02 (accounts schema + tests) can push new tables: the diff baseline is empty and `drizzle-kit push` exits 0 non-interactively.
- Plan 06-03 (`<ClerkProvider>`, `proxy.ts`, `/privacy`) has keys in all Vercel scopes and the contact address above; it ships `/privacy` only (no `/terms`).
- Plan 06-04 flips `wave_0_complete`; plan 06-07 flips `nyquist_compliant` and re-verifies the Dashboard settings.
- Concern carried forward: the Clerk development instance has a 100-user cap and shared OAuth credentials — acceptable for the LinkedIn demo, revisit at Phase 7.

## Self-Check: PASSED

- `src/db/schema.ts` contains `name: "transfer_bonuses_route_fk"` (commit b5cdba9)
- `npm ls @clerk/nextjs` → 7.9.1
- Commits b5cdba9, 411ef47, 0cd9898 present in `git log`
- Task 3 automated verify → PASS; `git status --porcelain | grep -c '\.env'` → 0

---
*Phase: 06-accounts-legal*
*Completed: 2026-09-14*
