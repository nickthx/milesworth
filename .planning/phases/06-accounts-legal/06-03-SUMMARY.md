---
phase: 06-accounts-legal
plan: 03
subsystem: auth
tags: [clerk, proxy, layout, header, privacy, static-route, tdd]

# Dependency graph
requires:
  - phase: 06-accounts-legal
    plan: 01
    provides: "@clerk/nextjs 7.9.1 installed; Clerk dev-instance keys in .env.development.local and on Vercel; PRIVACY_CONTACT_EMAIL nick@whitflow.com; no /terms required"
  - phase: 05-credibility-layer
    provides: /methodology static-page shape and its SSR + source-scan test pattern (T-05-05); SiteFooter mounted in layout; SITE_URL in src/lib/site.ts
provides:
  - src/proxy.ts — clerkMiddleware() public by default, /og excluded from the matcher (T-06-08)
  - "<ClerkProvider afterSignOutUrl=\"/\"> as the outermost child of <body>, no dynamic prop; SiteHeader mounted on every route"
  - src/components/site-header.tsx — Sign in (modal) / My account + UserButton via <Show>
  - /privacy static page (○ in the build table) naming every store and processor, deletion path, consent, contact
  - PRIVACY_CONTACT_EMAIL + PRIVACY_LAST_UPDATED constants in src/lib/site.ts
  - tests/privacy-page.test.ts — 14 SSR + source-scan + footer-link assertions
affects: [06-04, 06-05, 06-06, 06-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static routes under a Clerk root layout: ClerkProvider without `dynamic`, and every Clerk control component that calls auth() (the RSC <Show>) kept out of the shared layout — the header is a client boundary so <Show> resolves to the session-aware client version"
    - "Doc comments never quote grep-gated tokens (auth.protect, the server import path) so acceptance counts stay exact"
    - "Legal-page dates and contact addresses are module constants in src/lib/site.ts, never new Date() or inline strings"

key-files:
  created:
    - src/proxy.ts
    - src/components/site-header.tsx
    - src/app/privacy/page.tsx
    - tests/privacy-page.test.ts
    - .planning/phases/06-accounts-legal/06-03-SUMMARY.md
  modified:
    - src/app/layout.tsx
    - src/lib/site.ts
    - src/components/site-footer.tsx

key-decisions:
  - "site-header.tsx is a client component (\"use client\"): under the RSC export condition @clerk/nextjs resolves <Show> to a server implementation that calls auth(), which flipped every route (including /methodology and /_not-found) to ƒ in the first build; the client directive restores ○ /methodology and ○ /privacy while keeping the header on every page"
  - "Privacy contact address used: nick@whitflow.com (from 06-01-SUMMARY); /terms NOT created because 06-01 reported no terms-required signal"
  - "PRIVACY_LAST_UPDATED = 2026-09-03 rendered from a constant (no clock read) so /privacy stays prerendered"

patterns-established:
  - "Build-table gate for any layout change: ○ /methodology, ○ /privacy, ƒ /, ƒ /og, ƒ Proxy — a ƒ on a static route means something in the shared tree read request context"

requirements-completed: [ACCT-01, ACCT-04]

# Metrics
duration: ~18min
completed: 2026-09-14
---

# Phase 06 Plan 03: Clerk Proxy, Layout Provider, Header, and /privacy Summary

**Clerk now runs on every request without gating anything (`src/proxy.ts`, `/og` excluded), `<ClerkProvider>` wraps the app beneath `<body>` with a Sign in / My account header on every page, and `/privacy` ships as a statically prerendered, tested policy that names exactly the stores and processors the app has — with `/methodology` still `○` after the provider was added.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-09-14T17:23:49Z
- **Completed:** 2026-09-14
- **Tasks:** 2 (1 auto, 1 TDD)
- **Files modified:** 7 (4 created, 3 modified)

## Accomplishments

- `src/proxy.ts` (Next 16 name; no `middleware.ts` anywhere): `export default clerkMiddleware();` with the three RESEARCH Pattern 1 matcher entries verbatim — the first skips `_next`, static extensions and `og(?:$|\?)` (T-06-08); nothing protects a route. `next build` prints `ƒ Proxy (Middleware)`.
- `src/app/layout.tsx`: `<ClerkProvider afterSignOutUrl="/">` is the outermost child of `<body>`, no `dynamic` prop, wrapping `<NuqsAdapter>` → `<SiteHeader />` → `{children}` → `<SiteFooter />`. `grep -c NuqsAdapter` still reads 3; metadata, fonts and `<html>` untouched.
- `src/components/site-header.tsx`: wordmark link plus `<nav aria-label="Account">` with `<Show when="signed-out"><SignInButton mode="modal">` (h-11 touch target) and `<Show when="signed-in">` → `My account` link to `/account` + `<UserButton />`. Ink only; no server Clerk import, no DB import (`grep -rlE '@clerk/nextjs/server|from "@/db' src/components` → empty).
- `src/app/privacy/page.tsx` (218 lines): h1 "Privacy", `Last updated 2026-09-03`, seven h2 sections — What we collect (Guests / Signed in / Waitlist, citing `pu:balances:v1`), Who processes it (Clerk with DPA + subprocessor links, Neon in AWS us-east-2, Vercel request logs), What we never do, Cookies (`__session`, `__client_uat`, no banner), Retention and deletion (`/account` → "Delete my account", `mailto:nick@whitflow.com`), Consent, Children and changes — then links to `/methodology` and `/`. No `"use client"`, `searchParams`, `export const dynamic`, `new Date`, `@/db` or `@clerk/nextjs/server`.
- `src/lib/site.ts`: `PRIVACY_CONTACT_EMAIL = "nick@whitflow.com"`, `PRIVACY_LAST_UPDATED = "2026-09-03"` with the T-05-05 no-clock rationale.
- `src/components/site-footer.tsx`: `Privacy` link directly after `Methodology` (`href="/privacy"` exactly once).
- `tests/privacy-page.test.ts` (132 lines, 14 tests): single h1, seven ordered h2s, processors, storage key, deletion path, methodology link, mailto from the constant, Last updated from the constant, no accent / no exclamation marks in prose, six-token source scan, footer link count.

## Task Commits

1. **Task 1: src/proxy.ts + ClerkProvider in layout + SiteHeader** - `9e09e91` (feat)
2. **Task 2: /privacy static page + SSR test + footer link + contact constants** - `75a8065` (test, RED — module absent), `8cdf080` (feat, GREEN — 14/14)

**Plan metadata:** see final docs commit for this SUMMARY

## Files Created/Modified

- `src/proxy.ts` - New. `clerkMiddleware()` default export, `config.matcher` with `/og` exclusion, `/(api|trpc)(.*)`, `/__clerk/(.*)`. No `runtime` export.
- `src/app/layout.tsx` - `ClerkProvider` and `SiteHeader` imports; body restructured; comment records the no-`dynamic` rule (T-06-16) and `afterSignOutUrl`.
- `src/components/site-header.tsx` - New. Client component (see Deviations) rendering the sign-in / account affordances.
- `src/app/privacy/page.tsx` - New. Static policy page copying the `/methodology` shell and class constants.
- `src/lib/site.ts` - Two exported privacy constants appended.
- `src/components/site-footer.tsx` - Privacy link; header comment mentions ACCT-04.
- `tests/privacy-page.test.ts` - New. Render-once SSR assertions + source scan + footer scan.

## Verification

- `npx vitest run` → 17 files, 246 tests passed (was 16 / 232; +14 privacy)
- `npm run typecheck` → exit 0; `npm run lint` → exit 0
- Env-exported `npm run build` (keys sourced from `.env.development.local` into the shell, never printed) → exit 0; route table: `ƒ /`, `○ /_not-found`, `○ /methodology`, `ƒ /og`, `○ /privacy`, `ƒ Proxy (Middleware)`
- Acceptance greps (all match): `export default clerkMiddleware()` = 1, `auth.protect` = 0, `/(api|trpc)(.*)` = 1, `og(?:$|\?)` present, no `middleware.ts`; `NuqsAdapter` = 3, `<ClerkProvider afterSignOutUrl="/">` = 1, `<ClerkProvider dynamic` = 0, `<SiteHeader />` = 1 before `{children}`; header `href="/account"` = 1, `Show when="signed-out"` = 1, `Show when="signed-in"` = 1, `mode="modal"` = 1, forbidden tokens = 0; privacy `export const metadata` = 1, `<h2` = 7, forbidden tokens = 0, `pu:balances:v1` = 1, `Delete my account` = 1, `PRIVACY_CONTACT_EMAIL` = 3; site.ts email/date exports = 1 each; footer `href="/privacy"` = 1
- Secrets hygiene: `git status --porcelain | grep -c '\.env'` → 0 at every commit; no key or connection string appears in any tracked file or in this SUMMARY

## TDD Gate Compliance

Task 2 has a `test(...)` commit preceding a `feat(...)` commit in `git log`: `75a8065` (RED — `Cannot find module '../src/app/privacy/page'`) → `8cdf080` (GREEN — 14/14, full suite 246/246). No refactor commit was needed.

## Decisions Made

- **Header is a client component.** `@clerk/nextjs` maps `Show` through a `#components` import condition: server components get `app-router/server/controlComponents.js`, whose `Show` does `await auth(...)`, and `auth()` reads request headers. Mounted in the root layout that opted every route into dynamic rendering (first build: `ƒ /methodology`, `ƒ /_not-found`). `SignedIn`/`SignedOut` are removed stubs in v7, so the only fix that keeps a session-aware header on every page while preserving `○ /methodology` and `○ /privacy` is a client boundary, where `Show` resolves to `@clerk/react`'s `useAuth`-based version. One line, no data, no secrets; SSR still emits the wordmark and nav shell.
- **Contact address** `nick@whitflow.com` taken verbatim from 06-01-SUMMARY; **no `/terms`** because 06-01 recorded that the Clerk Dashboard did not require a Terms URL.
- **`PRIVACY_LAST_UPDATED` = 2026-09-03** as specified by the plan, rendered from the constant.
- **Comment wording avoids grep-gated tokens** — `auth.protect` in the proxy header and the server import path in the header comment were rephrased after the first gate run counted them (same lesson as 06-02).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `site-header.tsx` carries `"use client"` (plan required 0)**
- **Found during:** Task 1 build gate
- **Issue:** The plan's interface note said `Show` is "client-safe, usable inside server components". In 7.9.1 the server-resolved `Show` calls `auth()`; with the header in the root layout, the build table showed `ƒ /methodology` and `ƒ /_not-found` — violating the must-have "/methodology stays ○" and T-06-16.
- **Fix:** Added `"use client"` to `site-header.tsx` with a comment explaining why. Every other Task 1 gate (`href="/account"`, both `Show when=` counts, `mode="modal"`, forbidden-token scan, NuqsAdapter = 3, no `dynamic` prop) holds; the build table returned to `○ /methodology`, `ƒ /`, `ƒ /og`. The plan's `"use client"` = 0 acceptance line is the only one not met, deliberately.
- **Files modified:** src/components/site-header.tsx
- **Commit:** 9e09e91

**2. [Rule 1 - Bug] Doc comments inflated two acceptance counts**
- **Found during:** Task 1 verification
- **Issue:** The proxy comment said "nothing here calls auth.protect()" (`grep -c auth.protect` → 1) and the header comment named the server import path and `@/db` verbatim (forbidden-token grep → 1).
- **Fix:** Rephrased both comments; counts are now 0.
- **Files modified:** src/proxy.ts, src/components/site-header.tsx
- **Commit:** 9e09e91 (folded in before the commit was made)

Minor: `site-header.tsx` is 57 lines against the plan's "under 50" guidance; the extra lines are the deviation-1 explanation, kept on purpose.

## Issues Encountered

- First `next build` after adding the provider showed `/methodology` dynamic — diagnosed by reading `node_modules/@clerk/nextjs/dist/esm/app-router/server/controlComponents.js` (server `Show` → `auth()`), `components.server.js` (the RSC export map), and `index.js` (`SignedIn`/`SignedOut` come from `removedControlComponents`). Resolved as deviation 1.
- `next build` prints a benign warning about an unrelated `package-lock.json` in the user's home directory being outside the repo (pre-existing, not touched).
- `.vscode/` remains untracked and unrelated to this plan; left alone.

## Known Stubs

- `href="/account"` (header, signed-in only; privacy page prose) targets a route that does not exist yet — it ships in a later plan of this phase (Server Actions in 06-04, the account page after). Guests never see the header link (`Show when="signed-in"`); the privacy page link is intentional forward reference to the deletion path the policy must name. Not a data stub; no empty values flow to the UI.

## Threat Flags

None beyond the plan's register. The new request-path component (`src/proxy.ts`) and the sign-in modal are T-06-08 / T-06-01 in the plan's threat model; the header's client bundle imports only `@clerk/nextjs` client-safe components (T-06-05); no new endpoints, schema changes or file access.

## Next Phase Readiness

- Plan 06-04 (Server Actions) can call `auth()` from `@clerk/nextjs/server`: the proxy runs on every non-static, non-`/og` request. It must keep `auth()` out of `src/components/**` and out of `/methodology`, `/privacy`, `/og` (the guest-flow-gate test it introduces should assert the build-table pattern established here).
- The `/account` route (My account link target, privacy deletion path) is still to be built; until then the signed-in header link 404s — acceptable pre-launch, must exist before 06-07's deploy checkpoint.
- 06-07's production curl gate must re-prove `/og` is untouched by the proxy: `image/png`, no `set-cookie`, `x-vercel-cache: HIT` on the second fetch.
- The Clerk Dashboard privacy URL `https://milesworth.vercel.app/privacy` resolves once this plan deploys.

## Self-Check: PASSED

- All 7 plan files present on disk
- Commits 9e09e91, 75a8065, 8cdf080 present in `git log`
- Build table: ○ /methodology, ○ /privacy, ƒ /, ƒ /og, ƒ Proxy

---
*Phase: 06-accounts-legal*
*Completed: 2026-09-14*
