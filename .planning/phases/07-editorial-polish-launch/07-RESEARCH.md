# Phase 7: Editorial Polish & Launch - Research

**Researched:** 2026-09-15
**Domain:** Editorial design-system pass (Tailwind v4 tokens + next/image imagery), mobile/LinkedIn-WebView hardening, Lighthouse mobile gate, dataset launch-size gate, launch flips (noindex, robots, README)
**Confidence:** MEDIUM-HIGH (codebase audit HIGH; Next/Clerk/Tailwind/Lighthouse APIs HIGH via Context7; LinkedIn WebView behavior MEDIUM — no first-party LinkedIn docs exist, and its production WebView cannot be remote-debugged, so the real-device pass is the only ground truth)

No CONTEXT.md exists for this phase (user chose to plan from research + requirements). No UI-SPEC.md exists yet — this document is an upstream input to `/gsd-ui-phase 7`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLAT-02 | App is fully responsive and works in the LinkedIn in-app browser (mobile WebView tested before launch) | Current-State Audit (responsive inventory); Pattern 3 (viewport export + safe-area); Pattern 4 (canonical share URL); Pattern 5 (WebView detection + Google OAuth block); Pitfalls 1–7; Validation Architecture (emulated checks + mandatory real-device checkpoint) |
| PLAT-05 | Editorial travel design system (light, magazine-like, destination imagery, big numbers) applied across all pages | Current-State Audit (per-file deviations); Pattern 1 (tokenize the missing heading size + warm neutrals); Pattern 2 (destination image manifest + next/image static imports); Don't Hand-Roll; Validation Architecture (design-system source-scan gate + image-manifest test + UI-SPEC review) |

Roadmap Success Criterion 3 (Lighthouse + dataset launch size) has no requirement ID but is a phase gate — covered under "Lighthouse Mobile Gate" and "Dataset Launch-Size Gate" below.
</phase_requirements>

## Summary

Phase 7 is four workstreams that share one deadline: (1) an editorial polish pass over a codebase that already has the right bones — Fraunces + Inter via `next/font`, cream/ink/terracotta `@theme` tokens, a single `max-w-3xl` rail on every route, 44px touch targets, ink-only accent discipline — but has **zero destination imagery**, one un-tokenized heading size copy-pasted into seven files, cool-gray shadcn neutrals under a warm palette, and create-next-app leftovers (README, `public/*.svg`, default favicon) that a recruiter would notice; (2) LinkedIn in-app-browser hardening, where the codebase is already well-defended (no `100vh`, storage/clipboard guarded, modal sign-in, inputs `inputMode="numeric"` at 16px) and the real risks are **Google OAuth being hard-blocked inside every WebView** (`403 disallowed_useragent`), the "Copy my link" URL copying whatever junk is in `location.href`, and the fact that LinkedIn's production WebView **cannot be attached to Safari/Chrome remote debugging** — so the device pass is observational and must be a human checkpoint; (3) a repeatable Lighthouse mobile gate (`@lhci/cli` against the public production URL, 3 runs, category assertions) whose likely blockers are the Clerk client bundle, the new imagery if it lands above the fold, footer tap targets, and — until the launch flip — the `noindex` tag failing the SEO `is-crawlable` audit; (4) the dataset launch-size gate, where the truth is **36 entries / 34 Nick-verified** (not the "all null" STATE.md deferred row, which is stale), the engine already filters unverified rows, CI enforces a ≥30 floor, and the 80–120 roadmap target needs an explicit Nick decision because it costs 15–40 hours of his time.

**Primary recommendation:** Run Phase 7 as: Wave 0 decisions (custom domain or not, launch dataset number N) → tokens + image pipeline + component polish (no new runtime deps; imagery via static `next/image` imports from a typed manifest) → WebView hardening (viewport export, canonical share URL, clipboard fallback, `[LinkedInApp]` OAuth guard) → LHCI script + real-device checkpoint → dataset batches through the 02-05 human-verify pattern → launch flip (noindex off, `robots.ts`/`sitemap.ts`, `/account` route noindex, README, Post Inspector re-scrape).

## Project Constraints (from CLAUDE.md)

Two CLAUDE.md files apply: the parent-directory RuFlo file (`C:\Users\geoca\CLAUDE.md`) and the project file (`C:\Users\geoca\points-unlocked\CLAUDE.md`). Directives that bind this phase:

| Directive | Source | Phase 7 implication |
|-----------|--------|---------------------|
| NEVER save working files/tests/md to the repo root; use `/src`, `/tests`, `/docs`, `/config`, `/scripts` | RuFlo | LHCI config goes in `config/lighthouserc.cjs` (invoked with `--config`), image pipeline in `scripts/`, tests in `tests/`. Framework-required root files (`next.config.ts`, `vitest.config.ts`) are existing precedent. |
| NEVER proactively create `*.md`/README files | RuFlo | Editing the existing boilerplate `README.md` is allowed (it is the recruiter's first read); do not add new docs files. Image credits live in the TS manifest, not a new CREDITS.md. |
| Keep files under 500 lines; typed interfaces for public APIs; input validation at boundaries | RuFlo | `core-experience.tsx` is 385 lines — imagery/animation additions must not push it past 500; extract if needed. |
| ALWAYS run tests after code changes; verify build before commit | RuFlo | Every plan's verify step: `npm test && npm run typecheck && npm run lint && npm run build`. |
| NEVER commit secrets/.env | RuFlo + project | Vercel protection-bypass secret and any PSI API key stay in env, never in `config/`. |
| Next.js 16 App Router, Tailwind v4 `@theme` (no `tailwind.config.js`), shadcn vendored | Project | Add tokens to `globals.css` `@theme`; no JS config. |
| Images: sourced once, pre-cropped to a consistent editorial ratio, WebP ~1600w, committed to repo (or Vercel Blob past ~50MB), statically imported via `next/image` with `placeholder="blur"`, referenced by `imageSlug` → typed manifest. **Do not hotlink Unsplash at runtime.** Watch Vercel image-optimization quota | Project | This is the imagery pipeline contract — Pattern 2 below implements it verbatim. |
| `next/og` built in — do not install `@vercel/og`; `tw-animate-css` not `tailwindcss-animate`; `proxy.ts` not `middleware.ts`; no CSS-in-JS; no Pages Router | Project | Already honored; the design-system gate test should pin them. |
| `motion` (12.x) "optional but earns its keep for the one moment that matters … use sparingly. Skip everywhere else." | Project | Claude's discretion — see Alternatives: recommend **no** `motion` install for launch (perf budget + timeline); CSS entrance via `tw-animate-css` already installed. |
| Design: editorial travel aesthetic — light, magazine-like, destination imagery; Condé Nast meets fintech; big numbers carry the drama | Project | The PLAT-05 contract. |
| Valuations defensible; methodology transparent | Project | Dataset gate: nothing ships unverified (already structural). |
| GSD workflow enforcement (edits only via GSD commands) | Project | Planner output executes via `/gsd-execute-phase 7`. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Design tokens (heading size, warm neutrals, safe-area utility) | CDN / Static (CSS) | — | `@theme` in `globals.css` compiles to static CSS; no runtime |
| Destination imagery | CDN / Static (repo assets + Vercel image optimizer) | Browser (lazy `<img>` decode) | Static imports resolve at build; Vercel serves responsive AVIF/WebP variants; the manifest is a compile-time map |
| Viewport meta / theme-color / robots / sitemap | Frontend Server (SSR metadata) | — | Next `viewport`, `robots.ts`, `sitemap.ts` exports render at build/request |
| Share-URL canonicalization | Browser / Client | — | Lives in the client island; builds `SITE_URL + canonical query` from `balancesToParams` |
| WebView detection + OAuth hint | Browser / Client | — | UA sniffing is presentation-only (a hint), never an auth decision |
| Clerk sign-in inside WebView | Browser (Clerk modal) + external (Clerk FAPI) | Clerk Dashboard (social connections config) | Modal is in-page; OAuth providers are Dashboard config |
| Lighthouse gate | Dev tooling (local Chrome via LHCI) | External (PageSpeed Insights API cross-check) | Runs against the public production URL |
| Dataset launch size | Data layer (`src/data/*.ts` seeds) + CI test | Database (reseed Neon) | Truth is the typed seed files; Neon mirrors them |
| Launch flip (noindex, README, Post Inspector) | Frontend Server (metadata) | External (LinkedIn Post Inspector, Clerk/Vercel dashboards) | Metadata edits + external cache invalidation |

## Current-State Audit (Focus Area 1) — HIGH confidence, from source at HEAD `30428ed`

### Route inventory

| Route | File | Render | Shell | Design-system status |
|-------|------|--------|-------|----------------------|
| `/` | `src/app/page.tsx` → `src/components/core-experience.tsx` (385 lines, client island) | dynamic (ƒ) | `mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16`, `bg-cream` main | Hero h1 Fraunces `text-display md:text-display-xl` (ink); balance form; terracotta "Copy my link"; result cards; advisor tease. **No imagery anywhere.** |
| `/account` | `src/app/account/page.tsx` | dynamic (ƒ) | same rail, `h1 text-display` | Consistent; ink-only. **No route-level `robots` noindex** (06-REVIEW IN-05 — unfixed; layout-level noindex currently masks it). |
| `/methodology` | `src/app/methodology/page.tsx` (260 lines) | static (○) | same rail | Consistent; ink-only |
| `/privacy` | `src/app/privacy/page.tsx` (217 lines) | static (○) | same rail | Consistent; ink-only; `mailto:` link |
| `/og` | `src/app/og/route.tsx` | dynamic PNG | — | Already editorial (cream, Fraunces terracotta number, vendored fonts) |
| error boundary | `src/app/error.tsx` | client | same rail | Consistent |
| layout | `src/app/layout.tsx` | — | `html.h-full`, `body.min-h-full.flex.flex-col`, footer `mt-auto` | `robots: { index:false, follow:false }` (D-03 — removal is the explicit launch-gate task); **no `viewport` export** (Next default `width=device-width, initial-scale=1`; no `viewport-fit=cover`, no `theme-color`) |

### Shared components (`src/components/`, 1,807 lines total)

| File | Lines | Deviations / notes |
|------|-------|--------------------|
| `core-experience.tsx` | 385 | `SECTION_HEADING_CLASS = "font-heading text-ink text-[1.75rem] leading-tight font-semibold"` — **arbitrary value, not a token**; empty-state teaser card `CardTitle` repeats it. Copy-link copies `window.location.href` verbatim (Pitfall 3). Clipboard failure is a silent no-op with no user feedback (Pitfall 4). 385 lines — 115 from the 500 cap. |
| `result-card.tsx` | 152 | Same arbitrary `text-[1.75rem]` on `CardTitle`. Hero delta `font-display text-display text-terracotta` — correct. `Card` supports a leading `<img>` (`has-[>img:first-child]:pt-0`, `*:[img:first-child]:rounded-t-xl`) but none is rendered — the imagery slot exists and is empty. |
| `almost-there.tsx` | 94 | Same arbitrary heading size on `h2` and `CardTitle` |
| `advisor-tease.tsx` | 122 | Same arbitrary heading size; default (cool-neutral `--primary`) submit button |
| `balance-form.tsx` | 83 | `h-11 bg-white text-base` override on `NumericFormat` — but the vendored `Input` keeps `md:text-sm`, so desktop inputs render 14px (UI-SPEC body is 16px). Mobile is 16px → no iOS focus-zoom. `grid-cols-1 sm:grid-cols-2`. |
| `site-header.tsx` | 57 | Wordmark is Inter `text-sm font-semibold` — no display type; "Sign in" is `h-11`, but "My account" link has no min height (tap-target audit risk, Pitfall 9) |
| `site-footer.tsx` | 39 | Links are `text-sm` with `gap-2` stacked on mobile — **below Lighthouse tap-target size** (Pitfall 9); wordmark Inter |
| `save-balances-button.tsx`, `bookmark-button.tsx` | 100, 85 | `h-11` both branches; ink/outline — consistent |
| `account/*` (4 files) | 49–98 | Consistent ink-only |
| `ui/*` (button, card, dialog, input, label) | vendored radix-nova | `Card`: `rounded-xl ring-1 ring-foreground/10 bg-card text-sm` — ring derives from `--foreground` (ink) so it is warm; `Input`: `border-input` uses `--input: oklch(0.922 0 0)` — **cool gray** |

### Tokens (`src/app/globals.css`)

- Present: `--color-cream #faf7f2`, `--color-ink #262119`, `--color-terracotta #c05f33`, `--text-display 3rem/1.1/-0.02em`, `--text-display-xl 4.5rem/1.05/-0.025em`, `--font-sans` (Inter), `--font-display` and `--font-heading` (both Fraunces — redundant but harmless).
- **Missing:** a 28px heading token (UI-SPEC "Heading 28px Fraunces 600 1.2") — hence seven copies of `text-[1.75rem] leading-tight` across `core-experience.tsx` (×2), `result-card.tsx`, `almost-there.tsx` (×2), `advisor-tease.tsx`, `account/page.tsx`, `privacy/page.tsx`, `methodology/page.tsx`. Also no muted-ink token (`text-ink/70` is used consistently, which is fine to keep as the convention).
- **Cool neutrals under a warm palette:** `--border`, `--input`, `--ring`, `--muted`, `--secondary`, `--accent`, `--primary` are shadcn's default achromatic oklch values. Visible on input borders, focus rings, and default buttons. A `.dark {}` block with cool neutrals exists with no toggle — inert but a liability if any `dark:` class ever activates (`@custom-variant dark (&:is(.dark *))`).
- No `dvh`/`100vh`/`safe-area`/`env(` usage anywhere (grep = 0). `html.h-full` + `body.min-h-full` is the correct WebView-safe pattern already.

### Responsive usage (Focus Area 6)

`sm:` ×19, `md:` ×8, `lg:` ×2; `h-11` ×24 (touch targets). Every route is a single column inside `max-w-3xl`; UI-SPEC declares 360px as the floor and Phase 4's human walkthrough passed at that width. No horizontal-overflow risks found (no fixed widths; `min-w-44` on two CTAs = 176px, fits 360 − 32 padding). `flex-col sm:flex-row` on the CTA row.

### Launch hygiene leftovers

- `README.md` is the untouched create-next-app boilerplate (mentions Geist font) — a recruiter's GitHub landing.
- `public/` contains only `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` (create-next-app) — delete.
- `src/app/favicon.ico` is the scaffold default — brand it.
- `next.config.ts` is empty (`images.qualities` defaults to `[75]` in Next 16 — fine).
- Clerk runs on a **development instance** ("Development mode" badge in the modal, 100-user cap, `__clerk_db_jwt` URL handoff) because `*.vercel.app` cannot host a Clerk production instance `[CITED: clerk.com/docs/guides/development/managing-environments]`.

## Standard Stack

### Core (already installed — verified against `node_modules`)

| Library | Installed | Registry latest | Purpose | Note |
|---------|-----------|-----------------|---------|------|
| next | 16.3.4 | 16.3.5 | Framework | Above the 16.3.3 security floor. `next/image`'s `priority` prop is deprecated in favor of `preload` in 16 `[VERIFIED: Context7 /vercel/next.js get-img-props.ts]` |
| react / react-dom | 19.2.8 | — | — | — |
| tailwindcss | 4.3.3 | — | Styling | `h-dvh`/`min-h-dvh` built in `[VERIFIED: Context7 tailwindcss docs]`; **no built-in safe-area utilities** — use arbitrary `pb-[env(safe-area-inset-bottom)]` or a `@utility` (plugins exist only because it is absent) `[CITED: github.com/mvllow/tailwindcss-safe-area]` |
| @clerk/nextjs | 7.9.1 | 7.9.4 | Auth | `SignInButton` props: `mode`, `oauthFlow: "redirect"|"popup"|"auto"`, `fallbackRedirectUrl`, `forceRedirectUrl` `[VERIFIED: Context7 /clerk/clerk-docs sign-in-button.mdx]` |
| tw-animate-css | 1.4.0 | — | CSS entrance animations | Already installed by shadcn — use for card entrance instead of a JS animation lib |
| sharp | 0.35.4 (transitive, Next optional dep) | 0.35.4 | Image pipeline | Present in `node_modules` but **not in package.json** — add as devDependency to pin it for `scripts/optimize-images.ts` |
| vitest | 4.1.11 | — | Tests | 20 test files / ~289 tests, `tests/**/*.test.ts`, node env, `@` alias |

### Supporting (to add — dev-only)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@lhci/cli` | 0.15.1 (published by GoogleChrome; repo since 2019) | Repeatable Lighthouse runs with assertions, `numberOfRuns` median | `npm run lighthouse` phase gate; optional manual GitHub workflow |
| `lighthouse` | 13.4.1 (published 2026-07-20; GoogleChrome) | One-off HTML reports for debugging a failing category | `npx lighthouse <url> --output=html` |
| `sharp` (devDependency pin) | 0.35.4 | `resize({ width: 1600 }).webp({ quality })` in the one-off image script | Image pipeline only |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| No JS animation (CSS via `tw-animate-css` + a ~15-line rAF count-up honoring `prefers-reduced-motion`) | `motion` 13.3.0 (`motion/react`; note the major is now **13**, not the 12.x in CLAUDE.md) `[VERIFIED: npm view motion version 2026-09-14]` | `motion` gives `animate(0, n, { onUpdate })` + `useReducedMotion` `[VERIFIED: Context7 motion.dev]` but the hybrid `animate` needed for numeric tweens is a non-trivial client chunk on a page whose Lighthouse score is a phase gate, and the guidance is "use sparingly". **Recommend: no install for launch**; revisit if the UI-SPEC demands more than an entrance + count-up. |
| LHCI against production URL | `npx lighthouse` raw; PageSpeed Insights API (`GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=…&strategy=mobile`, no key needed at low volume, 240 req / 4 min published limit `[CITED: developers.google.com/speed/docs/insights/v5/get-started]`) | LHCI adds `numberOfRuns` + assertions (the gate); PSI is a free second opinion from Google's infra — use both: LHCI as the scripted gate, PSI as the human spot-check |
| Manual real-device pass (human checkpoint) | Playwright 1.63.0 with iPhone/Pixel device descriptors + custom UA `[LinkedInApp]` | Playwright can emulate the viewport + UA and catch layout regressions, but cannot emulate LinkedIn's WKWebView/Android-WebView feature set (OAuth block, clipboard, storage). Not worth adding a new framework for the launch; Chrome DevTools UA override covers emulation for free. |
| Static repo images (`src/images/destinations/*.webp`, ~20 files ≈ 3–4 MB) | Vercel Blob | CLAUDE.md threshold is ~50 MB; 20 sources at ≤200 KB is far below. Static imports give blur placeholders + dimensions for free. |
| Stay on Clerk dev instance | Buy a custom domain → Clerk production instance | Removes the "Development mode" badge and the 100-user cap; requires domain + DNS + `pk_live`/`sk_live` on Vercel + `NEXT_PUBLIC_SITE_URL` + LinkedIn Post Inspector re-scrape. Config task, no code change (06-RESEARCH Pitfall 2). **[NEEDS DECISION]** — Open Question 1. |

**Installation:**
```bash
npm install -D @lhci/cli@0.15.1 lighthouse@13.4.1 sharp@0.35.4
```

**Version verification (run 2026-09-15):** `npm view lighthouse version` → 13.4.1; `npm view @lhci/cli version` → 0.15.1; `npm view sharp version` → 0.35.4; `npm view motion version` → 13.3.0; `npm view next version` → 16.3.5; `npm view @clerk/nextjs version` → 7.9.4.

## Package Legitimacy Audit

slopcheck could not be installed in this session (`pip install slopcheck` produced no binary on PATH) — per protocol every package below is tagged `[ASSUMED]` and the planner must gate each install behind a `checkpoint:human-verify` task. Registry metadata was still gathered:

| Package | Registry | Age (created) | Source Repo | postinstall | slopcheck | Disposition |
|---------|----------|---------------|-------------|-------------|-----------|-------------|
| `lighthouse` | npm | 2012-03 | github.com/GoogleChrome/lighthouse | none | unavailable | `[ASSUMED]` — gate behind checkpoint; official GoogleChrome org |
| `@lhci/cli` | npm | 2019-09 | github.com/GoogleChrome/lighthouse-ci | none | unavailable | `[ASSUMED]` — gate behind checkpoint; official GoogleChrome org |
| `sharp` | npm | 2013-08 | github.com/lovell/sharp | none (uses prebuilt binaries via `@img/*` optional deps) | unavailable | `[ASSUMED]` — gate behind checkpoint; already present transitively via `next` |
| `motion` | npm | 2013-12 | github.com/motiondivision/motion | none | unavailable | Not recommended for install (see Alternatives) |
| `@playwright/test` | npm | 2020-09 | github.com/microsoft/playwright | none listed (browsers are a separate `npx playwright install`) | unavailable | Not recommended for install |

**Packages removed due to slopcheck [SLOP] verdict:** none (tool unavailable)
**Packages flagged as suspicious [SUS]:** none (tool unavailable)

*slopcheck was unavailable at research time: all packages above are `[ASSUMED]`; the planner must add a `checkpoint:human-verify` before the single `npm install -D` step.*

## Architecture Patterns

### System Architecture Diagram

```
                    ┌──────────────────────────── build time ────────────────────────────┐
 raw/*.jpg ──► scripts/optimize-images.ts (sharp: crop 3:2, 1600w, webp q75)          │
   (gitignored)        │                                                               │
                       ▼                                                               │
 src/images/destinations/<slug>.webp ──► src/images/destinations.ts (typed manifest)   │
                       │                         │  Record<ImageSlug, {image, credit}>  │
 src/data/*.ts ────────┼─── imageSlug ───────────┘                                     │
   (36 → N verified)   │                                                               │
 tests/image-manifest.test.ts  (fs listing ⟷ seed imageSlugs)                          │
 tests/design-system-gate.test.ts (tokens, no arbitrary heading, viewport export…)      │
 tests/seed-data.test.ts (verified ≥ N floor, 8-program reachability, provenance)       │
                    └───────────────────────────────────────────────────────────────────┘

 ┌─ request: LinkedIn WebView (UA "[LinkedInApp]", Android adds "wv") ────────────────────┐
 │  GET /?ur=90000&mr=50000                                                               │
 │     ├─ layout.tsx: viewport {viewportFit:"cover", themeColor:cream}, fonts, metadata    │
 │     ├─ page.tsx (SSR): auth() → props; generateMetadata → og:image /og?…&d=            │
 │     └─ core-experience island: nuqs URL → engine → ResultCard(+ <Image> from manifest) │
 │            ├─ "Copy my link" → SITE_URL + canonical query (never location.href)         │
 │            │      ├─ navigator.clipboard.writeText  ─ ok → "Link copied"                │
 │            │      └─ throws/absent → reveal read-only URL field (visible fallback)      │
 │            └─ "Sign in to save" → Clerk modal (in-page)                                 │
 │                   ├─ email code ─ works in WebView                                      │
 │                   └─ Google OAuth ─ redirect inside WebView → Google 403 (blocked)      │
 │                        → guard: UA has "[LinkedInApp]" → show "Open in browser" hint   │
 └────────────────────────────────────────────────────────────────────────────────────────┘

 ┌─ gates ────────────────────────────────────────────────────────────────────────────────┐
 │ npm run lighthouse  → lhci autorun --config=config/lighthouserc.cjs (prod URLs, 3 runs)│
 │ PSI API spot-check  → curl runPagespeed?strategy=mobile                                │
 │ checkpoint:human-verify → phone inside LinkedIn app (observational — no remote debug)  │
 │ checkpoint:human-verify → Nick verifies dataset batch (02-05 pattern)                  │
 │ launch flip → remove layout noindex, add robots.ts/sitemap.ts, /account noindex,       │
 │               README, favicon, Post Inspector re-scrape                                │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure (additions only)

```
config/
└── lighthouserc.cjs            # LHCI collect/assert config (RuFlo: no root config files)
scripts/
└── optimize-images.ts          # one-off sharp pipeline raw/ → src/images/destinations/
src/images/
├── destinations/               # <imageSlug>.webp, 3:2, 1600w (committed)
└── destinations.ts             # typed manifest: slug → { image: StaticImageData, credit }
src/app/
├── robots.ts                   # allow /, disallow /account; sitemap URL
├── sitemap.ts                  # /, /methodology, /privacy
└── icon.png (or favicon.ico)   # branded
tests/
├── design-system-gate.test.ts  # source-scan pins (PLAT-05, PLAT-02)
├── image-manifest.test.ts      # every seed imageSlug has a file + manifest entry
└── launch-gate.test.ts         # noindex removed from layout; /account noindex; robots/sitemap exist
raw/                            # gitignored source photos (not committed)
```

### Pattern 1: Tokenize the missing heading size and warm the neutrals

**What:** Add `--text-heading` (1.75rem / 1.2) to `@theme` and replace all seven `text-[1.75rem] leading-tight` copies with `text-heading`; re-derive the shadcn neutral variables from ink so borders/rings/inputs/buttons stop being cool gray; delete the inert `.dark {}` block.
**When to use:** First plan of the phase — every later component touch depends on it.
**Example:**
```css
/* src/app/globals.css — Source: Tailwind v4 @theme docs (tailwindcss.com/docs/theme) */
@theme {
  --color-cream: #faf7f2;
  --color-ink: #262119;
  --color-terracotta: #c05f33;

  --text-heading: 1.75rem;            /* UI-SPEC "Heading 28px" — was text-[1.75rem] ×7 */
  --text-heading--line-height: 1.2;
  --text-display: 3rem;               /* unchanged */
  --text-display--line-height: 1.1;
  --text-display--letter-spacing: -0.02em;
  --text-display-xl: 4.5rem;
  --text-display-xl--line-height: 1.05;
  --text-display-xl--letter-spacing: -0.025em;
}

:root {
  --background: #faf7f2;
  --foreground: #262119;
  /* warm neutrals derived from ink instead of shadcn's achromatic oklch */
  --border: color-mix(in oklab, #262119 12%, transparent);
  --input:  color-mix(in oklab, #262119 16%, transparent);
  --ring:   color-mix(in oklab, #262119 40%, transparent);
  --muted-foreground: color-mix(in oklab, #262119 70%, transparent);
  --primary: #262119;                  /* ink buttons */
  --primary-foreground: #faf7f2;
  /* …keep --card white, --radius 0.625rem … */
}
```
`[ASSUMED]` that `color-mix()` is acceptable in the target WebViews — it is supported in Safari 16.2+/Chrome 111+, and the sampled LinkedIn UAs run WebKit 605 (iOS 18) and Chrome/151. Plain hex values are an equally valid, zero-risk alternative.

### Pattern 2: Destination imagery — static imports through a typed manifest

**What:** One WebP per `imageSlug` (20 today), committed under `src/images/destinations/`, exposed by a manifest that maps slug → `StaticImageData` + credit. `ResultCard` renders it as the Card's leading image with `placeholder="blur"`, `sizes` matched to the `max-w-3xl` rail, and lazy loading (default). A DB-free vitest test proves every seed `imageSlug` has a file and a manifest entry.
**When to use:** Cards and (optionally) a small editorial band on `/`. Keep imagery **below the fold on mobile** unless the UI-SPEC chooses a hero image — see Pitfall 8.
**Example:**
```ts
// src/images/destinations.ts — Source: Next.js static image imports
// (nextjs.org/docs/app/getting-started/images) [VERIFIED: Context7 /vercel/next.js]
import type { StaticImageData } from "next/image";
import tokyo from "./destinations/tokyo.webp";
import maldives from "./destinations/maldives.webp";
// … one import per slug …

export interface DestinationImage {
  image: StaticImageData;          // width/height/blurDataURL provided automatically
  alt: string;
  credit: { photographer: string; source: "Unsplash" | "Pexels" };
}

export const DESTINATION_IMAGES = {
  tokyo:    { image: tokyo,    alt: "Tokyo skyline at dusk", credit: { photographer: "…", source: "Unsplash" } },
  maldives: { image: maldives, alt: "Overwater villas, Maldives", credit: { photographer: "…", source: "Unsplash" } },
  // …
} as const satisfies Record<string, DestinationImage>;

export type ImageSlug = keyof typeof DESTINATION_IMAGES;

export function getDestinationImage(slug: string | null): DestinationImage | null {
  return slug !== null && slug in DESTINATION_IMAGES
    ? DESTINATION_IMAGES[slug as ImageSlug]
    : null;                        // typed map lookup — never a filesystem path
}
```
```tsx
// in result-card.tsx — Source: next/image docs (Context7 /vercel/next.js image.mdx)
import Image from "next/image";
const art = getDestinationImage(redemption.imageSlug);
<Card>
  {art && (
    <Image
      src={art.image}
      alt={art.alt}
      placeholder="blur"
      sizes="(min-width: 768px) 768px, 100vw"   // max-w-3xl rail
      className="aspect-[3/2] w-full object-cover"
      // no `preload`/`priority`: cards are below the fold on mobile
    />
  )}
  …
```
```ts
// scripts/optimize-images.ts — Source: sharp.pixelplumbing.com/api-output (webp options)
import sharp from "sharp";
await sharp(input)
  .resize({ width: 1600, height: 1067, fit: "cover", position: "attention" })
  .webp({ quality: 75, effort: 6 })
  .toFile(`src/images/destinations/${slug}.webp`);
```
Licensing: the Unsplash License grants free commercial use of **downloaded** photos with no attribution required; the attribution + hotlinking rules apply only to **API** usage — which this pipeline does not use `[CITED: unsplash.com/license; unsplash.com/api-terms]`. Keep the photographer credit in the manifest anyway (CLAUDE.md asks for a credits note) and surface "Photos via Unsplash" in the footer or `/methodology`.

### Pattern 3: `viewport` export + safe-area padding (WebView chrome)

**What:** Export a `viewport` object from `layout.tsx` with `viewportFit: "cover"` and a cream `themeColor`; pad the footer/bottom CTAs with `env(safe-area-inset-bottom)`. Do **not** set `maximumScale: 1` / `userScalable: false` — Lighthouse accessibility fails the `meta-viewport` audit on zoom-disabling viewports.
**Example:**
```tsx
// src/app/layout.tsx — Source: nextjs.org/docs/app/api-reference/functions/generate-viewport
// [VERIFIED: Context7 /vercel/next.js generate-viewport.mdx for themeColor/width/initialScale;
//  viewportFit key is [ASSUMED] — confirm with `npm run typecheck`]
import type { Viewport } from "next";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf7f2",
};
```
```css
/* globals.css — Tailwind v4 has no safe-area utilities; define one */
@utility pb-safe {
  padding-bottom: max(--spacing(8), env(safe-area-inset-bottom));
}
```

### Pattern 4: Canonical share URL (never `location.href`)

**What:** "Copy my link" should copy `${SITE_URL}/?${canonicalQuery}` built from `balancesToParams(balances)` — the same canonical query `buildShareContent`/`og:url` already use — so Clerk's dev-instance `__clerk_db_jwt`, LinkedIn tracking params, or any junk key never lands in a shared link. Pair it with a visible clipboard fallback.
**Example:**
```tsx
// core-experience.tsx (island) — SITE_URL from "@/lib/site" is already client-safe (NEXT_PUBLIC_ or constant)
function shareUrl(balances: Balances): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(balancesToParams(balances))) if (v !== null) q.set(k, String(v));
  const s = q.toString();
  return s ? `${SITE_URL}/?${s}` : `${SITE_URL}/`;
}

async function handleCopyLink() {
  const url = shareUrl(balances);
  try {
    await navigator.clipboard.writeText(url);   // needs secure context + user gesture
    setCopied(true);
  } catch {
    setFallbackUrl(url);   // render a read-only <input value={url} readOnly onFocus={e => e.currentTarget.select()} />
  }
}
```
`navigator.share` is **not** reliably available inside WebViews `[CITED: github.com/react-native-webview/react-native-webview/issues/1262 — MEDIUM]`; treat it as optional progressive enhancement only if the device pass proves it works in LinkedIn's browser.

### Pattern 5: `[LinkedInApp]` detection — a hint, never an auth decision

**What:** Detect the LinkedIn in-app browser client-side to (a) suppress or annotate Google OAuth (which Google hard-blocks in every embedded WebView with `403 disallowed_useragent` `[CITED: developers.googleblog.com — enforcement since 2021/2023; auth0.com/blog]`), and (b) offer an "Open in your browser" hint. Verified UA shapes `[CITED: explore.whatismybrowser.com/useragents/explore/software_name/linkedin-app/]`:
- iOS: `… (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 … Mobile/15E148 Safari/604.1 [LinkedInApp]/9.78.4909`
- Android: `… (Linux; Android 16; SM-A176U Build/…; wv) AppleWebKit/537.36 … Chrome/151.0.7922.85 Mobile Safari/537.36 [LinkedInApp]/2.312.70` (note the `; wv)` WebView marker)
**Example:**
```ts
// src/lib/in-app-browser.ts — pure, testable
export function isLinkedInInAppBrowser(ua: string): boolean {
  return ua.includes("[LinkedInApp]") || ua.includes("LinkedInApp");
}
// iOS 17+ can hand the page to Safari via the x-safari- scheme:
//   location.href = "x-safari-" + url   [CITED: felixcarmona.com — single source, MEDIUM]
// Prefer the passive hint ("tap ⋯ → Open in browser") over auto-redirecting.
```
Read the UA in an effect (never during render — hydration must stay exact, Phase 4 Pitfall 2). Whether Google is even enabled on the Clerk instance is Dashboard state (06-01 plan said "enable Google if you want") — Open Question 2.

### Pattern 6: Lighthouse CI against the public production URL

**What:** `config/lighthouserc.cjs` collects the four launch URLs 3× each (mobile emulation is Lighthouse's default) and asserts category minimums; `npm run lighthouse` runs it locally with the installed Chrome. Optional: a manual-dispatch GitHub workflow — do not put it on every push (Lighthouse is noisy and the CI runner's network differs).
**Example:**
```js
// config/lighthouserc.cjs — Source: github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
// [VERIFIED: Context7 /googlechrome/lighthouse-ci — collect.url list, numberOfRuns, assert.assertions, upload target]
const BASE = process.env.LHCI_BASE_URL ?? "https://milesworth.vercel.app";
module.exports = {
  ci: {
    collect: {
      url: [`${BASE}/`, `${BASE}/?ur=90000&mr=50000`, `${BASE}/methodology`, `${BASE}/privacy`],
      numberOfRuns: 3,
      settings: { chromeFlags: "--headless=new" },
    },
    assert: {
      assertions: {
        "categories:performance":    ["error", { minScore: 0.85, aggregationMethod: "median" }],
        "categories:accessibility":  ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo":            ["error", { minScore: 0.90 }],   // fails until noindex is removed (Pitfall 10)
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },   // add .lighthouseci/ to .gitignore
  },
};
```
```json
// package.json scripts
"lighthouse": "lhci autorun --config=config/lighthouserc.cjs"
```
Thresholds are `[ASSUMED]` (no authoritative "launch-worthy" number exists); rationale: `/` carries Clerk's client bundle and per-request SSR so 85 is realistic, the static routes should clear 90+, and accessibility/best-practices have no structural blockers. Tune after the first baseline run — record the baseline in the plan's SUMMARY.

### Pattern 7: Launch flip (metadata) — atomic, tested

**What:** One plan that (1) removes `robots: { index:false }` from `layout.tsx`, (2) adds `robots: { index:false, follow:false }` to `/account`'s `metadata` (closes 06-REVIEW IN-05), (3) adds `app/robots.ts` (allow `/`, disallow `/account`, sitemap URL) and `app/sitemap.ts` (`/`, `/methodology`, `/privacy`), (4) rewrites README, (5) replaces favicon, (6) ends with a human checkpoint: LinkedIn Post Inspector re-scrape of the launch share link.
**Example:**
```ts
// src/app/robots.ts — Source: nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
// [VERIFIED: Context7 /websites/nextjs]
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: "/account" }, sitemap: `${SITE_URL}/sitemap.xml` };
}
```
`app/sitemap.ts` must not call `new Date()` if it is to stay static — use a constant `lastModified` (same T-05-05 reasoning as `PRIVACY_LAST_UPDATED`).

### Anti-Patterns to Avoid

- **Hotlinking Unsplash/Pexels URLs or adding `images.remotePatterns`:** violates CLAUDE.md and couples the demo to a third party. Static imports only.
- **`h-screen` / `100vh` anywhere:** WebView toolbars make `100vh` taller than the visible area; the current `min-h-full` flex shell is correct — the design-system gate should forbid `h-screen`/`100vh`/`min-h-screen`.
- **`maximumScale: 1` / `userScalable: false`:** fails Lighthouse a11y `meta-viewport` and hurts low-vision users.
- **Reading `navigator.userAgent` during render:** hydration mismatch. Effects only.
- **Auto-redirecting LinkedIn users to Safari:** hostile UX for the recruiter who is already reading; show a hint.
- **Putting a full-bleed hero photo above the balance form on mobile:** turns the LCP element from text into a multi-hundred-KB image on a slow-4G-throttled audit (Pitfall 8).
- **`new Date()` in `sitemap.ts`/`robots.ts`:** silently makes them dynamic (T-05-05 precedent).
- **Raising the seed floor test to the aspirational 80–120 before Nick has verified that many:** CI goes red for weeks. Raise it to the agreed N only in the plan that lands the verified batch.
- **Growing `core-experience.tsx` past 500 lines:** extract the copy-link/share block into its own client component instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive image variants, blur placeholders, dimensions | A custom `<picture>`/srcset generator or manual `blurDataURL` | `next/image` static imports (+ Vercel optimizer) | Automatic width/height (no CLS), inlined blur, AVIF/WebP negotiation, `sizes`-driven srcset `[VERIFIED: Context7]` |
| WebP encoding / cropping | ImageMagick shell loops, online converters per file | `sharp` script | Deterministic, repeatable, one command for 20+ files; already a Next dependency |
| Lighthouse repeatability/median | Ad-hoc PageSpeed screenshots | `@lhci/cli` `numberOfRuns` + assertions | Lighthouse variance between single runs is large; assertions make it a gate, not an opinion |
| robots.txt / sitemap.xml | Hand-written files in `public/` | `app/robots.ts` + `app/sitemap.ts` | Typed, uses `SITE_URL`, cached statically, one source for the host `[VERIFIED: Context7]` |
| Viewport/theme-color meta | Manual `<meta>` in layout | Next `viewport` export | Type-checked; deduped with Next's own defaults `[VERIFIED: Context7]` |
| Design-system regression checks | Visual diff tooling | Source-scan vitest tests (the `guest-flow-gate.test.ts` precedent) | Zero infra; pins tokens/patterns in CI in <1s |
| Safe-area padding | Per-component `padding-bottom` hacks | One `@utility pb-safe` in `globals.css` | Single definition; `max()` keeps the desktop padding |

**Key insight:** every "polish" primitive this phase needs is either built into Next/Tailwind or already vendored; the only new runtime code is a small manifest, a viewport export, and a share-URL helper. New dependencies are dev-only.

## Runtime State Inventory

Not a rename/refactor phase — omitted. External state the **launch flip** touches (not code): Clerk Dashboard (social connections; instance type), Vercel project (domain, env vars if a domain is bought), LinkedIn Post Inspector cache for the share link (re-scrape after the final deploy), Neon (reseed after the dataset batch). Each appears as a human step in the relevant plan.

## Common Pitfalls

### Pitfall 1: Google OAuth is hard-blocked inside LinkedIn's browser
**What goes wrong:** Tapping "Continue with Google" in the Clerk modal redirects inside the WebView; Google returns `403 disallowed_useragent`. The recruiter's sign-up attempt dies on a Google error page.
**Why it happens:** Google refuses OAuth from embedded WebViews (iOS WKWebView and Android `wv`) `[CITED: developers.googleblog.com; auth0.com/blog/google-blocks-oauth-requests-from-embedded-browsers]`.
**How to avoid:** Keep **Email code** as the primary strategy (works in-page); either disable Google on the Clerk instance for launch or gate it behind Pattern 5's hint. Verify on the real device.
**Warning signs:** Any social button in the modal during the device pass.

### Pitfall 2: LinkedIn's production WebView cannot be remote-debugged
**What goes wrong:** Planning a "connect Safari Web Inspector / chrome://inspect" step that can never work.
**Why it happens:** iOS 16.4+ requires the host app to set `WKWebView.isInspectable = true` `[CITED: webkit.org/blog/13936]`; Android requires `setWebContentsDebuggingEnabled(true)` `[CITED: developer.chrome.com/docs/devtools/remote-debugging/webviews]`. Store builds of LinkedIn do neither.
**How to avoid:** Do emulation locally (Chrome DevTools → device toolbar → custom UA with `[LinkedInApp]` and, for Android, `; wv)`), then a human checkpoint on the phone with a written checklist and screenshots. Get the link into the app by DM'ing yourself the production URL and tapping it.
**Warning signs:** A plan task that says "attach the inspector to the LinkedIn WebView".

### Pitfall 3: "Copy my link" copies `location.href` verbatim
**What goes wrong:** Shared links carry Clerk's dev-instance `__clerk_db_jwt` (transmitted via query string on development instances `[CITED: clerk.com docs clerkdbjwt-vs-client-cookie]`), LinkedIn/utm tracking params, or a reordered/duplicated query.
**Why it happens:** `navigator.clipboard.writeText(window.location.href)` in `core-experience.tsx`.
**How to avoid:** Pattern 4 — build from `SITE_URL` + canonical `balancesToParams`.
**Warning signs:** Any `?` params other than the eight short keys in a pasted link during the device pass. `[ASSUMED]` that the JWT param actually surfaces after a modal email-code sign-in (it is documented for cross-domain handoffs); the fix is correct regardless.

### Pitfall 4: Clipboard silently fails and the user sees nothing
**What goes wrong:** In a WebView that denies `navigator.clipboard`, the button does nothing — no "Link copied", no URL.
**Why it happens:** The T-04-14 guard swallows the rejection with no fallback UI.
**How to avoid:** Reveal a read-only, pre-selected URL field on failure (Pattern 4). Do not rely on `navigator.share` in WebViews.
**Warning signs:** Device pass: tap "Copy my link", then paste into a LinkedIn message — nothing pastes.

### Pitfall 5: Preview deployments are behind Vercel Authentication
**What goes wrong:** A preview URL sent to a phone prompts for a Vercel login inside LinkedIn's browser.
**Why it happens:** Standard Protection is on by default for all non-production deployments `[CITED: vercel.com/docs/deployment-protection]`.
**How to avoid:** Test **production** (`branching_strategy: none` — main auto-deploys, production is unprotected). If a pre-merge phone test is ever needed, use a Vercel Shareable Link or the `?x-vercel-protection-bypass=<secret>&x-vercel-set-bypass-cookie=true` query (secret in env only) `[CITED: vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection]`.
**Warning signs:** A Vercel login page in the WebView.

### Pitfall 6: `mailto:` and `target="_blank"` inside the WebView
**What goes wrong:** The `/privacy` contact `mailto:` may do nothing in LinkedIn's browser; new-window links may be swallowed. `[ASSUMED]`
**How to avoid:** Render the email address as visible, selectable text next to the link; avoid `target="_blank"` (there are no external links today — keep it that way, including the credits link).
**Warning signs:** Tapping the mailto on device produces no Mail sheet.

### Pitfall 7: Zoom-disabling viewport or sub-16px inputs
**What goes wrong:** Lighthouse a11y `meta-viewport` failure; or iOS auto-zooms on input focus when font-size < 16px.
**How to avoid:** Pattern 3 viewport (no `maximumScale`), keep inputs `text-base` on mobile (already true; desktop `md:text-sm` from the vendored `Input` is a minor spec deviation — override with `md:text-base` in the polish pass).

### Pitfall 8: Imagery flips the LCP element from text to a heavy image
**What goes wrong:** Mobile performance drops 10–20 points after adding a hero photo.
**Why it happens:** Lighthouse mobile throttles to slow 4G/4× CPU; a 1600w hero above the fold is the LCP candidate.
**How to avoid:** Keep the h1 as the first paint on mobile; put imagery on result cards (below the fold → lazy). If the UI-SPEC insists on a hero image: `preload` (Next 16 name; `priority` is deprecated `[VERIFIED: Context7]`), `sizes="100vw"`, ≤ ~60 KB at 640w, and `fetchPriority` via `preload`. Re-run LHCI before/after.
**Warning signs:** LHCI "Largest Contentful Paint element" is an `<img>`.

### Pitfall 9: Footer/header links fail the mobile tap-target audit
**What goes wrong:** Lighthouse SEO "Tap targets are not sized appropriately" (needs ≥ 48×48 CSS px with spacing) on `site-footer.tsx` (`text-sm`, `gap-2`) and the "My account" header link.
**How to avoid:** Give nav links a `min-h-11` (44px) box with `py-2`/`gap-3`, matching the 44px rule already used elsewhere. `[ASSUMED]` exact audit thresholds; the fix is cheap either way.

### Pitfall 10: The SEO gate fails until the noindex flip — by design
**What goes wrong:** LHCI's `categories:seo` assertion fails on every pre-launch run because `robots: { index:false }` trips the `is-crawlable` audit `[ASSUMED — well-known audit]`.
**How to avoid:** Run the LHCI gate twice: once pre-flip with SEO set to `warn`, once post-flip with `error`. Or land the flip before the gate plan.

### Pitfall 11: Clerk's client bundle is the largest third-party cost on `/`
**What goes wrong:** "Reduce unused JavaScript" flags `@clerk/clerk-js`/UI chunks (tens of KB unused on the guest flow) `[CITED: community Lighthouse audits — LOW/MEDIUM]`.
**Why it happens:** `ClerkProvider` + `SignInButton`/`UserButton` load the full clerk-js; `headless` variant is unavailable when prebuilt components are used.
**How to avoid:** Accept for launch (it is async and does not block LCP); do not add analytics or other third-party scripts on top of it. If TBT is the failing metric, the header's `UserButton` is the only candidate for `next/dynamic` deferral.

### Pitfall 12: Raising the seed floor before the data exists
**What goes wrong:** CI red for the duration of Nick's verification.
**How to avoid:** Raise `tests/seed-data.test.ts`'s `≥30` floor to the agreed N only in the plan task that also lands the verified batch (02-05 Task 2 pattern).

### Pitfall 13: Stale planning bookkeeping misleads the plan
**What goes wrong:** STATE.md's Deferred row says "All 36 entries remain `verifiedAt: null`"; ROADMAP shows Phase 2/3 unchecked and Phase 2 "0/TBD"; REQUIREMENTS leaves DATA-01..04 unchecked — but `02-05-SUMMARY.md` and the seed files show 34/36 verified with the coverage gate active.
**How to avoid:** The dataset plan should start from the seed-file truth (`npx tsx -e` count: 36 / 34 verified / 2 held) and the transition step should tick DATA-02/03/04 and the Phase 2/3 roadmap boxes.

## Lighthouse Mobile Gate (Focus Area 3)

- **Run locally:** `npx lighthouse "https://milesworth.vercel.app/?ur=90000&mr=50000" --only-categories=performance,accessibility,best-practices,seo --output=html --output=json --output-path=./.lighthouseci/results --chrome-flags="--headless=new"` — mobile emulation + slow-4G/4× CPU throttling are the defaults `[CITED: github.com/GoogleChrome/lighthouse readme]`. Chrome is at `C:\Program Files\Google\Chrome\Application\chrome.exe`.
- **Repeatable gate:** Pattern 6 (`lhci autorun`, 3 runs, median). Add `.lighthouseci/` to `.gitignore`.
- **Second opinion:** `curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://milesworth.vercel.app/&strategy=mobile"` → `lighthouseResult.categories.{performance,accessibility,best-practices,seo}.score`.
- **Expected blockers, in order of likelihood:** Clerk JS (unused bytes/TBT) → new imagery if above the fold → footer tap targets → noindex (SEO) until the flip → Fraunces variable font weight (next/font self-hosts with `display: swap` and metric-compatible fallback, so CLS is already handled; check the served woff2 size in the report).
- **What "launch-worthy" means here:** `[ASSUMED]` Perf ≥ 85 on `/` (dynamic + Clerk), ≥ 90 on static routes; A11y ≥ 95; Best Practices ≥ 95; SEO ≥ 90 post-flip. Record the first baseline and adjust the config thresholds to "baseline − noise", not to aspiration.

## Dataset Launch-Size Gate (Focus Area 5)

**Truth at HEAD (from `src/data` via tsx, 2026-09-15):** 36 redemptions (21 flights / 15 hotels), **34 verified** `2026-09-01`, 2 held drafts (`st-regis-maldives`, `gritti-palace-venice` — Nick's ruling: manual marriott.com check needed), 8 `featured`, all 36 carry an `imageSlug` (20 unique: tokyo, singapore, hong-kong, hawaii, london, paris, frankfurt, dubai, istanbul, doha, amsterdam, big-sur, kauai, austin, cancun, maldives, bora-bora, maui, kyoto, venice), 21 programs, 46 routes, 1 dated bonus.

**Mechanisms already in place:**
- `verifiedAt: null` = draft; the engine's A5 filter never ranks drafts (DATA-04 is structural, not disciplinary).
- `tests/seed-data.test.ts`: `verified.length ≥ 30` + every enterable program reachable by a verified entry + provenance test (sourceNote starts with "Verified ", no "CLAUDE DRAFT").
- `npm run db:seed` idempotent delete-then-insert; `scripts/db-check.ts` prints counts.
- The 02-05 pattern: `checkpoint:human-verify gate="blocking"` (Nick rules per slug with `verifiedAt` dates) → auto task applies corrections + raises the floor → auto task reseeds Neon twice and asserts the DB count.

**What the launch-size plan needs:**
1. **[NEEDS DECISION] the number N.** Roadmap says 80–120; STATE says "launch thin (30+) if needed"; PROJECT.md estimates 15–40 h of Nick's time. Gap from 34: +46 to +86 entries. The planner should open with a checkpoint that fixes N and a per-batch cadence (e.g., 2 batches of ~15–20) rather than assume 80.
2. Claude drafts batches with `verifiedAt: null`, `sourceNote: "CLAUDE DRAFT — check …"`, and `imageSlug` — new destinations require new images through Pattern 2 (the image-manifest test enforces it).
3. Balance coverage per program: the reachability test guarantees ≥1 verified path per program; the plan should target the thinnest programs (Capital One, Citi, Bilt are typically the thin ones — `[ASSUMED]`, verify by counting `chosenPath.fromProgramSlug` over a balanced sample or by partner-slug distribution).
4. Resolve the 2 held drafts (data-only change).
5. Raise the CI floor to N in the same commit as the verified batch; reseed Neon; assert `verified_at is not null` count ≥ N via the 02-05 T3 one-liner.
6. Re-stamp note: existing stamps read "Verified Sep 1, 2026" — fine, but Nick may want a launch-week re-verification of the featured 8 and the one dated bonus (it may have expired by launch; the engine handles dates, but the badge copy should be checked on device).

## Code Examples

### Design-system gate (source-scan test, `guest-flow-gate.test.ts` precedent)
```ts
// tests/design-system-gate.test.ts — DB-free, node env
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");
function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.match(/\.(tsx?|css)$/) ? [join(dir, e.name)] : []);
}
const files = walk(SRC).map((p) => [p, readFileSync(p, "utf8")] as const);

describe("PLAT-05 editorial design system", () => {
  it("uses the heading token, never the arbitrary 1.75rem size", () => {
    for (const [p, s] of files) expect(s, p).not.toMatch(/text-\[1\.75rem\]/);
  });
  it("declares the heading token in globals.css", () => {
    const css = readFileSync(join(SRC, "app/globals.css"), "utf8");
    expect(css).toMatch(/--text-heading:\s*1\.75rem/);
    expect(css).not.toMatch(/^\.dark\s*\{/m);
  });
});

describe("PLAT-02 WebView hardening", () => {
  it("never uses viewport-height units that lie inside WebViews", () => {
    for (const [p, s] of files.filter(([p]) => !p.endsWith(".css")))
      expect(s, p).not.toMatch(/\b(h-screen|min-h-screen|100vh)\b/);
  });
  it("exports a viewport with viewport-fit cover and no zoom lock", () => {
    const layout = readFileSync(join(SRC, "app/layout.tsx"), "utf8");
    expect(layout).toMatch(/export const viewport/);
    expect(layout).toMatch(/viewportFit:\s*"cover"/);
    expect(layout).not.toMatch(/userScalable:\s*false|maximumScale:\s*1\b/);
  });
  it("builds the share link from the canonical query, not location.href", () => {
    const island = readFileSync(join(SRC, "components/core-experience.tsx"), "utf8");
    expect(island).not.toMatch(/clipboard\.writeText\(window\.location\.href\)/);
  });
});
```

### Image-manifest coverage test
```ts
// tests/image-manifest.test.ts
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { redemptions } from "@/data";
// Do NOT import the manifest (vitest node env cannot load .webp static imports); read the directory instead.
const files = new Set(readdirSync(join(process.cwd(), "src/images/destinations")).map((f) => f.replace(/\.webp$/, "")));

describe("destination imagery", () => {
  it("has a WebP for every redemption imageSlug", () => {
    const missing = [...new Set(redemptions.map((r) => r.imageSlug))].filter((s) => s !== null && !files.has(s));
    expect(missing, `missing images: ${missing.join(", ")}`).toEqual([]);
  });
});
```

### Reduced-motion-safe count-up (no dependency)
```tsx
// src/components/count-up.tsx — ~20 lines, honors prefers-reduced-motion; render the FINAL formatted
// string on the server so SSR/hydration match, then animate only after mount.
"use client";
import { useEffect, useState } from "react";
export function CountUp({ cents, format }: { cents: number; format: (c: number) => string }) {
  const [shown, setShown] = useState(cents);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now(), from = Math.round(cents * 0.6), d = 600;
    let raf = requestAnimationFrame(function tick(t) {
      const p = Math.min(1, (t - start) / d), e = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(from + (cents - from) * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [cents]);
  return <>{format(shown)}</>;
}
```
(Only if the UI-SPEC asks for it; the hero must still render the exact conservative figure once settled — UI-SPEC number rule.)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next/image` `priority` | `preload` | Next 16 | Use `preload` for any above-the-fold image; both together throws `[VERIFIED: Context7]` |
| `images.qualities` unrestricted | default `[75]` | Next 16 | No config needed unless another quality is used `[VERIFIED: Context7]` |
| `middleware.ts` | `proxy.ts` | Next 16 | Already done |
| `tailwindcss-animate` | `tw-animate-css` | shadcn/Tailwind v4 | Already installed |
| framer-motion 11 / motion 12 | `motion` **13.x** (`motion/react`) | 13.0 in 2026 | CLAUDE.md's "12.x" is stale; not installing anyway |
| Clerk `afterSignInUrl` | `fallbackRedirectUrl` / `forceRedirectUrl` | Clerk Core 3 | Relevant only if a redirect-mode button is ever used `[VERIFIED: Context7]` |
| `100vh` hacks | `dvh`/`svh` units | broadly supported | Not needed — the flex shell avoids vh entirely |

**Deprecated/outdated:** `@vercel/og` (built in), `tailwindcss-animate`, `middleware.ts`, `priority` on `next/image`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Next `Viewport` type accepts `viewportFit: "cover"` | Pattern 3 | Typecheck fails → fall back to a manual `<meta name="viewport">`; low |
| A2 | Lighthouse thresholds (85/90/95/95/90) are the right "launch-worthy" bar | Pattern 6 | Gate too strict or too lax → tune after baseline; low |
| A3 | Clerk dev-instance `__clerk_db_jwt` can appear in the app URL after modal sign-in | Pitfall 3 | Fix (canonical URL) is correct regardless; none |
| A4 | `mailto:` / `target=_blank` misbehave in LinkedIn's WebView | Pitfall 6 | Visible email text is harmless either way |
| A5 | Lighthouse SEO `is-crawlable` fails on noindex; tap-target audit thresholds ~48px | Pitfalls 9–10 | Gate sequencing changes; low |
| A6 | `color-mix()` renders in the target WebViews | Pattern 1 | Use hex values instead; trivial |
| A7 | Capital One / Citi / Bilt are the thin programs for dataset growth | Dataset gate | Count before drafting; low |
| A8 | Vercel Hobby image-optimization quota comfortably covers ~20 source images | Pattern 2 | Quota hit → `unoptimized` on cards or Blob; low |
| A9 | The `x-safari-https://` scheme (iOS 17+) hands off to Safari from LinkedIn's WebView | Pattern 5 | Single blog source; only a hint, not relied on |
| A10 | Clerk logs "development keys" as `console.warn`, not `console.error` (BP audit counts errors) | Pitfall 11 | BP score dips → visible in the first LHCI run |
| A11 | All three new dev packages are legitimate (slopcheck unavailable) | Package audit | Planner checkpoint before install |

## Open Questions

1. **Custom domain / Clerk production instance before launch?**
   - What we know: `*.vercel.app` cannot host a Clerk production instance; the dev instance shows a "Development mode" badge in the modal a recruiter will see and caps at 100 users `[CITED: clerk docs]`. Cut-over is config only (domain → Vercel → `pk_live`/`sk_live` env → `NEXT_PUBLIC_SITE_URL` → Post Inspector re-scrape); 06-RESEARCH/06-07 explicitly deferred it to Phase 7.
   - What's unclear: whether Nick will buy a domain (≈$10–15/yr) this week.
   - Recommendation: decide in Wave 0. If yes, do it **first** (every URL, OG image, and the Clerk instance depend on the host); if no, accept the badge and record it.

2. **Is Google (or any social connection) enabled on the Clerk instance?**
   - What we know: 06-01 said "enable Google if you want"; Dashboard state is not in the repo.
   - Recommendation: check the Dashboard at Wave 0; for launch keep Email code only, or ship Pattern 5's guard. Verify on device either way.

3. **Launch dataset size N.**
   - What we know: 34 verified today; roadmap 80–120; Nick's time is the long pole.
   - Recommendation: Wave 0 checkpoint fixes N and the batch cadence; CI floor follows the data, never leads it.

4. **Hero imagery on `/` or cards-only?**
   - What we know: cards-only is Lighthouse-safe; a hero band is more "magazine" but is the LCP risk (Pitfall 8).
   - Recommendation: the UI-SPEC decides; default to cards + a small editorial band that is not an `<img>` (type + terracotta rule) on mobile.

5. **Android device for the pass?**
   - What we know: iOS (WKWebView) and Android (`wv`) differ in clipboard/storage behavior.
   - Recommendation: iOS is mandatory; Android is best-effort (borrow a device or accept emulation).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | everything | ✓ | v24.11.0 | — |
| npm / npx | installs, `npx lighthouse` | ✓ | 10.9.8 | — |
| Google Chrome | Lighthouse/LHCI | ✓ | `C:\Program Files\Google\Chrome\Application\chrome.exe` | Edge present at `Program Files (x86)\Microsoft\Edge` (`CHROME_PATH`) |
| Vercel CLI | env pull, optional inspect | ✓ | 57.0.0 | — |
| `sharp` | image pipeline | ✓ (transitive) | 0.35.4 | pin as devDependency |
| `lighthouse` / `@lhci/cli` | gate | ✗ (not installed) | — | `npm install -D` (checkpointed) |
| `cwebp` / ImageMagick | — | ✗ | — | not needed (sharp) |
| Playwright | — | ✗ | — | not needed (DevTools emulation + human pass) |
| ngrok / tunnel | — | ✗ | — | not needed (production is public) |
| Python / pip | slopcheck | ✓ / ✓ | 3.13.14 / 26.1.2 | slopcheck still not runnable → `[ASSUMED]` packages |
| iPhone with LinkedIn app | real-device pass | unknown (Nick's phone) | — | none — blocking human checkpoint |
| Android phone with LinkedIn app | real-device pass | unknown | — | Chrome DevTools UA emulation (best-effort) |
| `.env.development.local` (Clerk + DB keys) | build, reseed | ✓ (gitignored) | — | — |

**Missing dependencies with no fallback:** a physical iPhone (or iPad) with the LinkedIn app for the PLAT-02 pass — must be a human checkpoint.
**Missing dependencies with fallback:** `lighthouse`, `@lhci/cli` (install); Android device (emulate).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 (node environment, `tests/**/*.test.ts`, `@` → `src`) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run tests/design-system-gate.test.ts tests/image-manifest.test.ts tests/seed-data.test.ts` |
| Full suite command | `npm test && npm run typecheck && npm run lint && npm run build` |
| Phase gate commands | `npm run lighthouse` (LHCI, prod URLs) + PSI curl spot-check |

### Phase Requirements → Test Map
| Req ID / SC | Behavior | Test Type | Automated Command | File Exists? |
|-------------|----------|-----------|-------------------|-------------|
| PLAT-05 | Heading token used everywhere; no arbitrary `text-[1.75rem]`; `.dark` block removed; warm neutrals declared | unit (source scan) | `npx vitest run tests/design-system-gate.test.ts` | ❌ Wave 0 |
| PLAT-05 | Every seed `imageSlug` has a committed WebP + manifest entry | unit (fs vs seed) | `npx vitest run tests/image-manifest.test.ts` | ❌ Wave 0 |
| PLAT-05 | `ResultCard` renders the destination image with blur placeholder | unit (SSR render string, `methodology-page.test.ts` precedent) | `npx vitest run tests/result-card.test.ts` | ❌ Wave 0 (optional) |
| PLAT-05 | Editorial look is consistent across `/`, `/account`, `/methodology`, `/privacy`, error state | manual — UI-SPEC checker + human visual review | — | `/gsd-ui-phase 7` output |
| PLAT-02 | No `h-screen`/`100vh`; `viewport` export with `viewportFit: "cover"` and no zoom lock; `pb-safe` utility exists | unit (source scan) | `npx vitest run tests/design-system-gate.test.ts` | ❌ Wave 0 |
| PLAT-02 | Share link is canonical (`SITE_URL` + short keys), never `location.href` | unit (pure `shareUrl` helper + source scan) | `npx vitest run tests/share-url.test.ts` | ❌ Wave 0 |
| PLAT-02 | `isLinkedInInAppBrowser` matches the verified iOS/Android UA strings | unit | `npx vitest run tests/in-app-browser.test.ts` | ❌ Wave 0 |
| PLAT-02 | Responsive at 360px; mobile Lighthouse a11y/tap targets | automated (LHCI mobile emulation) | `npm run lighthouse` | ❌ Wave 0 (`config/lighthouserc.cjs`) |
| PLAT-02 | Full flow inside LinkedIn's in-app browser on a real phone: land via share link → enter balance → results → Copy my link → paste in a DM → Sign in (email code) → Save → /account → back; OG unfurl in the DM | **human checkpoint** (cannot be automated: no remote debugging of LinkedIn's WebView) | — | checklist in plan |
| SC3 Lighthouse | Scores meet thresholds on 4 URLs (median of 3) | automated | `npm run lighthouse` | ❌ Wave 0 |
| SC3 dataset | `verified ≥ N`, 8-program reachability, provenance; Neon count ≥ N | unit + DB one-liner | `npx vitest run tests/seed-data.test.ts`; 02-05 T3 tsx one-liner | ✅ exists (floor to raise) |
| SC3 dataset | Nick verifies each batch | **human checkpoint** (02-05 pattern) | — | plan |
| Launch flip | Layout has no `index:false`; `/account` has route noindex; `robots.ts`/`sitemap.ts` exist and disallow `/account`; `public/*.svg` scaffold files gone; README not boilerplate | unit (source scan) | `npx vitest run tests/launch-gate.test.ts` | ❌ (lands with the flip) |
| Launch flip | Production: `/robots.txt`, `/sitemap.xml` 200; `/` head has no `noindex`; `/account` head has noindex; Post Inspector re-scraped | curl probes + **human checkpoint** | `curl -s https://milesworth.vercel.app/robots.txt` etc. | plan |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/design-system-gate.test.ts tests/image-manifest.test.ts` (+ the task's own test)
- **Per wave merge:** `npm test && npm run typecheck && npm run lint && npm run build`
- **Phase gate:** full suite green + `npm run lighthouse` green on production + both human checkpoints approved before `/gsd:verify-work 7`

### Wave 0 Gaps
- [ ] `tests/design-system-gate.test.ts` — PLAT-05/PLAT-02 source-scan pins
- [ ] `tests/image-manifest.test.ts` — imagery coverage
- [ ] `tests/share-url.test.ts`, `tests/in-app-browser.test.ts` — pure helpers
- [ ] `config/lighthouserc.cjs` + `"lighthouse"` npm script + `.lighthouseci/` in `.gitignore`
- [ ] Dev install (checkpointed): `npm install -D @lhci/cli@0.15.1 lighthouse@13.4.1 sharp@0.35.4`
- [ ] `tests/launch-gate.test.ts` — added by the flip plan (would fail before it)
- [ ] Wave 0 decisions checkpoint: domain (Q1), Clerk social connections (Q2), dataset N (Q3)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no new surface | Clerk unchanged; UA detection never gates auth |
| V3 Session Management | no new surface | — (dev-instance JWT-in-URL is a Clerk property; Pattern 4 keeps it out of share links) |
| V4 Access Control | yes (metadata) | `/account` route-level `noindex` before the global noindex is lifted (IN-05) |
| V5 Input Validation | yes | `getDestinationImage` is a typed map lookup on `imageSlug` — never a path; `scripts/optimize-images.ts` only reads from `raw/` and writes fixed slugs (no user input) |
| V6 Cryptography | no | — |
| V14 Configuration | yes | Vercel bypass secret / PSI key env-only; `.lighthouseci/` and `raw/` gitignored; no `remotePatterns` |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Share link leaks a session token (`__clerk_db_jwt`) | Information disclosure | Canonical share URL from `balancesToParams` (Pattern 4) |
| UA-spoofed "in-app" detection changes behavior | Spoofing | Detection only shows a hint; no auth/authz depends on it |
| Third-party image hotlink → tracking / breakage | Tampering / Availability | Static imports only; test forbids `remotePatterns` |
| Lifting noindex exposes `/account` in search | Information disclosure | Route noindex + `robots.ts` disallow; launch-gate test |
| Lighthouse/PSI hammering prod `/og` (Satori CPU) | DoS | LHCI hits 4 HTML URLs ×3 only; `/og` already CDN-cached (05-REVIEW rate-limit note stands) |
| Committing photos with embedded PII/EXIF | Information disclosure | sharp strips metadata by default on re-encode (`withMetadata` not called) `[ASSUMED]` |

## Sources

### Primary (HIGH confidence)
- Codebase at HEAD `30428ed` — every file in `src/app`, `src/components`, `src/data`, `globals.css`, `package.json`, configs, tests; seed counts via `npx tsx` (36 / 34 verified / 20 image slugs)
- Context7 `/vercel/next.js` — `generate-viewport.mdx` (viewport export), `images.mdx` + `image.mdx` (static imports, blur, `sizes`), `get-img-props.ts` (`preload` replaces `priority`), `version-16.mdx` (`qualities` default `[75]`, `formats`)
- Context7 `/websites/nextjs` — `robots.ts` / `sitemap.ts` conventions
- Context7 `/clerk/clerk-docs` — `SignInButton` props (`mode`, `oauthFlow`, redirect props); `managing-environments.mdx` (dev instance: 100 users, `__clerk_db_jwt`, accounts.dev); `clerkdbjwt-vs-client-cookie.mdx`
- Context7 `/websites/tailwindcss` — `h-dvh`/`min-h-dvh` utilities (and absence of safe-area utilities)
- Context7 `/googlechrome/lighthouse-ci` — `lighthouserc` collect/assert/upload schema
- Context7 `/websites/motion_dev` — `useReducedMotion`, numeric `animate(0, n, { onUpdate })`
- GoogleChrome/lighthouse README (WebFetch) — CLI flags
- sharp.pixelplumbing.com/api-output (WebFetch) — `webp()` options
- npm registry (2026-09-15) — versions/ages/repos for lighthouse, @lhci/cli, sharp, motion, @playwright/test, next, @clerk/nextjs
- Phase artifacts: 04-UI-SPEC.md, 04-RESEARCH.md (OQ2 ruling, Pitfall 6), 05-VERIFICATION.md, 05 deferred-items.md (closed in 06-01), 06-VERIFICATION.md, 06-HUMAN-UAT.md, 06-REVIEW.md (IN-05), 06-01/06-07 SUMMARY (Clerk dev instance, Phase 7 inheritances), 02-05-PLAN/SUMMARY (checkpoint pattern, 34 verified)

### Secondary (MEDIUM confidence)
- explore.whatismybrowser.com LinkedIn App UA list — `[LinkedInApp]/x.y.z` on both platforms, `; wv)` on Android
- Google Developers Blog + Auth0 blog — OAuth blocked in embedded WebViews (`disallowed_useragent`)
- webkit.org/blog/13936 + developer.chrome.com remote-debugging docs — inspectability is an app-side opt-in
- vercel.com/docs/deployment-protection (+ bypass methods) — previews protected by default; production unprotected
- unsplash.com/license + api-terms — attribution/hotlinking rules apply to API use only
- developers.google.com PSI API v5 get-started — no key needed at low volume
- clerk.com managing-environments (web) — corroborates Context7

### Tertiary (LOW confidence — flagged)
- felixcarmona.com — `x-safari-` scheme handoff from LinkedIn iOS (single source)
- react-native-webview issue #1262 — `navigator.share` unavailable in WebViews
- Apple Developer Forums thread 742037 — WKWebView localStorage loss (anecdotal; the Phase 4 guard already covers it)
- Community Lighthouse audits of Clerk bundles (unused-JS numbers)

## Metadata

**Confidence breakdown:**
- Current-state audit: HIGH — read from source; counts computed
- Standard stack: HIGH — versions from registry; APIs from Context7
- Architecture patterns: HIGH for Next/Tailwind/LHCI code; MEDIUM for WebView-specific behavior
- Pitfalls: MEDIUM — WebView items rest on vendor docs + community reports; several are cheap to mitigate regardless
- Dataset gate: HIGH on mechanics; the launch number is a user decision

**Research date:** 2026-09-15
**Valid until:** 2026-10-15 (Next/Clerk minor releases are frequent; re-check `next` and `@clerk/nextjs` latest before the launch flip)
