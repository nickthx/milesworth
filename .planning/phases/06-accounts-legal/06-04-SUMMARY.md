---
phase: 06-accounts-legal
plan: 04
subsystem: api
tags: [server-actions, clerk, drizzle, neon, zod, vitest, vi.mock, tdd, security]

# Dependency graph
requires:
  - phase: 06-accounts-legal
    plan: 02
    provides: users/user_balances/bookmarks/travel_goals tables (cascade FKs, uniqueIndex conflict targets); balancesSchema / bookmarkSlugSchema / goalSchema / goalIdSchema; MAX_BALANCE shared ceiling
  - phase: 06-accounts-legal
    plan: 03
    provides: src/proxy.ts clerkMiddleware() on every non-static, non-/og request so auth() resolves in Server Actions and RSC pages
  - phase: 05-credibility-layer
    provides: src/app/actions/interest.ts contract (use server, ActionState shape, raw FormData → safeParse, bare catch, neutral copy) and the @/db grep gate
provides:
  - src/app/actions/account.ts — saveBalances, setBookmark, addGoal, deleteGoal, deleteAccount + ActionState; session gate, Zod before DB, userId-scoped mutations, neutral copy, DB-before-Clerk delete
  - src/lib/server/account-data.ts — loadAccountSnapshot(userId) (three scoped selects → AccountSnapshot | null) + pure filterKnownBookmarks / rowsToBalances + TravelGoalRow type
  - tests/account-actions.test.ts — first vi.mock usage in the repo (Clerk server, next/cache, @/db fake) pinning T-06-01/02/03/04/06
  - tests/guest-flow-gate.test.ts — permanent source-scan gate for src/components, static routes, proxy, schema FKs, and the @/db importer set
  - 06-VALIDATION.md wave_0_complete: true (all six Phase 6 test files exist)
affects: [06-05, 06-06, 06-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Action contract: `await auth()` first, safeParse second, `db.batch` third, fixed copy only — userId never a parameter"
    - "ensureUser(userId) upsert leads every writing batch so a bookmark or goal before any Save never violates the users FK"
    - "Empty-input branch is explicit: zero balances → scoped delete, no notInArray([]) / .values([]) (Pitfall 10)"
    - "vi.hoisted + vi.mock with a recording fake db; @/db spread from importOriginal so schema tables stay real and the lazy Proxy never connects"
    - "Guest-flow invariants are a test (tests/guest-flow-gate.test.ts), not a plan-time grep; new components fail CI if they import @/db, drizzle-orm, or @clerk/nextjs/server"

key-files:
  created:
    - src/lib/server/account-data.ts
    - src/app/actions/account.ts
    - tests/account-data.test.ts
    - tests/account-actions.test.ts
    - tests/guest-flow-gate.test.ts
    - .planning/phases/06-accounts-legal/06-04-SUMMARY.md
  modified:
    - .planning/phases/06-accounts-legal/06-VALIDATION.md

key-decisions:
  - "deleteAccount takes no parameters: eslint's no-unused-vars has no underscore exemption here, and a zero-arg async function is still assignable to useActionState's (state, payload) signature, so 06-06 can call useActionState(deleteAccount, initial) unchanged"
  - "The @/db importer set is now exactly three files (actions/interest.ts, actions/account.ts, lib/server/account-data.ts) and is enforced by a test rather than by the Phase 5 grep"
  - "Doc comments never spell out the grep-gated `eq(table.userId, userId)` form so the scoped-select count stays exactly 3 (same lesson as 06-02 / 06-03)"

patterns-established:
  - "Recording fake db for Server Action tests: insert → { values: () => item } where item carries onConflictDoNothing/onConflictDoUpdate returning itself; delete → { where: mocks.where }; batch/where resolve by default and are rejected per-test with mockRejectedValueOnce"
  - "Call-order assertions via mock.invocationCallOrder[0] for cross-service sequencing (DB cascade before Clerk deleteUser)"

requirements-completed: [ACCT-01, ACCT-02, ACCT-03, ACCT-04]

# Metrics
duration: ~7min
completed: 2026-09-14
---

# Phase 06 Plan 04: Account Server Actions, Read Module, and Guest-Flow Gate Summary

**Five thin `"use server"` actions that open with `await auth()`, validate with the 06-02 Zod schemas, write idempotent userId-scoped `db.batch` statements, and answer only with fixed neutral copy — plus a server-only `loadAccountSnapshot` reader, 43 new mocked/pure/source-scan tests (including the DB-before-Clerk delete order under a rejected DB call), and a permanent guest-flow gate that fails if any component ever imports the DB or Clerk server code.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-09-14T17:37:20Z
- **Completed:** 2026-09-14
- **Tasks:** 3 (1 auto, 2 TDD)
- **Files modified:** 7 (6 created, 1 modified)

## Accomplishments

- `src/lib/server/account-data.ts` (116 lines): `loadAccountSnapshot(userId)` runs three `Promise.all` selects, each `.where(eq(table.userId, userId))` (count = 3 exactly), maps through `rowsToBalances` (enterable slug + positive safe int ≤ `MAX_BALANCE`, else dropped; `null` when nothing survives) and `filterKnownBookmarks(slugs, redemptions)` (unknown dropped, deduped, first-seen order), and returns `null` from a bare `catch` — zero `console.` outside comments, no `"use client"`. Exports `AccountSnapshot`, `TravelGoalRow`.
- `src/app/actions/account.ts` (244 lines): `"use server";` on line 1; `const { userId } = await auth();` exactly 5 times (one per action, first statement); four `safeParse` calls; `ensureUser` upsert on `users.clerkUserId` leads every writing batch; `saveBalances` does scoped `notInArray` delete + `onConflictDoUpdate` on `(userId, programSlug)` with `excluded.points` / `now()`, or a plain scoped delete when the map is empty; `setBookmark` inserts with `onConflictDoNothing` on `(userId, redemptionSlug)` or deletes by `(userId, slug)`; `addGoal` inserts with `"" → null`; `deleteGoal` deletes by `and(id, userId)`; `deleteAccount` awaits `db.delete(users)` before `clerkClient().users.deleteUser(userId)`. `grep -E 'console\.|throw |\.message'` outside comments = 0.
- `tests/account-data.test.ts`: 11 tests — 4 filter cases, 4 balance cases, 3 source-scan assertions.
- `tests/account-actions.test.ts` (235 lines, 17 tests): `vi.hoisted` mocks for `auth`, `deleteUser`, `revalidatePath`, `batch`, `del`, `ins`, `where`; `vi.mock` of `@clerk/nextjs/server`, `next/cache`, and `@/db` (spread from `importOriginal`). Covers: null session → all five actions error with zero db calls; save → batch of 3 / of 2 for `{}` / error for `-1` / neutral copy on a rejected batch; bookmark bad-slug / add / remove; goal add / 281-char reject; goal delete `"7"` / `"abc"`; **delete order** (`del.invocationCallOrder[0] < deleteUser.invocationCallOrder[0]`), **rejected DB delete → `deleteUser` never called and `"boom"` absent from the result**, success copy; `"use server"` first-line + no-log/throw/message scan.
- `tests/guest-flow-gate.test.ts` (127 lines, 15 tests): every `.ts/.tsx` under `src/components` (12 files) lacks `from "@/db`, `drizzle-orm`, `@clerk/nextjs/server`, `CLERK_SECRET_KEY`; `src/app/page.tsx` has no `export const dynamic`; `/methodology`, `/privacy`, `/og` import neither Clerk server helpers nor `@/db`; `src/proxy.ts` has `export default clerkMiddleware()` and no `auth.protect`; no `middleware.ts` at either location; the schema text after `pgTable("users"` has exactly 3 `references(() => users.clerkUserId` and none into `programs`/`redemptions`; the `@/db` importer set across `src/app`, `src/components`, `src/lib` equals exactly the three server files (backslashes normalized for Windows).
- `06-VALIDATION.md`: `wave_0_complete: true`, all six Wave 0 test-file boxes ticked, the four `❌ W0` File-Exists cells now `✅`; `nyquist_compliant: false` left for 06-07.

## Task Commits

1. **Task 1: account-data read module + pure helper tests** - `37c4ea7` (test, RED — module absent), `1a100a0` (feat, GREEN — 11/11)
2. **Task 2: five account Server Actions** - `f6492be` (feat)
3. **Task 3: mocked action tests + guest-flow gate + VALIDATION wave_0** - `1addc24` (test — 32/32)

**Plan metadata:** see final docs commit for this SUMMARY

## Files Created/Modified

- `src/lib/server/account-data.ts` - New. Only DB reader for user data; scoped selects; null on failure; read-time filters.
- `src/app/actions/account.ts` - New. Five actions + `ActionState`; `NEUTRAL_ERROR` / `SIGN_IN_FIRST` constants; `ensureUser` and `revalidateAccountViews` helpers.
- `tests/account-data.test.ts` - New. Pure-helper cases + source scan.
- `tests/account-actions.test.ts` - New. First `vi.mock` in the repo; fake db; call-order and rejection tests.
- `tests/guest-flow-gate.test.ts` - New. Recursive `readdirSync` scans; schema FK rule; importer-set equality.
- `.planning/phases/06-accounts-legal/06-VALIDATION.md` - `wave_0_complete: true`; Wave 0 checklist and File Exists column updated.

## Verification

- `npx vitest run` → 20 files, 289 tests passed (was 17 / 246; +11 account-data, +17 account-actions, +15 guest-flow-gate)
- `npm run typecheck` → exit 0; `npm run lint` → exit 0 (0 warnings after the deleteAccount signature change)
- `grep -rlE 'from "@/db|drizzle' src/components src/app src/lib` → exactly `src/app/actions/account.ts src/app/actions/interest.ts src/lib/server/account-data.ts`
- Task 1 greps: `loadAccountSnapshot` export = 1; scoped `eq(.*\.userId, userId)` = 3; `console.` outside comments = 0; 3 function exports, 2 type exports; `"use client"` = 0
- Task 2 greps: `head -1` = `"use server";`; `await auth();` = 5; 5 action exports; `ActionState` = 1; `safeParse` = 4; `console\.|throw |\.message` = 0; `users.deleteUser(userId)` = 1; `db.delete(users)` line precedes `deleteUser` line (awk exit 0); scoped counts goals = 1, bookmarks = 1, balances = 2
- Task 3 greps: `vi.hoisted` = 2, the three `vi.mock("…")` strings = 1 each; gate file references `proxy.ts`, `privacy`, `og`, `methodology`, `pgTable("users"`; `wave_0_complete: true` = 1, `nyquist_compliant: false` = 1, unchecked `tests/` boxes = 0
- Post-commit deletion check: 0 tracked files deleted across the four commits
- Secrets hygiene: `.env.development.local` never read or printed; `git status --porcelain | grep '\.env'` empty at every commit

## TDD Gate Compliance

- Task 1 (`tdd="true"`): `37c4ea7` `test(...)` RED (import of a missing module, "no tests" ran) → `1a100a0` `feat(...)` GREEN (11/11). Compliant.
- Task 3 (`tdd="true"`): the plan sequences the module under test (Task 2, `f6492be`) *before* this task's tests, so the `test(...)` commit `1addc24` went green on first run by design — there is no separate RED/GREEN pair for Task 3 and no `feat` commit follows it. The "passes unexpectedly" fail-fast rule does not apply: the behaviors were implemented one task earlier, and the A10 guidance ("get one test green before writing the rest") was followed — the whole file ran green on the first execution, confirming the `vi.mock` shape. No refactor commits.

## A10: vi.mock shape

Worked first try. The exact shape from the plan (`vi.hoisted` bundle → three `vi.mock` calls → imports) ran 17/17 on the first `vitest run`; no hoisting issues, no request-scope errors from `next/cache` (mocked), and `importOriginal<typeof import("@/db")>()` spread the real schema tables while the lazy `db` Proxy never connected. Deviations from the specified fake-db shape:

- `insert` records through `mocks.ins` and returns `{ values: () => item }` where `item` is a single self-returning object exposing `onConflictDoNothing` / `onConflictDoUpdate` — needed because `addGoal` batches a bare `.values(...)` result while the other inserts chain an `onConflict*`.
- No `ITEM` constant; `select` is an unused `vi.fn()` as planned.
- One extra hoisted mock (`ins`) so `dbUntouched()` can assert inserts as well as deletes and batches.

## Decisions Made

- **`deleteAccount()` has no parameters.** See Deviations 1. Still `useActionState`-compatible; the client dialog in 06-06 is unaffected.
- **Test count and layout** exceed the plan minimums (≥ 6 / ≥ 14 / ≥ 8 → 11 / 17 / 15) because the `<behavior>` rows were split into one `it` per assertion cluster and a rejected-batch case was added to `saveBalances` to cover T-06-04 on the save path too.
- **Comment wording** in both server modules avoids the literal `eq(table.userId, userId)` shape and any `.message` / `throw` tokens so the acceptance counts are exact.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `deleteAccount(_prev, _formData)` failed `npm run lint`**
- **Found during:** Task 2 verification
- **Issue:** `@typescript-eslint/no-unused-vars` flagged both parameters (the project's flat config has no `argsIgnorePattern: "^_"`; `addGoal`/`deleteGoal` pass only because `_prev` precedes a used `formData`). The plan's `npm run lint` gate could not pass with the specified signature.
- **Fix:** Removed both parameters (`export async function deleteAccount(): Promise<ActionState>`), matching RESEARCH Pattern 9's original shape. TypeScript accepts a zero-arg function wherever `(state, payload) => Promise<state>` is expected, so `useActionState(deleteAccount, initial)` in 06-06 still typechecks; the action still opens with `await auth()` and ignores any payload. A comment records the reason.
- **Files modified:** src/app/actions/account.ts
- **Commit:** f6492be

**2. [Rule 1 - Bug] Doc comment inflated the scoped-select count**
- **Found during:** Task 1 verification
- **Issue:** The header comment said "Every select is scoped by eq(table.userId, userId)", so `grep -c 'eq(.*\.userId, userId)'` read 4 instead of the required 3.
- **Fix:** Rephrased to "scoped by the session user"; count is exactly 3.
- **Files modified:** src/lib/server/account-data.ts
- **Commit:** 1a100a0 (folded in before the GREEN commit)

### Minor (not acceptance criteria)

- `src/lib/server/account-data.ts` is 116 lines (plan guidance: under 110) and `src/app/actions/account.ts` is 244 lines (guidance: under 200). Both overruns are prettier's multi-line formatting of the drizzle builder chains plus the threat-ID header comments; every acceptance grep holds and nothing was omitted. Not compressed further because shortening would mean removing the T-06-xx rationale comments the plan asks for.

## Issues Encountered

- None beyond the deviations above. `vitest` prints a pre-existing Vite warning about `vitest.config.ts` being ESM loaded as CommonJS (`configLoader: 'native'`); unrelated to this plan, not touched.
- `.vscode/` remains untracked and unrelated; left alone.

## Known Stubs

None. Every action writes real rows; the read module returns real data. `/account` (the page that renders `AccountSnapshot`) and the client components that call these actions are 06-05 / 06-06 work by design — nothing here renders to the UI yet, so no empty values flow anywhere.

## Threat Flags

None beyond the plan's register. The five Server Action endpoints and the Clerk Backend API call are exactly the surfaces enumerated in `<threat_model>` (T-06-01…06, T-06-14 accepted, T-06-15). No new schema, file access, or network path was introduced.

## Next Phase Readiness

- 06-05 can `import { saveBalances, setBookmark } from "@/app/actions/account"` and `import type { ActionState }` in `"use client"` components (never `@/db`, never `@clerk/nextjs/server` — the gate test enforces it), and thread `await auth()` + `loadAccountSnapshot(userId)` into `src/app/page.tsx` (`AccountSnapshot.balances` → `savedBalances`, `.bookmarkedSlugs`).
- 06-06 can build `/account` on `loadAccountSnapshot` (`goals: TravelGoalRow[]`) with `useActionState(addGoal)`, `useActionState(deleteGoal)`, and `useActionState(deleteAccount, initial)` — note `deleteAccount` accepts no arguments.
- 06-07's Nyquist sign-off flips `nyquist_compliant: true`; `wave_0_complete` is already true.

## Self-Check: PASSED

- `src/lib/server/account-data.ts` — FOUND
- `src/app/actions/account.ts` — FOUND
- `tests/account-data.test.ts`, `tests/account-actions.test.ts`, `tests/guest-flow-gate.test.ts` — FOUND
- `06-VALIDATION.md` `wave_0_complete: true` — FOUND
- Commits 37c4ea7, 1a100a0, f6492be, 1addc24 — all present in `git log`

---
*Phase: 06-accounts-legal*
*Completed: 2026-09-14*
