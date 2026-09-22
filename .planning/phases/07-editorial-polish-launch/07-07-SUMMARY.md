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
  - "config/lighthouserc.cjs: perf error at the 0.80 floor, a11y error 0.95, best-practices WARN 0.90 (Clerk dev-instance cookies), SEO warn 0.90 — all with dated baseline comments"
  - "LHCI_CHROME_PORT override: Windows-safe way to run npm run lighthouse"
  - "Device-pass evidence for PLAT-02: Nick approved the full flow inside LinkedIn's iOS in-app browser"
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
  - "Performance minScore 0.85 -> 0.80 (plan floor, error); accessibility 0.95 unchanged; SEO warn unchanged"
  - "Best-practices demoted to warn at 0.90 (orchestrator ruling 2026-09-22): the 0.79 baseline is entirely Cloudflare cookies from the Clerk dev-instance host under D7-01 (b); 07-10 / the Clerk production instance re-promotes it to error"
  - "No site-header.tsx change: TBT is not the dominant metric and Clerk's blocking share (140 ms of 420 ms) cannot lift / from 0.77 to 0.80 on its own"
  - "Performance on / (0.77) and /?ur (0.75) stays an open gap under the 0.80 error floor — recorded for 07-10 and verify-work 7, not lowered below the floor"

patterns-established:
  - "Deployment readiness probes after a push: poll viewport-fit=cover every 15 s, then Photos via once"
  - "Lighthouse gate categories blocked by an accepted external decision (SEO by the noindex flip, best-practices by the Clerk dev instance) run as warn with a dated comment naming the plan that re-promotes them"

requirements-completed: [PLAT-02]

# Metrics
duration: "~35 min executor time across two sessions (device pass by Nick excluded)"
completed: "2026-09-22"
---

# Phase 07 Plan 07: Lighthouse Gate + LinkedIn In-App-Browser Device Pass Summary

**Waves 1–3 are live on https://milesworth.vercel.app (fast-forward push 30428ed..9bee33a, both readiness probes = 1); the first production Lighthouse mobile baseline is recorded (a11y 1.00 everywhere; perf 0.77 / 0.75 / 0.85 / 0.83; best-practices 0.79 everywhere from Clerk dev-instance cookies, now a warn); and Nick approved the full flow on a real iPhone inside LinkedIn's in-app browser.**

## Status

| Task | State |
|------|-------|
| 1 — deploy, probes, LHCI baseline, thresholds, PSI | Complete — commits `4d058c4` (pushed), `2b51c2f` (best-practices warn, local) |
| 2 — real-device pass inside the LinkedIn app (iOS) | Complete — approved by Nick, see `## Device-pass findings` |

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

**Threshold changes (plan rule d: median − 0.03, floors 0.80 / 0.90), commits `4d058c4` and `2b51c2f`:**

| Assertion | Before | After | Baseline | Result under the new threshold |
|-----------|--------|-------|----------|--------------------------------|
| `categories:performance` (error, median) | 0.85 | **0.80** (floor) | 0.77 / 0.75 / 0.85 / 0.83 | `/methodology`, `/privacy` pass; `/`, `/?ur` still fail (open gap) |
| `categories:accessibility` (error) | 0.95 | 0.95 (unchanged) | 1.00 ×4 | pass |
| `categories:best-practices` | error 0.95 | **warn 0.90** (`2b51c2f`, orchestrator ruling) | 0.79 ×4 | warns on all four (expected until the Clerk production instance) |
| `categories:seo` (warn) | 0.90 | 0.90 (unchanged) | 0.63 / 0.63 / 0.60 / 0.60 | warns (expected until 07-09) |

`4d058c4` first set best-practices to the 0.90 error floor (still red on all four routes). The orchestrator then ruled to demote it to `warn` with the same treatment as SEO — the cause is external (third-party cookies from the Clerk development instance `renewing-seal-8576.clerk.accounts.dev` under D7-01 (b)) and 07-10, or whichever plan lands a Clerk production instance, re-promotes it to `error` at 0.90. The dated comment in the config says so.

`npx lhci assert` against the saved runs with the final config: **2 failures (perf on `/` and `/?ur`), 8 warnings (best-practices ×4, SEO ×4)**. `npm run lighthouse` therefore still exits 1 on the two perf routes — that is the deliberate open gap for 07-10 / verify-work 7, kept at the plan's floor rather than lowered below it. The config still has SEO at `warn`, 4 URLs, none `/og`, `aggregationMethod: "median"`; the plan's config-shape verify (`node -e …minScore<0.8…`) exits 0.

**PSI cross-check:** not available — both calls to `pagespeedonline/v5/runPagespeed` (for `/` and `/?ur=90000&mr=50000`) returned `Quota exceeded … 'Queries per day' … pagespeedonline.googleapis.com` for the anonymous shared key. PSI is advisory; re-run tomorrow or with a personal API key. (PSI runs the same Lantern simulation, so the simulated-LCP finding above would reproduce there.)

## Task 1 — Tooling deviation (Rule 3, blocking)

**`npm run lighthouse` failed on Windows before any score was produced:** every Lighthouse child process ended with `Runtime error encountered: EPERM, Permission denied: …\Temp\lighthouse.NNNNNNNN` from `chrome-launcher`'s `destroyTmp()` → `rmSync(…, { maxRetries: 10 })`. `taskkill` had already reported the Chrome PID as not found, so the main process was gone and orphaned Chrome children still held the profile files during the ~1 s retry window; LHCI's own Windows exception only covers the "Chrome could not be killed" message, so it retried three times per URL and aborted.

- First attempt (rejected): append `--user-data-dir=<os.tmpdir()>/lhci-chrome-profile` to `chromeFlags`. Verified empirically that Chrome honours the **first** `--user-data-dir` switch (the launcher's), so the flag is a no-op. Reverted before commit.
- Fix applied: optional `LHCI_CHROME_PORT` → `collect.settings.port`. With a port set, `ChromeLauncher.launch({port})` finds the running instance and returns before `prepare()` creates a temp dir, so nothing is deleted at exit. Procedure (documented in the config header): start `chrome.exe --headless=new --remote-debugging-port=9222 --user-data-dir=%TEMP%\lhci-chrome-profile about:blank`, then `LHCI_CHROME_PORT=9222 npm run lighthouse`. Lighthouse still clears cache and origin storage per run. Unset → behaviour identical to before (macOS / CI unaffected). Helper Chrome was stopped after the run.
- No packages installed, no global Chrome changes (checkpoint_note honoured).

## Gaps (for 07-10 and /gsd:verify-work 7)

1. **Performance on `/` (0.77) and `/?ur=90000&mr=50000` (0.75) is below the 0.80 error floor — OPEN.** LCP is text, fonts are preloaded; the simulated LCP is byte-volume driven (Next chunks + Clerk ~370 KB). Candidate remediations are outside this plan's file list: trimming the first-party client bundle on `/` (the 121 KB + 65 KB chunks), deferring Clerk's prebuilt UI until interaction, or accepting a lower floor for the dynamic route as a documented decision. 07-10 re-runs the gate post-flip and reads this baseline.
2. **Best-practices 0.79 on all routes — RESOLVED as a warn (`2b51c2f`)** per the orchestrator ruling; the underlying cause (D7-01 (b), Clerk dev-instance cookies) remains and is re-promoted to `error` by 07-10 or the plan that lands a Clerk production instance on a custom domain (which also removes the "Development mode" badge).
3. **Device pass step 5 partially captured:** Nick saw the expected canonical URL (`…?ur=90000&mr=50000&hyatt=40000`) on the phone — the T-07-02 real-world signal that the share URL carries only the short keys (no `__clerk_db_jwt` / `utm_`) — but did not say whether the label flipped to "Link copied" or the "Your link" fallback field appeared. Copy-path unknown; verify-work may ask for that one detail.

## Device-pass findings

Nick: approved (2026-09-21, iPhone, LinkedIn in-app browser). No failing steps reported. Copy-path (copied vs. fallback) and pasted URL not captured.

Step 5: Nick reports the expected canonical URL (…&hyatt=40000) was shown on the phone; copied-vs-fallback path not explicitly distinguished.

Relayed by the orchestrator as a one-word "approved" against the ten-step script (DM unfurl → in-app open → landing without zoom/horizontal scroll → photo cards → live re-rank → Copy my link → email-code sign-in in the Clerk modal → Save → /account → footer on all four routes + Clerk DPA link → /nowhere 404), followed by the step-5 addendum "it showed the url you said in step 4" (`https://milesworth.vercel.app/?ur=90000&mr=50000&hyatt=40000`). Android skipped per `android_device: no`. A visible URL is consistent with the read-only fallback field but is not proof of it; whether the label flipped to "Link copied" was not stated and is not inferred here (see Gaps 3).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Windows chrome-launcher EPERM on temp-profile cleanup**
- **Found during:** Task 1, first `npm run lighthouse`
- **Issue / Fix:** see `## Task 1 — Tooling deviation` above
- **Files modified:** `config/lighthouserc.cjs`
- **Commit:** `4d058c4`

**2. [Orchestrator ruling] Best-practices assertion demoted from `error` to `warn`**
- **Found during:** Task 1 threshold tuning (baseline 0.79 < 0.90 floor on every route, cause external)
- **Fix:** `categories:best-practices: ["warn", { minScore: 0.9 }]` with a dated comment naming the cause and the re-promotion owner (07-10 / Clerk production instance). Raised at the Task 2 checkpoint as a Rule 4 decision; ruled by the orchestrator, not improvised.
- **Files modified:** `config/lighthouserc.cjs`
- **Commit:** `2b51c2f`

### Plan assumptions that did not hold

- The plan expected `npm run lighthouse` to be brought to exit 0 by lowering thresholds to the floors. The floors (0.80 perf, 0.90 best-practices) are above the measured medians on `/`, `/?ur` (perf) and all routes (best-practices), and the two permitted remediation files cannot change either outcome. Performance was set to the floor as instructed and left red as an open gap; best-practices was demoted to warn by ruling.
- PSI second opinion unavailable (daily anonymous quota exhausted).
- Nick's device-pass reply did not include the step-5 path or URL the plan's acceptance criteria asked for; recorded as given, not filled in.

## Threat Flags

None — no new endpoints, auth paths, or schema. T-07-07 (`/og` never collected; PSI called twice, both rejected by quota), T-07-08 (`.lighthouseci/` gitignored; only scores in this file), T-07-28 (no env values in any output; pushes and probes touched public URLs only) all held.

## Known Stubs

None.

## Commits

| Task | Commit | Type | Files |
|------|--------|------|-------|
| 1 (deploy) | — | push `30428ed..9bee33a` | (no new commit; deploy of waves 1–3) |
| 1 (thresholds + Windows override) | `4d058c4` | chore | `config/lighthouserc.cjs` (pushed `9bee33a..4d058c4`) |
| 1 (draft SUMMARY at the checkpoint) | `151f070` | docs | `07-07-SUMMARY.md` |
| 1 (best-practices → warn, ruling) | `2b51c2f` | chore | `config/lighthouserc.cjs` (local; orchestrator pushes with tracking) |
| 2 (device pass) | no code commit — findings recorded in this SUMMARY's completion commit | docs | `07-07-SUMMARY.md` |

## Self-Check: PASSED

- FOUND: `config/lighthouserc.cjs` (perf error 0.80 median, a11y error 0.95, best-practices warn 0.90, SEO warn 0.90, 4 URLs, none `/og`)
- FOUND: `.planning/phases/07-editorial-polish-launch/07-07-SUMMARY.md`
- FOUND commits: `4d058c4`, `151f070`, `2b51c2f`
- `git rev-parse origin/main` included `4d058c4` after the second push; production probes re-checked at 1 / 1
- `src/components/site-header.tsx` unchanged; STATE.md / ROADMAP.md untouched; no env values in any output; `.lighthouseci/` untracked (gitignored)
