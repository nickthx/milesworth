---
phase: 07-editorial-polish-launch
verified: 2026-09-22T05:15:00Z
status: passed
score: 38/41 must-haves verified (3 accepted by override — same root cause)
overrides_applied: 1
overrides:
  - must_have: "Lighthouse mobile scores are launch-worthy — performance error floor 0.80 on all four routes"
    reason: "Production perf 0.77 (/) and 0.75 (/?ur) accepted for launch; a11y/SEO 1.00 and the real-device pass carry the production-quality bar; cause is Next client chunks + Clerk UI bundle, scheduled for v1.1 bundle work. config/lighthouserc.cjs categories:performance demoted to warn with a dated comment."
    accepted_by: "nick"
    accepted_at: "2026-09-22T05:30:00Z"
gaps_accepted:
  - truth: "Lighthouse mobile scores are launch-worthy — the phase's own gate (config/lighthouserc.cjs, categories:performance error at minScore 0.80 median) passes on all four production routes"
    status: failed
    reason: "Final production run (07-10, 2026-09-22, median of 3): performance 0.77 on / and 0.75 on /?ur=90000&mr=50000 against the committed 0.80 error floor; npm run lighthouse exits 1. a11y 1.00 x4 and SEO 1.00 x4 pass as errors. 07-07 and 07-10 both recorded this as 'open gap for verify-work 7' — a deferred decision, not an accepted deviation. ROADMAP wording ('launch-worthy') is not numeric; the only concrete definition of the bar in the repo is the committed config, and the 07-07 PLAN must_have set it at perf >= 0.85. Neither is met on the two routes a recruiter actually lands on."
    artifacts:
      - path: "config/lighthouserc.cjs"
        issue: "Asserts a performance floor (0.80, error) that production does not meet; the gate is red by default so a real a11y/SEO regression is indistinguishable from known noise (07-REVIEW WR-03)"
      - path: "src/components/core-experience.tsx"
        issue: "Candidate remediation named by 07-07 (first-party client chunks ~121 KB + 65 KB on /) — untouched; not in any Phase 7 plan's file list"
      - path: "src/components/site-header.tsx"
        issue: "Candidate remediation named by 07-07 plan branch (c) (defer Clerk UserButton/@clerk/ui until interaction) — evaluated and not applied because it alone cannot reach 0.80"
    missing:
      - "EITHER lift / and /?ur to a 0.80 median (trim the first-party client bundle on /, defer Clerk's prebuilt UI until interaction) and re-run npm run lighthouse to exit 0"
      - "OR record the decision: demote categories:performance to warn (or set per-URL thresholds via matchingUrlPattern at median - 0.03 = 0.72/0.74) with a dated comment naming the plan that re-promotes it, and add an override entry to this file's frontmatter so the gap is accepted, not silently carried"
human_verification:
  - test: "On the iPhone inside the LinkedIn app, open https://milesworth.vercel.app/?ur=90000&mr=50000, edit a balance, tap 'Copy my link', then paste into a LinkedIn DM or Notes"
    expected: "Either the button swaps to 'Link copied' for ~2 s or the read-only 'Your link' field appears pre-selected. The pasted URL is https://milesworth.vercel.app/?ur=…&mr=…(&hyatt=…) with ONLY the short balance keys — no __clerk_db_jwt, no utm_, no hash"
    why_human: "07-07 device pass step 5 was not reported (Nick confirmed step 4 and approved overall). The T-07-02 real-world guarantee currently rests on unit tests (tests/share-url.test.ts) and the source-scan gate, not on a WebView observation. Clipboard permission behaviour in LinkedIn's WKWebView cannot be exercised from a desktop"
---

# Phase 7: Editorial Polish & Launch Verification Report

**Phase Goal:** The app earns the "production quality" bar on the device that matters — a recruiter's phone inside LinkedIn's browser
**Verified:** 2026-09-22T05:15:00Z
**Status:** passed (1 override — perf floor accepted by Nick 2026-09-22, see frontmatter)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Must-haves are the three ROADMAP Success Criteria (the contract) merged with the 38 PLAN-frontmatter truths across 07-01..07-10. Evidence is from grep/file checks, the test suite, a read-only Neon count, and live curl probes against production run in this session — not from SUMMARY text.

#### ROADMAP Success Criteria

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| SC1 | Editorial travel design system (light, magazine-like, destination imagery, big numbers) is applied consistently across all pages | ✓ VERIFIED | `src/lib/brand.ts` exports CREAM/INK/TERRACOTTA `#b25429`; `globals.css` carries identical hex + `--text-heading: 1.75rem` + `@utility pb-safe` + `color-scheme: light`; `tests/design-system-gate.test.ts` imports `../src/lib/brand` and pins CSS/TS equality. Type sweep: `text-[1.75rem]` = 0 and `\btext-lg\b` = 0 under `src`; `text-heading` used in 13 files across `/`, `/account`, `/methodology`, `/privacy`, header, cards, dialogs. 20 committed WebPs (all <= 204800 B), 20 manifest imports, every seed `imageSlug` has a file. Live: `/?ur=90000&mr=50000` serves 13 distinct `/_next/image?url=…webp` and 18 `text-heading` occurrences; `theme-color #faf7f2`; footer `Photos via Unsplash` = 1. |
| SC2 | The full flow works in LinkedIn's in-app browser and on small screens, verified by a real-device pass | ✓ VERIFIED | Real-device pass: Nick approved the ten-step script on iPhone inside the LinkedIn app 2026-09-21 (07-07), and the launch DM unfurl + in-app open 2026-09-22 ("launch verified", 07-10). Code pins: `layout.tsx` `viewport = { width: device-width, initialScale: 1, viewportFit: "cover", themeColor: CREAM }` with no `maximumScale`/`userScalable`; live `viewport-fit=cover` present; header/footer links `inline-flex min-h-11` / `h-11`; `target="_blank"` = 0 under `src`; `share-link.tsx` catches clipboard rejection → `readOnly` `Input#share-link-fallback`; `save-balances-button.tsx` renders the D7-02 hint via `isLinkedInInAppBrowser(navigator.userAgent)` through `useSyncExternalStore`; Lighthouse a11y 1.00 x4 (tap-targets/contrast clean). One step (Copy my link on device) uncaptured → human item, does not negate the approved pass. |
| SC3 | Lighthouse mobile scores are launch-worthy and the dataset has reached its launch size with all entries Nick-verified | ✗ FAILED (partial) | **Dataset half — met:** D7-03 fixes N=34; seed files hold 36 entries / 34 `verifiedAt` non-null / 2 `null` drafts (the third `verifiedAt: null` grep hit is a header comment); `tests/seed-data.test.ts:167` floor `toBeGreaterThanOrEqual(34)`; `src/engine/ranking.ts:116` drops `verifiedAt === null` fail-closed; `core-experience.tsx:101` and `result-card.tsx:156` re-guard; all 8 featured carry `verifiedAt: "2026-09-21"`; Neon read-only count this session: `{"total":"36","verified":"34","bonuses":"5"}`. **Lighthouse half — not met:** committed gate `categories:performance: ["error", { minScore: 0.8, aggregationMethod: "median" }]`; production medians `/` 0.77, `/?ur` 0.75 (07-10 final run, identical to 07-07 baseline); `npm run lighthouse` exits 1. a11y 1.00 x4 and SEO 1.00 x4 pass as errors; best-practices 0.79 x4 is `warn` by orchestrator ruling (Clerk dev-instance Cloudflare cookies, D7-01 b). The roadmap does not define "launch-worthy" numerically; the phase's own config and the 07-07 PLAN truth (perf >= 0.85) do, and both are failed on the two routes the launch link opens. Recorded by 07-07 and 07-10 as an open gap for this verification with no accepting ruling. |

#### PLAN must_haves (by plan)

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 01.1 | Three Wave 0 decisions recorded as literal values read by later plans | ✓ VERIFIED | 07-01-SUMMARY `## Wave 0 Decisions` block: `D7-01: b`, `domain: none`, `D7-02: b`, `providers: google`, `D7-03: N=34`, `batch1=0`, `batch2=0`, `android_device: no`; 07-05/06/08/10 SUMMARYs cite the keys and act on them (07-10 Task 1 skipped, 07-06/08 zero-draft path, 07-05 hint rendered) |
| 01.2 | Dev packages installed only after human legitimacy gate | ✓ VERIFIED | `package.json` devDependencies exact pins `@lhci/cli 0.15.1`, `lighthouse 13.4.1`, `sharp 0.35.4` (no caret); gate reply "packages verified" + `npm view` re-check recorded; commits `775787f` (decisions) precede `55ab0a8` (install) |
| 01.3 | `npm run lighthouse` → committed config, 4 production HTML URLs x 3 runs | ✓ VERIFIED | `package.json:15` `lhci autorun --config=config/lighthouserc.cjs`; config `url: [/, /?ur=90000&mr=50000, /methodology, /privacy]` on `LHCI_BASE_URL ?? https://milesworth.vercel.app`, `numberOfRuns: 3`, none `/og`; SEO was warn at 07-01 and is now `error` post-flip (intended sequencing) |
| 02.1 | Brand colors once in TS, CSS carries identical hex, enforced by test | ✓ VERIFIED | `brand.ts:12,15,18` vs `globals.css:42-44` identical; gate imports `../src/lib/brand` (line 6) |
| 02.2 | 28px `text-heading` token exists | ✓ VERIFIED | `globals.css:46-47` `--text-heading: 1.75rem` / `--line-height: 1.2`; consumed in 13 files |
| 02.3 | shadcn neutrals ink-derived, no achromatic oklch, `.dark` block gone | ✓ VERIFIED | only `oklch(` under `:root` is `--destructive` (line 79); `.dark` appears only in `@custom-variant dark` (line 5) |
| 02.4 | Vendored primitives use 400/600 only, inputs never below 16px | ✓ VERIFIED | `grep font-medium\|md:text-sm src/components/ui/{button,card,dialog,input,label}.tsx` = 0 |
| 02.5 | `/og` reads colors from brand.ts, renders `#b25429` | ✓ VERIFIED | `og/route.tsx:6` `import { CREAM, INK, TERRACOTTA } from "@/lib/brand"`; no 6-digit hex literal in file; live `/og` CDN HIT (07-10 probe 7) |
| 03.1 | Every seed imageSlug has a committed 1600x1067 WebP <= 200 KB + manifest entry with alt + credit | ✓ VERIFIED | 20 WebPs; 20 seed slugs; per-slug file check: no missing; size check: none over 204800 B; `tests/image-manifest.test.ts` (readFileSync/readdirSync, never imports manifest) green |
| 03.2 | Images sourced once, metadata stripped, never referenced by URL/path at runtime | ✓ VERIFIED | `scripts/optimize-images.ts:58` `position: "attention"`, no `withMetadata`; manifest is static imports only; `getDestinationImage` returns null on unknown slug (`destinations.ts:166-172`) |
| 03.3 | DB-free test fails CI on slug/file/manifest mismatch | ✓ VERIFIED | test asserts all three directions; delete-and-restore check recorded; suite green |
| 03.4 | Nick reviewed all 20 photos against UI-SPEC | ✓ VERIFIED | "photos approved" 2026-09-21 recorded in 07-03 with per-slug caveat table (human checkpoint, accepted as recorded) |
| 04.1 | Every heading uses `text-heading`; no `text-[1.75rem]`, no `text-lg` under src | ✓ VERIFIED | grep counts 0 / 0; gate self-tests its regex; mutation check recorded |
| 04.2 | Header/footer links 44px, footer safe-area, Unsplash credit | ✓ VERIFIED | `site-footer.tsx:14` `pb-safe`, `:24,:30` `min-h-11`, `:36` `Photos via Unsplash`; `site-header.tsx:41` `h-11`, `:50` `min-h-11` |
| 04.3 | `/privacy` has no `target=_blank` | ✓ VERIFIED | 0 matches under src |
| 04.4 | not-found + /account loading render in the editorial shell with locked copy | ✓ VERIFIED | `not-found.tsx:21` "Page not found" (imports only `next/link`); `account/loading.tsx:23` "Loading your account…" (no imports); live `/nowhere` → 404 + "Page not found" = 1 |
| 05.1 | Copy my link copies `SITE_URL` + canonical short-key query, never `location.href` | ✓ VERIFIED | `share-link.tsx:56` `writeText(shareUrl(balances))`; `share-url.ts:31-33` builds from `SITE_URL` + `balancesToParams`; `window.location`/`location.href` = 0 under src; `tests/share-url.test.ts` hostile-key case |
| 05.2 | Clipboard absent/denied → read-only pre-selected field | ✓ VERIFIED | `share-link.tsx:62` `setFallbackUrl(url)` in catch; `:82-99` `readOnly` Input `#share-link-fallback`, focus effect, copy "Couldn't reach the clipboard…". (WR-02: value captured once, can go stale — warning, not a stub) |
| 05.3 | Document declares `viewport-fit=cover`, cream `theme-color`, never disables zoom | ✓ VERIFIED | `layout.tsx:75-77`; no `maximumScale`/`userScalable`; live meta confirmed |
| 05.4 | Bookable-now cards + teaser lead with destination photo (blur, lazy, 3:2) | ✓ VERIFIED | `result-card.tsx:84-94` `getDestinationImage(redemption.imageSlug)` → `<Image placeholder="blur" sizes=… className="aspect-[3/2]…">`; `core-experience.tsx:313,327-330` teaser same; `almost-there.tsx` has no `<Image>` (type-only, as specified); live page serves 13 WebPs |
| 05.5 | LinkedIn in-app detection is a tested pure helper; per D7-02 renders the hint | ✓ VERIFIED | `in-app-browser.ts:10-11` pure; `tests/in-app-browser.test.ts` 5 cases; `save-balances-button.tsx:58,88,108-109` |
| 05.6 | Footer credit names exactly the manifest sources | ✓ VERIFIED | manifest: 20 x `source: "Unsplash"`, 0 Pexels; footer "Photos via Unsplash" |
| 06.1 | Batch 1 = min(20, N-34) = 0; only Nick-confirmed entries carry `verifiedAt` | ✓ VERIFIED | zero drafts added; 34 non-null `verifiedAt`, 2 null; no `verifiedAt` set in 07-06 (commit `2d6ac53` is test/comment/docs) |
| 06.2 | Held drafts have a ruling | ✓ VERIFIED | `redemptions-hotels.ts:6-8` header records "keep as drafts" 2026-09-21; both remain `verifiedAt: null` (lines 330, 378); ruling logged in `02-05-corrections.md` |
| 06.3 | Every new destination has WebP + manifest before drafting | ✓ VERIFIED | vacuously (no new destinations); image-manifest test green |
| 06.4 | CI floor = verified count; Neon mirrors seed | ✓ VERIFIED | floor 34 = 34 verified; Neon 36/34 (read-only count this session) |
| 07.1 | Lighthouse baseline recorded with perf >= 0.85 (/) and a11y/best-practices >= 0.95 passing as errors, SEO warn | ✗ FAILED | Baseline recorded (07-07 table, reproduced 07-10). a11y 1.00 passes. **perf 0.77 / 0.75 < 0.85 (plan) and < 0.80 (config floor)** — open gap. best-practices 0.79 demoted to `warn` by orchestrator ruling 2026-09-22 (documented deviation with dated config comment; cause external under D7-01 b) — accepted as intentional, not counted as a second gap. SEO is now `error` (post-flip), which supersedes the "warn" wording. |
| 07.2 | Real iPhone inside LinkedIn completed the full flow and Nick approved | ✓ VERIFIED | Approved 2026-09-21; step 4 (URL updates on edit) explicitly confirmed; step 5 (Copy my link path + pasted URL) not reported → human item below |
| 08.1 | Verified count >= N and CI floor = N | ✓ VERIFIED | 34 >= 34; `seed-data.test.ts:167` floor 34 with launch-floor comment |
| 08.2 | Featured 8 + dated Hilton bonus re-checked in launch week | ✓ VERIFIED | 8 x `verifiedAt: "2026-09-21"` on featured entries; `transfers.ts` 5 `bonusPercent` rows (Hilton + 4 added); ranking tests adapted (`rankBase()`), suite green |
| 08.3 | Neon holds the repo's verified set; stale bookkeeping corrected | ✓ VERIFIED | Neon 36/34/5 matches seed; `REQUIREMENTS.md:30-32` DATA-02/03/04 `[x]`, DATA-01 annotated "N=34 per D7-03; 80–120 target carried forward"; ROADMAP Phase 2/3 rows Complete |
| 09.1 | `/account` noindex at route level; robots disallows it; sitemap lists only /, /methodology, /privacy | ✓ VERIFIED | `account/page.tsx:37` `robots: { index: false, follow: false }`; `robots.ts:14-15`; `sitemap.ts:15-17`; **live** robots.txt and sitemap.xml match exactly; live `/account` meta `noindex, nofollow` |
| 09.2 | Site-wide noindex gone; SEO asserted as error | ✓ VERIFIED | `layout.tsx` noindex/index:false = 0; config `categories:seo: ["error", 0.9]`; live `/` and `/methodology` noindex = 0; production SEO 1.00 x4 |
| 09.3 | Branded Fraunces M icon; no scaffold leftovers | ✓ VERIFIED | `icon.tsx` + `apple-icon.tsx` use `ImageResponse` + `@/lib/brand`; `public/` and `src/app/favicon.ico` absent; README 49 lines, no `create-next-app`/`Geist`; live `rel="icon" … /icon?… image/png 32x32` |
| 09.4 | Launch-gate test pins all of the above | ✓ VERIFIED | `tests/launch-gate.test.ts` (33 assertions) green in the 390-test run |
| 10.1 | Production serves robots/sitemap, `/` no noindex, `/account` noindex, icon + OG resolve, og:url host = live origin | ✓ VERIFIED | All reproduced by curl this session: robots 200 with `Disallow: /account`; 3 `<loc>`; `/` noindex 0; `/account` `noindex, nofollow`; icon link present; `og:url content="https://milesworth.vercel.app/?ur=90000&mr=50000"`; 404 on `/nowhere` with "Page not found" |
| 10.2 | The Lighthouse gate passes with SEO as an error on the live origin | ✗ FAILED (partial) | SEO passes as error (1.00 x4) — the flip objective is proven. But "the gate passes" is false: `npm run lighthouse` exits 1 on the performance assertion for `/` and `/?ur`. Same root cause as SC3 / 07.1. |
| 10.3 | Post Inspector shows the fresh OG card and the phone opens it inside LinkedIn | ✓ VERIFIED | "launch verified" 2026-09-22 (Nick); fresh scrape, DM unfurl matched, in-app open OK; "Development mode" badge check N/A under D7-01 b; OG softness noted as a v1.1 candidate (LinkedIn re-encode, native PNG crisp) |

**Score:** 38/41 truths verified (3 failed, all one root cause: production performance below the committed 0.80 floor on `/` and `/?ur`)

### Required Artifacts

All 29 artifacts declared across the ten PLAN frontmatters pass `gsd-sdk query verify.artifacts` (exists + contains/exports/min_lines). Level 3/4 checked manually for the ones that carry behaviour:

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `config/lighthouserc.cjs` | 4 URLs x 3 runs, median perf, dated thresholds | ✓ VERIFIED (config) / ⚠️ gate red | Wired via `package.json` script; asserts a floor production fails (see gap) |
| `src/lib/brand.ts` | CREAM/INK/TERRACOTTA | ✓ VERIFIED | Imported by `og/route.tsx`, `icon.tsx`, `apple-icon.tsx`, `layout.tsx`, gate test |
| `src/app/globals.css` | tokens, pb-safe, warm neutrals | ✓ VERIFIED | `pb-safe` consumed by footer; `text-heading` by 13 files |
| `src/images/destinations.ts` + 20 WebPs | typed manifest | ✓ VERIFIED | `getDestinationImage` called in `result-card.tsx:84`, `core-experience.tsx:313`; live page serves the WebPs (data flowing) |
| `scripts/optimize-images.ts` | sharp pipeline | ✓ VERIFIED | Wired via `npm run images:optimize`; slug regex + attention crop present |
| `src/lib/share-url.ts` | `toShareQuery`, `shareUrl` | ✓ VERIFIED | Consumed by `share-link.tsx:10` and `share-content.ts` |
| `src/lib/in-app-browser.ts` | `isLinkedInInAppBrowser` | ✓ VERIFIED | Consumed by `save-balances-button.tsx:16,58` |
| `src/components/share-link.tsx` | CTA + fallback | ✓ VERIFIED | Mounted at `core-experience.tsx:235` wrapping `SaveBalancesButton` |
| `src/app/layout.tsx` | viewport export | ✓ VERIFIED | Live meta confirms |
| `src/components/result-card.tsx` | leading `<Image>` | ✓ VERIFIED | `placeholder="blur"`, `sizes`, 3:2 |
| `src/app/not-found.tsx`, `src/app/account/loading.tsx` | designed states | ✓ VERIFIED | Live 404 confirmed |
| `src/components/site-footer.tsx` | pb-safe, min-h-11, credit | ✓ VERIFIED | Live credit string present |
| `src/data/redemptions.ts` + split files | 36/34 dataset | ✓ VERIFIED | Barrel `satisfies RedemptionSeed[]`; Neon mirrors |
| `src/data/transfers.ts` | 5 bonuses | ✓ VERIFIED | Neon `transfer_bonuses` = 5 |
| `src/app/robots.ts`, `sitemap.ts`, `icon.tsx`, `apple-icon.tsx` | launch flip | ✓ VERIFIED | All live |
| `README.md` | recruiter-facing, >= 40 lines | ✓ VERIFIED | 49 lines |
| `tests/design-system-gate.test.ts`, `image-manifest.test.ts`, `share-url.test.ts`, `in-app-browser.test.ts`, `launch-gate.test.ts`, `seed-data.test.ts` | gates | ✓ VERIFIED | All in the 25-file / 390-test green run |
| `.planning/phases/…/07-10-SUMMARY.md` | probe transcript, Lighthouse table, launch URL | ✓ VERIFIED | Contains `robots.txt`; transcript independently reproduced |

### Key Link Verification

`gsd-sdk query verify.key-links` could not evaluate 20 of 22 links (non-file `from` values such as "Nick (human checkpoint)" / "origin/main", or the plans' double-escaped regex patterns). Each was verified manually:

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| 07-01-SUMMARY Wave 0 keys | 07-05/06/08/10 actions | `D7-0[123]` read verbatim | ✓ WIRED | Each downstream SUMMARY quotes the key and takes the matching branch |
| `package.json` scripts.lighthouse | `config/lighthouserc.cjs` | `--config` | ✓ WIRED | line 15 |
| gate test | `brand.ts` + `globals.css` | import + hex assert | ✓ WIRED | gate line 6 |
| `og/route.tsx` | `brand.ts` | `from "@/lib/brand"` | ✓ WIRED | line 6 |
| seed `imageSlug` | `destinations/<slug>.webp` | manifest static imports | ✓ WIRED | 20/20 slugs resolve to files |
| image-manifest test | manifest source text + dir | `readdirSync` | ✓ WIRED | line 8, 19 |
| `site-footer.tsx` | `@utility pb-safe` | class | ✓ WIRED | line 14 |
| heading class strings | `--text-heading` | `text-heading` | ✓ WIRED | 13 files |
| `share-link.tsx` | `share-url.ts` | `writeText(shareUrl(` | ✓ WIRED | line 56 |
| `result-card.tsx` | `destinations.ts` | `getDestinationImage(` | ✓ WIRED | line 84 |
| `layout.tsx` | `brand.ts` | `themeColor: CREAM` | ✓ WIRED | line 77 |
| Nick checkpoint | seed files | `verifiedAt` as git event | ✓ WIRED | `a0fba1f`, `2d6ac53` exist; dates match rulings |
| seed files | Neon | `db:seed` | ✓ WIRED | read-only count 36/34/5 |
| origin/main | milesworth.vercel.app | push → Vercel | ✓ WIRED | live build serves 07-09 routes; deployed SHA `5e7f692` recorded |
| `npm run lighthouse` | production | `collect.url` | ✓ WIRED | BASE default is the live host |
| `robots.ts` | `site.ts SITE_URL` | template | ✓ WIRED | line 15 |
| `account/page.tsx` robots | `layout.tsx` (no robots) | route-level replaces site-wide | ✓ WIRED | page line 37 present; layout 0 matches |
| `SITE_URL` | og:url, robots sitemap, share link | `site.ts` single source | ✓ WIRED | live og:url and Sitemap line both on the host |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `result-card.tsx` | `art` (image/alt/credit) | `getDestinationImage(redemption.imageSlug)` → static import | Yes — 13 WebP URLs in live HTML | ✓ FLOWING |
| `core-experience.tsx` teaser | `featuredTeaser` | `redemptions.find(featured && verifiedAt !== null)` | Yes — ANA Tokyo entry verified 2026-09-21 | ✓ FLOWING |
| `share-link.tsx` | `shareUrl(balances)` | `SITE_URL` + `balancesToParams` | Yes — live og:url shows canonical query | ✓ FLOWING |
| ranked results | `verifiedAt` filter | `src/engine/ranking.ts:116` | Yes — Neon/seed 34 verified rows | ✓ FLOWING |
| `robots.ts` / `sitemap.ts` | `SITE_URL` | `site.ts` constant/env | Yes — live output on host | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Full test suite (gates included) | `npx vitest run` | 25 files, 390/390 passed | ✓ PASS |
| Typecheck | `npm run typecheck` | exit 0 | ✓ PASS |
| Lint | `npm run lint` | exit 0 | ✓ PASS |
| Neon mirrors seed | read-only SQL count (scratchpad script, prints counts only) | `{"total":"36","verified":"34","bonuses":"5"}` | ✓ PASS |
| Production launch surfaces | `curl` robots.txt, sitemap.xml, `/`, `/?ur…`, `/methodology`, `/account`, `/nowhere` | All nine 07-10 probe expectations reproduced | ✓ PASS |
| Lighthouse gate | not re-run (needs local headless Chrome + ~3 min) — 07-10's 2026-09-22 run is the evidence | exit 1 (perf on 2 routes) | ✗ FAIL (gap) |

### Probe Execution

No `scripts/*/tests/probe-*.sh` files exist and no PLAN declares shell probes; the phase's "probes" are curl commands in 07-10, which were re-executed above. Step 7c: no MISSING_PROBE.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| PLAT-02 | 07-01, 04, 05, 07, 09, 10 | Fully responsive; works in the LinkedIn in-app browser (mobile WebView tested before launch) | ✓ SATISFIED | SC2 evidence; real-device pass approved twice; a11y 1.00; WebView pins in gate. `REQUIREMENTS.md:44` checkbox still `[ ]` — orchestrator bookkeeping, not a code gap |
| PLAT-05 | 07-01, 02, 03, 04, 05, 06, 08, 09, 10 | Editorial travel design system applied across all pages | ✓ SATISFIED | SC1 evidence. `REQUIREMENTS.md:47` checkbox still `[ ]` — same note |
| DATA-04 | 07-06, 07-08 | Content verified by Nick before launch; no unverified entry ships | ✓ SATISFIED | 34 verified; drafts filtered fail-closed; `[x]` at line 32 |
| DATA-01 | 07-06, 07-08 | 80–120 curated redemptions | ⚠️ PARTIAL (by decision) | N=34 per D7-03; line 29 annotated "launch size N=34; 80–120 target carried forward". Phase 2 requirement, not a Phase 7 success criterion; recorded, not hidden |

Orphaned requirements: none — `REQUIREMENTS.md:83` maps exactly PLAT-02 and PLAT-05 to Phase 7 and both are claimed by plans.

### Anti-Patterns Found

Scanned the 46 files in 07-REVIEW's `files_reviewed_list` plus README.

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | `TBD` / `FIXME` / `XXX` / `TODO` / `HACK` / `PLACEHOLDER` | none found | No debt-marker blockers |
| `config/lighthouserc.cjs` | 49-52 | Error assertion documented in its own comment as failing on production | ⚠️ Warning (WR-03) | Gate is red by default; regressions in a11y/SEO would be masked |
| `src/lib/site.ts` | 13-22 | `SITE_URL` unnormalized (trailing slash / empty env) | ⚠️ Warning (WR-01) | Only bites on the custom-domain cut-over (not taken under D7-01 b) |
| `src/components/share-link.tsx` | 37, 62, 94 | `fallbackUrl` captured once; stale if balances change after the field appears | ⚠️ Warning (WR-02) | Fallback path only; clipboard path always canonical |
| `package.json` / `node_modules` | — | `lighthouse@13.4.1` pinned at root but `@lhci/cli` runs its nested `lighthouse@12.6.1` | ℹ️ Info | Root pin is inert for `npm run lighthouse`; 07-07's "13.4.1" label was wrong; both baselines ran on 12.6.1 so the comparison is like-for-like |
| built CSS | — | dead `.text-lg` rule emitted from non-`src` class-like strings | ℹ️ Info (07-04 deferred) | Bytes only; no rendered size |
| `src/components/advisor-tease.tsx`, `src/app/privacy/page.tsx` | 58, 78 | "Coming soon" | ℹ️ Info | PLAT-04 product copy, pre-existing and intentional — not a stub |
| `return null` / `() => {}` sites | various | early-return guards, `useSyncExternalStore` no-op subscribe, unknown-slug guard | ℹ️ Info | Inspected; none are stubs |

Files under 500 lines: yes (largest `redemptions-hotels.ts` 383).

### Human Verification Required

### 1. Copy my link inside LinkedIn's in-app browser (07-07 step 5)

**Test:** On the iPhone, open the launch DM link inside the LinkedIn app, change one balance, tap "Copy my link", then paste into a DM or Notes.
**Expected:** Either "Link copied" appears for ~2 s, or the read-only "Your link" field appears pre-selected. The pasted URL is `https://milesworth.vercel.app/?ur=…&mr=…` with only the short balance keys — no `__clerk_db_jwt`, no `utm_`, no `#`.
**Why human:** Nick's device pass approved the flow overall and confirmed step 4, but did not report what step 5 did. Clipboard permission behaviour in LinkedIn's WKWebView cannot be exercised from a desktop; the guarantee currently rests on unit tests and the source-scan gate.

### Gaps Summary

One gap, one root cause. Everything the phase set out to build exists, is substantive, is wired, and is live: the editorial design system is applied and CI-pinned; 20 destination photos ship through a typed manifest and render on the results page; the share link is canonical with a WebView clipboard fallback; the launch flip (robots, sitemap, route-level noindex, branded icons) is verified on production by this session's own probes; the dataset is at its ruled launch size (N=34) with every visible entry Nick-verified in launch week and Neon mirroring the repo; the full suite, typecheck and lint are green; and Nick completed the real-device pass inside the LinkedIn app twice.

What is not met is the Lighthouse half of Success Criterion 3. The roadmap says "launch-worthy" without a number; the phase itself put a number on it — `categories:performance` as an `error` at 0.80 median in `config/lighthouserc.cjs`, and 0.85 in the 07-07 PLAN — and production scores 0.77 on `/` and 0.75 on `/?ur=90000&mr=50000`, the two routes the launch link opens. `npm run lighthouse` exits 1. Accessibility (1.00 x4) and SEO (1.00 x4) do pass as errors, and best-practices was demoted to warn by an explicit orchestrator ruling with a documented external cause; performance received no such ruling. 07-07 and 07-10 both wrote "open gap for verify-work 7", which is a request for a decision, not a decision. It is therefore reported as a gap rather than absorbed.

**This may be an acceptable deviation.** The cause is diagnosed (simulated slow-4G LCP dominated by ~370 KB of first-party Next chunks + Clerk UI; LCP element is the `<h1>`, fonts preloaded, CLS 0.012), observed unthrottled LCP is 547 ms, and the device pass found no perceived slowness. If Nick accepts 0.77/0.75 for launch, add to this file's frontmatter and demote the config assertion to `warn` with a dated comment so the gate stops being red by default (07-REVIEW WR-03):

```yaml
overrides:
  - must_have: "Lighthouse mobile scores are launch-worthy — performance error floor 0.80 on all four routes"
    reason: "Production perf 0.77 (/) and 0.75 (/?ur) accepted for launch; a11y/SEO 1.00 and the real-device pass carry the production-quality bar; cause is Next client chunks + Clerk UI bundle, scheduled for v1.1 bundle work"
    accepted_by: "nick"
    accepted_at: "2026-09-22T00:00:00Z"
```

Otherwise the closure plan is bundle work on `/`: trim the first-party client chunks (121 KB + 65 KB) and/or defer Clerk's prebuilt UI until interaction, then re-run `npm run lighthouse` to exit 0.

---

_Verified: 2026-09-22T05:15:00Z_
_Verifier: Claude (gsd-verifier)_
