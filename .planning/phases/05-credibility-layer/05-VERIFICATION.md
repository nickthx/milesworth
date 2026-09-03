---
phase: 05-credibility-layer
verified: 2026-09-03T21:00:00Z
status: passed
score: 20/20 must-haves verified
overrides_applied: 0
---

# Phase 5: Credibility Layer Verification Report

**Phase Goal:** The numbers are defensible and the product markets itself when shared
**Verified:** 2026-09-03T21:00:00Z (HEAD `40d2909`)
**Status:** passed
**Re-verification:** No — initial verification

Verification stance: SUMMARY claims were treated as hypotheses. Every truth below was checked against the working tree at HEAD, the local test/typecheck/lint gates run in this session, live curl against `https://points-unlocked.vercel.app`, the two production PNGs rendered and visually inspected, and `npx tsx scripts/db-check.ts` against Neon.

## Goal Achievement

### Observable Truths

Roadmap success criteria (the contract) first, then plan-level truths that add detail. Plan truths that merely restate a roadmap SC were deduplicated into the SC row.

| #   | Truth | Source | Status | Evidence |
| --- | ----- | ------ | ------ | -------- |
| 1 | A methodology page explains fare sourcing, taxes/fees treatment, and the dynamic-award-pricing disclaimer, linked from results | ROADMAP SC1 (+05-02 T1, 05-02 T3) | ✓ VERIFIED | Prod `GET /methodology` → 200; nine `<h2>` present incl. "Where cash fares come from", "Taxes and fees", "Dynamic award pricing". Prod `/` HTML contains `href="/methodology"` ×2: the results-view link "How we calculate these numbers →" (core-experience.tsx:213-217) and the footer nav (site-footer.tsx). Local: 10 `it()` in tests/methodology-page.test.ts pass |
| 2 | Shared links unfurl with proper OG tags and a branded OG image (verified in a link-preview inspector) | ROADMAP SC2 (+05-05 T3) | ✓ VERIFIED | Prod `/?ur=90000&mr=50000` head emits og:title, og:description, og:url (`…/?ur=90000&mr=50000`), og:image (`https://points-unlocked.vercel.app/og?ur=90000&mr=50000`, absolute, canonical order), og:image:width/height/alt, og:type, twitter:card=summary_large_image, twitter:title/description/image. `/og?ur=90000&mr=50000` → 200 `image/png`, bytes 1-3 = `PNG`; PNG downloaded and viewed: cream background, Inter eyebrow "90,000 Chase Ultimate Rewards points", terracotta Fraunces "$12,870", title line, "vs. ~$730 cashing out", wordmark. LinkedIn Post Inspector + Vercel OG tab confirmed by the user at the 05-05 blocking checkpoint (approved 2026-09-03, recorded in 05-05-SUMMARY) |
| 3 | A "coming soon" tease for the v2 AI card-roadmap advisor is present with an interest hook | ROADMAP SC3 (+05-04 T1) | ✓ VERIFIED | Prod `/?ur=90000` HTML: "Coming soon" ×1, "The AI card-roadmap advisor" ×1, `name="email"` ×1, honeypot `name="website"` ×1, "Notify me" ×1. advisor-tease.tsx wires `useActionState(joinAdvisorWaitlist, INITIAL)`; interest.ts inserts into `interest_signups`; `npx tsx scripts/db-check.ts` → `interest_signups rows: 1` |
| 4 | A vitest test can import a module that runtime-imports @/data and @/engine (alias resolves) | 05-01 | ✓ VERIFIED | vitest.config.ts `resolve.alias { "@": path.resolve(__dirname, "src") }`; tests/share-content.test.ts, og-route.test.ts, methodology-page.test.ts all import modules that use `@/data`/`@/engine` and pass (15 files / 180 tests) |
| 5 | Two static-instance .woff font files exist in the repo so the OG card never fetches a font at runtime | 05-01 | ✓ VERIFIED | `src/assets/fonts/fraunces-latin-600-normal.woff` magic `wOFF` 22,512 B; `inter-latin-400-normal.woff` magic `wOFF` 30,696 B; both tracked by git; route reads them via `readFile(join(process.cwd(), "src/assets/fonts", …))`; `grep fontsource package.json` = 0 (no dependency) |
| 6 | buildShareContent turns balances into the exact share strings the page metadata and the OG image both use | 05-01 | ✓ VERIFIED | share-content.ts exports `buildShareContent`/`ShareContent`; consumed by both page.tsx `generateMetadata` and og/route.tsx; 7 `it()` pins in tests/share-content.test.ts pass; prod og:title/og:description and the PNG text agree ("$12,870 more than cashing out") |
| 7 | interestSchema accepts a normalized email, rejects invalid/oversized input, and rejects a filled honeypot — without touching the database | 05-01 | ✓ VERIFIED | interest-validation.ts: `z.string().trim().toLowerCase().max(254).pipe(z.email())`, `website: z.literal("").optional()`; zero `@/db`/drizzle/next imports; 8 `it()` hostile-input rows pass |
| 8 | Every number on the methodology page is computed from the same @/data and @/engine the results use | 05-02 | ✓ VERIFIED | page.tsx imports `programs, redemptions` from `@/data`, `cppX100` from `@/engine`; table maps `enterablePrograms`; worked example `formatCpp(anchorCpp)` where `anchorCpp = cppX100(anchor.cashFareCents, anchor.taxesFeesCents, anchorPoints)`. Prod HTML shows 0.6¢, 0.5¢, "Pure travel value" (seed values), and the test pins "9.3¢" against `cppX100` |
| 9 | /methodology is a static, zero-client-JS, DB-free route | 05-02 | ✓ VERIFIED | Sync default export, no `"use client"`, `searchParams`, `new Date`, `@/db`, `export const dynamic` (grep = 0); `.next/server/app/methodology.html` prerendered at HEAD build |
| 10 | GET /og?ur=90000&mr=50000 returns a 1200x630 PNG showing the top redemption's wow delta in Fraunces, cached at the CDN | 05-03 | ✓ VERIFIED | Prod: first request `X-Vercel-Cache: MISS`, second `HIT`; `image/png`; PNG is 1200×630 with the terracotta Fraunces headline. Source sets `Cache-Control: public, max-age=0, s-maxage=86400, stale-while-revalidate=604800` (Vercel rewrites the client-visible header to `public, max-age=0` — see Info note) |
| 11 | GET /og with no or hostile params returns a branded baseline PNG (never a 500 for bad input) | 05-03 | ✓ VERIFIED | Prod `/og` → 200 `image/png` (baseline card viewed: ink "What are your points actually worth?"); `/og?ur=-5&mr=abc&zz=1&ur=1e9` → 200 `image/png`; tests/og-route.test.ts 3 cases pass |
| 12 | The HTML head of /?ur=90000&mr=50000 carries og:title, og:description, og:url (with params), og:image (absolute, canonical params), and twitter:card=summary_large_image | 05-03 | ✓ VERIFIED | See truth 2 — all tags present on production with the canonical `ur=90000&mr=50000` order |
| 13 | Every page inherits an absolute metadataBase and a default social card | 05-03 | ✓ VERIFIED | layout.tsx `metadataBase: new URL(SITE_URL)` with fixed production host + openGraph/twitter defaults pointing at `/og`; prod bare `/` emits `og:image content="https://points-unlocked.vercel.app/og"`; no `VERCEL_URL` (grep = 0); D-03 `index: false` preserved |
| 14 | Submitting a valid email stores one row in interest_signups (repeat submits idempotent) and shows "You're on the list." | 05-04 | ✓ VERIFIED | interest.ts: `db.insert(interestSignups).values(...).onConflictDoNothing({ target: interestSignups.email })`; schema `email: text("email").notNull().unique()`; "You're on the list." ×2 (honeypot + success); db-check `interest_signups rows: 1`; user confirmed idempotent resubmit at the checkpoint |
| 15 | Invalid input shows "Enter a valid email address."; a filled honeypot writes nothing and reveals nothing | 05-04 | ✓ VERIFIED | Honeypot branch returns ok before `safeParse` and before any DB call; `!parsed.success` → fixed copy, zod issue text never returned; bare `catch`, zero `console.*` |
| 16 | The DB driver is reachable from exactly one file under src/app + src/components: src/app/actions/interest.ts | 05-04 | ✓ VERIFIED | `grep -rlE 'from "@/db\|drizzle' src/components src/app` → exactly `src/app/actions/interest.ts`; advisor-tease.tsx imports only the action reference; `scripts/seed.ts` has 0 references to `interestSignups` |
| 17 | Every page shows the site footer with the Methodology link; / shows the advisor tease below the results | 05-05 | ✓ VERIFIED | layout.tsx renders `<SiteFooter />` after `{children}` inside `<NuqsAdapter>`; page.tsx renders `<AdvisorTease />` after `<CoreExperience asOf={asOf} />`; prod `/` has `aria-label="Footer"` ×1 and the tease markup |
| 18 | The production site serves the Phase 5 build: OG tags in the head, a PNG at /og, /methodology live | 05-05 | ✓ VERIFIED | All three probed live in this session (truths 1, 2, 10, 11) |
| 19 | A real email submitted on production lands as a row in interest_signups | 05-05 | ✓ VERIFIED | `npx tsx scripts/db-check.ts` → `programs rows: 21` / `interest_signups rows: 1` (run in this session, not copied from the SUMMARY) |
| 20 | The results view and the site footer both link to /methodology | 05-02 | ✓ VERIFIED | core-experience.tsx `href="/methodology"` ×1 under the single "Bookable now" heading (still `"use client"` on line 1); site-footer.tsx `href="/methodology"` ×1; prod `/` count = 2 |

**Score:** 20/20 truths verified

### Required Artifacts

`gsd-sdk query verify.artifacts` → all_passed for every plan (05-01: 7/7, 05-02: 4/4, 05-03: 4/4, 05-04: 4/4, 05-05: 2/2). Substance and wiring checked manually:

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `vitest.config.ts` | resolve.alias @ → ./src | ✓ VERIFIED | 15 lines; alias present; consumed by every `@/` runtime import in tests |
| `src/assets/fonts/*.woff` | Two OFL static instances | ✓ VERIFIED | Magic + byte sizes exact; git-tracked; read by og/route.tsx |
| `src/lib/share-content.ts` | buildShareContent + ShareContent | ✓ VERIFIED | 190 lines, no `new Date`/`.sort(`/`"use client"`; imported by page.tsx and og/route.tsx |
| `src/lib/interest-validation.ts` | interestSchema + InterestInput | ✓ VERIFIED | Imported by actions/interest.ts and tests |
| `tests/share-content.test.ts` | ≥40 lines, PLAT-03 pins | ✓ VERIFIED | 119 lines, 7 `it()` |
| `tests/interest-validation.test.ts` | ≥30 lines, hostile table | ✓ VERIFIED | 66 lines, 8 `it()` |
| `src/app/methodology/page.tsx` | ≥150 lines, nine sections, live table, worked example | ✓ VERIFIED | 260 lines, 9 `<h2>`, `isUserEnterable` ×1, anchor slug ×1, 0 exclamation marks in JSX |
| `tests/methodology-page.test.ts` | ≥40 lines SSR assertions | ✓ VERIFIED | 131 lines, 10 `it()` |
| `src/components/site-footer.tsx` | SiteFooter with methodology link | ✓ VERIFIED | Mounted in layout.tsx |
| `src/components/core-experience.tsx` | methodology link under Bookable now | ✓ VERIFIED | Link present; heading text unchanged, once |
| `src/app/og/route.tsx` | ImageResponse GET, Node runtime, vendored fonts | ✓ VERIFIED | 158 lines; no edge/dynamic exports; OFL attribution comment; `"#c05f33"` exactly once; no `console.`/`className=` |
| `tests/og-route.test.ts` | ≥25 lines, PNG/hostile cases | ✓ VERIFIED | 48 lines, 3 `it()` rendering real PNGs |
| `src/app/layout.tsx` | metadataBase + defaults + SiteFooter mount | ✓ VERIFIED | See truths 13, 17 |
| `src/app/page.tsx` | generateMetadata + AdvisorTease mount | ✓ VERIFIED | `new Date` ×2 (generateMetadata + Home), `buildShareContent` import + call, `url: pageUrl`, `/og?` |
| `src/db/schema.ts` | interestSignups table | ✓ VERIFIED | `pgTable("interest_signups", …)` with unique email, source default, timestamptz created_at; live in Neon (db-check counts it) |
| `src/app/actions/interest.ts` | joinAdvisorWaitlist + InterestState | ✓ VERIFIED | 55 lines, `"use server"` line 1, sole `@/db` importer |
| `src/components/advisor-tease.tsx` | AdvisorTease client form | ✓ VERIFIED | `"use client"` line 1, `h-11` ×2, `aria-live="polite"` ×2, honeypot single-line, no useState/useEffect/new Date |
| `scripts/db-check.ts` | prints `interest_signups rows: N` | ✓ VERIFIED | Executed: prints `interest_signups rows: 1` |

### Key Link Verification

`verify.key-links` reported 4 "failures" that are tool artifacts (double-escaped regex → "Invalid regex pattern"; non-file `from:` values → "Source file not found"). Each was re-checked by hand:

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| share-content.ts | @/engine rankRedemptions | bookableNow[0] never re-sorted | ✓ WIRED | `rankRedemptions({ balances, dataset, asOf }).bookableNow[0]`; 0 `.sort(` |
| share-content.ts | @/lib/format heroDelta + cashOutValueCents | sanctioned formatters | ✓ WIRED | `heroDelta\(\|cashOutValueCents\(` matches 3; `cashOutValueCents` imported from `@/lib/format`, not `@/engine` |
| share-content.ts | balancesToParams | canonical query order | ✓ WIRED | import + call in `toQueryString`; prod og:url/og:image show `ur=…&mr=…` order |
| methodology/page.tsx | @/data programs | isUserEnterable table | ✓ WIRED | `programs.filter(isUserEnterable)` → `<tr>` per program; prod HTML shows seed baselines |
| methodology/page.tsx | @/engine cppX100 | worked ANA example via formatCpp | ✓ WIRED | Implemented as `anchorCpp = cppX100(…)` then `formatCpp(anchorCpp)` — the plan's literal grep `formatCpp(cppX100(` returns 0, but the data path is identical and the SSR test pins the rendered "9.3¢" to `formatCpp(cppX100(…))`. Info-level only |
| core-experience.tsx | /methodology | next/link | ✓ WIRED | Link rendered; prod count confirms |
| og/route.tsx | share-content.ts | `buildShareContent(paramsToBalances(loadBalanceParams(request)))` | ✓ WIRED | Exact chain present; `loadBalanceParams(request)` ×1 |
| page.tsx generateMetadata | share-content.ts | same helper | ✓ WIRED | `buildShareContent({ balances, asOf })` in generateMetadata |
| page.tsx generateMetadata | /og | `openGraph.images[0].url = /og?…` | ✓ WIRED | `imageUrl = share.queryString ? \`/og?${share.queryString}\` : "/og"`; prod tag confirms absolute URL |
| og/route.tsx | src/assets/fonts/*.woff | readFile memoized | ✓ WIRED | `FONT_DIR = join(process.cwd(), "src/assets/fonts")`, `fontsPromise ??=` |
| advisor-tease.tsx | actions/interest.ts | useActionState | ✓ WIRED | `useActionState(joinAdvisorWaitlist, INITIAL)` ×1; `<form action={formAction}>` |
| actions/interest.ts | interest-validation.ts | safeParse before DB | ✓ WIRED | `interestSchema.safeParse` ×1, precedes `db.insert` |
| actions/interest.ts | interest_signups | onConflictDoNothing | ✓ WIRED | Exact `onConflictDoNothing({ target: interestSignups.email })` |
| layout.tsx | site-footer.tsx | import + render | ✓ WIRED | `<SiteFooter />` ×1 inside NuqsAdapter |
| page.tsx | advisor-tease.tsx | import + render | ✓ WIRED | `<AdvisorTease />` ×1 inside `<main>` |
| production HTML head | `https://points-unlocked.vercel.app/og?ur=90000&mr=50000` | og:image absolute | ✓ WIRED | Live curl this session |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| og/route.tsx + page.tsx generateMetadata | `share` | `buildShareContent` → `rankRedemptions` over the `@/data` seed | Yes — prod renders "$12,870" / "ANA First Class to Tokyo via Virgin Atlantic" from the engine, different PNG bytes for `ur=90000` (76,457) vs `hyatt=75000` (78,468) | ✓ FLOWING |
| methodology/page.tsx | `enterablePrograms`, `anchor` | `@/data` programs/redemptions + `cppX100` | Yes — prod shows 0.6¢, 0.5¢, "Pure travel value", and the 9.3¢ example | ✓ FLOWING |
| advisor-tease.tsx | `state` | `joinAdvisorWaitlist` Server Action → Neon `interest_signups` | Yes — table has 1 row from the production submission | ✓ FLOWING |
| site-footer.tsx | (static) | n/a | n/a | ✓ (no dynamic data) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Full test suite green | `npx vitest run` | 15 files, 180 tests passed | ✓ PASS |
| Types | `npm run typecheck` | exit 0 | ✓ PASS |
| Lint | `npm run lint` | exit 0 | ✓ PASS |
| Build at HEAD | (orchestrator-run, corroborated) | `.next/BUILD_ID` timestamp 16:53:16 is after HEAD commit 16:52:43; `.next/server/app/og/route.js` and `methodology.html` present | ✓ PASS |
| Waitlist row exists | `npx tsx scripts/db-check.ts` | `interest_signups rows: 1` | ✓ PASS |
| Share link OG tags | `curl -s "$B/?ur=90000&mr=50000" \| grep -oE '<meta (property="og:…"\|name="twitter:…")…>'` | 12 tags incl. absolute canonical og:image | ✓ PASS |
| OG PNG + CDN cache | `curl -sI "$B/og?ur=90000&mr=50000"` ×2 | 200 image/png; MISS then HIT | ✓ PASS |
| PNG magic | `curl -s "$B/og?ur=90000" \| head -c 4 \| od -c` | `211 P N G` | ✓ PASS |
| Hostile params degrade | `curl -sI "$B/og?ur=-5&mr=abc&zz=1&ur=1e9"` | 200 image/png | ✓ PASS |
| Baseline card | `curl -sI "$B/og"` | 200 image/png | ✓ PASS |
| Methodology live | `curl -s -o /dev/null -w '%{http_code}' "$B/methodology"` | 200, nine h2 headings | ✓ PASS |
| Tease + links on / | `curl -s "$B/?ur=90000"` greps | Coming soon 1, heading 1, email 1, honeypot 1, Notify me 1, href=/methodology 2 | ✓ PASS |
| OG card visual | Rendered `/og?ur=90000&mr=50000` and `/og` PNGs | Branded cream/ink/terracotta cards matching the plan spec | ✓ PASS |
| Secrets gate | `git ls-files \| grep -E '(^\|/)\.env'` | empty | ✓ PASS |
| DB-free client tree | `grep -rlE 'from "@/db\|drizzle' src/components src/app` | exactly `src/app/actions/interest.ts` | ✓ PASS |

### Probe Execution

Step 7c: SKIPPED — no `scripts/*/tests/probe-*.sh` exist and no plan/summary declares a probe script. Not a migration/tooling phase.

### Requirements Coverage

Plans declare: 05-01 [PLAT-03, PLAT-04], 05-02 [VAL-03], 05-03 [PLAT-03], 05-04 [PLAT-04], 05-05 [VAL-03, PLAT-03, PLAT-04]. REQUIREMENTS.md maps exactly VAL-03, PLAT-03, PLAT-04 to Phase 5 — no orphaned requirements.

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| VAL-03 | 05-02, 05-05 | A methodology page explains fare sourcing, taxes/fees treatment, and the dynamic-award-pricing disclaimer | ✓ SATISFIED | Truths 1, 8, 9, 20 |
| PLAT-03 | 05-01, 05-03, 05-05 | Share links render proper OG tags with a branded OG image | ✓ SATISFIED | Truths 2, 5, 6, 10-13, 18 |
| PLAT-04 | 05-01, 05-04, 05-05 | A "coming soon" tease for the v2 AI card-roadmap advisor is present | ✓ SATISFIED | Truths 3, 7, 14-17, 19 |

### Anti-Patterns Found

No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK` markers in any phase-modified file. Matches from the stub-word scan were reviewed and are not stubs:

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| src/components/advisor-tease.tsx | 34, 72 | "Coming soon" / `placeholder="you@example.com"` | ℹ️ Info | The feature's own copy and an input placeholder attribute — intended |
| src/app/page.tsx, src/db/schema.ts | 9, 14 | "placeholder" in comments | ℹ️ Info | Historical comments describing replaced Phase 1 code |
| src/components/core-experience.tsx | 70, 102 | `return null` | ℹ️ Info | Pre-existing Phase 4 storage-degrade paths, untouched by this phase (only a `<Link>` was added) |
| scripts/db-check.ts | 29-30 | `console.log` | ℹ️ Info | The script's intended output |
| src/app/methodology/page.tsx | — | plan grep `formatCpp(cppX100(` = 0 | ℹ️ Info | Split across `anchorCpp`; semantically identical, test-pinned. 05-02-SUMMARY's "executed exactly as written" is slightly overstated on this literal criterion |
| production `/og` | — | `Cache-Control: public, max-age=0` (no `s-maxage`) | ℹ️ Info | Vercel consumes `s-maxage` at the edge; MISS→HIT on identical requests proves the directive was honored. Source header is correct |
| src/app/layout.tsx | — | `grep -c NuqsAdapter` = 3 vs Phase 4 gate's 2 | ℹ️ Info | Prettier split the two-child wrap; one import + one adapter unchanged. Carry-forward to re-express the gate (05-05-SUMMARY) |
| deferred-items.md | — | drizzle-kit push constraint churn on `transfer_bonuses`/`transfer_routes` | ℹ️ Info | Documented out-of-scope quirk; `interest_signups` was created correctly (confirmed by db-check). Phase 6 must address before its next push |

### Human Verification Required

None outstanding. The one item that structurally needs a human — a third-party link-preview inspector against production (ROADMAP SC2) — was executed by the user at the 05-05 `checkpoint:human-verify` (gate=blocking) and approved on 2026-09-03 (LinkedIn Post Inspector, Vercel Open Graph tab, waitlist form incl. idempotent resubmit and invalid-email path, /methodology walkthrough). The verifier independently corroborated everything the inspector would fetch (tags, PNG bytes, PNG appearance) in this session.

### Gaps Summary

No gaps. All three ROADMAP success criteria and all 17 additional plan-level truths hold in the codebase and on the deployed product. The phase goal is achieved: the valuations are explained on a live, engine-sourced methodology page linked from results and footer; a share link carries a complete OG/Twitter tag set pointing at a cached, branded, balance-aware card; and the v2 advisor tease captures interest into Neon through a validated, honeypot-guarded Server Action that is the only DB importer in the app tree.

---

_Verified: 2026-09-03T21:00:00Z_
_Verifier: Claude (gsd-verifier)_
