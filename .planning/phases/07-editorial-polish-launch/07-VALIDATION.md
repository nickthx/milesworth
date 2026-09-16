---
phase: 7
slug: editorial-polish-launch
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-15
updated: 2026-09-16
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Task IDs filled by the planner (10 plans, 6 waves).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 (node environment, `tests/**/*.test.ts`, `@` → `src`) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/design-system-gate.test.ts tests/image-manifest.test.ts tests/seed-data.test.ts` |
| **Full suite command** | `npm test && npm run typecheck && npm run lint && npm run build` |
| **Phase gate command** | `npm run lighthouse` (LHCI against production URLs, median of 3; `config/lighthouserc.cjs`) |
| **Estimated runtime** | ~20 seconds quick · ~90 seconds full · ~4 minutes Lighthouse |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/design-system-gate.test.ts tests/image-manifest.test.ts` plus the task's own test file
- **After every plan wave:** Run `npm test && npm run typecheck && npm run lint && npm run build`
- **Before `/gsd:verify-work`:** Full suite green, `npm run lighthouse` green on production (SEO as error after 07-09), both human checkpoints (real-device LinkedIn pass 07-07, Nick dataset sign-off 07-06/07-08) approved, Post Inspector re-scrape (07-10) approved
- **Max feedback latency:** 30 seconds (quick run)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 07-01 | 1 | PLAT-02/05 | T-07-16 | Wave 0 decisions D7-01..03 recorded as literals | human (checkpoint:decision) | — | n/a | ⬜ pending |
| 07-01-02 | 07-01 | 1 | — | T-07-SC | Package legitimacy confirmed before install | human (checkpoint:human-verify, blocking-human) | — | n/a | ⬜ pending |
| 07-01-03 | 07-01 | 1 | PLAT-02 | T-07-07, T-07-08 | Pinned dev installs; LHCI config 4 HTML URLs, no /og, SEO warn | CLI | `npx lhci --version && node -e "require('./config/lighthouserc.cjs')"` | ❌ W1 | ⬜ pending |
| 07-02-01 | 07-02 | 1 | PLAT-05 | T-07-04 | brand.ts + tokens + warm neutrals + pb-safe; build accepts | CLI/build | `npm run build` + greps | ❌ W1 | ⬜ pending |
| 07-02-02 | 07-02 | 1 | PLAT-05 | T-07-12 | font-medium=0, md:text-sm=0, /og on brand.ts | unit | `npx vitest run tests/og-route.test.ts` | ✅ | ⬜ pending |
| 07-02-03 | 07-02 | 1 | PLAT-05 | T-07-04, T-07-17 | Design-system gate created (tokens, CSS≡TS hex, no .dark, no color-mix, accent budget) | unit (source scan) | `npx vitest run tests/design-system-gate.test.ts` | ❌ W1 | ⬜ pending |
| 07-03-01 | 07-03 | 2 | PLAT-05 | T-07-09, T-07-05 | sharp pipeline with slug regex, no withMetadata, 200 KB gate | CLI | `npm run typecheck` + raw listing | ❌ W2 | ⬜ pending |
| 07-03-02 | 07-03 | 2 | PLAT-05 | T-07-04, T-07-14, T-07-18 | 20 WebPs + typed manifest; coverage test (bidirectional, size, no https) | unit (fs vs seed) | `npx vitest run tests/image-manifest.test.ts` | ❌ W2 | ⬜ pending |
| 07-03-03 | 07-03 | 2 | PLAT-05 | — | Nick approves photos vs selection rules | human | — | n/a | ⬜ pending |
| 07-04-01 | 07-04 | 2 | PLAT-05/02 | T-07-20 | Pages/account sweep; no target=_blank | unit | `npx vitest run tests/privacy-page.test.ts tests/methodology-page.test.ts` | ✅ | ⬜ pending |
| 07-04-02 | 07-04 | 2 | PLAT-05/02 | T-07-14 | Island sweep; masthead; min-h-11; pb-safe; credit line | build + greps | `npm run build` | ✅ | ⬜ pending |
| 07-04-03 | 07-04 | 2 | PLAT-05 | T-07-19 | not-found/loading in shell; gate extended | unit (source scan) | `npx vitest run tests/design-system-gate.test.ts` | ❌ W1 (07-02) | ⬜ pending |
| 07-05-01 | 07-05 | 3 | PLAT-02 | T-07-02, T-07-03 | shareUrl canonical (no jwt/utm); isLinkedInInAppBrowser | unit (TDD) | `npx vitest run tests/share-url.test.ts tests/in-app-browser.test.ts tests/share-content.test.ts` | ❌ W3 | ⬜ pending |
| 07-05-02 | 07-05 | 3 | PLAT-02/05 | T-07-12, T-07-18, T-07-21 | share-link.tsx fallback field; card + teaser images; hint per D7-02 | build + greps | `npm run build` + `grep -rn "window.location.href" src` empty | ✅ | ⬜ pending |
| 07-05-03 | 07-05 | 3 | PLAT-02 | — | viewport export, no zoom lock; PLAT-02 pins | unit (source scan) | `npx vitest run tests/design-system-gate.test.ts` | ❌ W1 (07-02) | ⬜ pending |
| 07-06-01 | 07-06 | 3 | DATA-01/04 | T-07-09 | Batch 1 drafts (verifiedAt null) + images | unit | `npm test` + tsx count | ✅ | ⬜ pending |
| 07-06-02 | 07-06 | 3 | DATA-04 | T-07-10 | Nick verifies batch 1 + held drafts | human | — | n/a | ⬜ pending |
| 07-06-03 | 07-06 | 3 | DATA-04 | T-07-10, T-07-11, T-07-22 | Floor = achieved count; Neon = seed | unit + DB one-liner | `npm run db:seed && … && npm test` | ✅ | ⬜ pending |
| 07-07-01 | 07-07 | 4 | PLAT-02 / SC3 | T-07-07, T-07-08 | Lighthouse baseline on 4 prod URLs; thresholds = baseline − noise | automated (LHCI) | `npm run lighthouse` | ❌ W1 (07-01) | ⬜ pending |
| 07-07-02 | 07-07 | 4 | PLAT-02 | T-07-02, T-07-01 | Real-device LinkedIn pass (iOS mandatory) | human | — | n/a | ⬜ pending |
| 07-08-01 | 07-08 | 4 | DATA-01/04 | — | Batch 2 drafts + featured-8/bonus dossier | unit | `npm test` + tsx count | ✅ | ⬜ pending |
| 07-08-02 | 07-08 | 4 | DATA-04 | T-07-10, T-07-23 | Nick verifies batch 2 + launch-week re-check | human | — | n/a | ⬜ pending |
| 07-08-03 | 07-08 | 4 | DATA-04 | T-07-22, T-07-11 | Floor = N; Neon = seed; bookkeeping | unit + DB one-liner | `npm run db:seed && … && npm test` | ✅ | ⬜ pending |
| 07-09-01 | 07-09 | 5 | PLAT-02 | T-07-06, T-07-15, T-07-26 | /account route noindex; robots/sitemap static; launch-gate part 1 | unit (source scan) | `npx vitest run tests/launch-gate.test.ts` | ❌ W5 | ⬜ pending |
| 07-09-02 | 07-09 | 5 | PLAT-02 | T-07-06 | Layout noindex removed; SEO → error | unit + build | `npx vitest run tests/launch-gate.test.ts && npm run build` | ❌ W5 | ⬜ pending |
| 07-09-03 | 07-09 | 5 | PLAT-05 | T-07-24, T-07-25 | Icon routes, scaffold cleanup, README | unit + build | `npx vitest run tests/launch-gate.test.ts tests/design-system-gate.test.ts && npm run build` | ❌ W5 | ⬜ pending |
| 07-10-01 | 07-10 | 6 | PLAT-02 | T-07-08, T-07-13 | Domain/Clerk prod cut-over (D7-01 = a only) | human (checkpoint:human-action) | — | n/a | ⬜ pending |
| 07-10-02 | 07-10 | 6 | PLAT-02 / SC3 | T-07-06, T-07-07 | Live probes (robots, sitemap, noindex, icons, og:url host, /og cache); final LHCI with SEO error | curl + LHCI | `LHCI_BASE_URL=HOST npm run lighthouse` | ❌ W1 (07-01) | ⬜ pending |
| 07-10-03 | 07-10 | 6 | PLAT-02/05 | T-07-27 | Post Inspector re-scrape + phone open | human | — | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 is realised inside Wave 1 (plans 07-01 and 07-02); test files land in the plan that lands the behavior they pin, never ahead of it (a gate asserting the target state before the change would be red by design).

- [ ] 07-01-01 Wave 0 decisions checkpoint: custom domain + Clerk production instance (Q1), Clerk social connections state (Q2), launch dataset size N + batch split (Q3), Android device availability (Q5)
- [ ] 07-01-02 Package legitimacy human-verify, then 07-01-03 `npm install -D @lhci/cli@0.15.1 lighthouse@13.4.1 sharp@0.35.4`
- [ ] 07-01-03 `config/lighthouserc.cjs` + `"lighthouse"` / `"images:optimize"` npm scripts + `.lighthouseci/`, `raw/` in `.gitignore`
- [ ] 07-02-03 `tests/design-system-gate.test.ts` — PLAT-05 token pins (extended by 07-04-03 and 07-05-03)
- [ ] 07-03-02 `tests/image-manifest.test.ts` — imagery coverage
- [ ] 07-05-01 `tests/share-url.test.ts`, `tests/in-app-browser.test.ts` — pure helpers (TDD)
- [ ] 07-09-01 `tests/launch-gate.test.ts` — lands with the flip (parts 1–3)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full flow inside LinkedIn's in-app browser on a real phone | PLAT-02 | LinkedIn's store app cannot be attached to Safari/Chrome inspectors; no automation path | 07-07 Task 2 ten-step checklist (share-link DM → balances → results with photos → Copy my link / fallback → paste → email-code sign-in → Save → /account → back → footer/safe-area → 404). iOS mandatory, Android per D7-01 android_device |
| Editorial look is consistent across `/`, `/account`, `/methodology`, `/privacy`, error, not-found | PLAT-05 | Visual judgment | 07-03 Task 3 photo review + 07-07 Task 2 steps 2–3, 8–9 on a phone at 360px |
| Nick verifies each dataset batch | SC3 dataset | Data provenance is a human judgment | 07-06 Task 2 and 07-08 Task 2 (02-05 blocking-checkpoint pattern); floors raised only with verified rows |
| Production launch flip + social card | Launch flip | Requires live host + LinkedIn Post Inspector | 07-10 Task 2 curl probes, then Task 3 Post Inspector re-scrape and phone open |
| Wave 0 decisions and package legitimacy | — | Human choices / registry trust | 07-01 Tasks 1–2 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are human checkpoints with `<acceptance_criteria>` (no auto task lacks an automated command)
- [x] Sampling continuity: no 3 consecutive auto tasks without automated verify
- [x] Wave 0 covers all MISSING references (each test file is created by the task that lands its behavior)
- [x] No watch-mode flags (`vitest run` everywhere; `lhci autorun`)
- [x] Feedback latency < 30s for the quick run (Lighthouse is the explicit ~4 min phase gate)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planner 2026-09-16 — pending execution
