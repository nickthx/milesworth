---
phase: 05-credibility-layer
plan: 03
subsystem: ui
tags: [next-og, image-response, open-graph, twitter-card, generate-metadata, metadata-base, satori, vitest]

# Dependency graph
requires:
  - phase: 05-credibility-layer
    provides: "05-01: buildShareContent/ShareContent (single source of share text + canonical queryString), vendored Fraunces 600 / Inter 400 .woff under src/assets/fonts, vitest @ alias"
  - phase: 04-core-experience
    provides: "loadBalanceParams (nuqs createLoader — accepts a Request synchronously or a searchParams Promise) + paramsToBalances triple-layer sanitization; the / page whose head now carries per-share-link tags"
provides:
  - "GET /og — Node Route Handler rendering a 1200x630 PNG via next/og ImageResponse from buildShareContent; CDN-cacheable (s-maxage=86400, stale-while-revalidate=604800); hostile params degrade to the baseline card; neutral 500 on render failure"
  - "generateMetadata({ searchParams }) on / emitting complete openGraph/twitter objects — title, description, og:url with canonical params, og:image → /og?<canonical params>, twitter:card=summary_large_image"
  - "Root layout metadataBase (NEXT_PUBLIC_SITE_URL ?? https://milesworth.vercel.app) + site-wide openGraph/twitter defaults pointing at the baseline /og card"
  - "tests/og-route.test.ts — 3 node-env cases rendering real PNGs (share link, baseline, hostile params)"
affects: [05-05, linkedin-unfurl, methodology-page-metadata, launch-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "OG image as a Route Handler (not opengraph-image.tsx) so the card can read searchParams and be balance-aware"
    - "Memoized module-scope font loader (lazy Promise, no top-level await) so the route module has the same shape under Turbopack and vitest, and fonts are read once per process"
    - "Satori card JSX: inline style objects only, display:flex on every multi-child div, fontFamily strings exactly matching fonts[].name, lineClamp for the title"
    - "Metadata returns COMPLETE openGraph/twitter objects from the page — Next shallow-replaces nested metadata objects, so partial overrides would drop siteName/type"
    - "Absolute metadataBase from a fixed production constant with env override; the preview-deployment host is never used (Deployment Protection → 401 for crawlers)"

key-files:
  created:
    - src/app/og/route.tsx
    - tests/og-route.test.ts
  modified:
    - src/app/layout.tsx
    - src/app/page.tsx

key-decisions:
  - "Terracotta (#c05f33) appears exactly once in the card — the result headline (the wow delta, UI-SPEC reserved use #1); the baseline question renders in ink at 88px with no separate title line"
  - "Font bytes are loaded lazily via a memoized promise rather than top-level await so vitest and Next's bundler see an identical module shape"
  - "Two pre-existing/new comments were reworded to keep the plan's grep gates at zero (`export const dynamic` in page.tsx, the preview-host env var name in layout.tsx) — comment-only, no behavior change"

patterns-established:
  - "OG route tests render real PNGs through next/og in the node environment and assert the PNG signature bytes + content-type + cache-control — no mocking of ImageResponse"

requirements-completed: [PLAT-03]

# Metrics
duration: ~12min
completed: 2026-09-02
---

# Phase 5 Plan 03: OG Share Cards + Per-Link Metadata Summary

**Balance-aware `/og` social card rendered by `next/og` `ImageResponse` with vendored Fraunces/Inter, plus `generateMetadata` on `/` emitting absolute OG/Twitter tags that point at `/og?<canonical params>` — both fed by the single `buildShareContent` helper so preview text and image never disagree**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-09-02T23:18:00Z
- **Completed:** 2026-09-02T23:30:00Z
- **Tasks:** 2 (1 TDD)
- **Files modified:** 4

## Accomplishments
- `GET /og` returns a 1200x630 PNG (`content-type: image/png`, `Cache-Control: public, max-age=0, s-maxage=86400, stale-while-revalidate=604800`) for a share link, the branded baseline card for no params, and still a 200 PNG for hostile params (`ur=-5&mr=abc&zz=1&ur=1e9`) — verified by three real-render tests
- Fonts are the OFL `.woff` static instances vendored in 05-01, read once per process from `src/assets/fonts` via `process.cwd()`; attribution lives in the route's header comment (CLAUDE.md forbids a README)
- `/` now exports `generateMetadata({ searchParams })` returning complete `openGraph`/`twitter` objects: `og:url` carries the canonical query string (T-05-11), `og:image` is `/og?<same params>` resolved absolute via `metadataBase`
- Root layout gained `metadataBase` (`NEXT_PUBLIC_SITE_URL ?? https://milesworth.vercel.app`) and site-wide social defaults; the D-03 `robots: { index: false, follow: false }` block is untouched
- `npm run build` exits 0 with route table `ƒ /`, `○ /_not-found`, `ƒ /og`; full suite 170/170 across 14 files; `typecheck` and `lint` clean; `src/app` still has zero `@/db`/drizzle importers

## Task Commits

Each task was committed atomically:

1. **Task 1: /og ImageResponse Route Handler + node test** - `485185f` (test, RED) → `b2687b0` (feat, GREEN) → `95161b2` (style, Prettier)
2. **Task 2: metadataBase + social defaults in layout; generateMetadata on /** - `2b3f2d7` (feat)

_Note: Task 1 is TDD — RED confirmed as a module-not-found failure before the route existed; GREEN passed 3/3 on first run._

## Files Created/Modified
- `src/app/og/route.tsx` - Node Route Handler; `loadBalanceParams(request)` → `paramsToBalances` → `buildShareContent` → Satori card; memoized font loader; bare `catch` → neutral 500
- `tests/og-route.test.ts` - Share-link PNG + cache header, baseline PNG, hostile-params-still-200; PNG magic checked on bytes 1–3
- `src/app/layout.tsx` - `SITE_URL` constant, `metadataBase`, default `openGraph`/`twitter` pointing at `/og`
- `src/app/page.tsx` - `generateMetadata` above `Home`; imports `paramsToBalances` + `buildShareContent`; clock-read comment now documents two server-side reads per request (island/engine still clock-free)

## Decisions Made
- Card layout follows the plan's spec exactly: eyebrow (Inter 28) top; bottom column with the headline (Fraunces 600 — 176px terracotta for results, 88px ink for the baseline sentence), title (Fraunces 44, `lineClamp: 2`, result only), subline (Inter 28 at 0.7 opacity), and a small `milesworth.vercel.app` wordmark at 0.6 opacity (not terracotta).
- `loadFonts()` memoizes a `Promise.all` of the two `readFile`s instead of using top-level await, so a font-read failure surfaces inside the `try` and becomes the neutral 500 rather than a module-evaluation crash.
- `NEXT_PUBLIC_SITE_URL` is the only override; the Vercel per-deployment host variable is deliberately never consulted (T-05-10).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree was based on a Phase 2 commit, not the wave base**
- **Found during:** Startup branch check
- **Issue:** `git merge-base HEAD 0acc0d7` returned `061ced1` (phase-02); none of the Phase 5 plan files or 05-01 outputs existed in the worktree
- **Fix:** After the HEAD assertion passed (branch `worktree-agent-a6b2c6231c5c51f11`), ran the sanctioned `git reset --hard 0acc0d7` from the branch-check protocol; verified HEAD and a clean tree
- **Files modified:** none (environment only)
- **Commit:** n/a

**2. [Rule 1 - Grep gate] Pre-existing comment literally contained a forbidden token**
- **Found during:** Task 2 acceptance greps
- **Issue:** `src/app/page.tsx` line 16 (Phase 4 comment) said "do NOT add `export const dynamic`", which the acceptance criterion `grep -cE '…|export const dynamic' … = 0` rejects
- **Fix:** Reworded to "do NOT add a `dynamic` segment-config export" — comment only, no behavior change
- **Files modified:** src/app/page.tsx
- **Commit:** 2b3f2d7

**3. [Rule 1 - Grep gate] Two of my own comments tripped the same class of gate**
- **Found during:** Task 1 and Task 2 acceptance greps
- **Issue:** The route header comment mentioned `runtime = "edge"` literally; the layout comment named the preview-host env var literally (the plan asked for the comment, but its own grep gate forbids the token)
- **Fix:** Reworded both comments to describe the concept without the literal strings
- **Files modified:** src/app/og/route.tsx, src/app/layout.tsx
- **Commit:** b2687b0, 2b3f2d7

**4. Prettier formatting of the route (follow-up commit)**
- **Found during:** Post-Task-2 prettier check
- **Issue:** Prettier wanted the parentheses around the `ImageResponse` JSX argument removed. (Note: the repo has no Prettier gate — untouched files also fail `prettier --check` because the working tree is CRLF; `page.tsx` and `layout.tsx` were clean modulo line endings.)
- **Fix:** `prettier --write src/app/og/route.tsx`; test re-run green
- **Files modified:** src/app/og/route.tsx
- **Commit:** 95161b2

---

**Total deviations:** 4 (1 environment, 3 comment/formatting — none behavioral)
**Impact on plan:** None — all must-haves, artifacts, and key links delivered as specified.

## Issues Encountered
- The worktree had no `node_modules`; per the orchestrator's safety rule, `npm ci --prefer-offline --no-audit --no-fund` was run inside the worktree (~3 min, 720 packages). No junction/symlink was created; nothing under the main checkout was touched.
- The sandbox refuses compound Bash commands that include git; every git operation was run as a plain single command.

## User Setup Required

None locally. Optional: set `NEXT_PUBLIC_SITE_URL` in Vercel if the production domain ever changes from `milesworth.vercel.app`. Production unfurl verification (LinkedIn Post Inspector, Vercel OG tab, `x-vercel-cache: HIT` on a repeat `/og?…` request) is scheduled for plan 05-05 after deploy.

## Known Stubs

None — the card and metadata are fully wired to the engine via `buildShareContent`; the only hardcoded strings are the wordmark and the site-wide defaults the plan specifies.

## Threat Flags

None beyond the plan's register. The one new network surface (`GET /og`) is T-05-07/08/09 in the plan's threat model and all three mitigations are implemented: triple-layer param sanitization, bounded input + CDN cache headers, and a detail-free 500 with no logging.

## Next Phase Readiness
- 05-05 can verify the production unfurl end-to-end and confirm distinct param sets yield distinct PNGs and CDN HITs.
- The methodology page (05-02) inherits `metadataBase` and the default `/og` card automatically via the root layout.
- No blockers.

## Self-Check: PASSED

- FOUND: src/app/og/route.tsx, tests/og-route.test.ts, src/app/layout.tsx, src/app/page.tsx
- FOUND commits: 485185f, b2687b0, 2b3f2d7, 95161b2

---
*Phase: 05-credibility-layer*
*Completed: 2026-09-02*
