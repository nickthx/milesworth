---
phase: 06-accounts-legal
plan: 06
subsystem: ui
tags: [clerk, server-actions, react-19, useActionState, shadcn-dialog, rsc, accent-discipline]

# Dependency graph
requires:
  - phase: 06-accounts-legal
    plan: 04
    provides: addGoal / deleteGoal / deleteAccount Server Actions + ActionState; loadAccountSnapshot(userId) + TravelGoalRow / AccountSnapshot; tests/guest-flow-gate.test.ts
  - phase: 06-accounts-legal
    plan: 03
    provides: src/proxy.ts clerkMiddleware() so auth() resolves on /account; ClerkProvider for SignInButton modal and useClerk; site-header link to /account; /privacy "Delete my account" instruction
  - phase: 06-accounts-legal
    plan: 05
    provides: the auth() → loadAccountSnapshot page shape reused here; Save CTA that populates the balances this page lists
  - phase: 05-credibility-layer
    provides: /methodology shell + class constants; advisor-tease.tsx useActionState + live-region pattern
provides:
  - src/app/account/page.tsx — dynamic auth-gated RSC; signed-out prompt with modal sign-in (no redirect); signed-in Saved balances (+ "Open my saved results"), Bookmarks, Travel goals, Delete your account
  - src/components/account/goal-form.tsx — GoalForm: useActionState(addGoal), form reset + live-region focus on success
  - src/components/account/goal-list.tsx — GoalList: per-row Remove form bound to deleteGoal via hidden goalId; type-only TravelGoalRow import
  - src/components/account/bookmark-list.tsx — BookmarkList: server component rendering bookmarked redemptions by title from @/data, unknown slugs skipped
  - src/components/account/delete-account-dialog.tsx — DeleteAccountDialog: shadcn Dialog confirm → deleteAccount → signOut({ redirectUrl: "/" }) on ok
affects: [06-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dynamic auth-gated RSC: `const { userId } = await auth()` picks the branch; the signed-out branch is a prompt (modal SignInButton), never a redirect, so the URL stays linkable"
    - "Restore link = balancesToParams → drop nulls → URLSearchParams → `/?…`, the same canonical short-key shape the share link uses"
    - "One useActionState per list for per-row forms: each row submits its own hidden id; one live region under the list"
    - "Confirm-then-sign-out: the client dialog only calls signOut on `status === \"ok\"`; the server action has already cascaded DB before Clerk"
    - "Shared page Shell component so the three branches (signed-out, null snapshot, signed-in) render the identical methodology-style frame"

key-files:
  created:
    - src/app/account/page.tsx
    - src/components/account/goal-form.tsx
    - src/components/account/goal-list.tsx
    - src/components/account/bookmark-list.tsx
    - src/components/account/delete-account-dialog.tsx
    - .planning/phases/06-accounts-legal/06-06-SUMMARY.md
  modified: []

key-decisions:
  - "A6 confirmed: `useClerk().signOut({ redirectUrl: \"/\" })` typechecks on @clerk/nextjs 7.9.1, so the `router.push` fallback and its `useRouter` import were dropped rather than left as a dead dependency in the effect"
  - "The delete confirm uses the vendored Button `destructive` variant (which exists) and the trigger is `outline`; neither is the accent color, so the ink-only rule holds"
  - "Header comments never spell out the gated tokens (the `@/db` / ORM / Clerk-server import strings) — 'no database, ORM, or Clerk server imports' says the same thing without tripping the forbidden-token grep (same lesson as 06-02/03/04/05)"
  - "Python edits on Windows must pass newline=\"\\n\" — write_text defaults to CRLF and prettier then rewrites every line"

patterns-established:
  - "Account page shell: `Shell({ children })` wraps the methodology <main>/<article>/<header h1> frame so each auth branch returns only its body"
  - "Per-row Server Action forms: `<form action={formAction}><input type=\"hidden\" name=\"goalId\" value={id} /><Button type=\"submit\" disabled={pending}>` with one shared useActionState"

requirements-completed: [ACCT-01, ACCT-02, ACCT-03, ACCT-04]

# Metrics
duration: ~7min
completed: 2026-09-14
---

# Phase 06 Plan 06: `/account` Page, Goals, Bookmarks, and Delete Account Summary

**A linkable, auth-gated `/account` route that reads the session with `auth()`, shows a signed-out visitor a modal sign-in prompt instead of a redirect, and shows a signed-in user their saved balances with a one-click "Open my saved results" restore link, their bookmarks by title, and their travel goals — with `useActionState` forms to add and remove goals and a shadcn-Dialog "Delete my account" flow that runs the DB-before-Clerk server action and signs out to `/` only on success.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-09-14T18:00:02Z
- **Completed:** 2026-09-14T18:06:46Z
- **Tasks:** 3 (all auto)
- **Files modified:** 5 (5 created, 0 modified)

## Accomplishments

- `src/components/account/goal-form.tsx` (98 lines): `"use client"`; `useActionState(addGoal, INITIAL)`; `formRef` + `statusRef`; effect on `status === "ok"` resets the form and focuses the persistent `aria-live="polite"` paragraph; three labelled `h-11` inputs — `text` (`required maxLength={280}`), `destination` (`maxLength={80}`), `targetDate` (`type="date"`) — and an `h-11` submit (`Saving` / `Add goal`). Idle helper copy: "Goals are stored with your account. They do not change your ranking yet."
- `src/components/account/goal-list.tsx` (74 lines): `"use client"`; `import type { TravelGoalRow }` from the server read module (type-only, so nothing server-side enters the bundle); one `useActionState(deleteGoal, INITIAL)` for the whole list; empty state "No goals yet."; each `<li>` shows the goal text, a muted `destination · formatVerifiedDate(targetDate)` line when present, and a per-row `<form>` with `<input type="hidden" name="goalId">` + outline `h-11` Remove button; one live region under the list.
- `src/components/account/bookmark-list.tsx` (49 lines): server component (no directive); `slugs.flatMap` through `redemptions.find((r) => r.slug === slug)` skipping unknowns (Pitfall 6 defense in depth); empty state "No bookmarks yet. Save a redemption from your results."; rows show title (`font-heading text-lg`), destination when non-null, and `~{formatDollars(cashFareCents)} cash fare`.
- `src/components/account/delete-account-dialog.tsx` (88 lines): `"use client"`; `useActionState(deleteAccount, INITIAL)`; `useClerk().signOut({ redirectUrl: "/" })` inside an effect keyed on `status === "ok"`; `<Dialog>` → outline `h-11` trigger "Delete my account" (verbatim match with `/privacy` line 167) → `DialogTitle` "Delete your account?" + `DialogDescription` "…It cannot be undone." → `<form action={formAction}>` with an error-only live region and a `DialogFooter` holding `DialogClose` "Keep my account" (outline) and the `destructive` submit "Deleting" / "Delete everything".
- `src/app/account/page.tsx` (184 lines): async RSC, `export const metadata` ("Your account — Milesworth"), the six methodology class constants, a `Shell` component for the shared frame; `const { userId } = await auth();` → signed-out branch (MUTED prompt, `<SignInButton mode="modal">` around an `h-11` "Sign in" text button, links to `/privacy` "How we handle your data" and `/` "Back to your results"); `loadAccountSnapshot(userId)` → null branch ("Something went wrong loading your account. Refresh the page to try again."); signed-in branch with four `<h2>` sections in order — Saved balances (`<dl>` of program name → `formatPoints`, then `Open my saved results` → `savedResultsHref` built from `balancesToParams` with nulls dropped), Bookmarks, Travel goals (`GoalList` then `GoalForm`), Delete your account (BODY copy + `/privacy` link + `DeleteAccountDialog`) — and a trailing `/` link. No `searchParams`, no segment-config export, no `@/db`.

## Task Commits

1. **Task 1: GoalForm + GoalList (client) and BookmarkList (server)** - `c2100e3` (feat)
2. **Task 2: DeleteAccountDialog (client)** - `34cb5a9` (feat)
3. **Task 3: /account page (dynamic, auth-gated RSC)** - `89f3c19` (feat)

**Plan metadata:** see final docs commit for this SUMMARY

## Files Created/Modified

- `src/app/account/page.tsx` - New. ACCT-01..04 account surface; dynamic auth-gated RSC.
- `src/components/account/goal-form.tsx` - New. ACCT-03 add-goal form.
- `src/components/account/goal-list.tsx` - New. ACCT-03 goal rows with Remove.
- `src/components/account/bookmark-list.tsx` - New. ACCT-02 bookmark titles from seed data.
- `src/components/account/delete-account-dialog.tsx` - New. ACCT-04 confirm → deleteAccount → signOut.

## Verification

- `npx vitest run` → 20 files, 289 tests passed (unchanged count; the guest-flow gate now scans 18 component files including `src/components/account/*`)
- `npm run typecheck` → exit 0; `npm run lint` → exit 0, 0 warnings
- Env-exported `npm run build` → exit 0; route table `ƒ /`, `○ /_not-found`, `ƒ /account`, `○ /methodology`, `ƒ /og`, `○ /privacy` — `/methodology` and `/privacy` rendering modes unchanged (T-06-16). Build output went to the scratchpad; only route lines were printed, no env value displayed.
- `grep -rlE 'from "@/db|drizzle|@clerk/nextjs/server' src/components` → empty
- Task 1 greps: `"use client";` first line in goal-form / goal-list, 0 in bookmark-list; `useActionState(addGoal` = 1; `useActionState(deleteGoal` = 1; `name="goalId"` = 1; `import type { TravelGoalRow }` = 1; `name="text"` / `name="destination"` / `name="targetDate"` / `maxLength={280}` / `type="date"` / `formRef.current?.reset()` = 1 each; `redemptions.find` = 1; forbidden tokens = 0 per file; `h-11` = 5 (goal-form: 3 inputs + 1 button + comment) / 2 (goal-list)
- Task 2 greps: first line `"use client";`; `^export function DeleteAccountDialog` = 1; `useActionState(deleteAccount` = 1; `Delete my account` = 1; `Delete your account?` = 1; `It cannot be undone.` = 1; `signOut(` = 1; `DialogClose` = 3 (≥ 2); forbidden tokens incl. `clerkClient` = 0
- Task 3 greps: `const { userId } = await auth();` = 1; `loadAccountSnapshot(userId)` = 1; `"use client"|export const dynamic|searchParams|from "@/db|drizzle` = 0; `<h2` = 4; `mode="modal"` = 1; `href="/privacy"` = 2; `Open my saved results` = 1; `balancesToParams(` = 1; `<(BookmarkList|GoalList|GoalForm|DeleteAccountDialog)` = 4
- Post-commit deletion check: 0 tracked files deleted across the three commits
- Secrets hygiene: `.env.development.local` sourced only inside a subshell for the build; never printed; `git status --porcelain | grep '\.env'` empty at every commit

## A6: `signOut({ redirectUrl })`

**Typechecked.** `useClerk().signOut({ redirectUrl: "/" })` compiles against the installed `@clerk/nextjs` 7.9.1 with no cast. The plan's fallback (`signOut().then(() => router.push("/"))`) was therefore not used, and the `useRouter` import the plan listed was removed — with A6 holding, the only reference would have been the effect's dependency array.

## Decisions Made

- **`useRouter` dropped.** See A6 above; a hook kept solely to appear in a deps array is clutter and the plan's fallback condition did not trigger.
- **Destructive variant on the confirm.** The vendored Button has `destructive`, so the plan's "if it exists" branch applies; it is a red tint, not the accent, and the trigger stays `outline`.
- **Comment wording.** First drafts of the three Task 1 components named the gated import strings in their header comments and failed the plan's forbidden-token grep; reworded to "no database, ORM, or Clerk server imports" (code unchanged).
- **`Shell` helper on the page.** The three branches share one frame; extracting it kept the file at 184 lines (limit 220) and guarantees identical `<h1>` markup whether or not the visitor is signed in.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Header comments tripped the forbidden-token grep**
- **Found during:** Task 1 verification
- **Issue:** `grep -E 'terracotta|from "@/db|drizzle|@clerk/nextjs/server|!"'` matched comment lines in all three components (they named the imports they avoid).
- **Fix:** Reworded the comments; code unchanged.
- **Files modified:** src/components/account/goal-form.tsx, goal-list.tsx, bookmark-list.tsx
- **Commit:** c2100e3 (folded in before the commit)

**2. [Rule 3 - Blocking] CRLF from Python `write_text` broke `prettier --check`**
- **Found during:** Task 1 verification
- **Issue:** A scripted comment edit wrote CRLF line endings on Windows; prettier flagged every line.
- **Fix:** Re-ran `prettier --write`; subsequent scripted edits pass `newline="\n"`. Working-copy files are CRLF via git autocrlf like the rest of the repo; the index holds LF.
- **Files modified:** src/components/account/goal-form.tsx
- **Commit:** c2100e3 (folded in before the commit)

### Minor (not acceptance criteria)

- `useRouter` / `router` were removed from `delete-account-dialog.tsx` because A6 typechecked (see A6 section). `grep -c 'signOut('` = 1 as required.
- `goal-form.tsx` first landed at exactly 100 lines against "under 100"; two header-comment lines were merged to reach 98.
- `Shell` and `programName` / `savedResultsHref` helpers are not named in the plan; they are local, unexported, and keep the page under its line limit.

## Issues Encountered

- None beyond the deviations above. `next build` prints the pre-existing warning about an ignored `package-lock.json` outside the repo; unrelated.
- `.vscode/` remains untracked and unrelated; left alone.

## Known Stubs

None. Every section renders from `loadAccountSnapshot` data, every form is bound to a tested Server Action, and the empty-state strings appear only when the user genuinely has no rows.

## Threat Flags

None beyond the plan's register. The route reads user data only through the server-only module with the session id (T-06-01/05); the hidden `goalId` is scoped by the action to the session user (T-06-02); the deletion flow requires an explicit confirmation and signs out only after the action reports `ok` (T-06-06); the null snapshot and action errors render fixed copy only (T-06-04); `/methodology` and `/privacy` remain `○` (T-06-16). No new endpoints, schema, or packages.

## Next Phase Readiness

- 06-07's human checkpoint can now walk the full account loop: sign in on `/`, Save my balances, open `/account`, confirm the balances list and "Open my saved results" restores them, bookmark a card and see it under Bookmarks, add and remove a goal, then "Delete my account" → confirm → land on `/` signed out with the Clerk user gone.
- The A5 router-refresh assumption (modal sign-in re-rendering server props) is still owed to that checkpoint; `/account`'s signed-out branch uses the same modal, so a failure there would show as the prompt not swapping to the signed-in sections until reload.

## Self-Check: PASSED

- `src/app/account/page.tsx` — FOUND
- `src/components/account/goal-form.tsx`, `goal-list.tsx`, `bookmark-list.tsx`, `delete-account-dialog.tsx` — FOUND
- Commits c2100e3, 34cb5a9, 89f3c19 — all present in `git log`

---
*Phase: 06-accounts-legal*
*Completed: 2026-09-14*
