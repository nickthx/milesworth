---
phase: 07-editorial-polish-launch
plan: 05
subsystem: guest-flow-webview-hardening
tags: [plat-02, plat-05, share-url, clipboard-fallback, viewport, next-image, in-app-browser, tdd]
requires:
  - "07-02: brand.ts CREAM, design-system-gate marker line"
  - "07-03: src/images/destinations.ts getDestinationImage + 20 WebPs"
  - "07-04: text-heading, pb-safe footer, 'Photos via Unsplash' credit"
provides:
  - "src/lib/share-url.ts: toShareQuery(balances), shareUrl(balances)"
  - "src/lib/in-app-browser.ts: isLinkedInInAppBrowser(ua)"
  - "src/components/share-link.tsx: Copy my link CTA + read-only clipboard fallback"
  - "src/app/layout.tsx: viewport export (viewport-fit=cover, theme-color cream)"
  - "result-card.tsx + EmptyState teaser lead with the destination photo"
affects:
  - "07-07 device pass: production build now carries viewport-fit, canonical share link, fallback field"
  - "07-08 Task 3: repeats the footer-credit reconciliation after dataset batches"
  - "07-09: removes robots noindex from the same layout.tsx metadata block"
tech-stack:
  added: []
  patterns:
    - "Single canonical share query: share-content.ts and share-link.tsx both consume toShareQuery"
    - "Mount-time browser-API read via useSyncExternalStore with a false server snapshot (hydration-safe, lint-clean)"
    - "Card imagery: <Image> as DIRECT first child of <Card> so the vendored img-slot selectors apply"
key-files:
  created:
    - src/lib/share-url.ts
    - src/lib/in-app-browser.ts
    - src/components/share-link.tsx
    - tests/share-url.test.ts
    - tests/in-app-browser.test.ts
  modified:
    - src/lib/share-content.ts
    - src/components/core-experience.tsx
    - src/components/result-card.tsx
    - src/components/save-balances-button.tsx
    - src/app/layout.tsx
    - tests/design-system-gate.test.ts
decisions:
  - "In-app hint reads navigator.userAgent through useSyncExternalStore (server snapshot false) instead of a mount useEffect + setState — the react-hooks/set-state-in-effect lint rule rejects the effect form; hydration guarantee is identical"
  - "Footer credit stays 'Photos via Unsplash' — manifest holds 20/20 Unsplash sources"
  - "D7-02 is b: the open-in-browser hint IS rendered under Sign in to save when the LinkedIn UA is detected"
metrics:
  duration: "~25 min"
  completed: "2026-09-21"
  tasks: 3
  tests-added: 16
---

# Phase 7 Plan 05: WebView Hardening + Card Imagery Summary

Canonical `SITE_URL`-rooted share links with a focused read-only clipboard fallback, `viewport-fit=cover` + cream `theme-color` via a typed `viewport` export, a tested LinkedIn in-app-browser helper driving the D7-02 hint, and the destination photo as the leading child of every bookable-now card and the empty-state teaser.

## What Was Built

**Task 1 (TDD) — pure helpers.** `src/lib/share-url.ts` exports `toShareQuery` (the former private `toQueryString` from `share-content.ts`, now the single implementation) and `shareUrl`, which returns `${SITE_URL}/?ur=…` or the bare `${SITE_URL}/`. `share-content.ts` imports `toShareQuery`; `tests/share-content.test.ts` passed unchanged. `src/lib/in-app-browser.ts` exports `isLinkedInInAppBrowser(ua)`. Neither file contains `window`, `navigator`, `document`, or `"use client"` (verified by grep, including comments). 11 share-url tests (including URL-parsed assertions that no `__clerk_db_jwt`, `utm_`, `#`, or foreign key ever appears, plus the key-order case) and 5 in-app-browser tests (2 true, 3 false).

**Task 2 — share-link.tsx + imagery + hint.** `src/components/share-link.tsx` (`"use client"`) owns the terracotta CTA (sanctioned accent use #2), the 2 s "Link copied" swap, and `navigator.clipboard.writeText(shareUrl(balances))`. On rejection it sets `fallbackUrl` and renders a `Label` + `readOnly` `Input` (`id="share-link-fallback"`, `onFocus` selects all, focused once via an effect) with the copy "Couldn't reach the clipboard — press and hold the link to copy it." `core-experience.tsx` lost the copy-link block and the `Button`/`useState` imports, mounts `<ShareLink balances={balances}>` with `SaveBalancesButton` as its child, and dropped from 385 to 375 lines; the teaser `Card` now starts with `<Image placeholder="blur" sizes="(min-width: 768px) 768px, 100vw" className="aspect-[3/2] w-full object-cover">`. `result-card.tsx` gets the identical `<Image>` as the direct first child of `<Card>`; `almost-there.tsx` is untouched. `save-balances-button.tsx` renders the D7-02 (b) hint "Signing in works best in your regular browser — tap the menu and choose Open in browser." under Sign in to save when the LinkedIn UA is detected.

**Task 3 — viewport, credit, gate.** `layout.tsx` exports `viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: CREAM }` — `viewportFit` typechecked cleanly (RESEARCH Assumption A1 held; no literal `<meta>` fallback needed). `robots: { index: false, follow: false }` remains. Built `.next/server/app/methodology.html` contains `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` and `<meta name="theme-color" content="#faf7f2">`. Footer credit: `grep -o 'source: "[A-Za-z]*"' src/images/destinations.ts | sort | uniq -c` → 21 × `"Unsplash"` (20 entries + the type-union line), 0 × `"Pexels"`; wording "Photos via Unsplash" left as-is, `site-footer.tsx` unmodified. The gate gained a `describe("PLAT-02 WebView hardening (07-05)")` with 7 tests and the accent allowed set is now exactly `["result-card.tsx", "share-link.tsx"]`.

## Verification

- `npm test`: 24 files, 354 tests passing (was 338 before this plan)
- `npm run typecheck`, `npm run lint`: clean
- `npm run build`: `/` ƒ dynamic; `/methodology`, `/privacy` ○ static
- `grep -rn "window.location.href" src`: empty
- No test file imports `src/images/destinations` (only a comment mention in image-manifest.test.ts)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] In-app hint uses `useSyncExternalStore` instead of `useEffect` + `setState`**
- **Found during:** Task 2, `npm run lint`
- **Issue:** The plan's `useEffect(() => setInApp(isLinkedInInAppBrowser(navigator.userAgent)), [])` fails `react-hooks/set-state-in-effect` (eslint-plugin-react-hooks v6 / React Compiler rule) — a hard lint error, and the build gate requires lint to pass.
- **Fix:** `const inApp = useSyncExternalStore(subscribeNoop, readInAppBrowser, () => false)`. `readInAppBrowser` wraps `navigator.userAgent` in try/catch. The server/hydration snapshot is `false`, so server HTML and the first client paint never carry the hint (the Pitfall 2 guarantee the plan wanted from the effect); React re-renders with the client snapshot afterwards. `navigator.userAgent` is therefore read in the client getSnapshot rather than literally "inside a useEffect" — the acceptance-criterion wording differs, the hydration intent is met, and the rule-recommended pattern is used.
- **Files modified:** `src/components/save-balances-button.tsx`
- **Commit:** 60ab6a4

**2. [Rule 1 - Bug] Comment wording tripped literal verify greps**
- **Found during:** Tasks 1 and 2 verification
- **Issue:** Header comments mentioning `window.location.href`, `navigator.`, `preload/priority`, and `navigator.share` matched the plan's literal token greps (the acceptance criteria forbid those tokens file-wide, comments included).
- **Fix:** Reworded the comments; no code change.
- **Commit:** 6601b63, 60ab6a4

**3. [Plan-internal conflict] `writeText(shareUrl(` vs `const url = shareUrl(balances)`**
- **Issue:** The plan's action text assigns `url` before the try, but its key_link pattern and acceptance criteria require the literal `writeText(shareUrl(` AND `setFallbackUrl(url)`.
- **Fix:** `writeText(shareUrl(balances))` in the try; `const url = shareUrl(balances); setFallbackUrl(url);` in the catch. `shareUrl` is pure and cheap. Both greps hold.
- **Commit:** 60ab6a4

## TDD Gate Compliance

Task 1: RED commit `2cc7672` (`test(07-05)`, both files failed on missing modules) → GREEN commit `6601b63` (`feat(07-05)`, 21/21 passing). No refactor commit needed.

## Known Stubs

None. Every card image, share URL, and hint is wired to real data.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes. All `<threat_model>` mitigations applied: T-07-02 (share-url tests + gate), T-07-03 (pure helper, presentation-only), T-07-12 (`readOnly` field with the validated canonical URL), T-07-18 (`getDestinationImage` null guard → no `<img>`), T-07-21 (no `preload`/`priority`, `sizes` capped at 768px).

## Commits

| Task | Commit | Type |
|------|--------|------|
| 1 (RED) | 2cc7672 | test |
| 1 (GREEN) | 6601b63 | feat |
| 2 | 60ab6a4 | feat |
| 3 | 8344d55 | feat |

## Self-Check: PASSED
