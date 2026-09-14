---
phase: 6
slug: accounts-legal
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-09-03
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 (`environment: "node"`, no jsdom) |
| **Config file** | `vitest.config.ts` — alias `@` → `src`; include `tests/**/*.test.ts`; no changes required this phase |
| **Quick run command** | `npx vitest run tests/<file>.test.ts` |
| **Full suite command** | `npm test && npm run typecheck && npm run lint && npm run build` (186 tests green pre-phase) |
| **Estimated runtime** | ~3 seconds unit suite (`tests/og-route.test.ts` renders real PNGs and dominates); build adds ~40 s when included |

---

## Sampling Rate

- **After every task commit:** Run the touched test file (`npx vitest run tests/<touched>.test.ts`) + `npm run typecheck` (the `<automated>` command on each task wraps both)
- **After every plan wave:** Run `npm test && npm run typecheck && npm run lint && npm run build`
- **Before `/gsd:verify-work`:** Full suite command green, plus the second-push no-op evidence (`npx drizzle-kit push` → "No changes detected") in 06-01/06-02 SUMMARYs, plus the production `/og` curl gate (`image/png`, no `set-cookie`, `x-vercel-cache: HIT`) in 06-07
- **Max feedback latency:** ~3 seconds (unit); ~45 s when the build is included

---

## Per-Task Verification Map

Task IDs are `6-NN-T` (plan NN, task T). Threat IDs come from each plan's `<threat_model>`.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 6-01-1 | 01 | 1 | ACCT-01, ACCT-04 | T-06-11 / T-06-SC | FK named ≤ 63 chars + PK order matched to PG18 introspection; `@clerk/nextjs` 7.9.x pinned, no `svix`, no postinstall; VALIDATION filled | grep gates + typecheck | `grep -c 'name: "transfer_bonuses_route_fk"' src/db/schema.ts` = 1; `grep -c 'pgTable(' src/db/schema.ts` = 5; `npm ls @clerk/nextjs` → 7.9.x; `npm run typecheck` | ✅ | ✅ green |
| 6-01-2 | 01 | 1 | ACCT-01 (Wave 0 unblock) | T-06-11 / T-06-07 | Constraint renamed once under a TTY with the human reading the preview; abort on any `ALTER TABLE "transfer_routes"`; second push is a no-op; seed rows intact; DATABASE_URL never printed | **manual** (checkpoint:human-action, TTY push) + executor re-run | `npx drizzle-kit push 2>&1 \| grep -q "No changes detected" && npx tsx scripts/db-check.ts \| grep -E '^programs rows: [1-9][0-9]*$'` | ✅ scripts/db-check.ts | ✅ human-verified 2026-09-14 (06-01 Task 2 TTY push; executor re-run "No changes detected", programs rows: 21) |
| 6-01-3 | 01 | 1 | ACCT-01, ACCT-04 | T-06-07 / T-06-10 / T-06-06 / T-06-12 | Clerk keys entered only in dashboards; `grep -c` counts only; `.env.development.local` gitignored; consent ON with `/privacy` URL; self-serve delete OFF | **manual** (checkpoint:human-action, Clerk Dashboard + Vercel env) + grep gates | `grep -c '^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=' .env.development.local` = 1; `grep -c '^CLERK_SECRET_KEY=' .env.development.local` = 1; `git check-ignore -q .env.development.local`; `git status --porcelain \| grep -c '\.env'` = 0 | — | ✅ human-verified 2026-09-14 (06-01 Task 3 Clerk Dashboard + Vercel env; grep counts 1/1, .env ignored) |
| 6-02-1 | 02 | 2 | ACCT-01, ACCT-02, ACCT-03 | T-06-11 / T-06-15 / T-06-07 | Four new tables with serial PKs + `uniqueIndex` only; cascade FKs to `users.clerkUserId`; zero FKs into seeded tables (Pitfall 6); first push CREATE-only, second push "No changes detected" | grep gates + typecheck + CLI (push + db-check) | `grep -c 'pgTable(' src/db/schema.ts` = 9; `npm run typecheck && npx drizzle-kit push 2>&1 \| grep -q "No changes detected" && npx tsx scripts/db-check.ts \| grep -cE '^(users\|user_balances\|bookmarks\|travel_goals) rows: [0-9]+$'` = 4 | ✅ scripts/db-check.ts | ✅ green |
| 6-02-2 | 02 | 2 | ACCT-01, ACCT-02, ACCT-03 | T-06-03 | `balancesSchema` / `bookmarkSlugSchema` / `goalSchema` / `goalIdSchema`: slug enums from `PARAM_KEY_BY_SLUG` + `@/data`; positive ints ≤ `MAX_BALANCE`; 280/80 caps; ISO date only; hostile-input table; module has no `@/db`, drizzle, Clerk, or client directive | unit (TDD, hostile table) | `npx vitest run tests/account-validation.test.ts tests/balance-params.test.ts && npm run typecheck` | ✅ `tests/account-validation.test.ts` | ✅ green |
| 6-02-3 | 02 | 2 | ACCT-01 | T-06-09 | `resolveInitialBalances(url, stored, saved)`: URL > storage > account > none; account branch never writes storage (`localStorage` count 0 in module) | unit (TDD, extends existing file) | `npx vitest run tests/balance-storage.test.ts && npm run typecheck` | ✅ extend `tests/balance-storage.test.ts` | ✅ green |
| 6-03-1 | 03 | 2 | ACCT-01 | T-06-05 / T-06-08 / T-06-16 / T-06-01 | `src/proxy.ts` is `clerkMiddleware()` with no `auth.protect`; matcher excludes `/og`; no `middleware.ts`; `<ClerkProvider afterSignOutUrl="/">` inside `<body>` without `dynamic`; header is a server component importing only client-safe Clerk components; `/methodology` stays `○`, `/og` stays `ƒ` | grep gates + typecheck + lint + build route table | grep gates in plan + `npm run typecheck && npm run lint && npm run build` (`○ /methodology`, `ƒ /og`) | ✅ build script | ✅ green |
| 6-03-2 | 03 | 2 | ACCT-04 | T-06-10 / T-06-16 | `/privacy` renders h1 + required h2 sections, names Clerk, Neon, the localStorage key, and "Delete my account"; no `new Date`, no client directive, no `@/db`, no `@clerk/nextjs/server`; footer `href="/privacy"`; `PRIVACY_CONTACT_EMAIL` constant in `src/lib/site.ts` | unit (TDD, renderToStaticMarkup + source scan) + build (`○ /privacy`) | `npx vitest run tests/privacy-page.test.ts tests/methodology-page.test.ts && npm run typecheck && npm run lint && npm run build` | ✅ `tests/privacy-page.test.ts` | ✅ green |
| 6-04-1 | 04 | 3 | ACCT-01, ACCT-02, ACCT-03 | T-06-02 / T-06-15 / T-06-04 | `loadAccountSnapshot(userId)` scopes all three reads by `eq(table.userId, userId)`; `filterKnownBookmarks` drops unknown slugs at read time; no `console.*` | unit (TDD, pure helpers) + grep gates | `npx vitest run tests/account-data.test.ts && npm run typecheck` + `grep -c 'eq(.*\.userId, userId)' src/lib/server/account-data.ts` = 3 | ✅ `tests/account-data.test.ts` | ✅ green |
| 6-04-2 | 04 | 3 | ACCT-01, ACCT-02, ACCT-03, ACCT-04 | T-06-01 / T-06-02 / T-06-03 / T-06-04 / T-06-06 / T-06-14 | `"use server"` first line; `const { userId } = await auth();` opens all five actions; every DELETE scoped by userId; no `throw`, no `console.*`; `users.deleteUser(userId)` exactly once; `@/db` importers are exactly `account.ts`, `interest.ts`, `account-data.ts` | grep gates + typecheck + lint | grep gates in plan + `npm run typecheck && npm run lint` | — | ✅ green |
| 6-04-3 | 04 | 3 | ACCT-01, ACCT-04 | T-06-01 / T-06-04 / T-06-05 / T-06-06 | Mocked Clerk + db: auth → null ⇒ no db call; driver error text never reaches the result; `db.delete(users)` awaited BEFORE `clerkClient().users.deleteUser`, DB failure short-circuits Clerk; guest-flow gate scans `src/components/**` for `@/db`, `drizzle-orm`, `@clerk/nextjs/server`, `CLERK_SECRET_KEY`; `page.tsx` has no `export const dynamic`; `/methodology`, `/privacy`, `/og` never import `@clerk/nextjs/server`; flips `wave_0_complete: true` | unit (TDD, mock call order) + source-scan test + full suite | `npx vitest run tests/account-actions.test.ts tests/guest-flow-gate.test.ts && npx vitest run && npm run typecheck && npm run lint` | ✅ `tests/account-actions.test.ts`, `tests/guest-flow-gate.test.ts` | ✅ green |
| 6-05-1 | 05 | 4 | ACCT-01, ACCT-02 | T-06-01 / T-06-05 / T-06-04 | `SaveBalancesButton` + `BookmarkButton` are `"use client"` with `mode="modal"` sign-in; `useOptimistic` on bookmark; no `useAuth`/`useUser`, no `@/db`, no `@clerk/nextjs/server`; render only `ActionState.message` | grep gates + typecheck + lint + guest-flow gate | grep gates in plan + `npm run typecheck && npm run lint && npx vitest run tests/guest-flow-gate.test.ts` | ✅ (after 6-04-3) | ✅ green |
| 6-05-2 | 05 | 4 | ACCT-01, ACCT-02 | T-06-09 / T-06-17 / T-06-03 | Island calls `resolveInitialBalances` once; `storage`/`account` sources both push with `history: "replace"`; `savedBalances` consumed only in the ref-guarded mount effect; `isSignedIn`/`bookmarkedSlugs` are server-derived props (no hydration flip); server re-validates arguments | grep gates + typecheck + lint + full unit suite | grep gates in plan + `npm run typecheck && npm run lint && npx vitest run` | ✅ | ✅ green |
| 6-05-3 | 05 | 4 | ACCT-01 | T-06-01 / T-06-05 / T-06-16 | `page.tsx` reads `await auth()` once and threads `loadAccountSnapshot(userId)` through the server module; no `@/db` import; no `export const dynamic`; `asOf` still derived once per request; route table `ƒ /`, `○ /methodology`, `○ /privacy`, `ƒ /og` | grep gates + typecheck + lint + suite + build route table | grep gates in plan + `npm run typecheck && npm run lint && npx vitest run && npm run build` (4 route lines) | ✅ build script | ✅ green |
| 6-06-1 | 06 | 4 | ACCT-02, ACCT-03 | T-06-02 / T-06-05 / T-06-04 | `GoalForm`/`GoalList` are `"use client"` with `useActionState(addGoal)` / `useActionState(deleteGoal)`; hidden `goalId` only ever combined with the session userId server-side; `BookmarkList` is a server component; `import type { TravelGoalRow }` only | grep gates + typecheck + lint + guest-flow gate | grep gates in plan + `npm run typecheck && npm run lint && npx vitest run tests/guest-flow-gate.test.ts` | ✅ | ✅ green |
| 6-06-2 | 06 | 4 | ACCT-04 | T-06-06 / T-06-04 / T-06-05 | `DeleteAccountDialog` requires explicit confirmation; `useActionState(deleteAccount)`; `signOut(` called only on `status === "ok"`; trigger label "Delete my account" matches `/privacy`; no `clerkClient` on the client | grep gates + typecheck + lint + guest-flow gate | grep gates in plan + `npm run typecheck && npm run lint && npx vitest run tests/guest-flow-gate.test.ts` | ✅ | ✅ green |
| 6-06-3 | 06 | 4 | ACCT-01, ACCT-02, ACCT-03, ACCT-04 | T-06-01 / T-06-16 / T-06-04 | `/account` RSC reads `await auth()` once; signed-out renders a prompt with zero data; no `@/db`, no `searchParams`, no `export const dynamic`; "Open my saved results" built via `balancesToParams(`; all four account components mounted; `○ /methodology`, `○ /privacy` unchanged, `ƒ /account` | grep gates + typecheck + lint + suite + build route table | grep gates in plan + `npm run typecheck && npm run lint && npx vitest run && npm run build` (3 route lines) | ✅ build script | ✅ green |
| 6-07-1 | 07 | 5 | ACCT-01, ACCT-04 | T-06-08 / T-06-07 | Full local gates green; production `/privacy` 200 with "Retention and deletion"; `/account` 200; `/og` is `image/png` with zero `set-cookie`; no env values printed | full suite + production smoke (curl) | `npm test && npm run typecheck && npm run lint` + curl commands in plan (`/privacy`, `/account`, `/og` headers) | ✅ | ✅ green |
| 6-07-2 | 07 | 5 | ACCT-01, ACCT-02, ACCT-03, ACCT-04 | T-06-10 / T-06-06 / T-06-13 / T-06-12 | Human walkthrough: guest flow untouched, modal in place with required consent, save/bookmark/goal persist across a fresh private session, account restore into the URL, delete lands on `/` signed out with the Clerk user gone; `users rows` back to baseline | **manual** (checkpoint:human-verify) + post-approval db-check | `npx tsx scripts/db-check.ts \| grep -E '^users rows: [0-9]+$' && npx tsx scripts/db-check.ts \| grep -qE '^programs rows: 21$'` | ✅ scripts/db-check.ts | ✅ human-verified 2026-09-14 (06-07 Task 2 steps 1–9 approved; post-approval db-check users rows: 0, programs rows: 21) |
| 6-07-3 | 07 | 5 | all | T-06-SC | VALIDATION sign-off: every row green, `nyquist_compliant: true`, `wave_0_complete: true`, zero pending-status cells | suite + grep gates | `npm test && grep -c '^nyquist_compliant: true' 06-VALIDATION.md` = 1 && `grep -c` of the pending marker = 0 | ✅ | ✅ green |

*Status: ✅ green (automated, `npm test` 289/289 on 2026-09-14) · ✅ human-verified <date> (manual) · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 is plan 06-01 (Wave 1) plus the first task that creates each test file — every test file is created in the same task as the module it covers, so no task runs without an automated verify:

- [x] TTY `drizzle-kit push` gate — human checkpoint (06-01 Task 2): FK rename applied once, second push prints "No changes detected", `programs rows: 21` intact
- [x] Clerk app + keys on Vercel (Production + Preview + Development) + `vercel env pull`; Dashboard consent ON with `/privacy` URL; self-serve delete OFF — human checkpoint (06-01 Task 3)
- [x] `tests/account-validation.test.ts` — ACCT-01/02/03 Zod boundary hostile table (06-02 Task 2)
- [x] `tests/balance-storage.test.ts` — extended with the `resolveInitialBalances` account branch (06-02 Task 3)
- [x] `tests/privacy-page.test.ts` — ACCT-04 render + source-scan assertions (06-03 Task 2)
- [x] `tests/account-data.test.ts` — ACCT-02 pure filter + snapshot helpers (06-04 Task 1)
- [x] `tests/account-actions.test.ts` — ACCT-01/04 mocked Clerk + db, delete call order (06-04 Task 3)
- [x] `tests/guest-flow-gate.test.ts` — ACCT-01 source-scan gate for `src/components/**` and the static routes (06-04 Task 3; flips `wave_0_complete: true`)
- No framework install needed; the only npm package this phase is `@clerk/nextjs@^7.9.1` (06-01 Task 1, audited Approved).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `drizzle-kit push` renames `transfer_bonuses_route_fk` once, then a second push is a no-op | ACCT-01 (Wave 0 unblock) | drizzle-kit refuses constraint renames without a TTY; a piped shell cannot answer the prompt | 06-01 Task 2: human runs `npx drizzle-kit push --verbose` in a real terminal, confirms only if the preview shows the FK DROP/ADD and no `ALTER TABLE "transfer_routes"`, then runs `npx drizzle-kit push` again → "No changes detected". Executor re-runs push + `npx tsx scripts/db-check.ts` (`programs rows: 21`) — verified 06-01 Task 2 |
| Clerk Dashboard settings: consent to legal documents ON with `https://milesworth.vercel.app/privacy`; self-serve account deletion OFF; keys on Vercel for Production + Preview + Development | ACCT-04, ACCT-01 | Dashboard configuration has no API surface the executor may drive; secrets must never enter the chat | 06-01 Task 3 steps 1–6; executor verifies with `vercel env pull` + `grep -c` counts only and `git check-ignore` — verified 06-01 Task 3 |
| Modal sign-up shows a required consent checkbox linking to `/privacy`; the Clerk user carries `legalAcceptedAt` | ACCT-04 | Clerk's hosted modal cannot run in node; the timestamp lives in the Clerk Dashboard | 06-07 Task 2 steps 2–3 (sign up via the modal on `/?ur=90000&mr=50000`, confirm the checkbox is required and links to `/privacy`) and step 8 (Dashboard → Users → test user shows a legal-acceptance timestamp) — approved 2026-09-14 (step 8 approved without notes) |
| Save my balances persists to the account and restores on a device with empty storage (URL becomes `/?ur=90000&mr=50000` by itself) | ACCT-01 | Server Actions need a browser-issued action request and a real Clerk session; cross-device storage state cannot be forged locally | 06-07 Task 2 steps 4–5 (Save after sign-in without reload — A5) and step 7 (sign out, new private window, sign in on bare `/`, URL restores) — approved 2026-09-14 (step 4 approved without notes; A5 not reported as failed) |
| Bookmarks and travel goals persist across sign-out/sign-in; `/account` lists them | ACCT-02, ACCT-03 | Same as above — requires a live Clerk session in a browser | 06-07 Task 2 steps 5–7 (bookmark one Bookable-now + one Almost-there card, add/remove/re-add a goal on `/account`, confirm both survive a fresh private session) — approved 2026-09-14 |
| Delete my account cascades DB rows, deletes the Clerk user, and lands on `/` signed out | ACCT-04 | Cascade + Clerk deletion + client sign-out is an end-to-end browser flow | 06-07 Task 2 step 9; executor then runs `npx tsx scripts/db-check.ts` → `users rows: <baseline>` and `programs rows: 21` — approved 2026-09-14; db-check users rows: 0, programs rows: 21 |
| `/og` stays CDN-cached with no cookies after the Clerk proxy ships | ACCT-01 (guest flow / PLAT-03 regression) | Only production is observable (previews are Deployment-Protected); `x-vercel-cache` is a Vercel edge header | 06-07 Task 1: `curl -sI 'https://milesworth.vercel.app/og?ur=90000&mr=50000'` twice → `content-type: image/png`, zero `set-cookie`, `x-vercel-cache: HIT` on the second fetch — verified 06-07 Task 1 (canonical `&d=` URL: image/png, set-cookie 0, MISS→HIT; the bare URL 308s cookie-free, see 06-07-SUMMARY deviations) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (checkpoint tasks 6-01-2, 6-01-3, 6-07-2 are manual by justification above)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags (`vitest run` everywhere)
- [x] Feedback latency < 6s (unit)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-14 (executor, 06-07 Task 3 — automated rows: `npm test` 20 files / 289 passed; manual rows: 06-01 Tasks 2–3 and 06-07 Task 2 human checkpoints, the last approved 2026-09-14 with `users rows: 0`)
