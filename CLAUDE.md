<!-- GSD:project-start source:PROJECT.md -->
## Project

**Milesworth**

A web app that shows people who have credit card points — but no idea what to do with them — how powerful those points actually are. Users enter their balances across major programs and see ranked, aspirational redemptions ("Your 90K Amex MR → ANA business class to Tokyo, worth ~$4,500 cash") with the side-by-side delta between cash-out value and transfer-partner value. Built as both a real product for points beginners and a portfolio piece demonstrating product thinking + full-stack execution.

**Core Value:** The "wow" moment: a user sees that the points they were about to burn at 1¢ each are actually a business-class flight — concrete route, concrete numbers, concrete delta. If everything else fails, that reveal must land.

### Constraints

- **Tech stack**: Next.js on Vercel, Postgres (Neon or Vercel Postgres), Clerk for auth — chosen for speed to production quality and portfolio credibility
- **Timeline**: ASAP — target a polished, deployed demo in 2–4 weeks for a LinkedIn launch post (job search is active)
- **Design**: Editorial travel aesthetic — light, magazine-like, destination imagery; Condé Nast meets fintech. Big numbers carry the drama
- **Distribution**: Must be publicly deployable and shareable via a single link
- **Data integrity**: Valuations must be defensible — finance credibility is part of the pitch; methodology stays transparent
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js (App Router) | 16.3.4 (pin `^16.3.3` minimum) | Framework | Current stable line. 16.3.3+ contains the August 2026 security fixes — do not ship anything older. Note: Next 16 renamed `middleware.ts` → `proxy.ts`; this affects the Clerk setup below. App Router + React Server Components is the only sensible mode for a content-forward app: redemption pages render server-side with zero client JS, which is exactly right for a mostly-read experience. |
| React | 19.2.x | UI runtime | Ships with Next 16; nothing to decide, just don't pin an older major. |
| TypeScript | 5.x (latest) | Language | Non-negotiable for a portfolio piece; also required for Drizzle's type inference to pay off. |
| Tailwind CSS | 4.3.x | Styling | v4 is the 2026 default: CSS-first config via `@theme` (no `tailwind.config.js`), automatic content detection, much faster builds. The `@theme` token approach is a genuinely good fit for an editorial design system (custom serif type scale, warm palette as CSS variables). |
| shadcn/ui | CLI `shadcn@latest` (components are vendored, not a dependency) | Component primitives | Standard pairing with Tailwind v4. Use it for the unglamorous parts — dialogs, inputs, dropdowns, toasts for the balance-entry form and save flow. The editorial look comes from your own typography/layout on top; shadcn just saves you from rebuilding accessible primitives. Init with the Tailwind v4 + React 19 preset (default in 2026). |
| Drizzle ORM | drizzle-orm 0.45.x + drizzle-kit 0.31.x | Database ORM | The 2026 default for Neon + Vercel serverless. No engine binary → ~90% smaller bundle and sub-500ms cold starts vs Prisma's 1–3s; first-class `drizzle-orm/neon-http` driver; schema lives in TypeScript so the curated redemption tables are plain readable code. `drizzle-kit push` is ideal for a solo builder iterating fast on a small schema. |
| Neon Postgres | via Vercel Marketplace integration | Database | **This decision is made for you: "Vercel Postgres" no longer exists.** Vercel sunset its white-labeled Postgres in Q4 2024–Q1 2025 and replaced it with Marketplace integrations; Neon is the flagship. Install "Neon" from the Vercel Marketplace: one click, env vars (`DATABASE_URL`) auto-injected into the project, billing through Vercel, free tier is ample for ~120 rows + a small users table. Bonus: automatic database branching per preview deployment. |
| @neondatabase/serverless | 1.1.x | Postgres driver | Neon's HTTP driver — works over fetch, no TCP pooling headaches in serverless functions. Pair with `drizzle(neon(DATABASE_URL))` via `drizzle-orm/neon-http`. |
| Clerk | @clerk/nextjs 7.8.x | Auth (optional-save) | v7 is the current major and explicitly supports Next 16's `proxy.ts` convention. Clerk's middleware model is *public-by-default* — `clerkMiddleware()` protects nothing until you opt routes in — which is precisely the optional-auth pattern this app needs (see integration pattern below). |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nuqs | 2.10.x | Type-safe URL query state | **This is the shareable-results mechanism.** Balances live in the URL (`/results?ur=90000&mr=50000`), read/written like `useState` via typed parsers, server-readable for SSR. Copy the link → identical results for the recipient, no DB row, no login. Requires wrapping the app in `NuqsAdapter` in `app/layout.tsx`. |
| zod | 4.5.x | Validation | Validate balance inputs at the boundary and (critically for data integrity) validate the curated redemption dataset in the seed script — a bad transfer ratio should fail the build, not ship. |
| next/og (`ImageResponse`) | built into Next.js | Dynamic OG images | The share-link payoff: a `opengraph-image.tsx` (or route handler) that renders "90K Amex MR → ANA Business to Tokyo · ~$4,500" as the social card for a given results URL. Built in — do **not** install `@vercel/og` separately. |
| next/image | built into Next.js | Destination imagery | See image-handling section below. |
| next/font | built into Next.js | Typography | Editorial aesthetic lives or dies on type. Self-host via `next/font/google` — e.g. a display serif (Fraunces, Newsreader, or Playfair Display) for headlines/big numbers + a clean sans (Inter/Geist) for UI. Zero layout shift, no external requests. |
| lucide-react | latest | Icons | shadcn's default icon set; consistent and tree-shaken. |
| motion (framer-motion successor, `motion/react`) | 12.x | Animation | Optional but earns its keep for the one moment that matters: the valuation-delta reveal. Use sparingly — number count-up, card entrance. Skip everywhere else. |
| tw-animate-css | 1.4.x | CSS animations for shadcn | shadcn deprecated `tailwindcss-animate`; new v4 projects use this. The CLI installs it for you. |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| drizzle-kit | Migrations + Studio | `drizzle-kit push` for dev-speed schema iteration; `drizzle-kit studio` gives a local DB browser (replaces Prisma Studio's role). Switch to generated migrations (`drizzle-kit generate`) once the schema stabilizes pre-launch. |
| tsx | Run TS scripts | For the seed script (`scripts/seed.ts`) that loads the ~80–120 curated redemptions from a typed source file into Neon. |
| ESLint 9 + eslint-config-next | Linting | Comes with `create-next-app`; flat config is the default now. |
| Prettier + prettier-plugin-tailwindcss | Formatting | Class sorting keeps Tailwind maintainable solo. |
| Vercel CLI / GitHub integration | Deploys | Push-to-deploy with preview URLs; Neon integration auto-branches the DB per preview. |
## Key Integration Patterns
### Clerk optional-auth pattern (public-by-default)
- `clerkMiddleware()` protects **nothing** by default — every route (landing, balance entry, results) works logged-out with zero friction. Only the explicit matcher list gates.
- Wrap layout in `<ClerkProvider>`; use `<SignedIn>` / `<SignedOut>` components to swap "Save my balances" CTA between a modal `<SignInButton mode="modal">` (keeps the user on the results page — important for the demo flow) and the actual save action.
- **Post-signup balance persistence:** balances are already in the URL (nuqs), so after the Clerk modal completes, the client still has them — write them to the DB in a server action. No pre-auth localStorage dance needed.
- Store app data (balances, goals, bookmarks) in **your own Postgres `users` table keyed by Clerk `userId`** — not in Clerk metadata. Clerk metadata is for auth-adjacent flags only; relational data (bookmarks → redemptions FK) belongs in Neon.
- Use the Clerk + Vercel Marketplace integration for env-var provisioning if convenient, but manual `.env` keys are equally fine.
### Shareable-results URL pattern
### Image handling for destination imagery
- **Source once, store statically.** Pull hero images from Unsplash/Pexels (license permits this; keep attribution in a credits note), pre-crop to a consistent editorial aspect ratio (e.g. 3:2 or 16:10), compress to WebP at ~1600w with something like Squoosh, and commit to the repo (`public/destinations/tokyo.webp`) or — if repo size becomes annoying past ~50MB — Vercel Blob.
- **Do not hotlink Unsplash CDN URLs at runtime.** It couples your demo's reliability and speed to a third party, requires `remotePatterns` config, and Unsplash's API terms push hotlinking through their tracked URLs. A broken image during a recruiter's visit is an unacceptable failure mode for a portfolio piece.
- **Static imports + `next/image`.** Importing images (`import tokyo from '@/images/tokyo.webp'`) gives automatic width/height (no CLS) and automatic blur placeholders (`placeholder="blur"`) — the blur-up is exactly the magazine-load feel the design wants. Vercel's image optimizer serves AVIF/WebP responsive variants automatically.
- Reference images from DB rows by a stable `imageSlug` string, mapped to imports in a typed manifest — keeps the DB free of file paths.
- Watch Vercel image-optimization quota (Hobby: 5,000 source images/month is far more than enough here; ~120 sources is trivial).
### Data layer shape
- Schema in `src/db/schema.ts` (Drizzle): `programs`, `redemptions`, `transfer_rates` (with a nullable `bonus_rate` + `bonus_note` for manual bonus entry), `users`, `bookmarks`.
- Curated data authored as a **typed TypeScript file** (`src/data/redemptions.ts`) validated by Zod, then seeded to Neon. Authoring in TS (not raw SQL or CSV) means Claude + Nick edit entries with autocomplete and type errors, and the dataset doubles cleanly as the v2 AI-advisor knowledge base.
- Redemption data is effectively static → fetch in server components and cache aggressively (`export const revalidate = 3600` or `unstable_cache`/`"use cache"`); the ranking math runs per-request against in-memory data, not per-request SQL gymnastics.
## Installation
# Scaffold (accepts defaults: TS, App Router, Tailwind v4, ESLint, src/)
# Core
# UI
# Dev
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Drizzle | Prisma 6+ | If you strongly prefer a higher-level client API or already know Prisma well. Prisma's newer Rust-free client narrowed the cold-start gap, but Drizzle remains the community default for Neon + Vercel, has the smaller footprint, and its SQL-transparent style reads better in a portfolio review. |
| Neon (Marketplace) | Supabase Postgres (Marketplace) | If you wanted built-in auth/storage/realtime — you don't (Clerk covers auth; app is read-heavy). Neon is thinner and the de-facto Vercel pairing. |
| Neon (Marketplace) | Neon direct account | Same product. Marketplace = billing via Vercel + auto env-var injection + preview-branch integration. Direct = marginally more control. Use Marketplace. |
| nuqs URL params | DB-backed share tokens (`/r/abc123`) | Only if URLs must be short (social character limits) or results must survive dataset re-ranking. v1 does not need either. |
| Static repo images | Vercel Blob | If total image weight exceeds ~50MB or you want to swap images without deploys. Same `next/image` consumption either way. |
| motion | CSS-only transitions + tw-animate-css | If the animation budget shrinks — the app is fully viable with zero JS animation. |
| shadcn/ui | Hand-rolled components | For purely editorial sections (hero, redemption cards), hand-rolled Tailwind is fine and often better; use shadcn only where accessibility is hard (dialogs, forms, menus). |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@vercel/postgres` package / "Vercel Postgres" | Product sunset (Q4 2024–Q1 2025); the package is legacy-compat only | Neon via Vercel Marketplace + `@neondatabase/serverless` |
| Prisma with the classic engine binary | 1–3s serverless cold starts, large bundle — visibly sluggish first hit on a demo link | Drizzle |
| NextAuth / Auth.js | Auth choice is already made (Clerk); NextAuth requires assembling flows Clerk ships prebuilt — costs days you don't have | Clerk `@clerk/nextjs` v7 |
| `middleware.ts` filename | Renamed in Next 16; a `middleware.ts` file will not run | `proxy.ts` (same code, new name) |
| `@vercel/og` package | Its `ImageResponse` has been built into Next.js since v14 | `import { ImageResponse } from 'next/og'` |
| `tailwindcss-animate` | Deprecated by shadcn for Tailwind v4 | `tw-animate-css` (installed by shadcn init) |
| `tailwind.config.js`-era v3 patterns | Tailwind v4 is CSS-first; JS config + `content` globs are legacy | `@theme` tokens in `globals.css` |
| CSS-in-JS (styled-components, Emotion) | Poor RSC compatibility; fights the server-first architecture | Tailwind v4 |
| Pages Router | Legacy mode; no RSC, no `opengraph-image` convention | App Router |
| Hotlinked Unsplash URLs at runtime | Third-party dependency in the critical demo path; ToS friction | Downloaded, optimized, statically imported images |
| localStorage as the primary share/persistence mechanism | Not shareable, not server-renderable | URL params (nuqs) + Postgres for saved users |
## Stack Patterns by Variant
- Cache the redemption dataset at build/ISR time (`"use cache"` or `unstable_cache` with long revalidate) so anonymous results pages never touch Postgres at request time.
- Because the dataset is static, the DB is only truly needed for save/bookmark writes — architect reads to tolerate this from day one.
- `ImageResponse` supports custom fonts (pass TTF/WOFF buffer) and flex layouts, but only a CSS subset. Keep the card to: big number, route line, delta. Load the display font once from the filesystem.
- Prefer `drizzle-kit push` + Neon's dev branch over local Postgres/Docker — zero local DB setup, and dev/prod parity is exact.
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| next@16.3.x | react@19.2.x | Bundled pairing from create-next-app |
| @clerk/nextjs@7.x | next@16 | v7 explicitly supports Next 16 + `proxy.ts` (peer range includes 16); do not use @clerk/nextjs v6 with Next 16 |
| shadcn/ui (current CLI) | tailwindcss@4.x + react@19 | Current default; v4/v19 is the standard init path in 2026 |
| drizzle-orm@0.45.x | @neondatabase/serverless@1.1.x | Via `drizzle-orm/neon-http` driver |
| nuqs@2.x | next@16 App Router | Requires `NuqsAdapter` (from `nuqs/adapters/next/app`) in root layout |
| zod@4.x | drizzle-zod (optional) | If generating Zod schemas from Drizzle tables, verify drizzle-zod's zod v4 support at install time; hand-written schemas avoid the question |
## Sources
- npm registry (queried 2026-08-31) — exact latest versions: next 16.3.4, tailwindcss 4.3.3, @clerk/nextjs 7.8.3, drizzle-orm 0.45.2, drizzle-kit 0.31.10, @neondatabase/serverless 1.1.0, nuqs 2.10.1, zod 4.5.4, react 19.2.8 — HIGH confidence
- [Next.js blog — 16.3 release](https://nextjs.org/blog/next-16-3) and [August 2026 security release](https://nextjs.org/blog/nextjs-security-release-august-2026-update) — version floor 16.3.3 — HIGH confidence
- [Neon: Vercel Postgres transition guide](https://neon.com/docs/guides/vercel-postgres-transition-guide), [Vercel Postgres docs](https://vercel.com/docs/postgres), [Neon on Vercel Marketplace](https://vercel.com/marketplace/neon) — Vercel Postgres sunset + Marketplace path — HIGH confidence
- [Clerk clerkMiddleware() reference](https://clerk.com/docs/reference/nextjs/clerk-middleware), [Clerk Next.js quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart), [clerk/javascript changelog](https://github.com/clerk/javascript/blob/main/packages/nextjs/CHANGELOG.md) — public-by-default middleware, v7 + proxy.ts support — HIGH confidence
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4), [shadcn Next.js install](https://ui.shadcn.com/docs/installation/next) — v4 migration, tw-animate-css — HIGH confidence
- Drizzle vs Prisma 2026 comparisons ([Makerkit](https://makerkit.dev/blog/tutorials/drizzle-vs-prisma), [Bytebase](https://www.bytebase.com/blog/drizzle-vs-prisma/), [TurboStarter](https://www.turbostarter.dev/blog/drizzle-vs-prisma-typescript-orm-2026)) — cold-start/bundle rationale — MEDIUM-HIGH confidence (third-party benchmarks, consistent across sources)
- [nuqs guides](https://www.robinwieruch.de/next-search-params/) — URL-state pattern for shareable links — HIGH confidence
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
