---
phase: 07-editorial-polish-launch
plan: 02
subsystem: ui
tags: [tailwind-v4, design-tokens, shadcn, vitest, source-scan, next-og, wcag]

# Dependency graph
requires:
  - phase: 05-share-og
    provides: src/app/og/route.tsx social card (now reads its colors from brand.ts)
  - phase: 06-accounts-legal
    provides: tests/guest-flow-gate.test.ts (the source-scan shape this plan's gate copies)
provides:
  - src/lib/brand.ts — CREAM, INK, TERRACOTTA literal exports (client-safe)
  - text-heading utility (28px / 1.2) and pb-safe utility in globals.css
  - AA-compliant terracotta #b25429 in both CSS and TS
  - Warm ink-derived shadcn neutrals; .dark block, chart and sidebar tokens removed
  - tests/design-system-gate.test.ts — 23 source-scan pins, extended by 07-04 and 07-05
affects: [07-04 type sweep, 07-05 WebView pins, 07-09, 07-10 Post Inspector re-scrape]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS/TS palette equality enforced by a test that imports brand.ts and asserts the hex strings appear in globals.css"
    - "Tailwind v4 @utility with --spacing() for safe-area padding"

key-files:
  created:
    - src/lib/brand.ts
    - tests/design-system-gate.test.ts
  modified:
    - src/app/globals.css
    - src/app/og/route.tsx
    - src/components/ui/button.tsx
    - src/components/ui/card.tsx
    - src/components/ui/dialog.tsx
    - src/components/ui/input.tsx
    - src/components/ui/label.tsx

key-decisions:
  - "brand.ts header comment avoids the literal tokens the gate forbids (process.env, node:) so the literal-only scan cannot trip on its own documentation"
  - "Accent-budget scan compares paths relative to src/components, so a future ui/* file using the accent is reported rather than matching by basename"
  - "PLAT-05 is NOT checked off in REQUIREMENTS.md — this plan lands the token foundation only; the seven text-[1.75rem] copies are retired in 07-04"

patterns-established:
  - "Design-system gate: one describe block per contract, every expect carries the offending file as its message, later plans append below the trailing marker comment"

requirements-completed: [PLAT-05] # foundation only — the sweep that finishes PLAT-05 lands in 07-04 / 07-05

# Metrics
duration: ~10min
completed: 2026-09-21
---

# Phase 7 Plan 02: Design-System Foundation Summary

**brand.ts as the single TypeScript palette source, a 28px text-heading token, AA terracotta #b25429, ink-derived shadcn neutrals replacing the achromatic oklch grays, and a 23-test source-scan gate that fails if CSS and TS drift apart**

## Performance

- **Duration:** ~10 min (start time was not captured; estimate from command timestamps)
- **Completed:** 2026-09-21
- **Tasks:** 3 of 3
- **Files modified:** 9 (2 created, 7 modified)

## Accomplishments

- The three brand colors exist once in TypeScript and the CSS `@theme` block carries identical hex strings, enforced by a test that imports `../src/lib/brand`.
- `text-heading` (28px / 1.2) and `pb-safe` exist and were proven to compile (see Verification).
- Every shadcn neutral derives from ink (`38 33 25`); exactly one `oklch(` remains (`--destructive`). The inert `.dark` block and all thirteen chart/sidebar map entries are gone; `@custom-variant dark` is kept so vendored `dark:` classes stay inert.
- Vendored primitives use `font-semibold` only, and inputs stay `text-base` at every width.
- `/og` imports `{ CREAM, INK, TERRACOTTA }` from `@/lib/brand` and contains no six-digit hex literal.

## Task Commits

1. **Task 1: brand.ts and globals.css token, neutral, and base blocks** - `032a24d` (feat)
2. **Task 2: five vendored primitives and /og on brand.ts** - `11dc093` (fix)
3. **Task 3: tests/design-system-gate.test.ts** - `3bf9daa` (test)

## Files Created/Modified

- `src/lib/brand.ts` - CREAM `#faf7f2`, INK `#262119`, TERRACOTTA `#b25429`; literal-only, no env read, no Node built-ins
- `src/app/globals.css` - heading token, re-tuned accent, warm `:root` neutrals, `@utility pb-safe`, `color-scheme: light`; `.dark`, chart and sidebar tokens deleted
- `src/components/ui/{button,card,dialog,label}.tsx` - `font-medium` to `font-semibold`
- `src/components/ui/input.tsx` - `file:font-medium` to `file:font-semibold`; `md:text-sm` removed
- `src/app/og/route.tsx` - local `CREAM`/`INK` constants deleted; `"#c05f33"` replaced by `TERRACOTTA`
- `tests/design-system-gate.test.ts` - 193 lines, 23 tests across five describe blocks

## Verification

- `npx vitest run tests/design-system-gate.test.ts` — 23 passed (criterion: at least 12)
- `npm test` — 21 files, 319 tests passed
- `npm run typecheck`, `npm run lint` — exit 0
- `npm run build` — exit 0; `/methodology` and `/privacy` still prerender as static
- `npx vitest run tests/og-route.test.ts` — 6 passed
- **Mutation check (required by the plan):** reverting `--color-terracotta` to `#c05f33` in globals.css alone made the gate fail — 1 failed, 22 passed, failing test `globals.css carries the brand.ts value: --color-terracotta: #b25429`. The mutation was reverted and the working tree confirmed clean before the Task 3 commit.
- **Tailwind compile proof:** the build alone does not prove this, because no component uses `pb-safe` or `text-heading` yet, so Tailwind never emits them. A throwaway scratchpad probe (not committed) ran globals.css through `@tailwindcss/postcss` with `@source inline("pb-safe text-heading")` and got:
  - `.pb-safe { padding-bottom: max(calc(var(--spacing) * 8), env(safe-area-inset-bottom)); }`
  - `.text-heading { font-size: var(--text-heading); line-height: var(--tw-leading, var(--text-heading--line-height)); }`
- Viewport-unit regex is exactly `/\b(h-screen|min-h-screen|h-dvh|\d+vh|\d+dvh)\b/` and is asserted in-test against `100dvh` (match), `min-h-[100vh]` (match), `h-full` (no match).
- Accent-budget scan strips `/* … */` before line filtering; asserted in-test against a multi-line JSX comment sample. Current users: `core-experience.tsx`, `result-card.tsx`.

## Decisions Made

See `key-decisions` in the frontmatter. No architectural decisions were required.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree branch was based on an older commit**
- **Found during:** startup branch check
- **Issue:** HEAD was `30428ed` (end of Phase 6), an ancestor of the expected base `f563a95`; the Phase 7 plan files did not exist in the tree.
- **Fix:** After confirming the branch was in the `worktree-agent-*` namespace, had no commits of its own, and had a clean tree, ran the sanctioned `git reset --hard f563a95`.
- **Verification:** `git log` shows the three task commits directly on `f563a95`.

**2. [Rule 3 - Blocking] No node_modules in the worktree**
- **Fix:** `npm ci --prefer-offline --no-audit --no-fund` inside the worktree, per the Windows rule. No junction or symlink to the main checkout was created. Lockfile unchanged; nothing new installed (T-07-SC holds).

**3. [Verification added] Explicit Tailwind compile probe**
- **Issue:** The plan treats `npm run build` as proof that Tailwind accepts `@utility pb-safe` with `--spacing(8)` and compiles `text-heading`. Since neither class is used yet, the build passes without emitting either.
- **Fix:** One-off probe from the session scratchpad (see Verification). No repo files added.

---

**Total deviations:** 3 (2 blocking environment fixes, 1 added verification)
**Impact on plan:** None on scope. All planned edits landed as written.

## Issues Encountered

- The isolation guard rejects compound git commands, so the branch check and per-commit guards were run as separate plain commands with the same logic.

## Known Stubs

None.

## Shared Artifacts

STATE.md, ROADMAP.md and REQUIREMENTS.md were not modified; the orchestrator owns those writes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 07-04 can replace the seven `text-[1.75rem]` copies with `text-heading` as one-line class swaps, and append its type-sweep pins below the marker comment at the end of the gate file.
- 07-05 appends the WebView pins and, when `share-link.tsx` arrives, drops `core-experience.tsx` from the accent `ALLOWED` list.
- `/og` now renders `#b25429`; cached PNGs on the CDN keep the old accent until they expire or 07-10 re-scrapes.

## Self-Check: PASSED

- FOUND: src/lib/brand.ts, src/app/globals.css, tests/design-system-gate.test.ts
- FOUND commits: 032a24d, 11dc093, 3bf9daa
- No tracked files deleted between f563a95 and HEAD

---
*Phase: 07-editorial-polish-launch*
*Completed: 2026-09-21*
