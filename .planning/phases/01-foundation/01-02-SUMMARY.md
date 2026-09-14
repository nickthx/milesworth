---
phase: 01-foundation
plan: 02
subsystem: ui
tags: [shadcn, tailwind, radix, fraunces, inter, next-font, design-tokens]

# Dependency graph
requires:
  - phase: 01-foundation plan 01
    provides: Buildable Next.js 16.3.4 App Router app with Tailwind v4 CSS-first config and green build/lint/typecheck/test scripts
provides:
  - Vendored shadcn/ui D-15 component set (button, input, label, card, dialog) + cn helper — Phase 4 needs no CLI runs mid-build
  - D-13 editorial typography: Fraunces (variable, opsz axis) + Inter via next/font/google, wired to Tailwind v4 @theme font-display/font-heading/font-sans utilities
  - Warm palette tokens (--color-cream, --color-ink, --color-terracotta) and display type scale (text-display, text-display-xl) in @theme
  - D-04 homepage shell: wordmark + pitch + in-progress note on the production URL (D-01, no holding page)
  - D-03 robots noindex metadata with Phase 7 removal comment
affects: [01-04 deploy, 04-ui, 05-results, 07-polish]

# Tech tracking
tech-stack:
  added:
    [
      shadcn@4.19.1 (CLI + runtime tailwind.css import),
      radix-ui@1.6.7,
      lucide-react@1.38.0,
      tw-animate-css@1.4.0,
      class-variance-authority@0.7.1,
      clsx@2.1.1,
      tailwind-merge@3.6.0,
    ]
  patterns:
    - shadcn components vendored under src/components/ui/, config in components.json (radix-nova style, neutral base)
    - Fonts loaded once in layout.tsx via next/font, exposed as CSS vars, consumed by @theme inline tokens
    - Design tokens live in globals.css @theme blocks (CSS-first, no tailwind.config.js); semantic warm palette names
    - shadcn :root --background/--foreground carry the warm palette so bg-background/text-foreground stay canonical

key-files:
  created:
    - components.json
    - src/components/ui/button.tsx
    - src/components/ui/input.tsx
    - src/components/ui/label.tsx
    - src/components/ui/card.tsx
    - src/components/ui/dialog.tsx
    - src/lib/utils.ts
  modified:
    - package.json
    - package-lock.json
    - src/app/globals.css
    - src/app/layout.tsx
    - src/app/page.tsx

key-decisions:
  - "shadcn CLI 4.19.1 dropped --base-color; used -b radix -p nova which lands baseColor neutral in components.json (radix primitives per STACK.md)"
  - "Kept warm palette on shadcn's own --background/--foreground (cream/ink) plus named @theme tokens, so shadcn components and custom utilities share one ground"
  - "Warm accent named --color-terracotta (not --color-accent) to avoid colliding with shadcn's existing --color-accent token"

patterns-established:
  - "Design tokens: @theme inline for var()-backed font tokens, plain @theme for literal color/type-scale tokens"
  - "Display type carries opsz: font-display + text-display/-xl utilities are the Phase 4 big-number surface"

requirements-completed: [PLAT-01]

# Metrics
duration: 8min
completed: 2026-08-31
---

# Phase 1 Plan 02: UI Foundation Summary

**shadcn/ui (radix-nova, neutral) with the five D-15 primitives vendored, Fraunces(opsz)+Inter design tokens in Tailwind v4 @theme, and the noindexed Milesworth homepage shell**

## Performance

- **Duration:** 8 min
- **Started:** 2026-08-31T21:23:43Z
- **Completed:** 2026-08-31T21:31:19Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments

- shadcn/ui initialized (components.json, radix library, neutral base) with button, input, label, card, dialog vendored — Phase 4's balance-entry form needs zero CLI runs
- Editorial typography live: Fraunces variable font with the opsz axis (chosen to carry the big dollar numbers) + Inter, self-hosted via next/font, exposed as font-display/font-heading/font-sans utilities through @theme
- Warm palette starting values (#faf7f2 cream / #262119 ink / #c05f33 terracotta) as named @theme tokens, also driving shadcn's --background/--foreground; display type scale tokens added
- Production homepage shows the real app shell: wordmark in Fraunces, one-sentence pitch, in-progress note — and every page carries `<meta name="robots" content="noindex, nofollow"/>` (verified in built HTML)

## Task Commits

Each task was committed atomically:

1. **Task 1: shadcn init + vendored component set (D-15)** - `0f38b86` (feat)
2. **Task 2: Editorial typography + warm @theme tokens (D-13)** - `a648144` (feat)
3. **Task 3: D-04 homepage shell + D-03 noindex** - `36cca82` (feat)

## Files Created/Modified

- `components.json` - shadcn config: style radix-nova, baseColor neutral, Tailwind v4 CSS at src/app/globals.css
- `src/components/ui/{button,input,label,card,dialog}.tsx` - vendored D-15 primitives (radix-ui based)
- `src/lib/utils.ts` - `cn` helper (clsx + tailwind-merge)
- `src/app/globals.css` - shadcn variables + @theme inline font tokens (--font-sans/--font-display/--font-heading) + warm palette and display type-scale @theme block
- `src/app/layout.tsx` - Fraunces (axes: ["opsz"]) + Inter via next/font/google; metadata with robots index:false/follow:false and Phase 7 removal comment
- `src/app/page.tsx` - D-04 shell: wordmark, pitch, in-progress note; server component, no client JS
- `package.json` / `package-lock.json` - shadcn deps (radix-ui, lucide-react, tw-animate-css, cva, clsx, tailwind-merge, shadcn)

## Decisions Made

- shadcn CLI 4.19.1 has a new flag surface (`-b/-p` presets, no `--base-color`); used `-b radix -p nova`, which produces baseColor "neutral" — matching the plan's intent (neutral base, warm editorial palette from our own tokens)
- Named the warm accent `--color-terracotta` instead of the plan's example `--color-accent` because shadcn already defines `--color-accent`; preserving shadcn variables took precedence per the plan's own instruction
- Pointed shadcn's `:root` `--background`/`--foreground` at the cream/ink values so `bg-background`/`text-foreground` (used by shadcn components and the base layer) render the warm ground without forking the token system

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan's shadcn init invocation invalid for current CLI**
- **Found during:** Task 1 (shadcn init)
- **Issue:** `npx shadcn@latest init --yes` with a neutral base color flag does not exist in shadcn 4.19.1 (`--base-color` unknown; interactive preset prompt blocks `--yes` alone)
- **Fix:** Ran `npx shadcn@latest init -b radix -p nova --yes --no-monorepo` — radix component library (matches STACK.md/threat-model dep list), nova preset (Lucide icons), which writes baseColor "neutral"
- **Files modified:** components.json, package.json, package-lock.json, src/app/globals.css, src/lib/utils.ts
- **Verification:** components.json baseColor "neutral"; all five components compile; build/lint green
- **Committed in:** 0f38b86 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — CLI flag drift)
**Impact on plan:** None on scope; the exact CLI syntax changed upstream, the outcome (neutral base, radix primitives, tw-animate-css) is exactly what the plan specified. No new packages beyond shadcn's own install were introduced.

## Issues Encountered

None beyond the CLI flag drift above. Note: current shadcn init also adds `shadcn` itself as a runtime dependency and `@import "shadcn/tailwind.css"` in globals.css — this is the official shadcn package (same registry/publisher as the CLI), new standard behavior for the 4.x CLI, and it compiles clean.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: supply-chain-note | package.json | shadcn 4.x adds `shadcn` as a runtime dep (for `shadcn/tailwind.css`) — official package, but not in T-01-SC's named dep list (radix-ui, lucide-react, tw-animate-css, clsx/tailwind-merge, cva all matched) |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 01-04 (deploy) can ship this shell to Vercel — the production URL will show the real app (D-01) and stays out of indexes (D-03)
- Phase 4 builds the balance-entry flow on preinstalled primitives (D-15) and real typography/palette tokens (D-13); the wow-reveal numbers have `font-display` + `text-display-xl` with the opsz axis ready
- Phase 7 launch gate: remove `robots: { index: false, follow: false }` from src/app/layout.tsx (comment marks the spot); refine warm palette values

## Self-Check: PASSED

- components.json, src/components/ui/{button,input,label,card,dialog}.tsx, src/lib/utils.ts: all exist on disk
- Commits 0f38b86, a648144, 36cca82 present in git log
- `npm run build`, `npm run lint`, `npm run typecheck`, `npm test` all exit 0
- globals.css contains @theme + --font-fraunces; layout.tsx loads Fraunces/Inter; page.tsx contains "Milesworth"; built index.html contains `<meta name="robots" content="noindex, nofollow"/>`; no tailwind.config.js exists

---
*Phase: 01-foundation*
*Completed: 2026-08-31*
