---
phase: 06-accounts-legal
plan: 05
subsystem: ui
tags: [clerk, server-actions, react-19, useOptimistic, useTransition, nuqs, hydration, accent-discipline]

# Dependency graph
requires:
  - phase: 06-accounts-legal
    plan: 04
    provides: saveBalances / setBookmark Server Actions + ActionState; loadAccountSnapshot(userId) server-only reader; tests/guest-flow-gate.test.ts
  - phase: 06-accounts-legal
    plan: 02
    provides: resolveInitialBalances(url, stored, savedBalances) with the "account" branch (URL > storage > account > none)
  - phase: 06-accounts-legal
    plan: 03
    provides: src/proxy.ts clerkMiddleware() so auth() resolves in the / RSC page; ClerkProvider in the root layout for SignInButton modal
  - phase: 04-core-experience
    provides: CoreExperience island, ResultCard, AlmostThere, the 2s "Link copied" swap idiom, UI-SPEC accent budget
provides:
  - src/components/save-balances-button.tsx — SaveBalancesButton: SignInButton modal when signed out; outline "Save my balances" → "Saving" → "Saved" (2s revert) via useTransition + saveBalances(balances)
  - src/components/bookmark-button.tsx — BookmarkButton: first useOptimistic in the repo (one boolean), aria-pressed, setBookmark(slug, next); "Sign in to save this" modal when signed out
  - src/components/core-experience.tsx — isSignedIn / savedBalances / bookmarkedSlugs props; account precedence branch in the ref-guarded mount effect; Save CTA beside "Copy my link"; bookmark threading into both tiers
  - src/components/result-card.tsx — optional bookmarked / isSignedIn → BookmarkButton in CardFooter
  - src/components/almost-there.tsx — optional bookmarkedSlugs / isSignedIn → BookmarkButton on every near-miss card
  - src/app/page.tsx — await auth() + loadAccountSnapshot(userId) → island props; no @/db import, no dynamic export
affects: [06-06, 06-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Session state crosses into the island as server-derived props (isSignedIn / savedBalances / bookmarkedSlugs) — never a Clerk client hook — so server HTML and hydration are byte-identical (RESEARCH Pattern 3 / Pitfall 5)"
    - "Client affordances import only @clerk/nextjs (SignInButton), React, the Button primitive, and the Server Action reference — enforced by tests/guest-flow-gate.test.ts"
    - "useOptimistic + useTransition for a single boolean toggle; the action's revalidatePath('/') lets the server prop catch up with the optimistic value"
    - "Account balance restore runs only inside the ref-guarded mount effect and pushes to the URL with history: replace; storage is never written by that branch (A1 / T-06-09)"
    - "Optional props on server-compatible presentational components (ResultCard, AlmostThere) so existing callers and tests need no change; a server-compatible component may render a client child"

key-files:
  created:
    - src/components/save-balances-button.tsx
    - src/components/bookmark-button.tsx
    - .planning/phases/06-accounts-legal/06-05-SUMMARY.md
  modified:
    - src/components/core-experience.tsx
    - src/components/result-card.tsx
    - src/components/almost-there.tsx
    - src/app/page.tsx

key-decisions:
  - "Header comments in the new components never spell out the gated tokens (useAuth/useUser/terracotta) — a comment mentioning 'no useAuth()' fails the same grep that guards the code; 'no Clerk client hooks' / 'no accent' say the same thing (same lesson as 06-02/03/04)"
  - "The Save button class string is inlined in both branches rather than hoisted to a constant so the h-11 touch-target grep counts each rendered branch"
  - "The mount effect keeps hydratedRef so the added savedBalances dependency cannot re-run the precedence resolution; the WRITE effect alone keeps `if (storage === null) return;`"
  - "Task 2 was committed with page.tsx not yet passing the new required island props (one TS2739 at the caller) because the plan schedules page.tsx as Task 3; Task 3 followed immediately and typecheck is green at HEAD"

patterns-established:
  - "Session-aware client affordance: `if (!isSignedIn) return <SignInButton mode=\"modal\">…</SignInButton>` first, then the signed-in branch with useTransition + the action"
  - "Server page → island account props: `const { userId } = await auth(); const account = userId ? await loadAccountSnapshot(userId) : null;` then `isSignedIn={userId !== null} savedBalances={account?.balances ?? null} bookmarkedSlugs={account?.bookmarkedSlugs ?? []}`"

requirements-completed: [ACCT-01, ACCT-02]

# Metrics
duration: ~6min
completed: 2026-09-14
---

# Phase 06 Plan 05: Save CTA, Bookmark Toggles, and Account Props on `/` Summary

**Accounts wired into the guest flow without changing it for guests: `page.tsx` reads the session with `auth()` and hands the island `isSignedIn` / `savedBalances` / `bookmarkedSlugs`; the island resolves URL > storage > account inside its ref-guarded mount effect (never writing storage), shows an ink/outline "Save my balances" CTA beside "Copy my link", and every card in both tiers carries a `useOptimistic` bookmark toggle — all with the accent budget unchanged and `@/db` still absent from every component.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-09-14T17:51:10Z
- **Completed:** 2026-09-14T17:57:14Z
- **Tasks:** 3 (all auto)
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments

- `src/components/save-balances-button.tsx` (85 lines): `"use client"`; signed out → `<SignInButton mode="modal">` wrapping an outline `h-11 min-w-44` "Sign in to save" button (the modal keeps the visitor on `/` with the balances still in the URL); signed in → outline button, `disabled` while pending or when no balances are entered, `onClick={() => startTransition(async () => setState(await saveBalances(balances)))}`, label `Saving` / `Saved` / `Save my balances` inside `aria-live="polite"`, "Saved" reverts to idle after 2s via the same `window.setTimeout` + cleanup idiom as "Link copied"; error copy (the action's fixed `ActionState.message`) renders in a `text-ink/70` paragraph only when present.
- `src/components/bookmark-button.tsx` (73 lines): `"use client"`; signed out → modal `SignInButton` around a `text-ink/70 h-11` "Sign in to save this" text button; signed in → `useOptimistic(bookmarked)` + `useTransition`, `aria-pressed={optimistic}`, `disabled={pending}`, `onClick` flips `optimistic`, awaits `setBookmark(slug, next)`, and surfaces only `result.message` on error; label `Saved to my account` / `Save to my account`. The action's `revalidatePath("/")` refreshes the server-derived `bookmarked` prop after the transition.
- `src/components/core-experience.tsx`: `CoreExperienceProps` gains documented `isSignedIn: boolean`, `savedBalances: Balances | null`, `bookmarkedSlugs: readonly string[]`. The mount effect no longer returns early when storage is unreachable — `const stored = storage === null ? null : readStoredBalances(storage)` — then `resolveInitialBalances(paramsToBalances(params), stored, savedBalances)` and `if (action.source === "storage" || action.source === "account")` pushes the balances into the URL with `history: "replace"`; `savedBalances` added to the dependency array (the `hydratedRef` guard keeps it single-run). The write effect is untouched (`writeStoredBalances(` count 1, `if (storage === null) return;` count 1). The Copy button and `<SaveBalancesButton balances={balances} isSignedIn={isSignedIn} />` sit in a `flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4` wrapper; `bg-terracotta` count stays 1. `ResultCard` receives `bookmarked={bookmarkedSlugs.includes(result.redemption.slug)}` + `isSignedIn`; `AlmostThere` receives `bookmarkedSlugs` + `isSignedIn`.
- `src/components/result-card.tsx`: optional `bookmarked?: boolean; isSignedIn?: boolean`; `CardFooter` becomes `flex items-center justify-between gap-4` with the Verified stamp and, when `bookmarked !== undefined`, `<BookmarkButton slug={redemption.slug} bookmarked={bookmarked} isSignedIn={isSignedIn ?? false} />`. No `"use client"`; `text-terracotta` count stays exactly 2.
- `src/components/almost-there.tsx`: optional `bookmarkedSlugs?: readonly string[]; isSignedIn?: boolean`; when `bookmarkedSlugs !== undefined`, a `BookmarkButton` is the last child of each `CardContent`. Zero accent; no `"use client"`.
- `src/app/page.tsx`: `import { auth } from "@clerk/nextjs/server"` and `import { loadAccountSnapshot } from "@/lib/server/account-data"`; in `Home`, after `await loadBalanceParams(searchParams)`: `const { userId } = await auth(); const account = userId ? await loadAccountSnapshot(userId) : null;` and `<CoreExperience asOf={asOf} isSignedIn={userId !== null} savedBalances={account?.balances ?? null} bookmarkedSlugs={account?.bookmarkedSlugs ?? []} />`. `generateMetadata`, both clock reads, and the absence of `export const dynamic` / `@/db` are unchanged; header comment records Pattern 3, T-06-05, Pitfall 4, and the A5 router-refresh assumption (06-07 checkpoint).

## Task Commits

1. **Task 1: SaveBalancesButton + BookmarkButton client components** - `6debb76` (feat)
2. **Task 2: Island props + account precedence + Save CTA + bookmark threading** - `9209a29` (feat)
3. **Task 3: page.tsx reads the session and threads the account snapshot** - `c51f877` (feat)

**Plan metadata:** see final docs commit for this SUMMARY

## Files Created/Modified

- `src/components/save-balances-button.tsx` - New. ACCT-01 Save CTA; modal when signed out, transition + action when signed in.
- `src/components/bookmark-button.tsx` - New. ACCT-02 optimistic toggle; modal when signed out.
- `src/components/core-experience.tsx` - Account props, restructured mount effect, Save CTA, bookmark threading, header comment.
- `src/components/result-card.tsx` - Optional bookmark props; BookmarkButton in the footer.
- `src/components/almost-there.tsx` - Optional bookmark props; BookmarkButton per near-miss card.
- `src/app/page.tsx` - `auth()` + `loadAccountSnapshot` → island props; header comment.

## Verification

- `npx vitest run` → 20 files, 289 tests passed (unchanged count — guest-flow gate, precedence, actions, privacy suites all green; the gate now scans 14 component files)
- `npm run typecheck` → exit 0 at HEAD; `npm run lint` → exit 0, 0 warnings
- Env-exported `npm run build` → exit 0; route table `ƒ /`, `○ /methodology`, `ƒ /og`, `○ /privacy` (4 matching lines; rendering modes unchanged). Build output was written to the scratchpad and only route lines were printed; no env value was displayed.
- Task 1 greps: both files start `"use client";`; `mode="modal"` = 1 each; `useOptimistic(` = 1; `^export function` = 1 each; "Sign in to save" = 1, "Save my balances" = 1, `saveBalances(balances)` = 1; "Sign in to save this" = 1, `aria-pressed` = 1, `setBookmark(slug, next)` = 1; `terracotta|from "@/db|drizzle|@clerk/nextjs/server|useAuth|useUser|!"` = 0 per file; `h-11` = 2 / 3; 85 / 73 lines (limits 90 / 70 — see Minor)
- Task 2 greps: `bg-terracotta` core = 1; `text-terracotta` card = 2; `terracotta` almost-there = 0; `resolveInitialBalances(` = 1; `action.source === "storage" || action.source === "account"` = 1; `<SaveBalancesButton` = 1; `<BookmarkButton` = 1 in each of result-card / almost-there; `savedBalances` = 5 (≥ 3); `if (storage === null) return;` = 1; `writeStoredBalances(` = 1; `bookmarked?: boolean` = 1; `bookmarkedSlugs?: readonly string[]` = 1; `"use client"` = 0 in result-card / almost-there; forbidden tokens = 0 per file
- Task 3 greps: `const { userId } = await auth();` = 1; `loadAccountSnapshot(userId)` = 1; `isSignedIn={userId !== null}` = 1; `export const dynamic` = 0; `from "@/db|drizzle` = 0; `new Date` = 2; `const asOf = new Date` = 2; `git diff -- src/app/page.tsx` touches 0 lines containing `generateMetadata` (imports, `Home`, and comments only)
- Post-commit deletion check: 0 tracked files deleted across the three commits
- Secrets hygiene: `.env.development.local` sourced only inside a subshell for the build; never printed; `git status --porcelain | grep '\.env'` empty at every commit

## Decisions Made

- **Gated tokens stay out of comments.** The first draft's header comments said "no useAuth()/useUser()" and "no terracotta", which failed the plan's own forbidden-token grep; reworded to "no Clerk client hooks" / "no accent" (same lesson recorded in 06-02/03/04).
- **Class string inlined, not hoisted.** A `BUTTON_CLASS` constant made `grep -c 'h-11'` read 1 in save-balances-button; the plan's ≥ 2 criterion is per rendered branch, so the class is inlined in both branches.
- **Commit boundary between Task 2 and Task 3.** Task 2's `npm run typecheck` reported exactly one error — `src/app/page.tsx` not yet passing the new required props — because the plan makes the island props required and schedules the caller in Task 3. No commit hook runs typecheck; Task 2 was committed on its own acceptance (greps, lint, 289 tests) and Task 3 (`c51f877`) restored a green typecheck two minutes later. Making the props optional would have hidden a real wiring error, so the plan's required-props shape was kept.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Header comments tripped the forbidden-token grep**
- **Found during:** Task 1 verification
- **Issue:** `grep -E 'terracotta|…|useAuth|useUser'` matched comment lines in both new components.
- **Fix:** Reworded the comments (see Decisions); code unchanged.
- **Files modified:** src/components/save-balances-button.tsx, src/components/bookmark-button.tsx
- **Commit:** 6debb76 (folded in before the commit)

**2. [Rule 1 - Bug] Hoisted button class reduced the `h-11` count to 1**
- **Found during:** Task 1 verification
- **Issue:** Acceptance requires `h-11` ≥ 2 in save-balances-button (one per branch); a shared constant collapsed it.
- **Fix:** Inlined the class string in both branches.
- **Files modified:** src/components/save-balances-button.tsx
- **Commit:** 6debb76 (folded in before the commit)

### Minor (not acceptance criteria)

- `generateMetadata` count in page.tsx is 2, not the plan's stated 1 — it was already 2 at HEAD before this plan (the function plus the pre-existing "generateMetadata above and this one" comment). The diff touches no line containing it, which is what the criterion is protecting.
- `bookmark-button.tsx` is 73 lines against the plan's "under 70" guidance, and `save-balances-button.tsx` is 85 (guidance "under 90"). The overrun is prettier's multi-line JSX plus the threat-ID header comments; nothing was omitted.
- `bookmark-button.tsx` does not `import type { ActionState }` — it reads `result.status` / `result.message` directly off the action's return type, so the import would be unused and lint would reject it.

## Issues Encountered

- A multi-line Python heredoc containing apostrophes inside triple-quoted strings failed to parse in the Bash tool; the Task 2 and Task 3 edit scripts were written to the session scratchpad and executed from there instead. No effect on the repo.
- `next build` prints a pre-existing warning about an ignored `package-lock.json` outside the repo (`C:\Users\geoca`); unrelated and not touched.

## Known Stubs

None. Every affordance is wired to a real Server Action, every prop is fed from the real session read and `loadAccountSnapshot`, and `bookmarkedSlugs` / `savedBalances` are genuinely empty only for signed-out visitors (by design — guests are unchanged).

## Threat Flags

None beyond the plan's register. The client bundle gains two components that import `@clerk/nextjs` client code and Server Action references only (T-06-05, gate test green); `page.tsx` gains a session read through the server-only module (T-06-01); no new endpoints, schema, or file access. A5 (Clerk router refresh after modal sign-in) remains an assumption for the 06-07 human checkpoint — if it fails, the documented fallback is a `router.refresh()` effect keyed on the Clerk client session, which would need to be weighed against the no-client-hooks rule.

## Next Phase Readiness

- 06-06 (`/account` page) can reuse the exact `auth()` → `loadAccountSnapshot` → props shape from `page.tsx`, and `useActionState(addGoal)` / `deleteGoal` / `deleteAccount` from 06-04. The site header's signed-in nav (06-03) already links there.
- 06-07's human checkpoint verifies the four `must_haves.truths`: modal-in-place for signed-out visitors, "Saved" + fresh-device restore, instant bookmark flip + persistence after reload, and the A5 router refresh after modal sign-in.

## Self-Check: PASSED

- `src/components/save-balances-button.tsx` — FOUND
- `src/components/bookmark-button.tsx` — FOUND
- `src/components/core-experience.tsx`, `src/components/result-card.tsx`, `src/components/almost-there.tsx`, `src/app/page.tsx` — FOUND (modified)
- Commits 6debb76, 9209a29, c51f877 — all present in `git log`

---
*Phase: 06-accounts-legal*
*Completed: 2026-09-14*
