# Phase 5: Credibility Layer - Research

**Researched:** 2026-09-02
**Domain:** Next.js 16 App Router — methodology page (static RSC), Open Graph metadata + `next/og` ImageResponse share cards, v2-advisor tease with a server-action interest capture on Neon/Drizzle
**Confidence:** HIGH for framework mechanics and codebase facts (every load-bearing claim was executed or read from official 16.3.4 docs this session); MEDIUM for third-party social-platform behaviors (LinkedIn/Slack/iMessage unfurl rules)

## Summary

Phase 5 adds three thin surfaces on top of a finished guest flow. Nothing new is invented: the numbers the methodology page must defend already exist as documented integer functions in `src/engine/valuation.ts` and `src/engine/paths.ts` (TPG cpp, per-program cash-out baselines, wow delta, increment/block-bonus/promo transfer math, conservative `pointsMax` gating), the balances already live in the URL via the `loadBalanceParams` nuqs loader, and `next/og`'s `ImageResponse` is bundled inside the installed Next 16.3.4 (`node_modules/next/dist/compiled/@vercel/og`). **This phase installs zero npm packages.** The only new asset is two vendored static font files (Fraunces 600 + Inter 400, OFL) so the share card uses the design system's type without a runtime network dependency.

Three findings shape the plan. (1) The `opengraph-image.tsx` file convention receives only `params` — **never `searchParams`** — so a balance-aware share card must be a Route Handler (`src/app/og/route.tsx`) that reads the request URL, and the results page's `generateMetadata` must point `og:image` at `/og?<same params>`. `[VERIFIED: nextjs.org opengraph-image reference, v16.3.4]` (2) `ImageResponse` works under plain Node with a vendored `.woff`/`.ttf` (proved in this session: 1200x630 PNG in ~2.8s including process start, custom `Cache-Control` honored), which means the OG route is unit-testable in the existing vitest node environment — no dev server, no Playwright. (3) The existing `vitest.config.ts` has no `@/` alias; every unit-tested module today only uses `@/` for type-only imports. Phase 5's share-content helper needs runtime `@/data` + `@/engine`, so Wave 0 adds `resolve.alias` (verified working with a throwaway config this session).

The methodology page should be a plain TSX server component at `src/app/methodology/page.tsx` — not MDX (would require `@next/mdx` + config for one page) — that **renders live values from `@/data` and `@/engine`** (the baseline table from `programs`, a worked ANA example computed with `cppX100()`), so the prose can never drift from the engine. The v2 tease should be a section on `/` below the results with a one-field email capture backed by a Server Action writing to a new `interest_signups` table (schema change + `drizzle-kit push`), which is the lightest option that yields a real, followable interest signal without Clerk (Phase 6).

**Primary recommendation:** Ship four things — `src/app/methodology/page.tsx` (static RSC rendering engine-sourced numbers, linked from the results header and a new site footer), `generateMetadata` on `/` + `metadataBase` in the layout, `src/app/og/route.tsx` (branded 1200x630 card, balance-aware when params exist, baseline otherwise, `s-maxage` cached), and an `AdvisorTease` section with a Server Action into `interest_signups`. Verify unfurls against the **production** URL with LinkedIn Post Inspector and the Vercel deployment's Open Graph tab.

## User Constraints

No CONTEXT.md exists for this phase (user chose to plan from research + requirements). Binding constraints come from ROADMAP success criteria, REQUIREMENTS.md, CLAUDE.md (below), the 04-UI-SPEC design contract, and ratified prior-phase decisions:

- **04-UI-SPEC is the design contract for Phase 5 pages** (no new UI-SPEC): Fraunces (`font-display`/`font-heading`) + Inter; cream/ink/terracotta tokens only; terracotta reserved for wow-delta figures, the primary CTA, and the bonus badge; 400/600 weights; spacing scale in multiples of 4; 44px touch targets; copy voice "confident, concrete, second person — no exclamation marks."
- **Engine is sealed and pure** (STATE.md; `tests/engine-purity.test.ts`): the methodology page and OG route *consume* `@/engine` and `@/data`; they never re-implement math. UI-side arithmetic stays inside `src/lib/format.ts` helpers.
- **Guest flow is DB-free by grep gate** (04-04): no `@/db`/`drizzle` import reachable from `src/components/**` or `src/app/page.tsx`. The Server Action must live outside those paths (`src/app/actions/`).
- **`asOf` discipline** (Pitfall 7, Phase 4): the client island never reads the clock; server-only code (page, `generateMetadata`, `/og`) may derive `asOf` per request.
- **Phase 2 fare convention is inherited verbatim** (`src/data/types.ts`): discounted realistic retail fares for economy/business benchmarks, undiscounted retail for First. **A1/A2/A3/A5/A7 rulings** (Nick, 2026-09-01) are encoded in `src/engine/types.ts` and must be described accurately.
- **Deferred (V2-04):** *per-result* generated share image cards. See Assumption A7 for how a per-share-link card relates.

## Project Constraints (from CLAUDE.md)

Actionable directives from `C:\Users\geoca\milesworth\CLAUDE.md` and `C:\Users\geoca\CLAUDE.md`:

- **`next/og` is built in — do NOT install `@vercel/og`.** "`ImageResponse` supports custom fonts (pass TTF/WOFF buffer) and flex layouts, but only a CSS subset. Keep the card to: big number, route line, delta. Load the display font once from the filesystem." `[VERIFIED: matches nextjs.org ImageResponse reference]`
- Stack locked: Next.js 16.3.4 App Router, Tailwind v4 `@theme` tokens, shadcn primitives (vendored: button, card, dialog, input, label), Drizzle 0.45 + `@neondatabase/serverless` via `drizzle-orm/neon-http`, nuqs 2.10, zod 4.5. Clerk is Phase 6 (not installed today — `[VERIFIED: node_modules]`).
- Validate input at system boundaries (zod); never hardcode secrets; never commit `.env*`; never render caught error details (T-01-07 precedent).
- Files under 500 lines; `/src` for source, `/tests` for tests; nothing in repo root; do not create ad-hoc `.md` files (font attribution goes in a code comment, not a README).
- ALWAYS run tests after changes; `npm run build` green before commit. Vitest is the framework.
- Design reference repos (`~/design-repos/launch-ui` has `sections/cta`, `sections/footer`) may inspire the tease/footer structure, but hand-rolled Tailwind is the house style for editorial sections (04-UI-SPEC).
- Editorial aesthetic; "Big numbers carry the drama" — the OG card is the screenshot that travels on LinkedIn.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VAL-03 | A methodology page explains fare sourcing, taxes/fees treatment, and the dynamic-award-pricing disclaimer | Pattern 1 (static RSC rendering engine-sourced values) + "Methodology Content Architecture" section (nine sections mapped to the implemented engine: `cppX100`, `cashOutValueCents`, `wowDeltaCents`, `requiredSourcePoints`, A2 conservative gating, `verifiedAt` policy). Linked from the results header and footer (success criterion 1 says "linked from results"). |
| PLAT-03 | Share links render proper OG tags with a branded OG image | Patterns 2–4: `metadataBase` in layout, `generateMetadata({ searchParams })` on `/` emitting `og:title/description/url/image` + `twitter:card=summary_large_image`, Route Handler `/og` rendering a 1200x630 PNG with vendored Fraunces/Inter via `ImageResponse`, CDN-cached with `s-maxage`. Verified in LinkedIn Post Inspector + Vercel OG tab (Validation Architecture). |
| PLAT-04 | A "coming soon" tease for the v2 AI card-roadmap advisor is present (with an interest hook) | Pattern 5: `AdvisorTease` section on `/` + Server Action `joinAdvisorWaitlist` → `interest_signups` table (schema in Pattern 5), zod `z.email()` validation, honeypot, `onConflictDoNothing`. Copy hooks off the "Almost there" framing (FEATURES.md: "a signup bonus would cover this gap"). |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Methodology page content | Frontend Server (RSC, static prerender) | — | No request-time data; imports `@/data`/`@/engine` at build so numbers are computed, not typed. Zero client JS. |
| Methodology link placement | Browser / Client (inside `CoreExperience`) + layout footer | — | The results header lives in the client island; a `next/link` there is trivial. Footer is a server component in `layout.tsx`. |
| OG/Twitter meta tags for `/` | Frontend Server (`generateMetadata`, per request) | — | Depends on `searchParams`; `/` is already dynamic (awaits searchParams). Absolute URLs resolved via `metadataBase`. |
| OG image rendering | API / Backend (Route Handler `/og`, Node runtime) | CDN (Vercel cache via `s-maxage`) | File convention cannot see query params `[VERIFIED]`; handler reads `Request` URL via the existing nuqs loader, runs the pure engine, renders with Satori/Resvg. |
| Share-content derivation (title, headline, description, query string) | Isomorphic pure helper (`src/lib/share-content.ts`) | — | Consumed by both `generateMetadata` and `/og` so text and image never disagree; unit-tested in node. |
| Interest capture (form) | Browser / Client (`"use client"` form with `useActionState`) | Frontend Server (Server Action) | Form needs pending/success state; the action validates with zod and writes to Neon. |
| Interest persistence | Database (Neon, `interest_signups`) | — | Only DB write in the app until Phase 6; schema via Drizzle + `drizzle-kit push`. |
| Fonts for the card | Build artifact (vendored `.woff` under `src/assets/fonts/`, read via `node:fs` at module scope) | — | Satori cannot use `next/font`'s woff2 output `[VERIFIED: Satori limitations]`; filesystem read is the documented pattern. |

## Standard Stack

### Core (already installed — consume, don't add)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/og` (`ImageResponse`) | bundled in next 16.3.4 | OG PNG rendering (Satori + Resvg) | Built into Next since v14; `import { ImageResponse } from "next/og"` `[VERIFIED: nextjs.org ImageResponse reference; executed locally this session]` |
| Next Metadata API (`generateMetadata`, `metadataBase`) | next 16.3.4 | `<head>` OG/Twitter tags | Official; `searchParams` is a `Promise` in `generateMetadata` `[VERIFIED: Context7 /vercel/next.js]` |
| nuqs `createLoader` (`loadBalanceParams`) | 2.10.1 (installed) | Parse balances from a `Request` in the `/og` handler and from `searchParams` in `generateMetadata` | Loader accepts `Request`, `URL`, `URLSearchParams`, string, object, or a Promise of any `[VERIFIED: nuqs.dev/docs/server-side + executed: loadBalanceParams(new Request("http://localhost/og?ur=90000&mr=abc")) → {ur: 90000, mr: null}]` |
| `src/engine` + `src/data` barrels | in-repo | Top-result derivation for the card; live numbers on the methodology page | Sealed, pure, CI-gated `[VERIFIED: codebase]` |
| `src/lib/format.ts`, `src/lib/path-display.ts` | in-repo | `formatDollars`, `formatCpp`, `formatPoints`, `heroDelta`, `formatVerifiedDate`, `formatTransferPath` | Reuse for card + page text — no new arithmetic `[VERIFIED: codebase]` |
| Drizzle ORM + `@neondatabase/serverless` | 0.45.2 / 1.1.0 (installed) | `interest_signups` table + insert | Existing `src/db` lazy proxy; `insert().values().onConflictDoNothing({ target })` `[VERIFIED: orm.drizzle.team/docs/insert]` |
| zod | 4.5.4 (installed) | Email validation in the Server Action | zod 4 exposes top-level `z.email()` (the v3 `z.string().email()` form is deprecated in v4) `[ASSUMED — zod 4 API from training; confirm at implementation with npx tsc]` |
| React 19 `useActionState` | 19.2.8 (installed) | Pending/success state for the tease form | Documented Next 16 forms pattern `[VERIFIED: nextjs.org/docs/app/guides/forms]` |
| vitest | 4.1.11 (installed) | All automated checks | Node env proven to run `ImageResponse`, `react-dom/server`, and the nuqs loader `[VERIFIED: executed this session]` |

### Supporting (vendored assets, not packages)
| Asset | Source | Size | Purpose |
|-------|--------|------|---------|
| `src/assets/fonts/fraunces-latin-600-normal.woff` | `@fontsource/fraunces@5.3.0` → `files/fraunces-latin-600-normal.woff` (OFL) | 22,512 B | Display numbers/headline on the card. **Rendered successfully via `ImageResponse` in this session.** `[VERIFIED: npm pack listing + jsDelivr 200 + executed]` |
| `src/assets/fonts/inter-latin-400-normal.woff` | `@fontsource/inter@5.3.0` → `files/inter-latin-400-normal.woff` (OFL) | 30,696 B | Label/body lines on the card `[VERIFIED: npm pack listing + jsDelivr 200]` |

Both files together are ~53 KB, far under the 500 KB `ImageResponse` bundle limit `[VERIFIED: nextjs.org ImageResponse "Behavior"]`. Obtain them without adding a dependency: `npm pack @fontsource/fraunces@5.3.0` (then extract `package/files/…`) or `curl -sL https://cdn.jsdelivr.net/npm/@fontsource/fraunces@5.3.0/files/fraunces-latin-600-normal.woff`. Record the source URL and OFL license in a comment at the top of `src/app/og/route.tsx` (CLAUDE.md forbids ad-hoc README files).

Alternative: Google Fonts CSS API returns a **static TTF instance** when requested with a non-woff2 UA (`curl -s "https://fonts.googleapis.com/css2?family=Fraunces:wght@600"` → `…RYIcaRyjDg.ttf format('truetype')`, 71,632 B; Inter 400 → 324,820 B). Official source, but the Inter TTF alone is 325 KB (full charset) and the TTF instances were not render-tested here. Prefer the fontsource latin-subset woffs. `[VERIFIED: curl this session]`

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Route Handler `/og` reading the query string | `app/opengraph-image.tsx` file convention | Cleaner auto-wired `<meta>` tags, but **cannot read `searchParams`** `[VERIFIED]` — it would render one static branded card for every share link. Acceptable *fallback* if the balance-aware card is descoped (see A7): then use the file convention at `src/app/opengraph-image.tsx` (statically optimized at build) and drop `generateMetadata.openGraph.images`. |
| Vendored `.woff` read from disk | Fetch from Google Fonts CSS API at request time (Vercel KB pattern) | Adds a third-party network call to the crawler's critical path; violates CLAUDE.md's "no hotlinking in the demo path" principle. Use only if vendoring is somehow blocked. |
| Plain TSX methodology page | MDX via `@next/mdx` | MDX needs a new package + `next.config` + `mdx-components.tsx` for one page, and cannot easily render live `programs` values. Not worth it. |
| Server Action + `interest_signups` | `mailto:` link / Clerk-gated flag / Tally form | mailto gives no captured signal and is clunky in the LinkedIn WebView; Clerk is Phase 6; an external form breaks the editorial page and adds a third party. The action is ~60 lines and reuses existing infra. |
| Email capture | Anonymous "I want this" click counter (no PII) | Zero privacy exposure but no way to follow up. Recommended **fallback** if Nick prefers not to collect emails before the Phase 6 privacy policy ships (A4). Same table minus the email column. |

**Installation:** none. `npm ci` state is sufficient. `[VERIFIED: package.json]`

## Package Legitimacy Audit

**No external packages are installed in this phase.** slopcheck 0.6.1 is present (`python -m slopcheck`) but there is nothing to check. The two font files are extracted from `@fontsource/fraunces@5.3.0` (npm, created 2021-01-10, repo `github.com/fontsource/font-files`) and `@fontsource/inter@5.3.0` — used as *asset sources* via `npm pack`, never added to `package.json`. `[VERIFIED: npm view]`

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
   LinkedIn / Slack / iMessage crawler            Human visitor / share recipient
                 │  GET /?ur=90000&mr=50000                    │
                 ▼                                             ▼
 ┌───────────────────────────────────────────────────────────────────────────┐
 │ src/app/page.tsx  (dynamic: awaits searchParams)                          │
 │   generateMetadata({searchParams}) ── loadBalanceParams ──┐               │
 │   Home({searchParams})                                    │               │
 │      └─ <CoreExperience asOf/>  (Phase 4 island, unchanged │               │
 │          + "How we calculate these numbers →" link)        │               │
 │      └─ <AdvisorTease/>  (server section + client form)    │               │
 └───────────────────────────────────────────┬────────────────┼──────────────┘
                                             │                │
              <head> og:title / og:description / og:url(with params)
              og:image = https://milesworth.vercel.app/og?ur=90000&mr=50000
              twitter:card = summary_large_image                │
                                             │                ▼
                                             │   src/lib/share-content.ts (pure)
                                             │     balances ──► rankRedemptions ──► top bookableNow
                                             │     → { title, headline "$4,500", subline, description,
                                             │         queryString "ur=90000&mr=50000" }  (or baseline copy)
                                             ▼                ▲
   crawler GET /og?ur=90000&mr=50000                          │
 ┌───────────────────────────────────────────────────────────┴───────────────┐
 │ src/app/og/route.tsx  (Node runtime Route Handler)                        │
 │   loadBalanceParams(request) → paramsToBalances → buildShareContent       │
 │   new ImageResponse(<Card/>, {1200x630, fonts:[Fraunces600, Inter400],    │
 │        headers: Cache-Control: public, s-maxage=86400, swr=604800})       │
 │   fonts read once at module scope from src/assets/fonts/*.woff            │
 └───────────────────────────────────────────────────────────────────────────┘
                                             │ PNG  → Vercel CDN caches per URL
 ┌───────────────────────────────────────────────────────────────────────────┐
 │ src/app/methodology/page.tsx (static RSC) ── imports programs + cppX100   │
 │   renders baseline table + worked ANA example from live data              │
 └───────────────────────────────────────────────────────────────────────────┘
 ┌───────────────────────────────────────────────────────────────────────────┐
 │ src/components/advisor-tease.tsx ("use client" form, useActionState)      │
 │   └─ action: src/app/actions/interest.ts ("use server")                   │
 │        zod email + honeypot → db.insert(interestSignups).onConflictDoNothing │
 │        → Neon interest_signups                                            │
 └───────────────────────────────────────────────────────────────────────────┘
```

Trace the primary case: a recipient pastes `/?ur=90000&mr=50000` into LinkedIn → LinkedInBot fetches the HTML, reads `og:image` → fetches `/og?ur=90000&mr=50000` → the handler runs the same engine the page runs, renders "$4,500 · ANA business class to Tokyo · vs. ~$900 cashing out" → CDN caches the PNG → the preview shows the wow number before anyone clicks.

### Recommended Project Structure
```
src/
├── app/
│   ├── layout.tsx                 # + metadataBase, default openGraph/twitter, <SiteFooter/>
│   ├── page.tsx                   # + generateMetadata({ searchParams }); + <AdvisorTease/> below island
│   ├── methodology/page.tsx       # VAL-03 static RSC (sync component; no searchParams)
│   ├── og/route.tsx               # PLAT-03 ImageResponse route handler (Node runtime)
│   └── actions/interest.ts        # "use server" — joinAdvisorWaitlist (only place @/db is imported in app/)
├── assets/fonts/
│   ├── fraunces-latin-600-normal.woff
│   └── inter-latin-400-normal.woff
├── components/
│   ├── core-experience.tsx        # + methodology link under "Bookable now" heading (ink/muted)
│   ├── advisor-tease.tsx          # PLAT-04 "use client" form (useActionState) + copy
│   └── site-footer.tsx            # server component: Methodology · Coming soon · (Phase 6 adds Privacy)
├── db/schema.ts                   # + interestSignups table
└── lib/
    ├── share-content.ts           # pure: balances → {title, headline, subline, description, queryString}
    └── interest-validation.ts     # pure: zod schema + normalizeEmail + honeypot check (DB-free, testable)
tests/
├── share-content.test.ts
├── og-route.test.ts               # imports GET from ../src/app/og/route; asserts image/png + PNG magic
├── methodology-page.test.ts       # renderToStaticMarkup; asserts required sections + live baseline values
└── interest-validation.test.ts
vitest.config.ts                   # + resolve.alias { "@": ./src }  (Wave 0)
```

### Pattern 1: Methodology page renders engine-sourced values (VAL-03)

**What:** A sync server component that imports `programs` from `@/data` and `cppX100` from `@/engine`, and formats through `src/lib/format.ts`. Prose is hand-written; every number on the page is computed from the same data the engine uses.
**When to use:** Always for this page — it is the drift guard. If Nick re-ratifies a baseline (one integer in `programs.ts`), the page updates with zero edits.

```tsx
// src/app/methodology/page.tsx — source: repo contracts (src/engine/valuation.ts JSDoc, src/data/programs.ts)
import type { Metadata } from "next";
import Link from "next/link";
import { programs, redemptions } from "@/data";
import { cppX100 } from "@/engine";
import { formatCpp, formatDollars, formatPoints } from "@/lib/format";

export const metadata: Metadata = {
  title: "Methodology — Milesworth",
  description: "How we source cash fares, treat taxes and fees, value points, and why award prices are ranges.",
};

// The flagship anchor pinned by tests/engine-valuation.test.ts (933 cppX100).
const anchor = redemptions.find((r) => r.slug === "ana-business-tokyo-roundtrip");

export default function MethodologyPage() {
  const enterable = programs.filter((p) => p.isUserEnterable);
  const anchorCpp = anchor
    ? cppX100(anchor.cashFareCents, anchor.taxesFeesCents, anchor.pointsMax ?? anchor.pointsMin)
    : null;
  return (
    <main className="bg-cream flex flex-1 flex-col">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-4 py-12 sm:px-6 md:py-16">
        <h1 className="font-display text-ink text-display font-semibold">How we value your points</h1>
        {/* …sections per "Methodology Content Architecture" below… */}
        <table>{enterable.map((p) => (
          <tr key={p.slug}><td>{p.name}</td>
            <td>{p.cashOutBaselineCppX100 === null ? "No cash-out option" : formatCpp(p.cashOutBaselineCppX100)}</td></tr>
        ))}</table>
        {anchor && anchorCpp !== null && (
          <p>{anchor.title}: ({formatDollars(anchor.cashFareCents)} − {formatDollars(anchor.taxesFeesCents)}) ÷ {formatPoints(anchor.pointsMax ?? anchor.pointsMin)} points = {formatCpp(anchorCpp)} per point.</p>
        )}
        <Link href="/">Back to your results</Link>
      </article>
    </main>
  );
}
```

Notes: no `searchParams` → route prerenders as `○ /methodology` in the build table `[CITED: nextjs.org opengraph-image "statically optimized unless Request-time APIs"]`. Keep the component **sync** so `renderToStaticMarkup(createElement(MethodologyPage))` works in vitest (verified pattern). Use `<table>` markup with 04-UI-SPEC label/body sizes; no terracotta on this page (nothing here is the wow delta).

### Pattern 2: `metadataBase` + default social metadata in the root layout (PLAT-03)

**What:** Set `metadataBase` once so relative `openGraph.images`/`twitter.images` resolve to absolute URLs; provide site-wide defaults that the methodology page inherits.
**Why:** "Using a relative path in a URL-based metadata field without configuring a metadataBase will cause a build error." `[VERIFIED: nextjs.org generate-metadata reference, v16.3.4]` Nested `openGraph` objects are **shallowly replaced** by the last segment that defines them — so the page's `generateMetadata` must return the complete `openGraph` object, not just `images`. `[VERIFIED: same doc, "Merging"]`

```tsx
// src/app/layout.tsx additions — source: nextjs.org generate-metadata reference
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://milesworth.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Milesworth",
  description: "See what your credit card points are actually worth.",
  robots: { index: false, follow: false }, // D-03 — Phase 7 removes
  openGraph: {
    type: "website",
    siteName: "Milesworth",
    title: "Milesworth",
    description: "See what your credit card points are actually worth.",
    images: [{ url: "/og", width: 1200, height: 630, alt: "Milesworth" }],
  },
  twitter: { card: "summary_large_image", title: "Milesworth",
    description: "See what your credit card points are actually worth.", images: ["/og"] },
};
```

`NEXT_PUBLIC_SITE_URL` is optional — the literal production hostname is the safe default (Vercel Hobby production domains are public `[VERIFIED: vercel.com/docs/deployment-protection]`). Do **not** derive from `VERCEL_URL`: on preview deployments that host is behind Deployment Protection and crawlers cannot fetch it.

### Pattern 3: Per-share-link metadata via `generateMetadata({ searchParams })` (PLAT-03)

```tsx
// src/app/page.tsx additions — source: Context7 /vercel/next.js generateMetadata (searchParams is a Promise)
import type { Metadata } from "next";
import type { SearchParams } from "nuqs/server";
import { buildShareContent } from "@/lib/share-content";

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const balances = paramsToBalances(await loadBalanceParams(searchParams));
  const asOf = new Date().toISOString().slice(0, 10); // server-only clock read; island still clock-free
  const share = buildShareContent({ balances, asOf });
  const pageUrl = share.queryString ? `/?${share.queryString}` : "/";
  const imageUrl = share.queryString ? `/og?${share.queryString}` : "/og";
  return {
    title: share.title,
    description: share.description,
    openGraph: { type: "website", siteName: "Milesworth", title: share.title,
      description: share.description, url: pageUrl,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: share.imageAlt }] },
    twitter: { card: "summary_large_image", title: share.title, description: share.description, images: [imageUrl] },
  };
}
```

`buildShareContent` (pure, `src/lib/share-content.ts`) runs `rankRedemptions({ balances, dataset, asOf })`, takes `bookableNow[0]`, and returns e.g. title `"90,000 Chase Ultimate Rewards points → ANA business class to Tokyo"`, headline `formatDollars(heroDelta(top))`, subline using the same Pitfall-10 framing branch as `result-card.tsx` (`"vs. ~$900 cashing out"` / `"Pure travel value"`), description ≤ 200 chars, and a **canonically ordered** `queryString` built from `balancesToParams` (skip nulls, iterate in `PARAM_KEY_BY_SLUG` order) so `/og?…` cache keys are stable regardless of how the visitor's URL was ordered. With no balances (or no bookable result) it returns the baseline copy. Empty `bookableNow` but non-empty `almostThere` → baseline copy plus "you're X points away" is a nice touch but optional.

### Pattern 4: OG image Route Handler with vendored fonts (PLAT-03)

```tsx
// src/app/og/route.tsx — source: nextjs.org ImageResponse reference (Route Handlers, Custom fonts) + executed locally
// Fonts: @fontsource/fraunces@5.3.0 & @fontsource/inter@5.3.0 latin subsets, SIL OFL 1.1 — vendored, never fetched at runtime.
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadBalanceParams, paramsToBalances } from "@/lib/balance-params";
import { buildShareContent } from "@/lib/share-content";

const FONT_DIR = join(process.cwd(), "src/assets/fonts");
// Read once at module scope (docs: "Predictable values") — top-level await is fine in route modules.
const fraunces = await readFile(join(FONT_DIR, "fraunces-latin-600-normal.woff"));
const inter = await readFile(join(FONT_DIR, "inter-latin-400-normal.woff"));

export async function GET(request: Request) {
  const balances = paramsToBalances(loadBalanceParams(request)); // nuqs loader accepts Request [VERIFIED]
  const asOf = new Date().toISOString().slice(0, 10);
  const share = buildShareContent({ balances, asOf });
  try {
    return new ImageResponse(
      (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between",
          width: "100%", height: "100%", padding: 72, background: "#faf7f2", color: "#262119", fontFamily: "Inter" }}>
          <div style={{ display: "flex", fontSize: 28 }}>{share.eyebrow /* "Milesworth" or "90,000 Chase Ultimate Rewards points" */}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontFamily: "Fraunces", fontWeight: 600, fontSize: 176, lineHeight: 1, letterSpacing: "-0.02em", color: "#c05f33" }}>{share.headline}</div>
            <div style={{ display: "flex", fontFamily: "Fraunces", fontWeight: 600, fontSize: 44, lineHeight: 1.15 }}>{share.title}</div>
            <div style={{ display: "flex", fontSize: 28, opacity: 0.7 }}>{share.subline}</div>
          </div>
        </div>
      ),
      { width: 1200, height: 630,
        fonts: [ { name: "Fraunces", data: fraunces, weight: 600, style: "normal" },
                 { name: "Inter", data: inter, weight: 400, style: "normal" } ],
        headers: { "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch {
    // T-01-07: never leak error detail. A plain 500 lets crawlers fall back gracefully.
    return new Response("Image unavailable", { status: 500 });
  }
}
```

Verified behavior this session (plain Node via `tsx`, same `next/og` build): `status 200 | type image/png | cache public, s-maxage=86400 | 43,203 bytes | PNG magic` with the fontsource Fraunces woff and the exact palette above. Runtime defaults to `nodejs` (edge is deprecated in Next 16) — do not add `export const runtime = "edge"` `[VERIFIED: route-segment-config reference]`. Reading `request` (the URL) makes the handler dynamic; Vercel caches the PNG at the CDN because of `s-maxage` `[VERIFIED: vercel.com/docs/caching/cdn-cache — "s-maxage=N, stale-while-revalidate=Z"]`.

Satori rules that bite `[VERIFIED: Context7 /vercel/satori]`: every `<div>` with more than one child needs `display: "flex"`; no CSS grid; no `woff2`; `fontFamily` must match the `fonts[].name` exactly; use inline `style` objects (no Tailwind classes — the `tw` prop is a separate experimental path, don't use it).

### Pattern 5: Advisor tease + Server Action interest capture (PLAT-04)

Schema (Drizzle, same house style as existing tables):
```ts
// src/db/schema.ts addition
import { timestamp } from "drizzle-orm/pg-core";
export const interestSignups = pgTable("interest_signups", {
  id: serial("id").primaryKey(),
  // Lower-cased, trimmed; unique so repeat submits are idempotent (onConflictDoNothing).
  email: text("email").notNull().unique(),
  // Where the signal came from — lets Phase 6 / v2 filter ("advisor-tease" today).
  source: text("source").notNull().default("advisor-tease"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```
Apply with `npm run db:push` (drizzle-kit push against `DATABASE_URL` from `.env.development.local`, which is the Neon Marketplace production database pulled via `vercel env pull` — the same path Phases 1–2 used). A pure table *creation* should not hit the interactive rename prompt that bit plan 02-01 `[VERIFIED: 02-01-SUMMARY]`. `scripts/seed.ts` rebuilds only the four curated tables — confirm it never touches `interest_signups` (it doesn't today; add nothing).

Action + validation:
```ts
// src/lib/interest-validation.ts — pure, DB-free, unit-tested
import { z } from "zod";
export const interestSchema = z.object({
  email: z.email().max(254).transform((e) => e.trim().toLowerCase()),
  website: z.literal("").optional(), // honeypot: bots fill it, humans never see it
});

// src/app/actions/interest.ts — source: nextjs.org/docs/app/guides/forms (useActionState signature)
"use server";
import { db, interestSignups } from "@/db";
import { interestSchema } from "@/lib/interest-validation";
export type InterestState = { status: "idle" | "ok" | "error"; message: string };
export async function joinAdvisorWaitlist(_prev: InterestState, formData: FormData): Promise<InterestState> {
  const parsed = interestSchema.safeParse({ email: formData.get("email"), website: formData.get("website") ?? "" });
  if (!parsed.success) return { status: "error", message: "Enter a valid email address." };
  try {
    await db.insert(interestSignups).values({ email: parsed.data.email }).onConflictDoNothing({ target: interestSignups.email });
    return { status: "ok", message: "You're on the list." };
  } catch {
    return { status: "error", message: "Something went wrong. Try again in a moment." }; // never the caught error
  }
}
```
Client form (`src/components/advisor-tease.tsx`, `"use client"`): `const [state, formAction, pending] = useActionState(joinAdvisorWaitlist, { status: "idle", message: "" })`; shadcn `Input` (`type="email"`, `inputMode="email"`, `autoComplete="email"`, `h-11`) + `Button` (`bg-terracotta` is **not** sanctioned here per 04-UI-SPEC's reserved list — use the ink/primary button; the terracotta CTA is "Copy my link"); honeypot `<input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />`; `<p aria-live="polite">{state.message}</p>`; consent microcopy: "One email when it launches. No spam, unsubscribe any time." Placement: a `<section>` after `<CoreExperience/>` in `page.tsx` (server-rendered wrapper with Fraunces heading, the client form inside). Copy hook (from FEATURES.md): "Coming soon: the AI card-roadmap advisor. Tell it where you want to go; it works out which card, in what order, and when — so 'almost there' becomes 'booked'."

### Anti-Patterns to Avoid
- **Using `opengraph-image.tsx` and expecting balances:** it has no `searchParams`; you'd ship one generic card for every link `[VERIFIED]`.
- **Hand-writing `<meta property="og:…">` tags in JSX:** bypasses `metadataBase` resolution and Next's dedupe; use the Metadata API.
- **Typing numbers into the methodology prose** ("Amex cashes out at 0.6¢"): render from `programs` instead — the page is the drift guard, not a second source of truth.
- **`tw` prop / Tailwind classes inside `ImageResponse`:** Satori ignores class names; inline styles only.
- **`export const runtime = "edge"` on `/og`:** deprecated in Next 16 and breaks `node:fs` font reads.
- **Importing `@/db` from `src/components/**` or `page.tsx`:** breaks the Phase 4 grep gate. The action file under `src/app/actions/` is the only importer.
- **Putting the Server Action inline in a client component:** `"use server"` functions must be in a server file or a server component.
- **Deriving `metadataBase` from `VERCEL_URL`:** preview hosts are protected; crawlers get 401 on the image.
- **Re-sorting/re-computing engine output in `share-content.ts`:** take `bookableNow[0]` and `heroDelta()` exactly as the card does (Pitfall 4 from Phase 4 still applies to the image).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PNG social card | Canvas/Puppeteer/Sharp pipelines | `next/og` `ImageResponse` | Bundled, JSX-authored, proven under Node + Vercel; fonts via buffer |
| Absolute OG URLs | String concatenation with env vars | `metadataBase` + relative paths | Build-time validation; single place to change host |
| Query-string parsing in `/og` | `new URL(request.url).searchParams.get("ur")` + parseInt | `loadBalanceParams(request)` + `paramsToBalances` | Same triple-layer sanitization as the page (T-04-10); unknown/hostile values dropped, tested |
| Email validation | Regex | zod `z.email()` | Boundary validation rule (CLAUDE.md); zod already installed |
| Idempotent signup insert | SELECT-then-INSERT | `.onConflictDoNothing({ target })` on a unique column | Race-free; one statement |
| Form pending/error state | Manual `useState` + `fetch("/api/…")` | `useActionState` + Server Action | No API route, progressive enhancement, documented pattern |
| Worked cpp example | Typed literal "9.3¢" | `formatCpp(cppX100(fare, taxes, points))` | Ties the page to the tested 933 anchor |

**Key insight:** every Phase 5 number and string can be produced by functions that already have tests (`cppX100`, `heroDelta`, `formatDollars`, `formatTransferPath`, `loadBalanceParams`). The phase's own logic surface is two pure modules (`share-content.ts`, `interest-validation.ts`) plus templates.

## Methodology Content Architecture (VAL-03)

Sections, in order, each stating what the engine actually does (source files in parentheses). Nick should sign off on wording as if it were a research note (PITFALLS.md #4).

1. **What you're looking at** — dual valuation: representative cash fare and cents per point side by side; the hero dollar figure is *transfer-partner value minus what the same points fetch cashed out* (`wowDeltaCents`). It is the conservative end of any range (A2).
2. **Where cash fares come from** — representative, hand-verified benchmarks, not live prices: discounted realistic retail for economy/business, undiscounted retail for First (`src/data/types.ts` convention, confirmed 2026-09-01); each entry carries a `sourceNote` and `methodologyNote`; fares are refreshed manually and stamped with a verified date.
3. **Taxes and fees** — subtracted from the cash fare *before* dividing by points (`cppX100 = round((fare − taxes) × 100 / points)`), because you pay them in cash whether you book with points or dollars; the wow delta subtracts them on the value side for the same reason (`valuation.ts` JSDoc).
4. **Cents per point (TPG convention)** — formula + worked ANA example rendered live (≈9.3¢ at 90,000 points); note we show the *per-partner-point* figure and, when a transfer bonus is active, the *per-source-point* "effective" figure it improves (VAL-05, `effectiveCppX100`).
5. **What "cashing out" means** — per-program baseline table rendered from `programs` (Chase 1.0¢, Citi 1.0¢, Amex 0.6¢ statement credit, Capital One 0.5¢, Bilt ≈0.1¢ stand-in for "effectively no cash-out path", Hyatt/Hilton/Marriott none → shown as "pure travel value"); never a flat 1¢ (the attackable-methodology failure).
6. **Transfer math** — ratios and increments (transfers happen in blocks, rounded down), Marriott's 5,000-mile bonus per 60,000 points, promotional bonuses multiply the base conversion and never stack with structural bonuses (A4), single-hop transfers only (A7), and "cheapest path" = fewest source points, with direct use winning ties (A1). Example worth stating: 60,000 Alaska miles via Marriott costs 150,000 Bonvoy, not the naive 180,000 (`paths.ts` JSDoc).
7. **Dynamic award pricing disclaimer** — many programs price awards dynamically; entries carry a range (`pointsMin`–`pointsMax`); we rank and label "bookable now" on the *high* end (A2) so the site never overpromises; award space is not guaranteed — each entry has an availability rating (wide open / plan ahead / hard to find); prices and partners change without notice.
8. **Verification and freshness** — every shown entry has a "Verified" date; unverified drafts never appear (A5 fail-closed); when a transfer bonus window ends, figures revert automatically.
9. **Independence** — no affiliate links, no card recommendations in this version, educational only, not financial advice; how to report an error (mailto).

Length target: readable in ~4 minutes; 04-UI-SPEC Heading (28px Fraunces) for section titles, Body (16px Inter) for prose, Label (14px) for table cells.

## Common Pitfalls

### Pitfall 1: File-convention OG image has no `searchParams`
**What goes wrong:** `app/opengraph-image.tsx` renders the same card for every share link.
**Why:** The default export receives only `params` (and `id` with `generateImageMetadata`) `[VERIFIED: nextjs.org v16.3.4]`.
**How to avoid:** Route Handler `/og` + `generateMetadata` pointing at `/og?<params>`.
**Warning signs:** `og:image` in the HTML has no query string.

### Pitfall 2: `metadataBase` missing → build error; wrong host → 401 for crawlers
**What goes wrong:** Relative `openGraph.images` without `metadataBase` fails `next build`; deriving it from `VERCEL_URL` yields a Deployment-Protected preview host that LinkedIn cannot fetch.
**How to avoid:** Pattern 2 — explicit production URL constant, optional `NEXT_PUBLIC_SITE_URL` override.
**Warning signs:** Post Inspector shows title but no image; `curl -sI <og:image url>` returns 401.

### Pitfall 3: Fonts — woff2, variable axes, name mismatch, wrong path
**What goes wrong:** `next/font` emits woff2 (unsupported by Satori); variable Fraunces has "limited support"; `fontFamily: "Fraunces"` with `fonts[{name: "fraunces"}]` silently falls back; `readFile("./fonts/…")` resolves against the wrong cwd on Vercel.
**How to avoid:** Vendor static-instance `.woff` files; match names exactly; `join(process.cwd(), "src/assets/fonts/…")` at module scope `[VERIFIED: nextjs.org "Using Node.js runtime with local assets"]`.
**Warning signs:** Card renders in a serif fallback or throws "Unsupported OpenType signature wOF2".

### Pitfall 4: Satori layout rules
**What goes wrong:** A `<div>` with two children and no `display: flex` throws; `grid` is ignored; long redemption titles overflow.
**How to avoid:** `display: "flex"` on every multi-child container; `flexDirection: "column"`; clamp the title (`lineClamp: 2` is supported) and cap `share.title` length in the helper.

### Pitfall 5: `og:url` collapsing distinct share links
**What goes wrong:** If `openGraph.url` is the bare `/`, social platforms that key their preview cache on `og:url` may show one cached card for every balance combination.
**How to avoid:** Emit `og:url` **with** the canonical query string (Pattern 3). `[ASSUMED — OG protocol semantics; platform dedupe behavior not verified; see A1]`

### Pitfall 6: LinkedIn caches previews ~7 days; previews are Deployment-Protected
**What goes wrong:** First inspection after a bad deploy sticks; testing on a preview URL "fails" for reasons unrelated to code.
**How to avoid:** Verify on the production URL only; use LinkedIn Post Inspector (https://www.linkedin.com/post-inspector/ — 200 OK this session) to force a re-scrape; use the Vercel deployment's **Open Graph** tab (works even on protected deployments `[VERIFIED: vercel.com/docs/deployments/og-preview]`) for previews.

### Pitfall 7: vitest has no `@/` alias today
**What goes wrong:** `tests/share-content.test.ts` importing a module that runtime-imports `@/data` fails to resolve.
**Why:** Existing tested lib modules use `@/` only for type imports (erased) `[VERIFIED: grep]`.
**How to avoid:** Wave 0 adds `resolve: { alias: { "@": path.resolve(__dirname, "src") } }` to `vitest.config.ts` — verified to work with `@/data`, `@/engine`, `@/lib/*`, `react-dom/server`, and `nuqs/server` in node env this session.

### Pitfall 8: Server Action pulls DB into the wrong tree
**What goes wrong:** Placing `joinAdvisorWaitlist` in `src/components/` trips the Phase 4 grep gate (`from "@/db"` under components); an inline `'use server'` inside a `"use client"` file is a build error.
**How to avoid:** `src/app/actions/interest.ts` with a top-of-file `"use server"`; the client component imports the function reference only. Extend the verification grep to assert `@/db` appears in exactly that file (plus `scripts/`).

### Pitfall 9: Methodology text drifts from the engine
**What goes wrong:** Prose says "we rank on the low end" while A2 gates on `pointsMax`; a baseline is re-ratified and the page still shows the old figure.
**How to avoid:** Render numbers from data (Pattern 1); assert in `tests/methodology-page.test.ts` that each enterable program's name and formatted baseline appear, and that A2 wording ("high end"/"conservative") is present.

### Pitfall 10: Clock reads in server metadata vs. the island
**What goes wrong:** Adding `new Date()` inside the client island (to compute share text client-side) reintroduces the hydration hazard Phase 4 removed.
**How to avoid:** `generateMetadata` and `/og` are server-only — deriving `asOf` there is fine; never pass share text into the island. Around a bonus end date the card and page can differ by a day for cached images — acceptable and self-correcting after `s-maxage`.

### Pitfall 11: `drizzle-kit push` prompt and target DB
**What goes wrong:** Push asks an interactive question (only on renames/ambiguities) or runs against no `DATABASE_URL`.
**How to avoid:** Pure `CREATE TABLE` is prompt-free; run `vercel env pull .env.development.local` first if the file is stale; never echo the URL in logs (T-02-10).

## Code Examples

Covered inline in Patterns 1–5 (sources: nextjs.org 16.3.4 references for `opengraph-image`, `ImageResponse`, `generate-metadata`, `guides/forms`; Context7 `/vercel/next.js` and `/vercel/satori`; `nuqs.dev/docs/server-side`; `orm.drizzle.team/docs/insert`; repo contracts). Additional verified snippet — the OG route unit test shape:

```ts
// tests/og-route.test.ts — pattern executed this session against next/og in plain Node
import { describe, expect, it } from "vitest";
import { GET } from "../src/app/og/route";

describe("GET /og", () => {
  it("returns a cached 1200x630 PNG for a share link", async () => {
    const res = await GET(new Request("http://localhost/og?ur=90000&mr=50000"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("cache-control")).toContain("s-maxage");
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(Array.from(bytes.subarray(1, 4)).map((b) => String.fromCharCode(b)).join("")).toBe("PNG");
  });
  it("falls back to the baseline card on hostile params", async () => {
    const res = await GET(new Request("http://localhost/og?ur=-5&mr=abc&zz=1"));
    expect(res.status).toBe(200);
  });
});
```
(~3 s per test file on this machine — acceptable; keep it to 2–3 cases.)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@vercel/og` package / `next/server` ImageResponse | `import { ImageResponse } from "next/og"` | Next 14 | Nothing to install `[VERIFIED]` |
| `runtime = "edge"` for OG routes | Node runtime default; edge deprecated | Next 16 | `node:fs` font reads are the documented path `[VERIFIED]` |
| `metadataBase` implied on Vercel | Explicit `metadataBase` required for relative image URLs | Next 16.3 docs | Build error if omitted `[VERIFIED]` |
| `searchParams` plain object in `generateMetadata` | `Promise<…>` awaited | Next 15 | Type + `await` `[VERIFIED: Context7]` |
| `z.string().email()` | `z.email()` | zod 4 | Use the top-level validator `[ASSUMED]` |
| `useFormState` (react-dom) | `useActionState` (react) | React 19 | Returns `[state, action, pending]` `[VERIFIED: nextjs.org forms guide]` |

**Deprecated/outdated:** `@vercel/og` as a dependency; edge runtime; `tailwindcss-animate` (n/a); manual `<Head>` meta tags (Pages Router).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Emitting `og:url` with the query string prevents platforms from collapsing distinct share links into one cached preview | Pattern 3 / Pitfall 5 | If platforms ignore `og:url`, no harm; if they key on it and we omit params, every share shows the same card — cheap to include |
| A2 | Vercel's CDN cache key includes the full query string, so `/og?ur=…` variants cache independently | Pattern 4 | If not, cached PNGs could cross-contaminate; mitigation: verify `x-vercel-cache` HIT/MISS across two different param sets in the checkpoint |
| A3 | LinkedIn, Slack, and iMessage all render from standard `og:title/description/image`; X needs `twitter:card=summary_large_image`; LinkedIn ignores Twitter tags | Validation | Missing a platform-specific tag only degrades that platform; the four LinkedIn-required tags are documented `[CITED: linkedin.com/help/…/a521928]` |
| A4 | Collecting waitlist emails before the Phase 6 privacy policy ships is acceptable because both phases precede launch | Pattern 5 | If Nick objects, switch to the no-PII click-count fallback (same table without `email`) — one-plan change; Phase 6 must add waitlist emails to the privacy policy + deletion flow either way |
| A5 | The `robots: noindex` meta (D-03) does not affect link unfurls | Pattern 2 | Unfurl crawlers ignore `noindex`; if a platform respected it, the Phase 7 removal fixes it before launch |
| A6 | This Vercel project has Deployment Protection on for previews (Vercel default for new projects) | Pitfall 6 | Only affects where verification runs — production URL is public on Hobby `[VERIFIED]` |
| A7 | A *per-share-link* (balance-aware) OG card is in scope for PLAT-03, while V2-04 defers *per-redemption* share cards | Summary / Pattern 4 | If the user reads V2-04 as "static branded image only", drop `generateMetadata.openGraph.images` and use `app/opengraph-image.tsx` — the same `ImageResponse` JSX, ~1 hour less work. **Recommendation: build the balance-aware card** (marginal cost is one route + one pure helper; it is the "product markets itself when shared" goal) |
| A8 | zod 4 exposes `z.email()` as a top-level validator | Pattern 5 | Fallback `z.string().email()` still works (deprecated); typecheck catches it immediately |
| A9 | OG generation stays well under Vercel's default function timeout (local: ~0.3 s render after process start) | Pattern 4 | CDN caching hides it; `maxDuration` can be raised if ever needed |

## Open Questions

1. **Dynamic vs. static OG card (A7)** — see Assumptions. Recommendation: dynamic, with the static file-convention as the documented descoping path.
2. **Email capture vs. no-PII signal (A4)** — Recommendation: email capture with consent microcopy; Phase 6 covers it legally. Worth a one-line confirmation with Nick at plan review.
3. **Where the methodology link lives "on results"** — Recommendation: one ink/muted `next/link` under the "Bookable now" heading ("How we calculate these numbers →") plus the site footer; not on every card (accent/clutter discipline). Optional: make the "Verified {date}" footer text a link too.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build/test/tsx | ✓ | v24.11.0 | — |
| npm | `npm pack` font extraction, scripts | ✓ | 10.9.8 | curl from jsDelivr |
| `next/og` (compiled `@vercel/og`, `resvg.wasm`) | `/og` route | ✓ | bundled in next 16.3.4 | — |
| vitest | tests | ✓ | 4.1.11 | — |
| curl | font download, OG/header checks | ✓ | 8.17.0 | PowerShell `Invoke-WebRequest` |
| Vercel CLI | `vercel env pull`, deployment inspection | ✓ | 57.0.0 | Dashboard |
| gh CLI | — | ✓ | 2.94.0 | — |
| `DATABASE_URL` (`.env.development.local`) | `drizzle-kit push` | ✓ (file present) | — | `vercel env pull` |
| Neon Postgres (production) | `interest_signups` table + action | assumed ✓ (used in Phases 1–2) | — | None — blocks PLAT-04's interest hook only; tease copy can ship first |
| Network to cdn.jsdelivr.net / fonts.gstatic.com | one-time font vendoring | ✓ (200 this session) | — | `npm pack` from registry |
| slopcheck | package audit | ✓ (`python -m slopcheck` 0.6.1) | — | n/a — no packages this phase |
| Production site | unfurl verification | ✓ https://milesworth.vercel.app (200; currently emits only title/description/robots meta — no OG tags) | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 (environment: node) |
| Config file | `vitest.config.ts` — **Wave 0 adds `resolve.alias { "@": ./src }`** (include stays `tests/**/*.test.ts`; test files remain `.ts`, importing `.tsx` modules is fine) |
| Quick run command | `npx vitest run tests/<file>.test.ts` |
| Full suite command | `npm test && npm run typecheck && npm run lint` (152 tests green pre-phase) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VAL-03 | Methodology page renders all nine sections; baseline table matches `programs`; worked example equals `formatCpp(cppX100(...))`; A2 "high end" wording; "not financial advice"; taxes/fees + dynamic-pricing sections present | unit (renderToStaticMarkup) | `npx vitest run tests/methodology-page.test.ts` | ❌ Wave 0 |
| VAL-03 | Link to `/methodology` present in results UI and footer | grep gate | `grep -c 'href="/methodology"' src/components/core-experience.tsx src/components/site-footer.tsx` ≥ 1 each | — |
| PLAT-03 | `buildShareContent`: baseline copy with no balances; top-result copy for `{chase-ur: 90000}`; canonical param order; description ≤ 200 chars; hotel framing branch | unit | `npx vitest run tests/share-content.test.ts` | ❌ Wave 0 |
| PLAT-03 | `GET /og` returns `image/png`, PNG magic, `s-maxage` header; hostile params → 200 baseline | unit (real ImageResponse in node) | `npx vitest run tests/og-route.test.ts` | ❌ Wave 0 |
| PLAT-03 | HTML head carries og:title/description/url/image (absolute, with params) + twitter:card | smoke (local) | `npm run build && npm run start` then `curl -s "http://localhost:3000/?ur=90000"` piped to `grep -oE '<meta (property="og:[a-z:]+"\|name="twitter:[a-z]+")[^>]*>'` | — |
| PLAT-03 | Unfurl verified in a link-preview inspector | **manual-only** (checkpoint:human-verify) | LinkedIn Post Inspector on `https://milesworth.vercel.app/?ur=90000&mr=50000` + Vercel deployment → Open Graph tab; evidence = screenshot path or pasted inspector output in SUMMARY; plus `curl -sI "https://milesworth.vercel.app/og?ur=90000&mr=50000"` twice → `content-type: image/png`, second `x-vercel-cache: HIT` | — (justification: third-party crawler behavior cannot be exercised locally) |
| PLAT-04 | Email normalization, rejection of invalid/oversized input, honeypot rejection | unit | `npx vitest run tests/interest-validation.test.ts` | ❌ Wave 0 |
| PLAT-04 | Tease section present with copy + form; action wired | grep + typecheck | `grep -c "joinAdvisorWaitlist" src/components/advisor-tease.tsx` ≥ 1; `npm run typecheck` | — |
| PLAT-04 | Row lands in Neon on submit | **manual** (checkpoint) | submit on the deployed site, then a `scripts/db-check.ts`-style count or Neon console; evidence in SUMMARY | — |
| all | Build integrity: `ƒ /`, `ƒ /og`, `○ /methodology`; DB-free client tree; only `src/app/actions/interest.ts` imports `@/db` under `src/app` + `src/components` | build + grep | `npm run build` && `grep -rlE 'from "@/db\|drizzle' src/components src/app` → exactly `src/app/actions/interest.ts` | ✅ build script |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/<touched-area>.test.ts`
- **Per wave merge:** `npm test && npm run typecheck && npm run lint && npm run build`
- **Phase gate:** full suite + build green, production deploy, LinkedIn Post Inspector + Vercel OG tab evidence captured, one waitlist row confirmed — before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — add `resolve.alias` for `@` (verified pattern)
- [ ] `tests/share-content.test.ts` — PLAT-03 helper
- [ ] `tests/og-route.test.ts` — PLAT-03 route (requires vendored fonts to exist — order the font-vendoring task first)
- [ ] `tests/methodology-page.test.ts` — VAL-03 render assertions
- [ ] `tests/interest-validation.test.ts` — PLAT-04 validation
- No framework install needed.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Guest surfaces; Clerk arrives in Phase 6 |
| V3 Session Management | no | Stateless |
| V4 Access Control | no | All content public; the action creates a row, never reads PII back |
| V5 Input Validation | yes | `/og` and `generateMetadata`: `loadBalanceParams` → `paramsToBalances` → engine `sanitizeBalances` (triple layer, T-04-10); action: zod `z.email().max(254)` + honeypot literal-empty; never trust `FormData` shape |
| V6 Cryptography | no | Nothing secret handled; `DATABASE_URL` stays server-side in the action module only |
| V7 Error Handling | yes | Route + action return neutral messages; caught errors never rendered or logged (T-01-07) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Waitlist spam / enumeration | DoS / Tampering | Honeypot field, unique email with `onConflictDoNothing` (idempotent, no "already exists" leak), length cap; Vercel platform rate limits; optional Phase 7 hardening with Vercel WAF rules `[ASSUMED]` |
| OG route abuse (CPU via many param permutations) | DoS | Params sanitized to 8 bounded integers; engine binary search is bounded (T-03-05); CDN `s-maxage` absorbs repeats; PNG ~40–60 KB |
| Error-detail leakage from DB/action | Information disclosure | Catch-all with neutral copy; no `console.error(err)` of driver errors that may embed connection info |
| Client bundle contamination with DB driver | Information disclosure | Action in `src/app/actions/`; grep gate extended to assert the single importer |
| XSS via rendered share text | Tampering | Share strings are built from curated seed fields + formatters; JSX auto-escaping; no `dangerouslySetInnerHTML`; Satori renders text nodes, not HTML |
| Font supply-chain | Tampering | Vendor once from the pinned `@fontsource/*@5.3.0` tarball, commit the bytes, note source in a comment; no runtime fetch |
| Secrets in repo | Information disclosure | `.env*` remain gitignored; `db:push` reads env, never prints it |

## Sources

### Primary (HIGH confidence)
- nextjs.org (v16.3.4 docs, fetched 2026-09-02): `file-conventions/metadata/opengraph-image` (props = `params` only; static optimization; Node runtime local assets), `functions/image-response` (options, 500 KB limit, ttf/otf/woff only, Route Handler example), `functions/generate-metadata` (`metadataBase` rules incl. build error, shallow merge of `openGraph`, twitter fields), `guides/forms` (`"use server"` + zod + `useActionState`), `file-conventions/route-segment-config` (runtime default nodejs, edge deprecated)
- Context7 `/vercel/next.js` — `generateMetadata` searchParams Promise typing; Next 16 async `params`/`id` for image routes
- Context7 `/vercel/satori` — flexbox-only, no grid, `display: flex` for multi-child, TTF/OTF/WOFF only (no WOFF2), variable fonts limited
- nuqs.dev/docs/server-side — loader input types (Request/URL/URLSearchParams/string/object/Promise)
- orm.drizzle.team/docs/insert — `onConflictDoNothing({ target })`, `returning()`
- vercel.com/docs/caching/cdn-cache — `s-maxage`/`stale-while-revalidate` honored for function responses; cacheable criteria
- vercel.com/docs/deployment-protection — Hobby: previews protected, production public; `VERCEL_URL` caveat for OG
- vercel.com/docs/deployments/og-preview — Open Graph tab per deployment; works with protected routes
- linkedin.com/help/linkedin/answer/a521928 — four required OG tags; image ≥1200×627, 1.91:1, ≤5 MB
- **Executed this session:** `next/og` `ImageResponse` in plain Node with vendored Fraunces woff → 200 / image/png / custom Cache-Control / valid PNG; vitest node env with `@` alias resolving `@/data`, `@/engine`, `@/lib/*`; `react-dom/server` render; `loadBalanceParams(new Request(...))` and `(new URLSearchParams(...))`
- Codebase: `src/app/{layout,page}.tsx`, `src/components/*.tsx`, `src/lib/*.ts`, `src/engine/{types,valuation,ranking}.ts`, `src/data/{types,programs,redemptions-flights}.ts`, `src/db/{schema,index}.ts`, `scripts/seed.ts`, `vitest.config.ts`, `tsconfig.json`, `package.json`; `.planning/phases/03-*` and `04-*` RESEARCH/SUMMARY/UI-SPEC/VALIDATION; `.planning/research/{PITFALLS,FEATURES,ARCHITECTURE}.md`
- npm registry (2026-09-02): `@fontsource/fraunces` 5.3.0 (created 2021-01-10, repo fontsource/font-files), `@fontsource/inter` 5.3.0; jsDelivr font files 200 OK with sizes

### Secondary (MEDIUM confidence)
- vercel.com/kb/guide/using-custom-font — local file vs Google Fonts CSS fetch; 500 KB includes fonts
- WebSearch (LinkedIn preview guides, multiple sources agree): LinkedIn reads OG only (not Twitter tags), caches ~7 days, Post Inspector forces re-scrape

### Tertiary (LOW confidence)
- Platform dedupe on `og:url` (A1); Vercel cache key incl. query string (A2); Slack/iMessage tag consumption (A3); zod 4 `z.email()` (A8) — training knowledge, flagged in Assumptions Log

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero packages; every runtime piece executed locally or read from 16.3.4 docs
- Architecture: HIGH — route-handler-vs-file-convention decision verified against official docs; helper/test shapes proven in vitest
- Pitfalls: HIGH for framework/Satori/font mechanics; MEDIUM for social-platform caching/dedupe behavior (manual inspector step covers it)

**Research date:** 2026-09-02
**Valid until:** ~2026-10-02 (stable stack; note the live Amex→Hilton +30% window ends 2026-10-14 — cached OG images generated before then may show the bonus-adjusted figure for up to `s-maxage`)
