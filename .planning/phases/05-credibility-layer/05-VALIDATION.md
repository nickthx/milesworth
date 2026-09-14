---
phase: 5
slug: credibility-layer
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-02
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 (environment: node) |
| **Config file** | `vitest.config.ts` — plan 05-01 Task 1 adds `resolve.alias { "@": ./src }` (Wave 0); include stays `tests/**/*.test.ts` |
| **Quick run command** | `npx vitest run tests/<file>.test.ts` |
| **Full suite command** | `npm test && npm run typecheck && npm run lint` (152 tests green pre-phase) |
| **Estimated runtime** | ~5 seconds unit suite; `tests/og-route.test.ts` adds ~3 s (real ImageResponse renders) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/<touched-area>.test.ts` (the `<automated>` command on each task)
- **After every plan wave:** Run `npm test && npm run typecheck && npm run lint` (plus `npm run build` in 05-03 and 05-05)
- **Before `/gsd:verify-work`:** Full suite + build green, production deploy done, inspector + waitlist evidence captured
- **Max feedback latency:** 5 seconds (unit); ~10 s when og-route is included

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | PLAT-03 | T-05-02 | Fonts are pinned bytes (`wOFF` magic, exact size), no runtime fetch, no new dependency | config + asset gate | `npx vitest run tests/smoke.test.ts && head -c 4 src/assets/fonts/*.woff` + size checks | ✅ (smoke) | ⬜ pending |
| 5-01-02 | 01 | 1 | PLAT-03 | T-05-01 | Share strings built only from curated seed fields + formatters; no clock, no sort, no throw | unit | `npx vitest run tests/share-content.test.ts` | ❌ W0 (created in task) | ⬜ pending |
| 5-01-03 | 01 | 1 | PLAT-04 | T-05-03 | Email trimmed/lowercased, ≤254, valid format; filled honeypot rejected; non-string rejected | unit (hostile table) | `npx vitest run tests/interest-validation.test.ts` | ❌ W0 (created in task) | ⬜ pending |
| 5-02-01 | 02 | 2 | VAL-03 | T-05-04 / T-05-05 | Numbers rendered from data via `cppX100` + formatters; static sync RSC; no `@/db`, no client directive | unit (renderToStaticMarkup + source scan) | `npx vitest run tests/methodology-page.test.ts` | ❌ W0 (created in task) | ⬜ pending |
| 5-02-02 | 02 | 2 | VAL-03 | T-05-06 | Only a `next/link` added to the island; components tree stays DB-free | grep gate + typecheck | `grep -v '^\s*//' src/components/core-experience.tsx \| grep -c 'href="/methodology"'` = 1; `! grep -rlE 'from "@/db\|drizzle' src/components` | — | ⬜ pending |
| 5-03-01 | 03 | 2 | PLAT-03 | T-05-07 / T-05-08 / T-05-09 | Hostile params → sanitized → 200 baseline PNG; `s-maxage` header; neutral 500 with no detail | integration-in-node (binary response) | `npx vitest run tests/og-route.test.ts` | ❌ W0 (created in task; needs 05-01 fonts) | ⬜ pending |
| 5-03-02 | 03 | 2 | PLAT-03 | T-05-10 / T-05-11 | `metadataBase` is the fixed production host (never `VERCEL_URL`); `og:url`/`og:image` carry canonical params | source gate + build | grep gates in plan + `npm run build` (route table `ƒ /og`) | ✅ build script | ⬜ pending |
| 5-04-01 | 04 | 2 | PLAT-04 | T-05-15 | Schema pushed without echoing `DATABASE_URL`; `.env*` gitignored | CLI (drizzle-kit push + db-check) | `npx drizzle-kit push` then `npx tsx scripts/db-check.ts \| grep -E '^interest_signups rows: [0-9]+$'` | ✅ scripts/db-check.ts | ⬜ pending |
| 5-04-02 | 04 | 2 | PLAT-04 | T-05-12 / T-05-13 / T-05-14 | Honeypot short-circuits to success without a write; zod issue text never returned; bare catch, no logging; sole `@/db` importer | source gate + typecheck | grep gates in plan (`"use server"`, `onConflictDoNothing`, no `console.`, DB-free gate → exactly `src/app/actions/interest.ts`) | — | ⬜ pending |
| 5-04-03 | 04 | 2 | PLAT-04 | T-05-13 | Client form imports only the action reference; 44px targets; honeypot hidden | source gate + typecheck + suite | grep gates in plan + `npm run typecheck && npm run lint && npx vitest run` | — | ⬜ pending |
| 5-05-01 | 05 | 3 | VAL-03, PLAT-03, PLAT-04 | T-05-17 | No `.env` tracked; DB-free gate; all Phase 4 gates intact | full suite + build + grep | `npx vitest run && npm run typecheck && npm run lint && npm run build` + gates in plan | ✅ | ⬜ pending |
| 5-05-02 | 05 | 3 | PLAT-03, VAL-03 | T-05-11 / T-05-18 | Production `og:image` absolute on the production host with canonical params; distinct param sets → distinct PNGs; CDN HIT on repeat | production smoke (curl) | curl commands in plan (tags, `content-type: image/png`, `x-vercel-cache: HIT`, size diff, `/methodology` 200) | — | ⬜ pending |
| 5-05-03 | 05 | 3 | PLAT-03, PLAT-04, VAL-03 | T-05-16 | Real crawler render; real submission; idempotent repeat; neutral invalid message | **manual** (checkpoint:human-verify) + post-approval `npx tsx scripts/db-check.ts` (`interest_signups rows` ≥ 1) | see Manual-Only Verifications | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 is folded into plan 05-01 (Wave 1) and the first task of each Wave 2 plan — every test file is created in the same task as the module it covers, so no task ever runs without an automated verify:

- [ ] `vitest.config.ts` — `resolve.alias` for `@` (05-01 Task 1; RESEARCH-verified pattern)
- [ ] `src/assets/fonts/*.woff` — vendored before `tests/og-route.test.ts` can run (05-01 Task 1 → 05-03 Task 1 ordering enforced by `depends_on`)
- [ ] `tests/share-content.test.ts` — PLAT-03 helper (05-01 Task 2)
- [ ] `tests/interest-validation.test.ts` — PLAT-04 validation (05-01 Task 3)
- [ ] `tests/methodology-page.test.ts` — VAL-03 render assertions (05-02 Task 1)
- [ ] `tests/og-route.test.ts` — PLAT-03 route (05-03 Task 1)
- No framework install needed; no npm packages installed this phase.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Share link unfurls with the branded OG image in a link-preview inspector (ROADMAP criterion 2) | PLAT-03 | Third-party crawler rendering (LinkedIn/Slack/iMessage) cannot be exercised locally; previews are Deployment-Protected so only production counts | 05-05 Task 3 steps 1–3: LinkedIn Post Inspector on `https://milesworth.vercel.app/?ur=90000&mr=50000` and the bare URL; Vercel deployment → Open Graph tab. Evidence: screenshot path or pasted tag list in 05-05-SUMMARY |
| Waitlist submission stores a row; repeat is idempotent; invalid input shows neutral copy | PLAT-04 | Server Actions require a browser-issued action request; the executor cannot forge one | 05-05 Task 3 step 4 (submit real email, resubmit, submit `not-an-email`); then executor runs `npx tsx scripts/db-check.ts` → `interest_signups rows: ≥1` |
| Methodology page reads correctly and is reachable from both links | VAL-03 | Wording sign-off is Nick's (PITFALLS #4 — treat as a research note) | 05-05 Task 3 step 5 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (checkpoint task 5-05-03 is manual by justification above)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (each test file is created in the task that creates its module; fonts + alias precede og-route via `depends_on`)
- [x] No watch-mode flags (`vitest run` everywhere)
- [x] Feedback latency < 5s for unit files; og-route ~3 s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-02 (planner)
