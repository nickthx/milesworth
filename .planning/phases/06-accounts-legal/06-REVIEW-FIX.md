---
phase: 06-accounts-legal
fixed_at: 2026-09-15T20:49:21Z
review_path: .planning/phases/06-accounts-legal/06-REVIEW.md
iteration: 1
fix_scope: critical_warning
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 06: Code Review Fix Report

**Fixed at:** 2026-09-15T20:49:21Z
**Source review:** .planning/phases/06-accounts-legal/06-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (WR-01..WR-04; 0 Critical; 5 Info out of scope)
- Fixed: 4
- Skipped: 0

**Final gate (run in the isolated worktree after the last fix commit):**
- `npm test` — 20 files, 296 tests passed (289 before; 7 new tests)
- `npm run typecheck` — clean
- `npm run lint` — clean

| ID | Title | Status | Commit | Files |
|----|-------|--------|--------|-------|
| WR-01 | Signing in on an empty `/` never applies the account's saved balances | fixed: requires human verification | `a0c4709` | `src/components/core-experience.tsx`, `tests/balance-storage.test.ts` |
| WR-02 | Server Action transport failure is uncaught; no `error.tsx` in the tree | fixed | `0afb4d6` | `src/components/bookmark-button.tsx`, `src/components/save-balances-button.tsx`, `src/app/error.tsx` (new), `src/lib/site.ts`, `src/app/actions/account.ts`, `tests/guest-flow-gate.test.ts` |
| WR-03 | `/privacy` cookie disclosure is wrong about Clerk's behavior | fixed: requires human verification | `bc248fc` | `src/app/privacy/page.tsx`, `src/lib/site.ts`, `tests/privacy-page.test.ts` |
| WR-04 | The "T-06-02 scoping" test does not assert scoping | fixed | `5837015` | `tests/account-actions.test.ts` |

## Fixed Issues

### WR-01: Signing in on an empty `/` never applies the account's saved balances

**Files modified:** `src/components/core-experience.tsx`, `tests/balance-storage.test.ts`
**Commit:** `a0c4709`
**Applied fix:** Kept the existing one-shot `hydratedRef` mount effect unchanged (it is what stops "clear every field" from re-hydrating from storage). Added a second, prop-driven effect that runs the same pure `resolveInitialBalances(url, stored, savedBalances)` resolver and applies the result only when it answers `"account"` — i.e. URL empty, storage empty, non-empty `savedBalances` — and only if the visitor has not edited (`hasEditedRef`). A new `appliedAccountRef` is set by whichever effect applies the account save, so it happens at most once per mount and the second effect does not issue a duplicate `setParams` on first mount. Storage is still never written by either branch (T-06-09). Differs from the review's sketch in reusing the tested resolver instead of re-listing the precedence checks inline. Added a `resolveInitialBalances` test documenting the null → saved transition.
**Why human verification:** This is a state-handling change; the suite is node-only (no jsdom / testing-library), so the effect itself is not exercised by a test. Walkthrough: open `/` signed out with empty storage, sign in via the modal, confirm the saved balances populate without a reload; then confirm a share link (`/?ur=…`) still wins after sign-in and that clearing fields does not re-hydrate.

### WR-02: Transport failure of `setBookmark` / `saveBalances` is uncaught; no error boundary

**Files modified:** `src/components/bookmark-button.tsx`, `src/components/save-balances-button.tsx`, `src/app/error.tsx` (new), `src/lib/site.ts`, `src/app/actions/account.ts`, `tests/guest-flow-gate.test.ts`
**Commit:** `0afb4d6`
**Applied fix:** Wrapped both awaited Server Action calls in `try/catch`; on rejection the buttons render the fixed neutral copy (the bookmark label reverts via `useOptimistic` once the transition settles, since no revalidation happened). Hoisted the copy to `NEUTRAL_ERROR_MESSAGE` in `src/lib/site.ts` and pointed `account.ts`'s `NEUTRAL_ERROR` at it so the action result and the client fallback cannot drift (`account.ts` is `"use server"` and cannot export a constant itself). Added `src/app/error.tsx`: a `"use client"` boundary in the editorial shell (cream background, display heading, outline "Try again" button calling `reset()`, "Back to your results" link) that never reads the `error` prop. Pinned in `tests/guest-flow-gate.test.ts`: the boundary exists, is a client component, renders no error detail, and both buttons guard their action call. `@/db` importer set is unchanged (test still passes).
**Note:** `src/app/actions/interest.ts` still carries its own literal of the same string; left untouched as out of scope for this finding.

### WR-03: `/privacy` cookie disclosure is factually wrong about Clerk's behavior

**Files modified:** `src/app/privacy/page.tsx`, `src/lib/site.ts`, `tests/privacy-page.test.ts`
**Commit:** `bc248fc`
**Applied fix:** Rewrote the Cookies section: Clerk's script sets `__client_uat` (value `0` while signed out) on every page load, so the guest flow does set that one cookie; `__session` and a `__refresh_…` cookie are set only after sign-in; nothing optional, no analytics, no banner. Tightened the intro sentence from "sends nothing to our server" to "nothing you type is sent to our server" (the cookie is sent; typed balances are not). Bumped `PRIVACY_LAST_UPDATED` to `2026-09-15` because the page promises a new date whenever the policy text changes. Added a test asserting the prose names `__client_uat`, `__session`, `__refresh_`, mentions signed-out visitors, and never says "sets no cookies" / "set only once you sign in". Heading count (7), `mailto:` link, and all existing assertions still pass.
**Why human verification:** The review asks for the cookie list to be confirmed in DevTools on the deployed site in a fresh signed-out profile (and again after sign-in). The copy reflects Clerk 7's documented production behavior but was not verified against the live deployment here. If a `__clerk_db_jwt` cookie appears in production (expected only on development instances), the paragraph needs one more sentence.

### WR-04: The "T-06-02 scoping" test does not assert scoping

**Files modified:** `tests/account-actions.test.ts`
**Commit:** `5837015`
**Applied fix:** Added a `whereQuery()` helper that compiles the drizzle predicate handed to the fake's `.where()` with `new PgDialect().sqlToQuery()` and an `expectScopedToSessionUser()` assertion that the bound params include `"user_123"` and the SQL text filters on `"user_id"` (or `"clerk_user_id"` for `deleteAccount`). Applied to `deleteGoal` (also asserts `7`), `setBookmark(false)` (also asserts the slug), `deleteAccount` (params exactly `["user_123"]`), and both `saveBalances` paths (the cleanup delete and the zero-balance delete). Header comment updated to state what T-06-02 now pins.
**Mutation check:** With `eq(travelGoals.userId, userId)` removed from `deleteGoal`, the suite fails with `expected [ 7 ] to include 'user_123'`; restored, 19/19 pass.

## Skipped Issues

None — all in-scope findings were fixed.

## Notes for the orchestrator

- Fixes were made in an isolated worktree on branch `gsd-reviewfix/06-<pid>` and fast-forwarded onto `main` by the cleanup tail.
- Working-copy files on this Windows checkout are CRLF (`core.autocrlf=true`, no `.gitattributes`), so a bare `prettier --check` flags every file regardless of edits; all touched files pass `prettier --check --end-of-line auto`. `npm run lint` (eslint) is the project's actual gate and is clean.
- Info findings IN-01..IN-05 were out of scope (`fix_scope: critical_warning`) and remain open.

---

_Fixed: 2026-09-15T20:49:21Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
