---
phase: 07-editorial-polish-launch
plan: 01
subsystem: infra
tags: [lighthouse-ci, lhci, sharp, wave-0-decisions, clerk, supply-chain-gate, gitignore]

# Dependency graph
requires:
  - phase: 06-accounts-legal
    plan: 01
    provides: Clerk development instance on milesworth.vercel.app (the instance D7-01 keeps)
  - phase: 06-accounts-legal
    plan: 07
    provides: Production host https://milesworth.vercel.app, the LHCI default BASE
provides:
  - "Wave 0 Decisions D7-01 / D7-02 / D7-03 (+ batch1, batch2, android_device) as grep-able literal values"
  - "config/lighthouserc.cjs — LHCI collect/assert/upload config, 4 HTML URLs x 3 runs, SEO as warn"
  - "npm scripts: lighthouse, images:optimize"
  - "devDependencies pinned exactly: @lhci/cli 0.15.1, lighthouse 13.4.1, sharp 0.35.4"
  - ".gitignore entries /.lighthouseci/ and /src/images/raw/"
affects: [07-03, 07-05, 07-06, 07-07, 07-08, 07-09, 07-10]

# Tech tracking
tech-stack:
  added: ["@lhci/cli@0.15.1 (dev)", "lighthouse@13.4.1 (dev)", "sharp@0.35.4 (dev)"]
  patterns:
    - "Non-framework config lives in config/ and is passed by --config flag (RuFlo: no new root config files)"
    - "LHCI_BASE_URL env override with the production host as the default; no secrets in the config"
    - "Exact-pin dev tooling: npm install -D writes a caret even for an exact spec, so the specifier is corrected in package.json and the lockfile root entry together"

key-files:
  created:
    - config/lighthouserc.cjs
    - .planning/phases/07-editorial-polish-launch/07-01-SUMMARY.md
  modified:
    - package.json
    - package-lock.json
    - .gitignore

key-decisions:
  - "D7-01: b — stay on milesworth.vercel.app with the Clerk development instance; domain: none"
  - "D7-02: b — keep social connections and render the in-app-browser hint; providers: google (Google is NOT yet enabled on the instance — pending Dashboard action for Nick)"
  - "D7-03: N=34 — ship the dataset as-is; batch1=0, batch2=0"
  - "android_device: no"
  - "categories:seo is warn, not error, until plan 07-09 removes the layout-level noindex"

patterns-established:
  - "Package-legitimacy gate: human registry check first, executor re-reads npm view metadata (repo URL, version, integrity, install scripts) immediately before the single pinned install"

requirements-completed: []

# Metrics
duration: ~12min executor time (continuation run; excludes the two human gates)
completed: 2026-09-21
---

# Phase 07 Plan 01: Wave 0 Decisions, Package Legitimacy Gate, Lighthouse CI Skeleton Summary

**Three launch decisions fixed as literal keys (no custom domain, Google + in-app-browser hint, N=34), and a pinned Lighthouse CI skeleton in config/lighthouserc.cjs asserting 4 production HTML routes x 3 runs with SEO held at warn until the launch flip.**

## Wave 0 Decisions

Answered by Nick on 2026-09-21. Later plans (07-05, 07-06, 07-07, 07-08, 07-10) read these keys verbatim.

```
D7-01: b
domain: none
D7-02: b
providers: google
D7-03: N=34
batch1=0
batch2=0
android_device: no
```

- **D7-01: b** — stay on milesworth.vercel.app with the Clerk development instance. No custom domain. (`domain: none`)
- **D7-02: b** — keep social connections + render the in-app-browser hint (plan 07-05 renders the hint). `providers: google`
- **D7-03: N=34** — ship the dataset as-is. `batch1=0` (= min(20, 34 − 34)), `batch2=0` (= 34 − 34 − 0).
- **android_device: no** — no Android device available for plan 07-07's device pass.

### D7-02 nuance (recorded verbatim)

As of 2026-09-21 the live Clerk development instance (renewing-seal-8576.clerk.accounts.dev) has NO social connections enabled — the public /v1/environment endpoint reports `enabled social: none`, email_code is the only first factor. Nick chose to enable Google himself in the Clerk Dashboard before launch.

**Open human action:** Nick enables Google in Clerk Dashboard → Configure → SSO connections (pending as of 2026-09-21)

**Resolved 2026-09-21 (orchestrator, after this plan returned):** Nick enabled Google with "Enable for sign-up and sign-in" ON, "Block email subaddresses" OFF, "Use custom credentials" OFF (Clerk shared dev credentials). The public /v1/environment endpoint now reports `oauth_google` enabled and authenticatable; email_code remains a first factor. `providers: google` is now live, not just intended.

No executor changes Clerk settings; this is Nick's Dashboard action.

### What the rulings mean downstream

- **07-05** renders the in-app-browser hint under "Sign in to save" (D7-02: b). Until Nick completes the open action above, the hint describes a Google button that the live modal does not show yet — 07-05 / 07-10 should re-check `/v1/environment` before launch.
- **07-06 / 07-08** draft zero new entries (batch1=0, batch2=0). 07-08 still owns the launch-week re-check of the 8 featured entries, and the CI floor lands at N=34.
- **07-07** runs its device pass without an Android device (android_device: no).
- **07-10** has no domain / Clerk production cut-over work (D7-01: b). The "Development mode" badge and the 100-user cap are accepted for launch.

## Performance

- **Duration:** ~12 min executor time (continuation run; the two human gates are excluded)
- **Started:** 2026-09-21T21:50:14Z
- **Completed:** 2026-09-21T22:02:00Z
- **Tasks:** 3 (1 decision checkpoint, 1 human-verify checkpoint, 1 auto)
- **Files modified:** 5 (1 created config, 3 modified, this SUMMARY)

## Accomplishments

- Research Open Questions 1, 2, 3 and 5 are closed as literal values; no later plan has to guess the host, the provider list, the dataset floor, or device availability.
- The phase's only package installs ran once, pinned, after the human legitimacy gate, and after an executor-side re-read of the registry metadata.
- `npm run lighthouse` resolves to a committed config targeting four production HTML URLs (never `/og`), three runs each, median-aggregated performance.

## Task Commits

1. **Task 1: Wave 0 decisions** — `775787f` (docs) — rulings recorded in this SUMMARY before any install ran
2. **Task 2: Package legitimacy check** — no commit (human gate; nothing changes on disk)
3. **Task 3: Install dev packages, LHCI config, scripts, gitignore** — `55ab0a8` (chore)

**Plan metadata:** this SUMMARY's completion commit (docs)

## Files Created/Modified

- `config/lighthouserc.cjs` — LHCI config: `LHCI_BASE_URL` override, 4 URLs, `numberOfRuns: 3`, `--headless=new`, performance 0.85 (median) / accessibility 0.95 / best-practices 0.95 as errors, SEO 0.9 as warn, filesystem upload to `.lighthouseci`
- `package.json` — devDependencies `@lhci/cli: 0.15.1`, `lighthouse: 13.4.1`, `sharp: 0.35.4` (exact pins); scripts `lighthouse`, `images:optimize`; `dependencies` unchanged
- `package-lock.json` — 359 packages added for the three dev tools; root `devDependencies` specifiers match the exact pins
- `.gitignore` — `# lighthouse` block with `/.lighthouseci/`; `# image sources (not committed)` block with `/src/images/raw/`

## Package Legitimacy Gate (Task 2, T-07-SC)

Human reply: "packages verified" (Nick, 2026-09-21), relayed to this executor by the phase orchestrator together with the registry evidence he reviewed.

Executor re-check via `npm view` immediately before the install (read-only), all consistent with the plan's expected facts:

| Package | Version | Repository | dist-tag latest | Install scripts |
|---------|---------|------------|-----------------|-----------------|
| @lhci/cli | 0.15.1 | github.com/GoogleChrome/lighthouse-ci | 0.15.1 | — |
| lighthouse | 13.4.1 | github.com/GoogleChrome/lighthouse | 13.5.0 (same 13.x line) | — |
| sharp | 0.35.4 | github.com/lovell/sharp | 0.35.4 | none (no install / postinstall) |

Install sequence inside the worktree: `npm ci --prefer-offline --no-audit --no-fund` (732 packages), then the single `npm install -D @lhci/cli@0.15.1 lighthouse@13.4.1 sharp@0.35.4` (359 added). No junction or symlink to the main checkout's node_modules was created. Nothing else was installed.

## Verification Results

- `npx lhci --version` → `0.15.1`
- `config/lighthouserc.cjs` loads under `require`: 4 URLs, none containing `/og`, `numberOfRuns` 3, `categories:seo` level `warn`, `upload.target` `filesystem`
- `package.json`: three exact-pinned devDependencies; `dependencies` gained nothing; `scripts.lighthouse` is `lhci autorun --config=config/lighthouserc.cjs`
- `.gitignore`: `^/.lighthouseci/$` → 1 match; `^/src/images/raw/$` → 1 match
- `npm ls @lhci/cli lighthouse sharp --depth=0` → 0.15.1 / 13.4.1 / 0.35.4, no `invalid`; `npm ci --dry-run` accepts the lockfile (package.json and lock are in sync)
- `npm run typecheck` exit 0; `npm test` 296/296 passed (20 files); `npm run lint` clean
- No `.env*` file staged or present in the worktree

`npm run lighthouse` itself was not executed — its first run is plan 07-07, per this plan's done criteria.

## Decisions Made

- Recorded the four rulings exactly as answered (see `## Wave 0 Decisions`).
- Kept SEO at `warn` (the plan's override of RESEARCH Pattern 6's `error`), with the 07-09 sequencing note in the config header.
- Wrote the config in Prettier's multi-line style rather than Pattern 6's column-aligned one-liners; values are identical.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] npm wrote caret ranges for the three exact-version installs**
- **Found during:** Task 3
- **Issue:** `npm install -D pkg@x.y.z` saved `^0.15.1`, `^13.4.1`, `^0.35.4`. The plan and acceptance criteria require exact pins ("pinned, no caret").
- **Fix:** Removed the carets in `package.json` and in the lockfile's root `packages[""].devDependencies` entry by hand, rather than running a second install command (the approval covered one install). Left `next`'s own `optionalDependencies.sharp: ^0.35.4` lock entry untouched.
- **Verification:** `npm ls --depth=0` reports no `invalid`; `npm ci --dry-run` accepts the lockfile.
- **Files modified:** package.json, package-lock.json
- **Commit:** `55ab0a8`

**Total deviations:** 1 auto-fixed (Rule 1). **Impact:** none on scope; the pins now match the plan.

### Process notes (not deviations)

- The worktree branch was created at `30428ed` (end of Phase 6), a strict ancestor of the expected base `f563a95`, with a clean tree. The startup branch check fast-forwarded it with the sanctioned `git reset --hard f563a95`; nothing was discarded.
- `npm run build` was not run: the worktree has no `.env*` (Clerk / Neon keys), and no file the build consumes changed (dev-only packages, a `.cjs` config outside `src/`, two scripts, gitignore). Typecheck, lint and the full test suite stand in.
- STATE.md, ROADMAP.md and REQUIREMENTS.md were deliberately not touched — the orchestrator owns those writes after the wave merges. `requirements-completed` is left empty: PLAT-02 and PLAT-05 get tooling here but are proven in 07-07 and later.

## Issues Encountered

- `npm install` reported 14 audit findings (2 low, 5 moderate, 7 high) and several deprecation warnings (inflight, rimraf, glob 7, uuid 8), all in the transitive tree of the dev-only LHCI tooling. Nothing here ships to production or runs in the Vercel build output. Not fixed (`npm audit fix --force` would make breaking changes and install unreviewed versions); flagged for Nick's awareness.

## User Setup Required

One open human action, from D7-02:

- **Nick enables Google in Clerk Dashboard → Configure → SSO connections (pending as of 2026-09-21).** Until then the live instance offers email code only, and the 07-05 hint would refer to a provider the modal does not show. **Done 2026-09-21** — confirmed via the public /v1/environment endpoint (`oauth_google` enabled). Still worth one re-check before launch in 07-10.

## Known Stubs

- `package.json` `images:optimize` points at `scripts/optimize-images.ts`, which does not exist yet. Intentional and specified by this plan — the script is created in plan 07-03. Running `npm run images:optimize` before then fails with a module-not-found error.

## Threat Flags

None. No new network endpoint, auth path, or schema surface. T-07-SC, T-07-07, T-07-08 and T-07-16 are mitigated as planned (human gate + registry re-check; no `/og` in `collect.url`; no secrets in the config and `.lighthouseci/` ignored; decisions committed under fixed keys).

## Next Phase Readiness

- 07-03 can create `scripts/optimize-images.ts` against a deterministic `sharp@0.35.4` and the ignored `/src/images/raw/` folder.
- 07-07 can run `npm run lighthouse` for the first baseline; it needs a local Chrome. Thresholds are `[ASSUMED]` — tune after that baseline.
- 07-09 must switch `categories:seo` from `warn` to `error` when it removes the noindex.
- Blocker to watch: the D7-02 open human action above.

## Self-Check: PASSED

- FOUND: config/lighthouserc.cjs
- FOUND: .planning/phases/07-editorial-polish-launch/07-01-SUMMARY.md
- FOUND commits: 775787f, 55ab0a8
- All 8 literal decision lines present (D7-01, domain, D7-02, providers, D7-03, batch1, batch2, android_device)
- Working tree clean; STATE.md / ROADMAP.md untouched
