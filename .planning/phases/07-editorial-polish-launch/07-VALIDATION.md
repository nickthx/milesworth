---
phase: 7
slug: editorial-polish-launch
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-15
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 (node environment, `tests/**/*.test.ts`, `@` → `src`) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/design-system-gate.test.ts tests/image-manifest.test.ts tests/seed-data.test.ts` |
| **Full suite command** | `npm test && npm run typecheck && npm run lint && npm run build` |
| **Phase gate command** | `npm run lighthouse` (LHCI against production URLs, median of 3) |
| **Estimated runtime** | ~20 seconds quick · ~90 seconds full · ~4 minutes Lighthouse |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/design-system-gate.test.ts tests/image-manifest.test.ts` plus the task's own test file
- **After every plan wave:** Run `npm test && npm run typecheck && npm run lint && npm run build`
- **Before `/gsd:verify-work`:** Full suite green, `npm run lighthouse` green on production, both human checkpoints (real-device LinkedIn pass, Nick dataset sign-off) approved
- **Max feedback latency:** 30 seconds (quick run)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-XX-XX | TBD | 0 | PLAT-05 | — | Heading token used everywhere; no `text-[1.75rem]`; `.dark` block removed; warm neutrals declared | unit (source scan) | `npx vitest run tests/design-system-gate.test.ts` | ❌ W0 | ⬜ pending |
| 07-XX-XX | TBD | 0 | PLAT-05 | T-07 V5 | Every seed `imageSlug` has a committed WebP + typed manifest entry; lookup is a map, never a path | unit (fs vs seed) | `npx vitest run tests/image-manifest.test.ts` | ❌ W0 | ⬜ pending |
| 07-XX-XX | TBD | TBD | PLAT-05 | — | `ResultCard` renders destination image with blur placeholder | unit (SSR render string) | `npx vitest run tests/result-card.test.ts` | ❌ W0 (optional) | ⬜ pending |
| 07-XX-XX | TBD | 0 | PLAT-02 | — | No `h-screen`/`100vh`; `viewport` export with `viewportFit: "cover"`, no zoom lock; `pb-safe` utility exists | unit (source scan) | `npx vitest run tests/design-system-gate.test.ts` | ❌ W0 | ⬜ pending |
| 07-XX-XX | TBD | TBD | PLAT-02 | T-07 share-link leak | Share link is canonical (`SITE_URL` + short keys), never `location.href`; no `__clerk_db_jwt` | unit (pure helper + source scan) | `npx vitest run tests/share-url.test.ts` | ❌ W0 | ⬜ pending |
| 07-XX-XX | TBD | TBD | PLAT-02 | T-07 UA spoof | `isLinkedInInAppBrowser` matches verified iOS/Android UA strings; detection only shows a hint, never gates auth | unit | `npx vitest run tests/in-app-browser.test.ts` | ❌ W0 | ⬜ pending |
| 07-XX-XX | TBD | TBD | PLAT-02 / SC3 | T-07 DoS | Lighthouse mobile thresholds met on 4 HTML URLs (never `/og`) | automated (LHCI) | `npm run lighthouse` | ❌ W0 (`config/lighthouserc.cjs`) | ⬜ pending |
| 07-XX-XX | TBD | TBD | SC3 dataset | — | `verified ≥ N`, 8-program reachability, provenance | unit + DB one-liner | `npx vitest run tests/seed-data.test.ts` | ✅ (floor to raise) | ⬜ pending |
| 07-XX-XX | TBD | TBD | Launch flip | T-07 `/account` exposure | Layout has no `index:false`; `/account` has route noindex; `robots.ts`/`sitemap.ts` disallow `/account`; scaffold files gone | unit (source scan) | `npx vitest run tests/launch-gate.test.ts` | ❌ (lands with flip) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Task IDs are filled in by the planner once PLAN.md files exist.*

---

## Wave 0 Requirements

- [ ] `tests/design-system-gate.test.ts` — PLAT-05 / PLAT-02 source-scan pins
- [ ] `tests/image-manifest.test.ts` — imagery coverage (every seed `imageSlug` → WebP + manifest entry)
- [ ] `tests/share-url.test.ts` — canonical share URL helper
- [ ] `tests/in-app-browser.test.ts` — LinkedIn UA detection helper
- [ ] `config/lighthouserc.cjs` + `"lighthouse"` npm script + `.lighthouseci/` in `.gitignore`
- [ ] Dev install (human-verify checkpoint first): `npm install -D @lhci/cli@0.15.1 lighthouse@13.4.1 sharp@0.35.4`
- [ ] `tests/launch-gate.test.ts` — added by the launch-flip plan (fails before the flip by design)
- [ ] Wave 0 decisions checkpoint: custom domain + Clerk production instance (Q1), Clerk social connections state (Q2), launch dataset size N (Q3)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full flow inside LinkedIn's in-app browser on a real phone | PLAT-02 | LinkedIn's store app cannot be attached to Safari/Chrome inspectors; no automation path | Post share link in a LinkedIn DM to self → tap → enter balance → results → Copy my link → paste in DM → Sign in (email code) → Save → `/account` → back. Confirm OG unfurl in the DM. iOS mandatory, Android best-effort. |
| Editorial look is consistent across `/`, `/account`, `/methodology`, `/privacy`, error state | PLAT-05 | Visual judgment | UI-SPEC checker verdicts + human visual review on a phone at 360px width |
| Nick verifies each dataset batch | SC3 dataset | Data provenance is a human judgment | 02-05 blocking-checkpoint pattern per batch; raise `tests/seed-data.test.ts` floor only with verified rows |
| Production launch flip | Launch flip | Requires live URL + LinkedIn Post Inspector | `curl -s https://<host>/robots.txt` and `/sitemap.xml` return 200; `/` head has no `noindex`; `/account` head has `noindex`; re-scrape in LinkedIn Post Inspector |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
