---
phase: 05-credibility-layer
plan: 05
subsystem: ui
tags: [next-app-router, vercel, og-image, deploy, nuqs, footer, waitlist]

# Dependency graph
requires:
  - phase: 05-02
    provides: SiteFooter server component + /methodology route
  - phase: 05-03
    provides: metadataBase, per-link generateMetadata, /og ImageResponse route
  - phase: 05-04
    provides: AdvisorTease client component + interest server action + interest_signups table
provides:
  - "<SiteFooter /> mounted in the root layout after {children} inside NuqsAdapter (every route)"
  - "<AdvisorTease /> mounted on / below CoreExperience in a max-w-3xl container"
  - "Production deploy of Phases 2-5 at https://milesworth.vercel.app (Vercel Git auto-deploy)"
  - "Curl evidence that production serves per-link OG tags, a cached /og PNG, and /methodology"
affects: [06-launch-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Layout-level footer mount inside NuqsAdapter so mt-auto pins it to the flex-column body bottom"
    - "Deploy-by-push: origin/main is production; verification is curl-only against the production host"

key-files:
  created:
    - .planning/phases/05-credibility-layer/05-05-SUMMARY.md
  modified:
    - src/app/layout.tsx
    - src/app/page.tsx

key-decisions:
  - "Vercel strips s-maxage from the client-facing Cache-Control header; X-Vercel-Cache MISS then HIT is the observable proof of CDN caching for /og"
  - "grep -c NuqsAdapter reads 3 (not the Phase 4 gate's 2) because prettier forces the two-child wrap onto separate lines; one import + one usage is unchanged"

patterns-established:
  - "Production verification: poll og:image count on the share URL until >= 1, then capture tags / PNG headers / cache-key isolation / methodology in one curl pass"

requirements-completed: [VAL-03, PLAT-03, PLAT-04]

# Metrics
duration: ~5 min executor (Tasks 1-2) + human verify window for Task 3 (checkpoint approved 2026-09-03)
completed: 2026-09-03
---

# Phase 05 Plan 05: Mount Footer + Tease, Deploy, Probe Production Summary

**Footer and advisor tease mounted, Phases 2-5 pushed to production, live OG tags / PNG / CDN cache / /methodology verified by curl, and the unfurl plus a real waitlist row (`interest_signups rows: 1`) confirmed by the human against production.**

## Status

**COMPLETE — all 3 tasks done.** Tasks 1-2 committed (`0f9260f`), production deployed and curl-verified, and Task 3 (checkpoint:human-verify, gate=blocking) approved by the human on 2026-09-03 with the automated row-count check passing (`interest_signups rows: 1`). VAL-03, PLAT-03, PLAT-04 are satisfied on the deployed product.

## Performance

- **Duration:** Tasks 1-2 ~5 min (build + push + ~30s deploy wait); Task 3 human verify window, approved 2026-09-03
- **Started:** 2026-09-03T04:22Z
- **Tasks:** 3/3
- **Files modified:** 2

## Accomplishments

- `src/app/layout.tsx` renders `<SiteFooter />` after `{children}` inside `<NuqsAdapter>` — the Methodology link is now on every route (VAL-03)
- `src/app/page.tsx` renders `<AdvisorTease />` below `<CoreExperience />` inside `mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6`, no props (PLAT-04)
- Pushed `main` (`061ced1..0f9260f`, 99 commits) to origin; Vercel auto-deployed production within ~30s
- Production serves the Phase 5 build: absolute canonical `og:image`, `image/png` at `/og`, CDN HIT on second fetch, distinct bytes per query, `/methodology` 200 and linked from `/`

## Task Commits

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Mount SiteFooter + AdvisorTease and run every phase gate locally | `0f9260f` | src/app/layout.tsx, src/app/page.tsx |
| 2 | Deploy to production and probe OG tags, PNG, and CDN cache with curl | (no files; push of `0f9260f`) | — |
| 3 | Verify the unfurl in a link-preview inspector and submit one waitlist email | complete (docs commit — this SUMMARY finalize) | — |

## Task 1 Gate Results (local, on 0f9260f)

| Gate | Command | Result |
| ---- | ------- | ------ |
| Footer mount / import | `grep -c '<SiteFooter />' src/app/layout.tsx` / `grep -c 'from "@/components/site-footer"'` | 1 / 1 |
| Tease mount / import | `grep -c '<AdvisorTease />' src/app/page.tsx` / `grep -c 'from "@/components/advisor-tease"'` | 1 / 1 |
| Tests | `npx vitest run` | 15 files, 180 tests passed |
| Typecheck | `npm run typecheck` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| Build | `npm run build` | exit 0; route table `ƒ /`, `○ /_not-found`, `○ /methodology`, `ƒ /og` |
| DB-free components/app | `grep -rlE 'from "@/db\|drizzle' src/components src/app` | exactly `src/app/actions/interest.ts` |
| Phase 4: NuqsAdapter | `grep -c 'NuqsAdapter' src/app/layout.tsx` | 3 (see Deviations — line-count artifact of the multi-line wrap) |
| Phase 4: robots | `grep -c 'index: false' src/app/layout.tsx` | 1 |
| Phase 4: no force-dynamic | `grep -c 'force-dynamic' src/app/page.tsx` | 0 |
| Phase 4: client island | `head -1 src/components/core-experience.tsx` | `"use client";` |
| Secrets (T-05-17) | `git ls-files \| grep -E '(^\|/)\.env'` | prints nothing |
| Fonts tracked | `git ls-files src/assets/fonts` | `fraunces-latin-600-normal.woff`, `inter-latin-400-normal.woff` |

## Task 2 Production Evidence (curl, 2026-09-03 ~04:24Z)

**Push:** `git push origin main` → `061ced1..0f9260f  main -> main`; `git rev-list --count origin/main..main` → `0`

**Deploy poll:** `og:image` count on `/?ur=90000&mr=50000` was 0 at 04:23:56, 1 at 04:24:27.

**Tags** — `curl -s "https://milesworth.vercel.app/?ur=90000&mr=50000" | grep -oE '<meta (property="og:[a-z:]+"|name="twitter:[a-z]+")[^>]*>'`:

```
<meta property="og:title" content="90,000 Chase Ultimate Rewards points → ANA First Class to Tokyo via Virgin Atlantic"/>
<meta property="og:description" content="90,000 Chase Ultimate Rewards points → ANA First Class to Tokyo via Virgin Atlantic — $12,870 more than cashing out. See every redemption these balances unlock."/>
<meta property="og:url" content="https://milesworth.vercel.app/?ur=90000&amp;mr=50000"/>
<meta property="og:image" content="https://milesworth.vercel.app/og?ur=90000&amp;mr=50000"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:alt" content="90,000 Chase Ultimate Rewards points → ANA First Class to Tokyo via Virgin Atlantic — $12,870"/>
<meta property="og:type" content="website"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="90,000 Chase Ultimate Rewards points → ANA First Class to Tokyo via Virgin Atlantic"/>
<meta name="twitter:description" content="90,000 Chase Ultimate Rewards points → ANA First Class to Tokyo via Virgin Atlantic — $12,870 more than cashing out. See every redemption these balances unlock."/>
<meta name="twitter:image" content="https://milesworth.vercel.app/og?ur=90000&amp;mr=50000"/>
```

`og:image` host is `milesworth.vercel.app` (T-05-18 mitigated — not a Deployment-Protected preview host).

**Image** — `curl -sI "https://milesworth.vercel.app/og?ur=90000&mr=50000"`, twice:

```
#1  HTTP/1.1 200 OK
    Cache-Control: public, max-age=0
    Content-Type: image/png
    X-Vercel-Cache: MISS
    X-Vercel-Id: cle1::iad1::t22cb-1788409475334-a01e9d2d2018
#2  HTTP/1.1 200 OK
    Cache-Control: public, max-age=0
    Content-Type: image/png
    X-Vercel-Cache: HIT
    X-Vercel-Id: cle1::iad1::fm7ff-1788409475914-c219d8860387
```

**Cache-key isolation (A2 / T-05-11)** — `curl -s -o /dev/null -w '%{size_download}'`:

```
/og?ur=90000     → 76457 bytes
/og?hyatt=75000  → 78468 bytes   (differ: query is part of the cache key)
```

**Methodology (VAL-03):**

```
curl -s -o /dev/null -w '%{http_code}' https://milesworth.vercel.app/methodology → 200
curl -s https://milesworth.vercel.app/ | grep -c 'href="/methodology"'          → 1
```

**Baseline card** — `curl -sI https://milesworth.vercel.app/og`:

```
HTTP/1.1 200 OK
Cache-Control: public, max-age=0
Content-Type: image/png
```

**Tease present (PLAT-04):** `curl -s 'https://milesworth.vercel.app/?ur=90000' | grep -ci 'coming soon'` → 1

## Task 3 Human Verification (approved)

Inspector URLs and share link handed to the human:

- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
- Vercel dashboard → production deployment → Open Graph tab, path `/?ur=90000&mr=50000`
- Production share link: https://milesworth.vercel.app/?ur=90000&mr=50000
- Bare URL (baseline card): https://milesworth.vercel.app/

**Recorded after "approved" (2026-09-03):**

- `npx tsx scripts/db-check.ts | grep -E "^interest_signups rows: [1-9][0-9]*$"` → `interest_signups rows: 1`
- Inspector evidence: Human confirmed steps 1-5 via /gsd-execute-phase checkpoint on 2026-09-03 (no screenshots supplied). Confirmed on production: LinkedIn Post Inspector branded card for the share link (terracotta dollar figure, "90,000 Chase Ultimate Rewards points → …" title, description ending "See every redemption these balances unlock."); bare-URL baseline card (ink headline, no dollar figure); Vercel Open Graph tab matching step 1; waitlist form → "You're on the list." with no reload, idempotent on resubmit from a fresh visit, and "Enter a valid email address." on `not-an-email`; /methodology page content (nine sections, per-program cash-out baselines, ANA worked example ending "= 9.3¢ per point.").

## Files Created/Modified

- `src/app/layout.tsx` — `SiteFooter` import + `<SiteFooter />` after `{children}` inside `<NuqsAdapter>`
- `src/app/page.tsx` — `AdvisorTease` import + `<AdvisorTease />` in a `max-w-3xl` container after `<CoreExperience />`

## Decisions Made

- **CDN cache proof:** Vercel's edge consumes `s-maxage` and rewrites the client-facing header to `public, max-age=0`, so the literal `s-maxage=86400` cannot be observed with curl. The source (`src/app/og/route.tsx:39`) sets `public, max-age=0, s-maxage=86400, stale-while-revalidate=604800`, and the `MISS` → `HIT` pair on identical requests is the observable proof the CDN honored it. No code change.

## Deviations from Plan

### Evidence-interpretation notes (no code changes)

**1. `cache-control` criterion not literally observable on production**
- **Found during:** Task 2
- **Issue:** Acceptance criterion says the `/og` response `cache-control` contains `s-maxage=86400`; production returns `public, max-age=0` because Vercel strips `s-maxage` before responding to clients.
- **Resolution:** Verified the header in source (`src/app/og/route.tsx:39`) and used `X-Vercel-Cache: MISS` → `HIT` as the behavioral proof. Documented above.

**2. `grep -c 'NuqsAdapter' src/app/layout.tsx` = 3, Phase 4 gate expected 2**
- **Found during:** Task 1
- **Issue:** The Phase 4 gate counted lines when the wrap was the one-liner `<NuqsAdapter>{children}</NuqsAdapter>` (import + 1 line). Adding `<SiteFooter />` as a second child makes prettier split the open/close tags across lines (verified: prettier reformats a one-liner back to three lines), so the count is import + open + close = 3.
- **Resolution:** Semantic intent (exactly one import, one adapter wrapping the whole tree) is unchanged; the plan's `<automated>` verify block does not include this check. Recorded here so the Phase 4 gate can be updated to `grep -c 'import { NuqsAdapter }'` = 1 in a later plan.

No auto-fix rules (1-3) were triggered. No packages installed.

## Issues Encountered

None. Push accepted on first attempt; deploy was live ~30s after push.

## Known Stubs

None — both mounts are wired to real components with live data paths (footer links to the live `/methodology` route; the tease posts to the `interest` server action that writes to Neon).

## Threat Flags

None new. Task 2 confirmed T-05-18 (og:image host is production, not a preview) and T-05-11 (cache key includes the query string).

## Next Phase Readiness

- Phase 5 plans 01-05 all complete; phase is ready for `/gsd:verify-phase 5`.
- VAL-03 / PLAT-03 / PLAT-04 marked complete; ROADMAP plan progress updated in the tracking commit that follows this SUMMARY.
- Carry-forward for Phase 6/7: the Phase 4 `NuqsAdapter` gate should be re-expressed as `grep -c 'import { NuqsAdapter }'` = 1 (see Deviations #2).
- Launch-gate reminder (STATE.md): test the LinkedIn in-app WebView session before the LinkedIn post.

## Self-Check: PASSED

- Files: src/app/layout.tsx, src/app/page.tsx present
- Commits: 0f9260f (Task 1 mount), fde89c7 (draft summary) present in git log
- Task 3 automated verify: `interest_signups rows: 1`
