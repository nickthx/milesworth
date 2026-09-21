---
phase: 07-editorial-polish-launch
plan: 04
subsystem: ui
tags: [tailwind-v4, design-tokens, typography, webview, safe-area, vitest, source-scan, next-app-router]

# Dependency graph
requires:
  - phase: 07-editorial-polish-launch
    plan: 02
    provides: text-heading token, @utility pb-safe, warm --border token, tests/design-system-gate.test.ts
provides:
  - One heading size token across every route and component (no text-[1.75rem], no text-lg under src)
  - Fraunces text-heading masthead; 44px header and footer nav targets; safe-area footer with the photo credit
  - WebView-safe same-tab links on /privacy
  - src/app/not-found.tsx and src/app/account/loading.tsx designed states
  - 9 new gate tests pinning the sweep (gate total 32)
affects: [07-05 WebView pins + credit wording reconcile, 07-08 credit re-check, 07-09, 07-10]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Designed route states (not-found, loading) copy the shell markup inline rather than importing a page module, so they can never pull server-only code"
    - "Nav links are inline-flex min-h-11 items-center — a 44px hit area without changing the 14px type"

key-files:
  created:
    - src/app/not-found.tsx
    - src/app/account/loading.tsx
  modified:
    - src/app/account/page.tsx
    - src/app/privacy/page.tsx
    - src/app/methodology/page.tsx
    - src/components/account/bookmark-list.tsx
    - src/components/account/delete-account-dialog.tsx
    - src/components/core-experience.tsx
    - src/components/result-card.tsx
    - src/components/almost-there.tsx
    - src/components/advisor-tease.tsx
    - src/components/site-header.tsx
    - src/components/site-footer.tsx
    - tests/design-system-gate.test.ts

key-decisions:
  - "Footer credit is the literal 'Photos via Unsplash'; the gate accepts /Photos via (Unsplash( and Pexels)?|Pexels)/ so 07-05 Task 3 and 07-08 Task 3 can reconcile the wording against the manifest without editing the test"
  - "account/loading.tsx inlines the account shell instead of importing it — the page's Shell is not exported and page.tsx imports Clerk's server entry point (T-06-16)"
  - "existsSync added to the gate's node:fs import so a missing route file fails with a named-file assertion rather than an ENOENT stack"

patterns-established:
  - "Type-sweep pins scan only .ts/.tsx under src and self-test their regex in the same test (text-lg matches, text-heading does not)"

requirements-completed: [PLAT-05, PLAT-02]

# Metrics
duration: ~14min
completed: 2026-09-21
---

# Phase 7 Plan 04: Type Sweep, Chrome, and Designed States Summary

**Every heading, card title, dialog title, masthead and account figure now uses the 28px text-heading token; header/footer links are 44px targets with a safe-area footer carrying "Photos via Unsplash"; /privacy opens links same-tab; and 404 plus the /account wait render in the shared editorial shell — all pinned by 9 new source-scan tests**

## Performance

- **Duration:** ~14 min (includes a 3 min `npm ci` in the fresh worktree)
- **Completed:** 2026-09-21
- **Tasks:** 3 of 3
- **Files modified:** 14 (2 created, 12 modified)

## Accomplishments

- Retired all nine `text-[1.75rem] leading-tight` copies and both `text-lg` sizes. `grep` for either under `src` is empty.
- Saved-balance figures and bookmark titles moved to `font-display text-heading` (UI-SPEC A14); the delete-account dialog title and description are typed per the UI-SPEC dialog row.
- Header wordmark is the Fraunces `text-heading` masthead (A6). "Sign in" keeps `h-11`; "My account" and both footer links gained `inline-flex min-h-11 items-center`.
- Footer uses `pb-safe`, `gap-3`, a `font-display` wordmark, and a plain-text "Photos via Unsplash" span (A7, T-07-14). It remains a server component. Header and footer rules use the warm `border-border` token.
- `/privacy` has no new-window target or rel attribute on its two Clerk links (T-07-20). The `mailto:` link is untouched.
- `src/app/not-found.tsx` and `src/app/account/loading.tsx` exist with the locked UI-SPEC copy and import nothing server-only (T-07-19).

## PLAT-05 status

**PLAT-05 is now fully met for its type-scale half.** 07-02 landed the token; this plan retired every remaining arbitrary heading size and the undeclared `text-lg`, and the gate fails if either returns. The one PLAT-05-adjacent item still open by design is the accent budget: `core-experience.tsx` stays in the gate's `ALLOWED` list until 07-05 moves the CTA into `share-link.tsx`. PLAT-02's tap-target / WebView-chrome half is met here; 07-05 adds the remaining WebView pins. The orchestrator owns the REQUIREMENTS.md checkbox.

## Task Commits

1. **Task 1: token sweep on pages and account components; same-tab /privacy links** - `71f344d` (feat)
2. **Task 2: island headings, masthead, 44px nav links, safe-area footer with credit** - `85a2429` (feat)
3. **Task 3: not-found.tsx, account/loading.tsx, gate extension** - `037d219` (feat)

## Verification

- `npx vitest run tests/design-system-gate.test.ts` — 32 passed (23 existing + 9 new; criterion was at least 7 new)
- `npm test` — 21 files, 328 tests passed
- `npx vitest run tests/privacy-page.test.ts tests/methodology-page.test.ts` — 26 passed (section lists unchanged)
- `npm run typecheck`, `npm run lint` — exit 0
- `npm run build` — exit 0 with no `.env*` files present in the worktree (none were created or copied). Route table: `/_not-found` static, `/methodology` static, `/privacy` static, `/`, `/account`, `/og` dynamic.
- **Mutation check (required by the plan):** changing the bookmark title class back to `text-lg` in `bookmark-list.tsx` made the gate fail — 1 failed, 31 passed, message `components/account/bookmark-list.tsx: expected … not to match /\btext-lg\b/`. Reverted; `git diff` on that file against the Task 1 commit was empty before the Task 3 commit.
- **Built-CSS proof (07-02 handoff):** this plan is the first real consumer of both utilities, and both are emitted in `.next/static/chunks/*.css`:
  - `.pb-safe{padding-bottom:max(calc(var(--spacing) * 8), env(safe-area-inset-bottom))}`
  - `.text-heading{font-size:var(--text-heading);line-height:var(--tw-leading,var(--text-heading--line-height))}` with `--text-heading:1.75rem` and `--text-heading--line-height:1.2`

## Decisions Made

See `key-decisions` in the frontmatter. No architectural decisions were required.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree branch was based on an older commit**
- **Found during:** startup branch check
- **Issue:** HEAD was `30428ed`, an ancestor of the expected base `d38e07a`; the 07-04 plan file did not exist in the tree.
- **Fix:** Confirmed the branch was in the `worktree-agent-*` namespace, had no commits of its own, and had a clean tree, then ran the sanctioned `git reset --hard d38e07a`. Each check ran as a separate plain git command.

**2. [Rule 3 - Blocking] No node_modules in the worktree**
- **Fix:** `npm ci --prefer-offline --no-audit --no-fund` inside the worktree. No junction, symlink, or mklink to the main checkout. Lockfile unchanged; nothing new installed (T-07-SC holds).

### Formatting side effects (no behavior change)

The plan mandates `npx prettier --write` on the touched files. Prettier also re-wrapped two pre-existing lines unrelated to the sweep: the `requiredSourcePoints(...)` call in `src/app/methodology/page.tsx` (collapsed to one line) and the `useActionState(...)` call in `src/components/advisor-tease.tsx` (expanded; the committed line was 84 columns). Both are whitespace-only and are included in the Task 1 and Task 2 commits.

---

**Total deviations:** 2 blocking environment fixes; planned edits landed as written.

## Deferred Issues

- **Dead `.text-lg` rule in the built CSS (out of scope, not fixed).** No file under `src` uses `text-lg`, but the production stylesheet still contains a `.text-lg` rule. `globals.css` has no `@source` restriction, so Tailwind v4's automatic source detection reads class-like strings from non-`src` text; the literal appears in `tests/design-system-gate.test.ts` and several `.planning` documents. I did not isolate which file is the trigger. It is an unused rule of a few bytes, not a rendered size, so the four-size contract holds in the UI. Narrowing detection (for example `@import "tailwindcss" source("../")` scoped to `src`) would touch `globals.css`, which is outside this plan's files. No `deferred-items.md` was created, to avoid a merge conflict with the parallel 07-03 worktree.

## Issues Encountered

- The isolation guard rejects compound git commands, so the branch check and per-commit guards ran as separate plain commands with the same logic.

## Known Stubs

None. The "Coming soon" strings in `advisor-tease.tsx` and `/privacy` are pre-existing PLAT-04 product copy, not placeholders from this plan.

## Threat Flags

None. No new network endpoint, auth path, file access, or schema change. The two new route files render fixed copy and import nothing beyond `next/link`.

## Shared Artifacts

STATE.md, ROADMAP.md and REQUIREMENTS.md were not modified; the orchestrator owns those writes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 07-05 Task 3 reconciles the footer credit wording against the image manifest's `source:` values once 07-03 has merged; the gate regex already accepts "Unsplash", "Unsplash and Pexels", and "Pexels".
- 07-05 appends its WebView pins below the 07-04 describe block at the end of the gate file and drops `core-experience.tsx` from the accent `ALLOWED` list when `share-link.tsx` arrives.
- A14 fallback remains available: if 28px crowds the bookmark list or saved-balance rows on a narrow phone, UI-SPEC permits body 16px semibold. That is a visual call for the 07-09/07-10 device pass; nothing here was checked on a physical device.

## Self-Check: PASSED

- FOUND: src/app/not-found.tsx, src/app/account/loading.tsx, src/components/site-footer.tsx, tests/design-system-gate.test.ts
- FOUND commits: 71f344d, 85a2429, 037d219
- No tracked files deleted between d38e07a and HEAD
- Files changed since the base are exactly the plan's 14 plus this summary; STATE.md, ROADMAP.md and REQUIREMENTS.md untouched

---
*Phase: 07-editorial-polish-launch*
*Completed: 2026-09-21*
