---
phase: 07-editorial-polish-launch
plan: 07
subsystem: launch-gates
tags: [plat-02, lighthouse, lhci, deploy, vercel, device-pass, linkedin-webview]

# Dependency graph
requires:
  - phase: 07-editorial-polish-launch
    plan: 01
    provides: config/lighthouserc.cjs skeleton, pinned @lhci/cli 0.15.1 + lighthouse 13.4.1
  - phase: 07-editorial-polish-launch
    plan: 05
    provides: viewport-fit=cover export, canonical share link + clipboard fallback, card imagery
  - phase: 06-accounts-legal
    plan: 07
    provides: deploy-by-push precedent (git push origin HEAD:main -> Vercel production)
provides:
  - "First Phase 7 production deploy: origin/main 30428ed -> 9bee33a (47 commits) -> 4d058c4"
  - "Lighthouse mobile baseline (median of 3) for the four launch routes on production"
  - "config/lighthouserc.cjs thresholds tuned to the plan floors with inline baseline comments"
  - "LHCI_CHROME_PORT override: Windows-safe way to run npm run lighthouse"
  - "Device-pass findings (Task 2 — pending Nick's reply)"
affects: [07-09, 07-10, verify-work 7]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lighthouse on Windows: attach to a hand-started headless Chrome via settings.port instead of letting chrome-launcher own the temp profile"
    - "Gate thresholds carry a `// baseline <date>: <median>` comment; never raised above the measured median"

key-files:
  created:
    - .planning/phases/07-editorial-polish-launch/07-07-SUMMARY.md
  modified:
    - config/lighthouserc.cjs

key-decisions:
  - "Performance minScore 0.85 -> 0.80 (plan floor); best-practices 0.95 -> 0.90 (plan floor); accessibility 0.95 and SEO warn unchanged"
  - "No site-header.tsx change: TBT is not the dominant metric and Clerk's blocking share (140 ms of 420 ms) cannot lift / from 0.77 to 0.80 on its own"
  - "Best-practices 0.79 is structural (Cloudflare cookies on the Clerk dev-instance host, D7-01 b) — recorded as a gap, not patched"

patterns-established:
  - "Deployment readiness probes after a push: poll viewport-fit=cover every 15 s, then Photos via once"

requirements-completed: []

# Metrics
duration: "~25 min executor time to the Task 2 checkpoint"
completed: "2026-09-22 (Task 1); Task 2 pending"
---

# Phase 07 Plan 07: Lighthouse Gate + LinkedIn In-App-Browser Device Pass Summary

**Waves 1–3 are live on https://milesworth.vercel.app (fast-forward push 30428ed..9bee33a, both readiness probes = 1), the first production Lighthouse mobile baseline is recorded (a11y 1.00 everywhere; perf 0.77 / 0.75 / 0.85 / 0.83; best-practices 0.79 everywhere because of Clerk dev-instance cookies), thresholds sit at the plan floors, and the real-device LinkedIn pass is awaiting Nick.**

## Status

| Task | State |
|------|-------|
| 1 — deploy, probes, LHCI baseline, thresholds, PSI | Complete — commit `4d058c4` (config), pushed |
| 2 — real-device pass inside the LinkedIn app (iOS) | **Checkpoint pending** — see `## Device-pass findings` |

## Task 1 — Deploy by push

- Pre-push: `git status --porcelain` showed only the pre-existing untracked `.claude/` and `.vscode/` folders (no tracked changes); `git merge-base --is-ancestor origin/main HEAD` exit 0; local main was 47 commits ahead.
- `git push origin HEAD:main` → `30428ed..9bee33a HEAD -> main` (fast-forward; no force).
- Readiness probe 1 (`grep -c "viewport-fit=cover"` on `/`), polled every 15 s: 0, 0, 0, **1** at poll 4 (~50 s after the push).
- Readiness probe 2 (`grep -c "Photos via "` on `/`): **1**.
- Second push after threshold tuning: `9bee33a..4d058c4 HEAD -> main` (fast-forward). `git rev-parse origin/main` = `git rev-parse HEAD` = `4d058c4`; tracked tree clean.
- No env values were printed at any point (T-07-28); all probes hit public URLs only.

## Task 1 — Lighthouse mobile baseline (production, 2026-09-22, median of 3 runs)

Lighthouse 13.4.1 via `@lhci/cli` 0.15.1, mobile emulation, simulated slow-4G / 4x CPU (LHCI defaults), 12 runs total, `.lighthouseci/` (gitignored) holds the reports.

| URL | perf (runs) | a11y | best-practices | seo |
|-----|-------------|------|----------------|-----|
| `/` | **0.77** (0.72 / 0.77 / 0.80) | 1.00 | 0.79 | 0.63 (warn) |
| `/?ur=90000&mr=50000` | **0.75** (0.80 / 0.74 / 0.75) | 1.00 | 0.79 | 0.63 (warn) |
| `/methodology` | 0.85 (0.85 / 0.85 / 0.85) | 1.00 | 0.79 | 0.60 (warn) |
| `/privacy` | 0.83 (0.82 / 0.86 / 0.83) | 1.00 | 0.79 | 0.60 (warn) |

Representative-run metrics:

| URL | LCP element | LCP (sim) | FCP (sim) | TBT | CLS | Speed Index |
|-----|-------------|-----------|-----------|-----|-----|-------------|
| `/` | `<h1 class="font-display …">What are your points actually worth?` (text — not `<img>`) | 3.4 s | 1.9 s | 420 ms | 0.012 | 1.9 s |
| `/?ur=90000&mr=50000` | same `<h1>` (text) | 4.5 s | 1.9 s | 340 ms | 0.012 | 1.9 s |
| `/methodology` | `<p class="text-ink text-base …">` (text) | 3.9 s | 1.9 s | 160 ms | 0 | 1.9 s |
| `/privacy` | `<p class="text-ink text-base …">` (text) | 3.9 s | 1.9 s | 220 ms | 0 | 1.9 s |

**Accessibility:** 1.00 on all four routes — no `tap-targets` or `color-contrast` findings (07-02 / 07-04 closed them as planned).

**SEO (warn, expected):** the only sub-1 audit is `is-crawlable` (layout-level `noindex`, by design until 07-09). Nothing else to fix pre-flip.

**Best-practices 0.79 (all routes, all 12 runs identical):** failing audits are `third-party-cookies` (weight 5) and `inspector-issues` (weight 1). Both are the Cloudflare bot-management cookies `__cf_bm` and `_cfuvid` set by responses from `renewing-seal-8576.clerk.accounts.dev` (`/v1/environment`, `/v1/client`, the `@clerk/ui@1.33.0` chunks). That host is the Clerk **development instance** kept by D7-01 (b); nothing in this repo sets or can suppress those cookies. On a Clerk production instance (custom domain) FAPI becomes first-party and both audits pass. Every other best-practices audit scores 1.

**Performance diagnosis (`/`):**
- The LCP element is the `<h1>` — not an image (Pitfall 8 did not regress; 07-05's below-the-form imagery holds).
- Observed (unthrottled) FCP = LCP = 547 ms; the 3.4 s LCP is Lantern's simulated slow-4G estimate, of which 81 % (2.7 s) is "render delay": ~930 KB across 34 requests compete for the simulated link before the paint — first-party Next chunks (121 KB + 65 KB + 46 KB + 45 KB) plus Clerk's `clerk.browser.js` (80 KB) and `@clerk/ui` (`ui-common` 127 KB, `vendors` 65 KB, `ui.browser` 45 KB). Both `next/font` files are preloaded and finish by ~380 ms (66 KB + 48 KB), so fonts are not the cause; the only render-blocking resource is the 9 KB stylesheet (150 ms).
- TBT 420 ms: `bootup-time` top entries are a first-party chunk (`3n7zfry7sjo-4.js`, 573 ms scripting), the document itself, the Turbopack runtime (230 ms), then `clerk.browser.js` (110 ms) and `@clerk/ui` vendors (69 ms). `third-party-summary` attributes 140 ms of blocking time to accounts.dev. `unused-javascript` names `@clerk/ui` ui-common (86 KB wasted) and vendors (63 KB) first.
- Plan branch (c) (defer `UserButton` in `site-header.tsx`) was **not** applied: TBT is not the dominant metric (LCP and TBT contribute similarly), the `@clerk/ui` chunks load after the observed LCP, and removing Clerk's entire 140 ms blocking share would lift `/` by roughly two points — not enough to reach the 0.80 floor, and `/?ur` (0.75) even less so. `site-header.tsx` is unchanged.

**Threshold changes (plan rule d: median − 0.03, floors 0.80 / 0.90), commit `4d058c4`:**

| Assertion | Before | After | Baseline | Result under the new threshold |
|-----------|--------|-------|----------|--------------------------------|
| `categories:performance` (error, median) | 0.85 | **0.80** (floor) | 0.77 / 0.75 / 0.85 / 0.83 | `/methodology`, `/privacy` pass; `/`, `/?ur` still fail |
| `categories:accessibility` (error) | 0.95 | 0.95 (unchanged) | 1.00 ×4 | pass |
| `categories:best-practices` (error) | 0.95 | **0.90** (floor) | 0.79 ×4 | still fails on all four |
| `categories:seo` (warn) | 0.90 | 0.90 (unchanged) | 0.63 / 0.63 / 0.60 / 0.60 | warns (expected) |

`npx lhci assert` against the saved runs with the tuned config: 6 failures (2 perf, 4 best-practices), 4 SEO warnings. **`npm run lighthouse` therefore does not exit 0** — the two remaining failures are at the plan's own floors and cannot be closed inside `config/lighthouserc.cjs` / `site-header.tsx`. Both are recorded as gaps for `/gsd:verify-work 7` (see `## Gaps`). The config still has SEO at `warn`, 4 URLs, none `/og`, `aggregationMethod: "median"`; the plan's config-shape verify (`node -e …minScore<0.8…`) exits 0.

**PSI cross-check:** not available — both calls to `pagespeedonline/v5/runPagespeed` (for `/` and `/?ur=90000&mr=50000`) returned `Quota exceeded … 'Queries per day' … pagespeedonline.googleapis.com` for the anonymous shared key. PSI is advisory; re-run tomorrow or with a personal API key. (PSI runs the same Lantern simulation, so the simulated-LCP finding above would reproduce there.)

## Task 1 — Tooling deviation (Rule 3, blocking)

**`npm run lighthouse` failed on Windows before any score was produced:** every Lighthouse child process ended with `Runtime error encountered: EPERM, Permission denied: …\Temp\lighthouse.NNNNNNNN` from `chrome-launcher`'s `destroyTmp()` → `rmSync(…, { maxRetries: 10 })`. `taskkill` had already reported the Chrome PID as not found, so the main process was gone and orphaned Chrome children still held the profile files during the ~1 s retry window; LHCI's own Windows exception only covers the "Chrome could not be killed" message, so it retried three times per URL and aborted.

- First attempt (rejected): append `--user-data-dir=<os.tmpdir()>/lhci-chrome-profile` to `chromeFlags`. Verified empirically that Chrome honours the **first** `--user-data-dir` switch (the launcher's), so the flag is a no-op. Reverted before commit.
- Fix applied: optional `LHCI_CHROME_PORT` → `collect.settings.port`. With a port set, `ChromeLauncher.launch({port})` finds the running instance and returns before `prepare()` creates a temp dir, so nothing is deleted at exit. Procedure (documented in the config header): start `chrome.exe --headless=new --remote-debugging-port=9222 --user-data-dir=%TEMP%\lhci-chrome-profile about:blank`, then `LHCI_CHROME_PORT=9222 npm run lighthouse`. Lighthouse still clears cache and origin storage per run. Unset → behaviour identical to before (macOS / CI unaffected). Helper Chrome was stopped after the run.
- No packages installed, no global Chrome changes (checkpoint_note honoured).

## Gaps (for /gsd:verify-work 7)

1. **Performance on `/` (0.77) and `/?ur=90000&mr=50000` (0.75) is below the 0.80 floor.** LCP is text, fonts are preloaded; the simulated LCP is byte-volume driven (Next chunks + Clerk ~370 KB). Candidate remediations are outside this plan's file list: trimming the first-party client bundle on `/` (the 121 KB + 65 KB chunks), deferring Clerk's prebuilt UI until interaction, or accepting a lower floor for the dynamic route as a documented decision.
2. **Best-practices 0.79 on all routes** is a D7-01 (b) consequence (Cloudflare cookies from `*.clerk.accounts.dev`). Options: (a) keep D7-01 (b) and demote `categories:best-practices` to `warn` the way SEO is handled, with a comment pointing at the Clerk production-instance cut-over; (b) revisit D7-01 (custom domain + Clerk production instance) which also removes the "Development mode" badge. Nick's call — not made here.

## Device-pass findings

**Pending.** Task 2 is a blocking `checkpoint:human-verify`; the executor stopped after committing Task 1 and returned the ten-step phone script to the orchestrator. Nick's reply (approved — copied / approved — fallback, or the failing step numbers with what he saw) is to be recorded here verbatim by the continuation executor, including the step-5 path and the pasted URL's parameter keys.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Windows chrome-launcher EPERM on temp-profile cleanup**
- **Found during:** Task 1, first `npm run lighthouse`
- **Issue / Fix:** see `## Task 1 — Tooling deviation` above
- **Files modified:** `config/lighthouserc.cjs`
- **Commit:** `4d058c4`

### Plan assumptions that did not hold

- The plan expected `npm run lighthouse` to be brought to exit 0 by lowering thresholds to the floors. The floors (0.80 perf, 0.90 best-practices) are above the measured medians on `/`, `/?ur` (perf) and all routes (best-practices), and the two permitted remediation files cannot change either outcome. Thresholds were set to the floors as instructed and the residual failures are logged as gaps rather than papered over with sub-floor values.
- PSI second opinion unavailable (daily anonymous quota exhausted).

## Threat Flags

None — no new endpoints, auth paths, or schema. T-07-07 (`/og` never collected; PSI called twice, both rejected by quota), T-07-08 (`.lighthouseci/` gitignored; only scores in this file), T-07-28 (no env values in any output; pushes and probes touched public URLs only) all held.

## Known Stubs

None.

## Commits

| Task | Commit | Type | Files |
|------|--------|------|-------|
| 1 (deploy) | — | push `30428ed..9bee33a` | (no new commit; deploy of waves 1–3) |
| 1 (thresholds + Windows override) | `4d058c4` | chore | `config/lighthouserc.cjs` (pushed `9bee33a..4d058c4`) |
| 2 | pending | — | — |
