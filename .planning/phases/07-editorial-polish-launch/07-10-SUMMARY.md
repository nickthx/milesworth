---
phase: 07-editorial-polish-launch
plan: 10
subsystem: launch
tags: [plat-02, plat-05, deploy, vercel, lighthouse, seo, robots, sitemap, og, linkedin-post-inspector]

# Dependency graph
requires:
  - phase: 07-editorial-polish-launch
    plan: 01
    provides: D7-01 = b (host stays https://milesworth.vercel.app on the Clerk development instance)
  - phase: 07-editorial-polish-launch
    plan: 07
    provides: deploy-by-push precedent, LHCI_CHROME_PORT Windows procedure, 2026-09-22 Lighthouse baseline
  - phase: 07-editorial-polish-launch
    plan: 09
    provides: the launch flip (route-level /account noindex, robots.ts, sitemap.ts, icon routes, SEO promoted to error)
provides:
  - "Production deploy of the launch flip: origin/main 4d058c4 -> 5e7f692 (16 commits, fast-forward), Vercel dpl_HQ6S4DzqoZ6zjE4WznQzuuQsEQJ6 built from 5e7f692"
  - "Live probe transcript for every launch surface on https://milesworth.vercel.app (robots, sitemap, noindex placement, icons, og:url host, /og CDN HIT, 404, credits, viewport-fit)"
  - "Final Lighthouse mobile table on production with SEO asserted as error: SEO 1.00 x4, a11y 1.00 x4"
  - "Launch URL: https://milesworth.vercel.app/?ur=90000&mr=50000 — Post Inspector re-scrape + iPhone LinkedIn in-app open verified by Nick (launch verified)"
  - "Launch findings for gap closure: /og text soft in LinkedIn's preview (v1.1: render at 2x); CI typecheck fixed by orchestrator in 7740879"
affects: [verify-work 7]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Deployed-SHA proof on Vercel CLI 57: `vercel inspect` no longer prints git meta; use `MSYS_NO_PATHCONV=1 vercel api /v13/deployments/<id>` and read meta.githubCommitSha / gitSource.sha (no env values involved)"
    - "Readiness probe for a launch flip: poll /robots.txt for the new build's marker line (Disallow: /account) rather than a page string"

key-files:
  created:
    - .planning/phases/07-editorial-polish-launch/07-10-SUMMARY.md
  modified: []

key-decisions:
  - "Task 1 skipped per D7-01: b — no custom domain, no Clerk production instance; HOST = https://milesworth.vercel.app"
  - "Performance floor 0.80 kept as-is; / (0.77) and /?ur (0.75) remain the documented open gap from 07-07 (identical medians post-flip); site-header.tsx untouched"
  - "best-practices stays warn (0.79 x4, Clerk dev-instance Cloudflare cookies under D7-01 b) — not re-promoted because no Clerk production instance landed"

patterns-established: []

requirements-completed: [PLAT-02, PLAT-05]

# Metrics
duration: "~9 min executor time across two sessions (Nick's Post Inspector + phone pass excluded)"
completed: "2026-09-22"
---

# Phase 07 Plan 10: Ship the Launch Summary

**The 07-09 launch flip is live on https://milesworth.vercel.app (fast-forward push 4d058c4..5e7f692, Vercel build from the same SHA): robots.txt disallows only /account, the sitemap lists /, /methodology, /privacy, / and /methodology carry no noindex while /account does, the Fraunces icon and the OG image resolve with a CDN HIT, og:url is on the live host, and the final Lighthouse run scores SEO 1.00 and accessibility 1.00 on all four routes with SEO asserted as an error — the only red assertion is the pre-existing performance gap on / and /?ur (0.77 / 0.75, unchanged from the 07-07 baseline).**

## Status

| Task | State |
|------|-------|
| 1 — Domain + Clerk production cut-over | **Skipped per D7-01: b** (07-01-SUMMARY: `D7-01: b`, `domain: none`). No pause; proceeded straight to Task 2. |
| 2 — Deploy, probes, final Lighthouse gate | Complete (no code changes; results below) |
| 3 — LinkedIn Post Inspector re-scrape + final phone open | Complete — Nick replied **"launch verified"** (see `## Task 3`) |

**Launch URL:** `https://milesworth.vercel.app/?ur=90000&mr=50000` (baseline card: `https://milesworth.vercel.app/`)

## Task 1 — skipped per D7-01: b

07-01-SUMMARY records `D7-01: b` / `domain: none`. The plan's own instruction for that value is "do nothing: record 'Task 1 skipped per D7-01: b' in the SUMMARY and continue to Task 2 without pausing". HOST therefore stays `https://milesworth.vercel.app` on the Clerk development instance (Google OAuth enabled). The `pk_test_` assertion and the "no Development mode badge" phone check apply only to D7-01 = a and are not asserted here (`grep -c pk_test_` on `/` = 1, expected).

## Task 2 — Deploy by push

- Pre-push (2026-09-22T01:30:48Z): `git status --porcelain` → only the pre-existing untracked `.vscode/` (never staged); `git merge-base --is-ancestor origin/main HEAD` exit 0; local main 16 commits ahead of `origin/main` (`4d058c4`).
- `git push origin HEAD:main` → `4d058c4..5e7f692  HEAD -> main` (fast-forward; no force). `git rev-parse origin/main` = `git rev-parse HEAD` = `5e7f69246e2a68eea0cd406f185596e6be724359`.
- Readiness probe (`/robots.txt` every 15 s, 200 + `Disallow: /account`): poll 1 = 404 (old build, no robots route), poll 2 = 404, **poll 3 = 200 with the marker** (~45 s after the push).
- **Deployed-SHA assertion:** `vercel ls --prod` → newest READY production deployment `https://milesworth-gzthqlubx-nick-whitsetts-projects.vercel.app` (age 44 s, 31 s build). Vercel CLI 57's `vercel inspect` prints no git meta, so the SHA was read from `MSYS_NO_PATHCONV=1 vercel api /v13/deployments/dpl_HQ6S4DzqoZ6zjE4WznQzuuQsEQJ6`: `meta.githubCommitSha` = `5e7f69246e2a68eea0cd406f185596e6be724359`, `meta.githubCommitRef` = `main`, `meta.githubCommitMessage` = `docs(phase-07): update tracking after wave 5`, `gitSource.sha` = same, `readyState` = READY, `target` = production, aliases include `milesworth.vercel.app`. **Deployed SHA == `git rev-parse HEAD` == `origin/main`.**
- No env values were printed at any point (T-07-08 / T-07-28); the API response was filtered to git meta fields only. No `vercel --prod` rebuild was needed (D7-01 = b, no env change).

## Task 2 — Probe transcript (HOST = https://milesworth.vercel.app, 2026-09-22 ~01:32Z)

| # | Command | Result | Pass |
|---|---------|--------|------|
| 1 | `curl -s HOST/robots.txt` | 200; body: `User-Agent: *` / `Allow: /` / `Disallow: /account` / `Sitemap: https://milesworth.vercel.app/sitemap.xml` | yes |
| 2 | `curl -s HOST/sitemap.xml` | 200; `<loc>` = `https://milesworth.vercel.app/`, `…/methodology`, `…/privacy`; `grep -c /account` = 0 | yes |
| 3a | `curl -s HOST/ \| grep -o '<meta name="robots"[^>]*>'` | empty (no robots meta on `/`); `grep -c noindex` on `/` = 0 | yes |
| 3b | `curl -s HOST/methodology \| grep -c noindex` | 0 | yes |
| 4 | `curl -s HOST/account \| grep -o 'content="noindex[^"]*"'` | 200 (signed-out prompt page); `content="noindex, nofollow"` | yes |
| 5a | `grep -o 'rel="icon"[^>]*'` on `/` | one link: `href="/icon?71eb7a46af005f80" type="image/png" sizes="32x32"`; `curl -sI HOST/icon?…` → `200`, `Content-Type: image/png` | yes |
| 5b | `grep -o 'rel="apple-touch-icon"[^>]*'` on `/` | one link: `href="/apple-icon?66fe726fa6294bcf" type="image/png" sizes="180x180"`; `curl -sI` → `200`, `Content-Type: image/png` | yes |
| 6 | `curl -s "HOST/?ur=90000&mr=50000" \| grep -o '<meta property="og:url"[^>]*>'` | `content="https://milesworth.vercel.app/?ur=90000&amp;mr=50000"` — starts with HOST (T-05-10) | yes |
| 7 | `curl -sI "HOST/og?ur=90000&mr=50000"` | `308 Permanent Redirect`, `Location: /og?ur=90000&mr=50000&d=2026-09-22`; follow 1 → `200`, `Content-Type: image/png`, `X-Vercel-Cache: MISS`; follow 2 → `200`, `image/png`, **`X-Vercel-Cache: HIT`**; `set-cookie` count = 0 | yes |
| 8 | `curl -s HOST/nowhere -o … -w "%{http_code}"` | `404`; `grep -c "Page not found"` = 1 | yes |
| 9 | `grep -c "Photos via "` / `grep -c "viewport-fit=cover"` on `/` | 1 / 1 | yes |
| 10 | `grep -c "pk_test_"` on `/` (D7-01 = a only) | 1 — expected under D7-01 = b; not asserted | n/a |

Both `og:url` and the `Sitemap:` line start with HOST. All nine asserted probes pass with the plan's exact expectations; nothing needed redaction (no secret-bearing output).

## Task 2 — Final Lighthouse gate (production, 2026-09-22 01:33–01:36Z, median of 3)

`LHCI_BASE_URL=https://milesworth.vercel.app LHCI_CHROME_PORT=9222 npm run lighthouse` with a hand-started headless Chrome 153.0.8010.50 per the config header (07-07 Windows procedure; Chrome stopped after the run). Config: perf error 0.80 median, a11y error 0.95, best-practices warn 0.90, **SEO error 0.90** (promoted by 07-09). 12 reports in `.lighthouseci/` (gitignored).

| URL | perf (runs) | a11y | best-practices | seo (runs) | 07-07 baseline (perf / seo) |
|-----|-------------|------|----------------|------------|------------------------------|
| `/` | **0.77** (0.77 / 0.77 / 0.90) | 1.00 | 0.79 (warn) | **1.00** (1.00 / 1.00 / 1.00) | 0.77 / 0.63 |
| `/?ur=90000&mr=50000` | **0.75** (0.80 / 0.74 / 0.75) | 1.00 | 0.79 (warn) | **1.00** (1.00 / 1.00 / 1.00) | 0.75 / 0.63 |
| `/methodology` | 0.81 (0.81 / 0.78 / 0.83) | 1.00 | 0.79 (warn) | **1.00** (1.00 / 1.00 / 1.00) | 0.85 / 0.60 |
| `/privacy` | 0.84 (0.84 / 0.83 / 0.85) | 1.00 | 0.79 (warn) | **1.00** (1.00 / 1.00 / 1.00) | 0.83 / 0.60 |

Representative-run metrics: `/` LCP 3.4 s (sim), TBT 520 ms, CLS 0.012; `/?ur` LCP 4.1 s, TBT 270 ms, CLS 0.012; `/methodology` LCP 3.9 s, TBT 260 ms; `/privacy` LCP 3.9 s, TBT 180 ms, CLS 0. `is-crawlable` = 1 and `robots-txt` = 1 on every route; no failing SEO audit anywhere.

**Assertion result: exit 1 — 2 failures, 4 warnings.**
- **SEO (error, 0.90): PASS on all four routes at 1.00** — the phase's flip objective is proven on production (was 0.60–0.63 warn with the site-wide noindex).
- **Accessibility (error, 0.95): PASS at 1.00 x4.**
- **Performance (error, 0.80 median): FAIL on `/` (0.77) and `/?ur` (0.75)** — numerically identical to the 07-07 baseline medians; `/methodology` 0.81 and `/privacy` 0.84 pass. This is the documented open gap from 07-07 (simulated slow-4G LCP driven by first-party Next chunks + Clerk's ~370 KB). Per the launch context the floor was not lowered and `site-header.tsx` was not touched; the gap stays open for verify-work 7.
- **Best-practices (warn, 0.90): 0.79 x4** — Cloudflare `__cf_bm` / `_cfuvid` cookies from the Clerk development instance host under D7-01 (b); unchanged, expected, not re-promoted because no Clerk production instance landed in this plan.

**Engine note:** the reports record `lighthouseVersion 12.6.1` — `@lhci/cli` 0.15.1 resolves its own nested `lighthouse` 12.6.1 (`node_modules/@lhci/cli/node_modules/lighthouse`), so the root pin `lighthouse@13.4.1` is not what `npm run lighthouse` executes. 07-07's "Lighthouse 13.4.1" label was therefore inaccurate; both baselines ran on the same 12.6.1 engine, so the comparison above is like-for-like. Not changed here (this plan modifies no files); flagged for verify-work.

**PSI spot-check:** `pagespeedonline/v5/runPagespeed` for `HOST/` (mobile) → `429 Quota exceeded … 'Queries per day'` for the anonymous key — same as 07-07. Advisory only; re-run with a personal API key if wanted.

## Task 3 — Post Inspector result and phone open

Nick's reply (2026-09-22, relayed by the orchestrator): **"launch verified"**.

- **Post Inspector** (`https://www.linkedin.com/post-inspector/`) re-scrape of `https://milesworth.vercel.app/?ur=90000&mr=50000`: card shown with the title, the OG image, and the reported URL on `milesworth.vercel.app` — fresh scrape, not the pre-launch cached card (T-07-27 mitigated).
- **Phone** (iPhone, LinkedIn app): the DM unfurl matched the Post Inspector card and tapping it opened the page correctly in the in-app browser.
- "Development mode" badge check not applicable (D7-01 = b, Clerk development instance retained by decision).

**Launch URL:** `https://milesworth.vercel.app/?ur=90000&mr=50000`

## Launch findings

1. **OG card text looks soft in LinkedIn's preview (not a blocker).** Nick, verbatim: "the text is very blurry" in the Post Inspector preview. The orchestrator fetched the live `/og?ur=90000&mr=50000` PNG: 1200x630, 76,279 B, crisp at native resolution — the softness is LinkedIn's downscaled/recompressed preview, not the rendered image. **v1.1 candidate:** render `/og` at 2x (2400x1260) so LinkedIn's re-encode starts from more pixels (watch Satori CPU cost per T-07-07 and the 24h CDN cache when flipping it).
2. **CI was red on the three pushes since 07-03 merged (orchestrator action, already fixed).** The `typecheck` job ran on a fresh checkout without the gitignored `next-env.d.ts`, so the `*.webp` static imports had no module types. Fixed in commit `7740879` (`npx next typegen` before `npm run typecheck` in `.github/workflows/ci.yml`); GitHub Actions run 35676575750 is green. Production / Vercel builds were never affected (Vercel runs `next build`, which generates the file itself).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `vercel inspect` on CLI 57 prints no git commit SHA**
- **Found during:** Task 2 deployed-SHA assertion
- **Issue:** The plan expected `vercel inspect <url>` meta lines to include the commit SHA; CLI 57.0.0 prints only General / Aliases / Builds.
- **Fix:** Read the deployment JSON through `vercel api /v13/deployments/<id>` (beta subcommand, needs `MSYS_NO_PATHCONV=1` under Git Bash so the leading `/` is not rewritten to a Windows path) and extracted `meta.githubCommitSha` + `gitSource.sha` only. No env values in the output.
- **Files modified:** none
- **Commit:** n/a

### Plan assumptions that did not hold

- `npm run lighthouse` does not exit 0: performance on `/` and `/?ur` is still under the 0.80 floor (0.77 / 0.75, exactly the 07-07 medians). SEO — the assertion this plan was meant to prove — passes at 1.00 everywhere as an error. Recorded as the open gap with numbers per the launch context; floor not lowered.
- PSI second opinion unavailable again (daily anonymous quota).

## Threat Flags

None — no new endpoints, auth paths, or schema. T-07-08 / T-07-28 held (env names never listed, values never printed; API JSON filtered to git fields). T-07-13 held (og:url and Sitemap on HOST). T-07-06 held (noindex only on /account; /account absent from sitemap). T-07-07 held (`/og` probed with 3 requests, CDN HIT proven; never collected by LHCI). T-07-27 held (Post Inspector forced re-scrape showed the fresh card).

## Known Stubs

None.

## Commits

| Task | Commit | Type | Files |
|------|--------|------|-------|
| 2 (deploy) | — | push `4d058c4..5e7f692` | (no new commit; deploy of 07-07 finalization + 07-08 + 07-09) |
| 2 (draft SUMMARY at the checkpoint) | `8a41b8c` | docs | `07-10-SUMMARY.md` |
| — (orchestrator, between checkpoint and finalization) | `7740879` | ci | `.github/workflows/ci.yml` (typegen before typecheck; not part of this plan's file list) |
| 3 (launch verified, findings, completion) | this file's completion commit | docs | `07-10-SUMMARY.md` |

## Self-Check: PASSED

- FOUND: `.planning/phases/07-editorial-polish-launch/07-10-SUMMARY.md` (contains `robots.txt`, the probe transcript, the Lighthouse table, the Post Inspector result, and the launch URL)
- FOUND commits: `5e7f692` (deployed SHA = `git rev-parse origin/main` at push time = Vercel `meta.githubCommitSha`), `8a41b8c` (draft SUMMARY), `7740879` (orchestrator CI fix, on top of `8a41b8c`)
- STATE.md / ROADMAP.md untouched by this executor; `.vscode/` never staged; no env values in any output; `.lighthouseci/` gitignored; no force-push, reset, rebase, or stash
