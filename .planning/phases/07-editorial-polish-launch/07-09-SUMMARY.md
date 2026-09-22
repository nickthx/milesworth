---
phase: 07-editorial-polish-launch
plan: 09
subsystem: launch-flip
tags: [plat-02, plat-05, seo, robots, sitemap, favicon, readme, launch-gate]

# Dependency graph
requires:
  - phase: 07-editorial-polish-launch
    plan: 07
    provides: config/lighthouserc.cjs with best-practices warn, SEO warn, LHCI_CHROME_PORT override
  - phase: 07-editorial-polish-launch
    plan: 05
    provides: layout.tsx viewport export and CREAM theme-color (kept intact while the robots line was removed)
  - phase: 05-share-og
    plan: 03
    provides: src/app/og/route.tsx font-loading pattern and the vendored Fraunces woff the icon routes reuse
  - phase: 06-accounts-legal
    plan: 08
    provides: 06-REVIEW IN-05 (route-level /account noindex must precede lifting the site-wide one)
provides:
  - "src/app/account/page.tsx metadata.robots { index: false, follow: false } — the private route's own directive"
  - "src/app/robots.ts: allow /, disallow /account, sitemap URL derived from SITE_URL (static ○)"
  - "src/app/sitemap.ts: /, /methodology, /privacy with constant SITE_LAST_MODIFIED (static ○)"
  - "src/app/layout.tsx with the D-03 site-wide noindex removed (file is free of the word noindex)"
  - "config/lighthouserc.cjs: categories:seo promoted warn -> error at minScore 0.90"
  - "src/app/icon.tsx (32x32) + src/app/apple-icon.tsx (180x180): Fraunces 600 M, ink on cream, built from the vendored woff"
  - "README.md: recruiter-facing product README (49 lines, eight sections)"
  - "tests/launch-gate.test.ts: 33 assertions pinning every flip item"
affects: [07-10, verify-work 7]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Next metadata-route conventions (robots.ts, sitemap.ts, icon.tsx, apple-icon.tsx) replace hand-maintained public/ files; all four prerender as static"
    - "Source-scan gates read the WHOLE file, so header comments must not name the forbidden tokens (sitemap.ts comment reworded twice: /account, /og, new Date)"
    - "Icon routes follow the /og pattern: readFile(join(process.cwd(), 'src/assets/fonts', …)) at build, brand tokens from @/lib/brand, no hex literals"

key-files:
  created:
    - src/app/robots.ts
    - src/app/sitemap.ts
    - src/app/icon.tsx
    - src/app/apple-icon.tsx
    - tests/launch-gate.test.ts
    - .planning/phases/07-editorial-polish-launch/07-09-SUMMARY.md
  modified:
    - src/app/account/page.tsx
    - src/lib/site.ts
    - src/app/layout.tsx
    - config/lighthouserc.cjs
    - README.md
    - tests/design-system-gate.test.ts
  deleted:
    - src/app/favicon.ico
    - public/file.svg
    - public/globe.svg
    - public/next.svg
    - public/vercel.svg
    - public/window.svg

key-decisions:
  - "Flip order held: /account route-level noindex committed (665ded7) before the layout noindex was removed (457ab84), per 06-REVIEW IN-05"
  - "Icons via Next icon.tsx/apple-icon.tsx conventions (planner discretion note), not a hand-built favicon.ico — one icon link, no ICO container, zero new dependencies"
  - "SITE_LAST_MODIFIED = 2026-09-21 as a hand-bumped constant; sitemap never reads the clock (T-05-05)"
  - "best-practices stays warn per 07-07's Clerk dev-instance ruling; LHCI_CHROME_PORT override untouched"
  - "README lists the eight enterable programs by name and credits Unsplash only (every manifest entry is Unsplash today; Pexels is an accepted source, not a used one)"

patterns-established:
  - "Launch-gate test extended with a trailing marker per task part (same shape as design-system-gate)"

requirements-completed: [PLAT-02, PLAT-05]

# Metrics
duration: ~6 min
completed: 2026-09-21
---

# Phase 07 Plan 09: Launch Flip Summary

**The codebase is now indexable except /account: route-level noindex landed first, robots.ts/sitemap.ts/icon routes prerender as static, the D-03 site-wide noindex is gone, SEO is a hard Lighthouse assertion, and the scaffold README/SVGs/favicon are replaced by a product README and a Fraunces "M" mark — all pinned by 33 launch-gate assertions.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-09-21T21:22Z
- **Completed:** 2026-09-21T21:29Z
- **Tasks:** 3
- **Files modified:** 12 (5 created, 6 modified, 6 deleted, 1 test extended)

## Accomplishments

- `/account` carries its own `robots: { index: false, follow: false }` and is disallowed in `robots.txt`; the built `robots.txt` reads `User-Agent: * / Allow: / / Disallow: /account / Sitemap: https://milesworth.vercel.app/sitemap.xml`.
- `sitemap.xml` lists exactly `/`, `/methodology`, `/privacy` with `lastmod 2026-09-21` from a constant.
- `layout.tsx` no longer contains `index: false` or the word `noindex`; the built `.next/server/app/methodology.html` contains zero `noindex`.
- `config/lighthouserc.cjs`: `categories:seo` is `["error", { minScore: 0.9 }]` with a dated comment; best-practices remains `warn`.
- Build route table: `/icon`, `/apple-icon`, `/robots.txt`, `/sitemap.xml` all `○ (Static)`. The built head has one `rel="icon" … type="image/png" sizes="32x32"` link and one `rel="apple-touch-icon"` link; the rendered PNG was visually checked (ink Fraunces M on cream).
- README: 49 lines, eight H2 sections (Live, What it does, How the numbers work, Stack, Local development, Data, Credits, Roadmap), no `create-next-app`, no `Geist`, no env values.
- Full suite: 25 files / 390 tests green; `npm run typecheck`, `npm run lint`, `npm run build` all green.

## Task Commits

| Task | Name | Commit |
| ---- | ---- | ------ |
| 1 | Route-level noindex on /account, robots.ts, sitemap.ts, SITE_LAST_MODIFIED, launch-gate part 1 | 665ded7 |
| 2 | Remove layout noindex, promote SEO to error, launch-gate part 2 | 457ab84 |
| 3 | Branded icon routes, scaffold cleanup, README rewrite, launch-gate part 3 + design-system gate | c2ab8c4 |

## Files Deleted (intentional, per plan Task 3)

- `src/app/favicon.ico` (scaffold default; Next would otherwise emit a second icon link)
- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`

`grep -rn "\.svg" src` was empty before deletion; `public/` is now empty.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] sitemap.ts header comment tripped its own gate**
- **Found during:** Task 1 verification
- **Issue:** The gate scans the full file text; my explanatory comment named `/account`, `/og`, and `new Date()`, failing two assertions.
- **Fix:** Reworded the comment to describe the exclusions without the literal tokens.
- **Files modified:** src/app/sitemap.ts
- **Commit:** 665ded7

**2. [Rule 1 - Bug] README factual corrections against the data**
- **Found during:** Task 3
- **Issue:** First draft said the eight enterable programs included "major airline currencies" (they are five bank currencies plus Hyatt, Hilton, Marriott — airlines are transfer targets only) and credited "Unsplash and Pexels" (every manifest entry is Unsplash; the footer reads "Photos via Unsplash").
- **Fix:** Listed the eight programs by name; credit reads "Unsplash (the manifest also accepts Pexels)".
- **Files modified:** README.md
- **Commit:** c2ab8c4

### Not done (by instruction)

- `npm run lighthouse` was not run — 07-10 re-measures SEO against production after the deploy.
- No push, no STATE.md / ROADMAP.md edits (orchestrator owns them).

## Threat Flags

None beyond the plan's register. T-07-06 / T-07-15 / T-07-24 / T-07-25 / T-07-26 mitigations are all present and pinned by `tests/launch-gate.test.ts`. README references `vercel env pull` only; no env values appear anywhere.

## Known Stubs

None.

## Next Steps (07-10)

- Push to production; verify live `/robots.txt`, `/sitemap.xml`, the `/account` head carries `noindex`, and the tab icon renders.
- Run `npm run lighthouse` — SEO is now an error at 0.90 (was 0.60–0.63 with the noindex present).
- Re-scrape the share link on LinkedIn Post Inspector.

## Self-Check: PASSED

All 7 created/modified artifacts present, all 6 intentional deletions confirmed absent, all 3 task commits (665ded7, 457ab84, c2ab8c4) found in git log.
