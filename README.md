# Milesworth

Milesworth shows people with credit-card points — but no idea what to do with them — how powerful those points actually are. Enter your balances and see ranked, aspirational redemptions with the side-by-side delta between cashing out and transferring to an airline or hotel partner: "Your 90K Amex MR is an ANA business-class seat to Tokyo, worth about $4,500."

## Live

https://milesworth.vercel.app

## What it does

- Enter balances for up to eight programs: Amex Membership Rewards, Chase Ultimate Rewards, Capital One Miles, Citi ThankYou Points, Bilt Rewards, World of Hyatt, Hilton Honors, and Marriott Bonvoy. Nothing is required except one non-zero balance.
- See bookable-now redemptions ranked by value, each with a concrete route, a representative cash fare, and the delta between the 1¢-per-point cash-out and the transfer-partner value. Redemptions you are close to appear under "Almost there" with the exact shortfall.
- Share the result: balances live in the URL, so the link reproduces the same page for anyone, and it unfurls on LinkedIn and Slack with a generated social card showing the top redemption.
- Optionally sign in (Clerk) to save balances, bookmark redemptions, and set travel goals. The guest flow never requires an account.

## How the numbers work

Every valuation uses the cents-per-point convention popularised by The Points Guy: `(cash fare − taxes and fees) ÷ points × 100`. Cash fares are representative fares for a specific route and cabin, checked by hand and stamped with a "Verified <date>" note in the data file. Award prices are shown as ranges where programs use dynamic pricing. The full method, including how taxes and fees are treated and why the cash-out baseline is 1¢, is on the [/methodology](https://milesworth.vercel.app/methodology) page, which renders its worked example from the same data the ranking uses.

Any redemption with `verifiedAt: null` is a draft. Drafts are never ranked and never shown; the test suite enforces a minimum count of verified entries and that every enterable program is reachable by at least one verified redemption.

## Stack

Next.js 16 (App Router, React Server Components), React 19, TypeScript, Tailwind CSS v4 with shadcn/ui primitives, Drizzle ORM on Neon Postgres, Clerk for optional accounts, nuqs for URL state, and Vercel for hosting. The social card is rendered with `next/og` from vendored Fraunces and Inter files.

## Local development

- `npm install` — install dependencies.
- `vercel env pull .env.development.local` — pull the development environment variables (database URL, Clerk keys) from the linked Vercel project. Nothing secret is committed to this repository.
- `npm run dev` — start the dev server on http://localhost:3000.
- `npm run db:push` — push the Drizzle schema to the connected Neon branch.
- `npm run db:seed` — load the curated programs, routes, redemptions, and transfer rates into Postgres.
- `npm test` — run the Vitest suite (engine, data integrity, source-scan gates).
- `npm run typecheck` — `tsc --noEmit`.
- `npm run lint` — ESLint.
- `npm run lighthouse` — Lighthouse CI against production (or `LHCI_BASE_URL`) with the mobile budgets in `config/lighthouserc.cjs`.
- `npm run images:optimize` — re-encode the raw destination photos in `src/images/raw` to the WebP manifest under `src/images/destinations`.

## Data

The dataset is authored in the repository, not in a CMS: programs, routes, redemptions, and transfer rates are typed TypeScript in `src/data/*.ts`, validated by Zod at import time and seeded to Neon by `scripts/seed.ts`. Every redemption is either verified by Nick with a dated source note or left as a draft that the engine ignores. CI holds the floor: a minimum number of verified redemptions, full program coverage, and a provenance check on every source note.

## Credits

Photos via Unsplash (the manifest also accepts Pexels) under their respective licenses; photographers are listed per destination in `src/images/destinations.ts`. Type is Fraunces and Inter, both under the SIL Open Font License.

## Roadmap

A v2 AI advisor that reads your balances and goals and suggests which card to open next, built on the same verified redemption data.
