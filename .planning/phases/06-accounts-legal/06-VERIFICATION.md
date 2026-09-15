---
phase: 06-accounts-legal
verified: 2026-09-15T10:45:00Z
status: human_needed
score: 31/32 must-haves verified
overrides_applied: 0
human_verification:
  - test: "On production, open /?ur=90000&mr=50000 signed out, click 'Sign in to save', complete the Clerk modal sign-in, and watch the results page WITHOUT reloading"
    expected: "The 'Sign in to save' button becomes 'Save my balances' and every 'Sign in to save this' link becomes 'Save to my account' with no manual reload (A5 — Clerk refreshes the router so the server-derived isSignedIn prop re-renders)"
    why_human: "The session-to-prop re-render after a modal sign-in is Clerk client runtime behavior against a live session; grep and the node test suite cannot observe it. 06-07 Task 2 step 4 was approved without notes, while the plan's acceptance criterion required it to be 'reported as observed'."
  - test: "Sign up a fresh test user through the modal on production, then open Clerk Dashboard -> Users -> that user"
    expected: "The sign-up modal shows a REQUIRED consent checkbox linking to https://milesworth.vercel.app/privacy (sign-up cannot proceed unchecked), and the user record in the Dashboard carries a legal-acceptance timestamp (legalAcceptedAt)"
    why_human: "Consent capture is Clerk Dashboard configuration ('Require express consent to legal documents' ON with the /privacy URL) plus hosted-modal behavior; neither exists in this repository. 06-07 Task 2 step 8 was approved without notes, while the plan's acceptance criterion required it to be 'reported as observed'."
  - test: "In Clerk Dashboard -> Configure -> User & authentication -> User model (Restrictions), read 'Allow users to delete their accounts'; then, signed in on production, open the UserButton menu -> Manage account -> Security"
    expected: "The Dashboard toggle is OFF and the Clerk-hosted profile shows no self-serve 'Delete account' control, so the app's DB-cascading deleteAccount action on /account is the only user-facing delete path"
    why_human: "Dashboard configuration is external to the codebase (06-01 Task 3 human-attested). If Clerk self-serve deletion were ON, a user could delete the Clerk user without the DB cascade running, orphaning rows in users/user_balances/bookmarks/travel_goals."
---

# Phase 6: Accounts & Legal Verification Report

**Phase Goal:** Optional persistence bolts on without touching the guest flow
**Verified:** 2026-09-15T10:45:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Roadmap Success Criteria (the contract) first, then the plan-level truths that add detail.

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| SC1 | User can sign up via Clerk and their balances save to their profile; the core flow still works fully logged out | ✓ VERIFIED | `src/proxy.ts` = `clerkMiddleware()` with no `auth.protect`; `src/app/page.tsx` reads `await auth()` and only then `loadAccountSnapshot(userId)`; `saveBalances` in `src/app/actions/account.ts` upserts `user_balances` scoped by session userId; `SaveBalancesButton` renders `SignInButton mode="modal"` signed out. Production `GET /?ur=90000&mr=50000` signed out: 200, contains `Copy my link` (1), `Sign in to save` (1), `Sign in to save this` (19). `tests/guest-flow-gate.test.ts` pins: no `@/db`/`drizzle-orm`/`@clerk/nextjs/server` under `src/components/**`, no `export const dynamic` on `/`, `@/db` importers exactly `actions/account.ts`, `actions/interest.ts`, `lib/server/account-data.ts`. Build route table: `ƒ /`, `○ /methodology`, `○ /privacy`, `ƒ /og`, `ƒ /account`. `/og` PNG re-probed: `image/png`, `set-cookie` count 0 on both the 308 and the PNG, `X-Vercel-Cache: HIT`. |
| SC2 | Signed-in user can bookmark redemptions and record travel goals, and both persist across sessions | ✓ VERIFIED | Schema: `bookmarks` (uniqueIndex user+slug) and `travel_goals` tables with `onDelete: "cascade"` to `users.clerk_user_id`; live Neon has all four tables (`scripts/db-check.ts` → `users rows: 0`, `user_balances rows: 0`, `bookmarks rows: 0`, `travel_goals rows: 0`). Writes: `setBookmark`, `addGoal`, `deleteGoal` (each `await auth()` → `safeParse` → scoped `db` call → `revalidatePath`). Reads: `loadAccountSnapshot` three `eq(table.userId, userId)` selects. UI: `BookmarkButton` (`useOptimistic` + `setBookmark`) mounted on every `ResultCard` and `AlmostThere` card; `/account` mounts `BookmarkList`, `GoalList` (per-row `deleteGoal` form), `GoalForm` (`useActionState(addGoal)`). Cross-session persistence is DB-backed by construction; human walkthrough 06-07 steps 5–7 attested it on production. |
| SC3 | Privacy policy and consent are in place; a user can delete their account and data | ✓ VERIFIED (consent capture human-attested) | `/privacy` (217 lines) prerendered `○`, production 200 with `What we collect`, `Consent`, `Retention and deletion`, `Delete my account`, mailto `nick@whitflow.com`; footer `href="/privacy"`. `deleteAccount`: `db.delete(users)` (cascades three child tables) BEFORE `clerkClient().users.deleteUser(userId)`; `tests/account-actions.test.ts` asserts call order and that a DB rejection never calls Clerk. `DeleteAccountDialog` requires an explicit confirm, then `signOut({ redirectUrl: "/" })` only on `status === "ok"`. Consent checkbox itself is Clerk Dashboard config — see human items. |
| 1-1 | drizzle-kit push exits 0 and a repeated push is a no-op (Phase 5 blocker closed) | ✓ VERIFIED (substance) | `transfer_bonuses_route_fk` explicitly named in schema (line 107); all nine `pgTable(` definitions live on Neon and queryable via db-check. Push itself not re-run by the verifier (it can mutate); two independent executor runs (06-01 T2, 06-02 T1) recorded "No changes detected". |
| 1-2 | @clerk/nextjs 7.9.x pinned; no svix, no global clerk CLI | ✓ VERIFIED | `package.json` `"@clerk/nextjs": "^7.9.1"`; `"svix"` count 0. |
| 1-3 | Clerk keys exist locally (gitignored) and on Vercel; nothing secret committed | ✓ VERIFIED | `git check-ignore .env.development.local` → ignored; `git status --porcelain | grep .env` → 0. `next build` succeeded locally (ClerkProvider requires the publishable key at build) and production `/account` renders Clerk-backed HTML. No values read or printed. |
| 1-4 | Clerk Dashboard: consent-to-legal-documents ON with /privacy URL; self-serve deletion OFF | ? UNCERTAIN | External configuration; not observable in the repo. Human-attested in 06-01 Task 3; routed to human verification (items 2 and 3). |
| 1-5 | 06-VALIDATION.md is a filled contract, not the template | ✓ VERIFIED | 17-row per-task map, Wave 0 list, manual-only table, `nyquist_compliant: true`, `status: approved`, contains `tests/guest-flow-gate.test.ts`. |
| 2-1 | Live Neon has users/user_balances/bookmarks/travel_goals cascading from users.clerk_user_id | ✓ VERIFIED | db-check prints row counts for all four; schema has exactly 3 `references(() => users.clerkUserId, { onDelete: "cascade" })` (gate test asserts). |
| 2-2 | No user table FKs into programs/redemptions | ✓ VERIFIED | Only `references(() => programs.slug)` hits are lines 65/68/122 (Phase 2 curated tables); gate test asserts zero in the user block. |
| 2-3 | balancesSchema / bookmarkSlugSchema / goalSchema / goalIdSchema reject hostile shapes without DB | ✓ VERIFIED | `src/lib/account-validation.ts` (75 lines, zod 4 `partialRecord`, `z.iso.date`, slug enums from `PARAM_KEY_BY_SLUG` and `redemptions.map`); `tests/account-validation.test.ts` 266 lines; suite green. |
| 2-4 | resolveInitialBalances ranks URL > storage > account > none; two-arg callers still pass | ✓ VERIFIED | `savedBalances: Balances | null = null` third param, `source: "account"` branch; `tests/balance-storage.test.ts` green. |
| 3-1 | Every route works signed out; proxy protects nothing; /og excluded from matcher | ✓ VERIFIED | `src/proxy.ts` matcher `"/((?!_next|og(?:$|\\?)|...)"`; no `auth.protect` anywhere in `src/`; no `middleware.ts`. Production `/og` cookie-free. |
| 3-2 | Header shows 'Sign in' signed out, 'My account' + UserButton signed in | ✓ VERIFIED | `site-header.tsx` `<Show when="signed-out">` → `SignInButton mode="modal"`; `<Show when="signed-in">` → `href="/account"` + `<UserButton />`. Documented deviation: `"use client"` boundary (server `Show` calls `auth()` and forced every route dynamic) — substance holds, static routes stay `○`. |
| 3-3 | /privacy is static (○), covers collection/processors/cookies/retention/consent/contact; footer links to it | ✓ VERIFIED | Build: `○ /privacy`. Six `<h2>` sections present; `PRIVACY_CONTACT_EMAIL` + `PRIVACY_LAST_UPDATED` from `src/lib/site.ts`; no `new Date`, no client directive, no `@/db`. Production body carries all markers. `tests/privacy-page.test.ts` 132 lines. |
| 3-4 | /methodology stays ○ and / stays ƒ after ClerkProvider | ✓ VERIFIED | Build table: `○ /methodology`, `ƒ /`. `<ClerkProvider afterSignOutUrl="/">` inside `<body>`, no `dynamic` prop. |
| 4-1 | Every account write starts with await auth(), scopes by userId, validates with 06-02 schemas, returns fixed neutral copy | ✓ VERIFIED | All five actions open with `const { userId } = await auth();`; `safeParse` before every DB call; every DELETE `where(eq(...userId, userId))`; bare `catch` → `NEUTRAL_ERROR`; no `console.*`, no `throw`. |
| 4-2 | Delete removes users row (cascade) BEFORE Clerk user; DB failure means Clerk never called | ✓ VERIFIED | `deleteAccount` order in source; `tests/account-actions.test.ts` "deletes the users row BEFORE calling Clerk deleteUser" (invocationCallOrder) and "when the DB delete rejects, Clerk is never called". |
| 4-3 | One server-only read module returns balances, known-bookmark slugs, goals; only DB reader; never imported by a client component | ✓ VERIFIED | `src/lib/server/account-data.ts` imported by `src/app/page.tsx` and `src/app/account/page.tsx` only; `goal-list.tsx` uses `import type` only. `filterKnownBookmarks` drops unknown slugs; `rowsToBalances` re-validates. |
| 4-4 | Source-scan test proves the guest flow is untouched | ✓ VERIFIED | `tests/guest-flow-gate.test.ts` (127 lines) — 5 describe blocks covering components, static routes, proxy, schema FKs, `@/db` importer set. Green. |
| 5-1 | Signed-out visitor sees 'Sign in to save' beside 'Copy my link' and 'Sign in to save this' on every card; modal keeps URL | ✓ VERIFIED | Production HTML counts above; both buttons wrap `SignInButton mode="modal"`; no navigation. |
| 5-2 | Signed-in user clicks 'Save my balances', sees 'Saved'; fresh device restores balances into the URL | ✓ VERIFIED (A5 human item) | Label state machine in `save-balances-button.tsx` (`Saving`/`Saved`/2 s revert); island mount effect: `resolveInitialBalances(paramsToBalances(params), stored, savedBalances)` → `source === "account"` → `setParams(..., { history: "replace" })`; storage write keyed on `hasEditedRef` only. Cross-device restore attested at 06-07 step 7. Whether the buttons re-render without a reload after a modal sign-in (A5) is human item 1. |
| 5-3 | Bookmark toggle on Bookable-now and Almost-there cards flips instantly and persists | ✓ VERIFIED | `BookmarkButton` `useOptimistic(bookmarked)`; `result-card.tsx` and `almost-there.tsx` both render it when the island passes `bookmarked`/`bookmarkedSlugs`; `setBookmark` calls `revalidatePath("/")`. |
| 5-4 | Guest flow byte-for-byte same: no @/db in components, no export const dynamic on /, storage never written by the account branch | ✓ VERIFIED | Gate test + manual grep of real import statements (only comments mention `@/db` in components); `grep "export const dynamic" src/app/` → none. |
| 6-1 | Signed-out /account shows a prompt with modal sign-in and privacy link — no redirect | ✓ VERIFIED | `account/page.tsx` `userId === null` branch renders `SignInButton mode="modal"` + `href="/privacy"`; production `/account` signed out → 200, no `Location`. |
| 6-2 | Signed-in user sees saved balances with 'Open my saved results' link, bookmarks by title, goals | ✓ VERIFIED | `savedResultsHref` via `balancesToParams(` → `/?...`; `BookmarkList` looks slugs up in `@/data` by `title`; `GoalList` renders `goal.text` + meta. |
| 6-3 | User can add a goal (text, optional destination, optional date) and remove it; persists | ✓ VERIFIED | `GoalForm` fields `text`/`destination`/`targetDate` → `addGoal`; `GoalList` hidden `goalId` → `deleteGoal` scoped by userId; DB-backed. |
| 6-4 | User can open 'Delete my account', confirm, land on / signed out with rows and Clerk user gone | ✓ VERIFIED | `DeleteAccountDialog` trigger label "Delete my account" (matches /privacy prose), confirm `Delete everything`, `signOut({ redirectUrl: "/" })` on ok. Post-walkthrough db-check `users rows: 0` reproduced today. |
| 7-1 | Production serves /privacy (200, static), /account (200 signed out), /og cookie-free CDN PNG | ✓ VERIFIED | Re-probed 2026-09-15: `/privacy` 200 `X-Vercel-Cache: HIT`; `/account` 200; bare `/og?ur&mr` → cookie-free 308 to `&d=2026-09-15`; canonical PNG `image/png`, `set-cookie` 0, `HIT`. (Documented 308 deviation from Phase 5 CR-01/WR-02 — substance holds.) |
| 7-2 | Real person signs up with consent, saves, bookmarks, records a goal, all persist on a fresh session; guest flow works in a private window | ✓ VERIFIED (human-attested 2026-09-14) | 06-07 Task 2 resume signal "approved"; the code paths for every step are verified above. Steps 4 and 8 were approved without notes — the plan's acceptance criterion required them "reported as observed" — carried as human items 1 and 2. |
| 7-3 | Deleting from /account removes every DB row and the Clerk user — users rows: 0 | ✓ VERIFIED | db-check today: `users rows: 0`, `user_balances rows: 0`, `bookmarks rows: 0`, `travel_goals rows: 0`, `programs rows: 21` (seed untouched). Cascade order unit-tested. |
| 7-4 | 06-VALIDATION.md signed off: nyquist_compliant: true, every row green or human-verified | ✓ VERIFIED | Frontmatter `nyquist_compliant: true`, `status: approved`; 17 rows `✅ green` / 3 `✅ human-verified`; zero pending cells. |

**Score:** 31/32 truths verified (1 UNCERTAIN — external Clerk Dashboard configuration, routed to human)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/db/schema.ts` | users/userBalances/bookmarks/travelGoals + named FK | ✓ VERIFIED | 9 `pgTable(`; `transfer_bonuses_route_fk`; 3 cascade refs; uniqueIndex only; wired to actions + read module; live on Neon |
| `package.json` | @clerk/nextjs | ✓ VERIFIED | `^7.9.1` |
| `src/lib/account-validation.ts` | 4 Zod schemas | ✓ VERIFIED | 75 lines; imported by `actions/account.ts`; tested |
| `src/lib/balance-storage.ts` | account branch | ✓ VERIFIED | `source: "account"`; consumed by `core-experience.tsx` |
| `scripts/db-check.ts` | four user-table row counts | ✓ VERIFIED | Ran today, prints all four |
| `tests/account-validation.test.ts` | hostile table, min 80 lines | ✓ VERIFIED | 266 lines |
| `src/proxy.ts` | public-by-default, /og excluded | ✓ VERIFIED | 24 lines; `ƒ Proxy (Middleware)` in build |
| `src/app/layout.tsx` | ClerkProvider inside body, SiteHeader mounted | ✓ VERIFIED | `<ClerkProvider afterSignOutUrl="/">` wraps `NuqsAdapter` → `SiteHeader` |
| `src/components/site-header.tsx` | header with Show affordances | ✓ VERIFIED (documented deviation: client boundary) | 57 lines; mounted in layout |
| `src/app/privacy/page.tsx` | static policy, min 120 lines | ✓ VERIFIED | 217 lines; `○ /privacy`; tested |
| `src/lib/site.ts` | PRIVACY_CONTACT_EMAIL / PRIVACY_LAST_UPDATED | ✓ VERIFIED | Both exported; consumed by privacy page |
| `tests/privacy-page.test.ts` | SSR + source scan, min 60 lines | ✓ VERIFIED | 132 lines |
| `src/app/actions/account.ts` | 5 Server Actions + ActionState | ✓ VERIFIED | 244 lines; `"use server"` line 1; all five exported and consumed by 5 client components |
| `src/lib/server/account-data.ts` | loadAccountSnapshot + pure helpers | ✓ VERIFIED | 116 lines; consumed by both RSC pages |
| `tests/account-actions.test.ts` | mocked Clerk + db incl. delete order, min 100 | ✓ VERIFIED | 235 lines |
| `tests/guest-flow-gate.test.ts` | source-scan gate, min 50 | ✓ VERIFIED | 127 lines |
| `src/components/save-balances-button.tsx` | Save CTA | ✓ VERIFIED | 85 lines; mounted in `core-experience.tsx` line 230 |
| `src/components/bookmark-button.tsx` | optimistic toggle | ✓ VERIFIED | 73 lines; mounted in `result-card.tsx` and `almost-there.tsx` |
| `src/components/core-experience.tsx` | account props + precedence + Save CTA + bookmark threading | ✓ VERIFIED | `isSignedIn`/`savedBalances`/`bookmarkedSlugs` props; mount effect; both affordances threaded |
| `src/app/page.tsx` | auth() + loadAccountSnapshot → island props | ✓ VERIFIED | Lines 92–93, 105–108 |
| `src/app/account/page.tsx` | dynamic auth-gated RSC | ✓ VERIFIED | 184 lines; `ƒ /account`; all four account components mounted |
| `src/components/account/goal-form.tsx` | useActionState(addGoal) | ✓ VERIFIED | 98 lines |
| `src/components/account/goal-list.tsx` | per-row deleteGoal | ✓ VERIFIED | 74 lines |
| `src/components/account/bookmark-list.tsx` | server list by slug | ✓ VERIFIED | 49 lines; no client directive |
| `src/components/account/delete-account-dialog.tsx` | confirm → deleteAccount → signOut | ✓ VERIFIED | 88 lines; shadcn Dialog |
| `.planning/phases/06-accounts-legal/06-VALIDATION.md` | signed-off contract | ✓ VERIFIED | `nyquist_compliant: true` |

`gsd-sdk query verify.artifacts` on plans 06-02 and 06-03: 5/5 and 6/6 passed. Remaining plans verified manually (all files present, substantive, wired).

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `src/db/schema.ts` | Neon `transfer_bonuses_route_fk` | named FK | ✓ WIRED | Line 107; tables live |
| `.env.development.local` | Vercel env | vercel env pull | ✓ WIRED | Gitignored; local build + prod render both succeed (no values read) |
| `account-validation.ts` | `balance-params.ts` | `PARAM_KEY_BY_SLUG` + `MAX_BALANCE` | ✓ WIRED | Both imported |
| `account-validation.ts` | `@/data` redemptions | `redemptions.map((r) => r.slug)` | ✓ WIRED | Manually confirmed (gsd-sdk regex false negative) |
| user tables | `users.clerkUserId` | `onDelete: "cascade"` | ✓ WIRED | 3 refs (gsd-sdk could not resolve the pseudo-path) |
| `layout.tsx` | ClerkProvider | outermost child of body | ✓ WIRED | `<ClerkProvider afterSignOutUrl="/">` (gsd-sdk target string not literal) |
| `site-header.tsx` | `/account` | Show signed-in link | ✓ WIRED | `href="/account"` |
| `site-footer.tsx` | `/privacy` | next/link | ✓ WIRED | `href="/privacy"` |
| `privacy/page.tsx` | `site.ts` | contact + date constants | ✓ WIRED | Both rendered |
| `actions/account.ts` | `auth()` | first statement of every action | ✓ WIRED | 5 of 5 |
| `actions/account.ts` | `account-validation.ts` | `safeParse` before DB | ✓ WIRED | 4 schemas used |
| `deleteAccount` | `clerkClient().users.deleteUser` | after `db.delete(users)` | ✓ WIRED | Order unit-tested |
| `account-data.ts` | `@/db` | 3 `eq(table.userId, userId)` selects | ✓ WIRED | Count = 3 |
| `page.tsx` | `account-data.ts` | `userId ? await loadAccountSnapshot(userId) : null` | ✓ WIRED | Line 93 |
| `core-experience.tsx` | `balance-storage.ts` | `resolveInitialBalances(...)` in ref-guarded effect | ✓ WIRED | Lines 148–166 |
| `save-balances-button.tsx` | `saveBalances` | `startTransition` | ✓ WIRED | Line 72 |
| `bookmark-button.tsx` | `setBookmark` | `useOptimistic` + action | ✓ WIRED | Line 58 |
| `account/page.tsx` | `auth()` | branch decision | ✓ WIRED | Line 76 |
| `account/page.tsx` | `balance-params.ts` | `balancesToParams(` | ✓ WIRED | `savedResultsHref` |
| `delete-account-dialog.tsx` | `deleteAccount` | `useActionState(deleteAccount` | ✓ WIRED | Line 35 |
| `goal-form.tsx` | `addGoal` | `useActionState(addGoal` | ✓ WIRED | Line 28 |
| `origin/main` | milesworth.vercel.app | Vercel auto-deploy | ✓ WIRED | Production serves the Phase 6 routes |
| `scripts/db-check.ts` | four user tables | row counts | ✓ WIRED | Ran today |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `src/app/page.tsx` → `CoreExperience` | `isSignedIn`, `savedBalances`, `bookmarkedSlugs` | `auth()` → `loadAccountSnapshot` → 3 Drizzle selects | Yes (DB queries; guests short-circuit to `null`/`[]` by design) | ✓ FLOWING |
| `core-experience.tsx` mount effect | `savedBalances` → URL | `resolveInitialBalances` → `setParams` | Yes | ✓ FLOWING |
| `result-card.tsx` / `almost-there.tsx` | `bookmarked` | `bookmarkedSlugs.includes(slug)` from island props | Yes | ✓ FLOWING |
| `src/app/account/page.tsx` | `snapshot.balances/bookmarkedSlugs/goals` | `loadAccountSnapshot(userId)` | Yes | ✓ FLOWING |
| `bookmark-list.tsx` | `slugs` → `redemptions.find` | page prop from DB | Yes | ✓ FLOWING |
| `goal-list.tsx` | `goals` | page prop from DB | Yes | ✓ FLOWING |
| `deleteAccount` | — | `db.delete(users)` → Clerk | Yes (db-check shows cascade emptied all tables) | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Full unit suite | `npx vitest run` | 20 files / 289 tests passed, 3.89 s | ✓ PASS |
| Typecheck | `npm run typecheck` | exit 0 | ✓ PASS |
| Lint | `npm run lint` | exit 0 | ✓ PASS |
| Build route table | `npm run build` | `ƒ /`, `ƒ /account`, `○ /methodology`, `ƒ /og`, `○ /privacy`, `ƒ Proxy (Middleware)`; exit 0 | ✓ PASS |
| Live Neon user tables | `npx tsx scripts/db-check.ts` | `programs rows: 21`, `users rows: 0`, `user_balances rows: 0`, `bookmarks rows: 0`, `travel_goals rows: 0` | ✓ PASS |
| Production /privacy | `curl -sI` + body grep | 200, `X-Vercel-Cache: HIT`, all six section markers present | ✓ PASS |
| Production /account signed out | `curl -sI` | 200, no `Location`, `private, no-store` | ✓ PASS |
| Production /og cookie-free CDN | `curl -sI` twice | bare URL 308 (set-cookie 0) → canonical `image/png`, set-cookie 0, `HIT` | ✓ PASS |
| Production / signed-out affordances | body grep | `Copy my link` 1, `Sign in to save` 1, `Sign in to save this` 19 | ✓ PASS |
| Summary commit hashes | `git cat-file -e` on 26 hashes | all 26 resolve | ✓ PASS |
| drizzle-kit push no-op | — | Not re-run (mutating command; not cheap/safe non-interactively) | ? SKIP |

### Probe Execution

No `scripts/*/tests/probe-*.sh` files exist and no plan/summary declares a probe script. Step 7c: SKIPPED (no probes declared). The production curl probes above stand in for the 06-07 Task 1 gate and were re-run in this process.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| ACCT-01 | 06-01, 02, 03, 04, 05, 06, 07 | User can optionally sign up (Clerk) to save balances to their profile — core flow never requires login | ✓ SATISFIED | SC1 evidence; public-by-default proxy; guest-flow gate test; `saveBalances` + account restore branch |
| ACCT-02 | 06-02, 04, 05, 06, 07 | Signed-in user can bookmark redemptions they're working toward | ✓ SATISFIED | `bookmarks` table, `setBookmark`, `BookmarkButton` on both result tiers, `BookmarkList` on /account |
| ACCT-03 | 06-02, 04, 06, 07 | Signed-in user can record travel goals (stored only; no v1 ranking effect) | ✓ SATISFIED | `travel_goals` table, `addGoal`/`deleteGoal`, `GoalForm`/`GoalList`; engine untouched (no ranking import of goals) |
| ACCT-04 | 06-01, 03, 04, 06, 07 | Privacy policy, consent, and account/data deletion are available | ✓ SATISFIED (consent capture human-attested) | `/privacy` static page; `deleteAccount` DB-before-Clerk with confirm dialog; consent = Clerk Dashboard setting (human item 2) |

Orphaned requirements: none. REQUIREMENTS.md maps exactly ACCT-01..04 to Phase 6 and every ID appears in at least one plan's `requirements` field.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK` in any phase-modified source file | — | None |
| `src/app/privacy/page.tsx` | 79 | text "coming soon" | ℹ️ Info | Prose describing the Phase 5 advisor-tease form; not a stub |
| `src/db/schema.ts`, `src/app/page.tsx` | 16, 11 | word "placeholder" in comments | ℹ️ Info | Historical comments about the replaced Phase 1 placeholder; not a stub |
| `scripts/db-check.ts` | 19–57 | `console.log/error` | ℹ️ Info | Intended CLI output of a diagnostic script; no `console.*` in actions or read module |
| `src/components/site-header.tsx` | 1 | `"use client"` where plan said server component | ℹ️ Info | Documented deviation (06-03); required to keep `/methodology` and `/privacy` static under Clerk 7.9.1 |
| `.planning/ROADMAP.md` | 193 | Progress table still reads "6. Accounts & Legal \| 0/TBD \| Not started" while all seven plan checkboxes are `[x]` | ℹ️ Info | Stale planning bookkeeping only; orchestrator should update on phase close |

No blockers. No stubs: every rendered account value traces to a DB query or a server-derived prop.

### Human Verification Required

The 06-07 Task 2 walkthrough was approved on 2026-09-14 and the code paths for every step are verified above. Three items remain that no repository artifact can prove, two of which the plan's own acceptance criterion required to be "reported as observed" but which were approved without notes.

### 1. A5 — no-reload re-render after modal sign-in

**Test:** On production, open `/?ur=90000&mr=50000` signed out, click "Sign in to save", complete the Clerk modal sign-in, and watch the page without reloading.
**Expected:** "Sign in to save" becomes "Save my balances" and every "Sign in to save this" becomes "Save to my account" with no manual reload.
**Why human:** Clerk client-runtime router refresh against a live session; not observable by grep or the node test suite. Step 4 was approved without notes.

### 2. Consent checkbox is required and the timestamp is recorded

**Test:** Sign up a fresh test user through the modal on production; then open Clerk Dashboard → Users → that user.
**Expected:** The modal shows a required consent checkbox linking to `https://milesworth.vercel.app/privacy` (cannot proceed unchecked); the user record shows a legal-acceptance timestamp.
**Why human:** Consent capture lives entirely in Clerk Dashboard configuration and the hosted modal. Step 8 was approved without notes.

### 3. Clerk self-serve deletion is OFF

**Test:** Clerk Dashboard → Configure → User & authentication → User model (Restrictions) → "Allow users to delete their accounts"; and, signed in on production, UserButton → Manage account → Security.
**Expected:** Toggle OFF; no Clerk-hosted "Delete account" control, so the app's DB-cascading `deleteAccount` is the only delete path.
**Why human:** External configuration (06-01 Task 3 human-attested). If ON, a Clerk-side delete would bypass the DB cascade and orphan rows.

### Gaps Summary

No code gaps. Every roadmap success criterion is backed by substantive, wired, data-flowing artifacts; the automated gates (289 tests, typecheck, lint, build route table) were re-run in this process and are green; the live database has the four account tables and is at the post-delete baseline (`users rows: 0`, `programs rows: 21`); production serves `/privacy` static, `/account` signed out, and `/og` cookie-free from the CDN behind the Clerk proxy. The documented deviations (client-boundary header, zero-arg `deleteAccount`, `/og` 308 canonicalizer, no `/terms` page) all preserve the substance of their must-haves and are not gaps.

Status is `human_needed` rather than `passed` only because three behaviors live outside the repository — the post-sign-in re-render (A5), Clerk's consent checkbox and `legalAcceptedAt`, and the Dashboard's self-serve-deletion setting. Once a human confirms those three, the phase goal is fully achieved.

---

_Verified: 2026-09-15T10:45:00Z_
_Verifier: Claude (gsd-verifier)_
