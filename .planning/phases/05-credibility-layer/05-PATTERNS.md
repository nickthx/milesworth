# Phase 5: Credibility Layer - Pattern Map

**Mapped:** 2026-09-02
**Files analyzed:** 18 (10 new source files, 5 modified source/config files, 4 new test files — fonts counted as one asset entry)
**Analogs found:** 15 / 18 (no in-repo analog for a Route Handler, the vendored font assets, or a `renderToStaticMarkup` page test — RESEARCH.md supplies verified shapes for those)

Source of the file list: `05-RESEARCH.md` §"Recommended Project Structure" (no CONTEXT.md exists for this phase). Design contract: `04-UI-SPEC.md`.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/methodology/page.tsx` (new) | route / page (sync RSC) | static render (transform: seed → prose) | `src/app/page.tsx` (page shell) + `src/components/almost-there.tsx` (server-compatible presentational w/ formatters) + `src/components/core-experience.tsx` `EmptyState` (heading/body classes, `<dl>` figure layout) | role-match |
| `src/app/page.tsx` (modify: `generateMetadata`, `<AdvisorTease/>`) | route / page | request-response (`searchParams`) | itself — lines 16-36 already do the `loadBalanceParams` + `asOf` dance `generateMetadata` must mirror | exact |
| `src/app/layout.tsx` (modify: `metadataBase`, default `openGraph`/`twitter`, `<SiteFooter/>`) | config / root layout | static | itself — lines 21-27 `metadata` export, lines 40-42 body wrap | exact |
| `src/app/og/route.tsx` (new) | route handler (Node) | request-response → binary (PNG) | **none** for Route Handlers; partial: `src/app/page.tsx` lines 24-29 (loader + `asOf`), `src/lib/balance-storage.ts` lines 71-82 (try/catch degrade, T-01-07) | partial |
| `src/app/actions/interest.ts` (new) | server action | CRUD (single insert) | `scripts/seed.ts` lines 50-70 (`db.insert(table).values(...)` house style) + `scripts/db-check.ts` lines 31-35 (never echo driver errors) + `src/db/index.ts` (lazy proxy, import surface) | role-match |
| `src/db/schema.ts` (modify: `interestSignups`) | model (Drizzle table) | CRUD | itself — `transferBonuses` lines 70-92 (`serial` id + `text` columns + column comments) | exact |
| `src/components/site-footer.tsx` (new) | component (server) | static | `src/components/almost-there.tsx` (no client directive, `<section>` + heading class, ink/muted text) | role-match |
| `src/components/advisor-tease.tsx` (new) | component (`"use client"` form) | request-response (Server Action via `useActionState`) | `src/components/balance-form.tsx` (client form, `Input`/`Label`, `h-11`, `autoComplete`) + `src/components/core-experience.tsx` lines 152-194 (`Button`, `aria-live` status swap, silent-degrade handler) | role-match |
| `src/components/core-experience.tsx` (modify: methodology link) | component (client island) | — | itself — lines 206-223 ("Bookable now" section where the link goes) | exact |
| `src/lib/share-content.ts` (new) | utility (pure, isomorphic) | transform (balances → share strings) | `src/lib/path-display.ts` (pure barrel-import helper, guard-clause degrade) + `src/components/result-card.tsx` lines 35-60 (framing-line branch) + `src/components/core-experience.tsx` lines 74-103 (`dataset` const + `rankRedemptions` call) | exact (composite) |
| `src/lib/interest-validation.ts` (new) | utility (zod schema, pure) | transform / validation | `src/data/types.ts` lines 1-19 (hand-written zod v4 schema, header comment) | exact |
| `src/assets/fonts/*.woff` (new, 2 files) | asset | file-I/O (read once at module scope) | **none** — no vendored binary assets exist; `public/` is empty of fonts | none |
| `vitest.config.ts` (modify: `resolve.alias`) | config | — | itself (7 lines) | exact |
| `tests/share-content.test.ts` (new) | test | unit | `tests/path-display.test.ts` (real seed arrays, pinned strings) + `tests/engine-ranking.test.ts` lines 18-22 (`dataset`/`rank` helper, pinned `asOf`) | exact |
| `tests/interest-validation.test.ts` (new) | test | unit (hostile input) | `tests/balance-params.test.ts` lines 61-104 (hostile-value table) + `tests/format.test.ts` (exact-string pins) | exact |
| `tests/methodology-page.test.ts` (new) | test | unit (SSR string assert) | partial: `tests/balance-params.test.ts` lines 142-162 (source-scan `describe`), `tests/seed-data.test.ts` (iterate real `programs`) — no existing `react-dom/server` test | partial |
| `tests/og-route.test.ts` (new) | test | integration-in-node (binary response) | **none** — RESEARCH.md §"Code Examples" supplies the executed shape | none |
| Grep gate extension (verification step, no file) | test (static gate) | file-I/O | `tests/engine-purity.test.ts` (import-denylist gate) — optional promotion of the 04-04 grep to a test | role-match |

## Pattern Assignments

### `src/app/methodology/page.tsx` (page, static RSC)

**Analog:** `src/app/page.tsx` for the shell; `src/components/almost-there.tsx` + `core-experience.tsx` `EmptyState` for markup/classes.

**Page shell + module-header comment** (`src/app/page.tsx` lines 6-15, 31-35). Every file in this repo opens with a `//` block naming the requirement/decision IDs and threat IDs it satisfies — copy that habit:
```tsx
// D-04 homepage — Phase 4 replaces the Phase 1 placeholder (wordmark + live
// DB count) with the guest core experience. ...
//
// Server component, no client directive. Awaiting searchParams makes the
// route dynamic implicitly (Pitfall 3 / RESEARCH anti-pattern: do NOT add
// `export const dynamic`), ...
export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  ...
  return (
    <main className="bg-cream flex flex-1 flex-col">
      <CoreExperience asOf={asOf} />
    </main>
  );
}
```
Methodology differs in exactly one way: **sync** `export default function MethodologyPage()` with no `searchParams` (so it prerenders `○ /methodology` and `renderToStaticMarkup(createElement(MethodologyPage))` works in vitest). Keep the `<main className="bg-cream flex flex-1 flex-col">` wrapper and the inner container from `core-experience.tsx` line 174: `mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 md:py-16`.

**Import ordering convention** (`src/components/result-card.tsx` lines 1-18): external → blank → `@/components/ui/*` → `@/data` (type) → `@/engine` (type) → `@/lib/format` → `@/lib/path-display`. For the methodology page the value imports are `import { programs, redemptions } from "@/data"` and `import { cppX100 } from "@/engine"` — **barrels only**, never deep paths (`path-display.ts` lines 8-11 explain the `transfers` filename collision).

**Section heading + body classes** (`src/components/core-experience.tsx` lines 80-81, 249-258 and `almost-there.tsx` lines 26-29) — these ARE the UI-SPEC Heading (28px Fraunces 600) and Body (16px Inter 400) roles:
```tsx
const SECTION_HEADING_CLASS =
  "font-heading text-ink text-[1.75rem] leading-tight font-semibold";
...
<section className="flex flex-col gap-6">
  <div className="flex flex-col gap-2">
    <h2 className={SECTION_HEADING_CLASS}>Your points are worth more than you think</h2>
    <p className="text-ink/70 text-base leading-6">Enter a balance above to see ...</p>
  </div>
```
Page `<h1>` copies `core-experience.tsx` line 178: `font-display text-ink text-display md:text-display-xl font-semibold` (the sole permitted `text-display-xl` is the `/` hero — on `/methodology` use `text-display` only). Label cells (14px) copy `result-card.tsx` line 82: `text-ink/70 text-sm font-semibold`; body cells copy line 83: `text-ink text-base leading-6`. **No terracotta on this page** (UI-SPEC reserved list).

**Live-number rendering** — copy how `EmptyState` renders seed fields through formatters (`core-experience.tsx` lines 268-281):
```tsx
<dl className="grid grid-cols-2 gap-4">
  <div className="flex flex-col gap-1">
    <dt className="text-ink/70 text-sm font-semibold">Cash fare</dt>
    <dd className="text-ink text-base leading-6">
      ~{formatDollars(featuredTeaser.cashFareCents)} cash fare
    </dd>
  </div>
```
and how `balance-form.tsx` lines 36-40 derives the enterable list from the seed flag (never a second hand-written list):
```tsx
const enterablePrograms: EnterableProgram[] = programs.flatMap((program) =>
  program.isUserEnterable && isEnterableSlug(program.slug)
    ? [{ slug: program.slug, name: program.name }]
    : [],
);
```
For the baseline table: `programs.filter((p) => p.isUserEnterable)` and render `p.cashOutBaselineCppX100 === null ? "Pure travel value" : formatCpp(p.cashOutBaselineCppX100)` — mirroring the null-branch in `result-card.tsx` lines 47-55. Worked example: `formatCpp(cppX100(anchor.cashFareCents, anchor.taxesFeesCents, anchor.pointsMax ?? anchor.pointsMin))` with `anchor = redemptions.find((r) => r.slug === "ana-business-tokyo-roundtrip")` (slug confirmed at `src/data/redemptions-flights.ts` line 16; 933 pinned by `tests/engine-valuation.test.ts`). Guard with a conditional, never a non-null assertion (`result-card.tsx` lines 121-129 house rule).

**Engine facts the prose must state accurately** (`src/engine/valuation.ts` JSDoc lines 12-24, 62-70, 83-94; `src/engine/ranking.ts` lines 91-105):
- `cppX100 = Math.round(((cashFareCents - taxesFeesCents) * 100) / partnerPoints)` — TPG convention, taxes subtracted first (line 38)
- `cashOutValueCents` uses the program's OWN baseline, `null ⇒ 0` (lines 62-81) — "never a flat 1¢"
- `wowDeltaCents = cashFare − taxes − cashOutValue(spent source points)` (lines 95-106)
- A5 fail-closed `verifiedAt === null → skip`; A2 `conservativeNeed = pointsMax ?? pointsMin`; sort bookableNow by conservative wow desc (ranking.ts lines 95-105)

**Metadata export** — copy `src/app/layout.tsx` lines 21-27 shape (`export const metadata: Metadata = { title, description }`); the layout's `metadataBase`/`openGraph` defaults are inherited.

---

### `src/app/page.tsx` (modify — add `generateMetadata` + `<AdvisorTease/>`)

**Analog:** itself. Lines 16-29 are the exact sequence `generateMetadata` repeats:
```tsx
export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await loadBalanceParams(searchParams);            // line 24 — result currently DISCARDED
  const asOf = new Date().toISOString().slice(0, 10); // line 29 — "the repo's SOLE clock read for this flow"
```
In `generateMetadata`, keep the return value: `const balances = paramsToBalances(await loadBalanceParams(searchParams));` (`paramsToBalances` is `src/lib/balance-params.ts` lines 68-79, already imported by the island). Update the line 26-28 comment: the page and `generateMetadata` are now the two server-side clock reads; the island still never reads the clock (Pitfall 10). Type import: `import type { SearchParams } from "nuqs/server";` (line 1) — same for `generateMetadata`'s param. Add `import type { Metadata } from "next";` as in `layout.tsx` line 1.

**Composition:** `<AdvisorTease />` goes inside `<main>` after `<CoreExperience asOf={asOf} />` (line 33). `AdvisorTease` is a server-rendered wrapper importing a `"use client"` form — do not pass `asOf` or share text into it.

**Grep gate (keep passing):** `04-04-PLAN.md` line 189 — `grep -rE "from \"@/db|drizzle" src/components/ src/app/page.tsx` → no matches. `page.tsx` must import `@/lib/share-content`, never `@/db`.

---

### `src/app/layout.tsx` (modify — `metadataBase`, social defaults, `<SiteFooter/>`)

**Analog:** itself, lines 21-27:
```tsx
export const metadata: Metadata = {
  title: "Milesworth",
  description: "See what your credit card points are actually worth.",
  // D-03 noindex gate: keep the pre-launch site out of search indexes.
  // Removing this is an explicit Phase 7 launch-gate task.
  robots: { index: false, follow: false },
};
```
Extend in place (keep the D-03 comment and `robots` verbatim) with `metadataBase: new URL(SITE_URL)`, `openGraph: { type: "website", siteName, title, description, images: [{ url: "/og", width: 1200, height: 630, alt }] }`, `twitter: { card: "summary_large_image", ... }` (RESEARCH Pattern 2). `SITE_URL` constant at module scope next to the font consts (lines 8-19 style): `process.env.NEXT_PUBLIC_SITE_URL ?? "https://milesworth.vercel.app"` — never `VERCEL_URL`.

**Footer placement** (lines 40-42): `<body className="flex min-h-full flex-col"><NuqsAdapter>{children}</NuqsAdapter></body>` — the body is already a flex column and pages use `flex-1` on `<main>`, so `<SiteFooter />` slots after `{children}` inside `<NuqsAdapter>` (or as a sibling — it has no nuqs hooks) and lands at the bottom naturally.

---

### `src/app/og/route.tsx` (route handler, request → PNG)

**Analog:** none for a Route Handler (the repo has no `route.ts` files). Use RESEARCH Pattern 4 for the `ImageResponse` body (executed and verified). Borrow these repo conventions:

**Request → balances** — same loader, no re-parsing (`src/app/page.tsx` line 24 + `balance-params.ts` line 52 `createLoader`): `paramsToBalances(loadBalanceParams(request))`. The loader accepts a `Request` synchronously (verified in RESEARCH). `asOf` derived exactly as `page.tsx` line 29.

**Error handling — neutral, silent** (`src/lib/balance-storage.ts` lines 71-82):
```ts
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    return validateStoredPayload(JSON.parse(raw));
  } catch {
    // Pitfall 6 / T-01-07: swallow silently — degrade to URL-only behavior.
    return null;
  }
```
→ `catch { return new Response("Image unavailable", { status: 500 }); }` with a T-01-07 comment; no `console.error(err)`.

**Module-scope one-time setup** (`src/lib/format.ts` lines 19-27 — formatters built once at module scope; `core-experience.tsx` line 78 `const dataset = {...}` built once): read both `.woff` buffers at module scope via `join(process.cwd(), "src/assets/fonts", ...)`. Top-of-file comment must carry the font source URL + OFL note (CLAUDE.md forbids a README for this).

**Colors** are literals in Satori (no Tailwind): `#faf7f2` cream, `#262119` ink, `#c05f33` terracotta — copied from `src/app/globals.css` lines 54-56. Terracotta is used for the headline dollar figure only (UI-SPEC reserved use #1 — the wow delta).

**Do not add** `export const runtime = "edge"` or `export const dynamic` (`page.tsx` lines 12-14 anti-pattern comment applies).

---

### `src/lib/share-content.ts` (utility, pure, isomorphic)

**Analog:** `src/lib/path-display.ts` (structure) + `result-card.tsx` (framing branch) + `core-experience.tsx` (rank call).

**Module header + barrel-only imports** (`src/lib/path-display.ts` lines 1-11):
```ts
import type { TransferPath } from "@/engine";
import type { ProgramSeed, TransferRouteSeed } from "@/data";

// Transfer-path → human-readable string (RANK-04) — pure, testable, zero
// arithmetic. ...
//
// Imports stay on the "@/engine" and "@/data" BARRELS only — never deep
// paths. Both barrels export a module named transfers (engine FUNCTIONS vs
// seed ARRAYS, a known filename-collision hazard); type-only barrel imports
// sidestep it entirely.
```
`share-content.ts` is the **first lib module with runtime** `@/data`/`@/engine` imports (hence the vitest alias in Wave 0). **Name-collision warning** (`src/lib/format.ts` lines 14-17): both `@/engine` and `@/lib/format` export `cashOutValueCents` — import the format one (it takes the raw baseline) and do not import the engine one.

**Dataset + rank call** (`src/components/core-experience.tsx` lines 21-23, 78, 93-103):
```tsx
import { bonuses, programs, redemptions, routes } from "@/data";
import { rankRedemptions } from "@/engine";
...
const dataset = { programs, routes, bonuses, redemptions };
...
      return rankRedemptions({
        balances: paramsToBalances(params),
        dataset,
        asOf,
      });
```
Take `bookableNow[0]` — never re-sort (line 210 comment: "Engine array order is the ranking (RANK-01) — never re-sort").

**Headline + framing line** (`src/components/result-card.tsx` lines 38-55, 74) — the Pitfall-10 branch the card text and image must share:
```tsx
  const sourceProgram = programs.find(
    (program) => program.slug === chosenPath.fromProgramSlug,
  );
  const sourceName = sourceProgram?.name ?? chosenPath.fromProgramSlug;
  const cashOutBaselineCppX100 = sourceProgram?.cashOutBaselineCppX100 ?? null;

  // Pitfall 10 / A2: hotel currencies have no cash-out path (null baseline),
  // so a cash-out comparison would be misleading — frame as pure travel value.
  const framingLine =
    cashOutBaselineCppX100 === null
      ? "Pure travel value — these points have no cash-out option"
      : `vs. ~${formatDollars(
          cashOutValueCents(chosenPath.requiredSourcePoints, cashOutBaselineCppX100),
        )} cashing out`;
  ...
            {formatDollars(heroDelta(result))}
```
Headline = `formatDollars(heroDelta(top))` (`format.ts` lines 113-115 — the ONLY sanctioned hero-number path, T-04-06). Eyebrow/title use `formatPoints(balance)` + program `name` (`format.ts` lines 76-81) and `formatTransferPath(top.chosenPath, routes, programs)` (`path-display.ts` lines 24-50) for the route line if wanted.

**Canonical query string** — iterate `PARAM_KEY_BY_SLUG` order and skip nulls (`balance-params.ts` lines 20-29, 87-94):
```ts
export function balancesToParams(balances: Balances): BalanceParams {
  const params = {} as BalanceParams;
  for (const slug of SLUGS) {
    const value = balances[slug];
    params[PARAM_KEY_BY_SLUG[slug]] = isValidBalance(value) ? value : null;
  }
  return params;
}
```
→ `Object.entries(balancesToParams(balances)).filter(([, v]) => v !== null)` joined with `URLSearchParams` gives a stable `ur=90000&mr=50000` regardless of visitor URL order.

**Degrade rule** (`path-display.ts` lines 19-22, 44-47 and `format.ts` T-04-04 guards): no throws; empty `bookableNow` → baseline copy object. Wrap `rankRedemptions` in try/catch like `core-experience.tsx` lines 93-103 and fall back to baseline.

---

### `src/lib/interest-validation.ts` (utility, zod schema)

**Analog:** `src/data/types.ts` lines 1-19 — the repo's zod v4 house style:
```ts
import { z } from "zod";

// Seed-boundary validation (T-02-04): hand-written Zod v4 schemas whose object
// keys exactly mirror the camelCase Drizzle property names in src/db/schema.ts,
// so db.insert(table).values(seedArray) needs no field mapping. ...

const slug = z.string().regex(/^[a-z0-9-]+$/, "slug must be kebab-case");

export const programSeedSchema = z.object({
  slug,
  name: z.string().min(1),
  ...
});
```
Copy: `import { z } from "zod"`, header comment naming the boundary (T-05-xx form submission), exported `const interestSchema = z.object({...})`, keys mirroring the Drizzle column property (`email`). zod v4 top-level validators are already in use in this file (`z.iso.date()` at lines 56-57, 84) so `z.email()` is consistent. Export the inferred type via `z.infer` like lines 93-96. Keep this file DB-free so `tests/interest-validation.test.ts` runs in node without `DATABASE_URL` (the same reason `tests/seed-data.test.ts` header gives).

---

### `src/app/actions/interest.ts` (server action, single insert)

**Analog:** `scripts/seed.ts` (insert style) + `scripts/db-check.ts` (error hygiene) + `src/db/index.ts` (import surface).

**Import surface** (`src/db/index.ts` lines 16-24): `db` is a lazy Proxy so importing the module never throws at build time; the barrel re-exports every table: `import { db, interestSignups } from "@/db";` — this file becomes the **only** `@/db` importer under `src/app` + `src/components`.

**Insert house style** (`scripts/seed.ts` lines 56-63):
```ts
  if (programData.length > 0) {
    statements.push(db.insert(programs).values(programData));
  }
```
→ `await db.insert(interestSignups).values({ email }).onConflictDoNothing({ target: interestSignups.email });` (single statement; no select-then-insert).

**Validate before touching the DB** (`scripts/seed.ts` lines 30-48 — "Validate FIRST — any Zod ... failure throws here, before src/db is imported"): `interestSchema.safeParse(...)` and early-return the error state before the insert.

**Never leak driver errors** (`scripts/db-check.ts` lines 31-35 prints only `err.message`; T-01-07 in UI goes further — nothing at all):
```ts
main().catch((err: unknown) => {
  // Print only the error class/message — never the connection string.
  console.error("db-check failed:", err instanceof Error ? err.message : String(err));
```
In the action: `catch { return { status: "error", message: "Something went wrong. Try again in a moment." }; }` — no logging of the caught value (RESEARCH Security: driver errors may embed connection info).

**Copy voice** for messages (UI-SPEC): "You're on the list." / "Enter a valid email address." — no exclamation marks.

---

### `src/db/schema.ts` (modify — add `interestSignups`)

**Analog:** itself, `transferBonuses` lines 70-92 (a `serial` id table with commented columns):
```ts
export const transferBonuses = pgTable(
  "transfer_bonuses",
  {
    id: serial("id").primaryKey(),
    fromProgramSlug: text("from_program_slug").notNull(),
    ...
    // Where the promo was seen (DATA-03: methodology stays transparent).
    sourceNote: text("source_note").notNull(),
  },
```
Copy: snake_case column names in the string arg, camelCase property, a `//` comment on any column with a rule. Add `timestamp` to the import block (lines 1-11, alphabetical). Column set per RESEARCH Pattern 5: `id serial pk`, `email text notNull unique`, `source text notNull default("advisor-tease")`, `createdAt timestamp({ withTimezone: true }) notNull defaultNow()`. Header comment (lines 13-18) should gain one line noting `interest_signups` is the first table with a runtime writer (curated tables are seed-only — `scripts/db-check.ts` line 3). Apply via `npm run db:push` (`package.json` script; `drizzle.config.ts` loads `.env.development.local`).

---

### `src/components/site-footer.tsx` (component, server, static)

**Analog:** `src/components/almost-there.tsx` lines 1-29 — server-compatible presentational section, no client directive:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
...
// The "Almost there" tier (RANK-02): ...
// Accent discipline (UI-SPEC): no accent color anywhere in this section. The
// drama stays in Bookable now; the callout and the potential delta are ink.
...
  return (
    <section className="mt-12 flex flex-col gap-6">
      <h2 className="font-heading text-ink text-[1.75rem] leading-tight font-semibold">
```
Footer: `<footer>` with the same `mx-auto w-full max-w-3xl px-4 sm:px-6` container as `core-experience.tsx` line 174, `text-ink/70 text-sm leading-5` links (the "Verified" stamp class, `result-card.tsx` line 125), `next/link` `href="/methodology"`, ink only. Include an "Accent discipline" comment like lines 11-12. Must contain the literal `href="/methodology"` (RESEARCH grep gate).

---

### `src/components/advisor-tease.tsx` (client form + Server Action)

**Analog:** `src/components/balance-form.tsx` (client form primitives) + `src/components/core-experience.tsx` lines 152-194 (button + live status).

**Client form scaffold** (`balance-form.tsx` lines 1-9, 42-67):
```tsx
"use client";

import { NumericFormat } from "react-number-format";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
...
          <div key={slug} className="flex flex-col gap-2">
            <Label htmlFor={slug} className="text-ink text-sm font-semibold">
              {name}
            </Label>
            <NumericFormat
              customInput={Input}
              id={slug}
              name={slug}
              ...
              inputMode="numeric"
              placeholder="0"
              autoComplete="off"
              // UI-SPEC exception: 44px touch target for the LinkedIn WebView
              // session — overrides the vendored Input's h-8 via cn merge.
              className="text-ink h-11 bg-white text-base"
```
→ plain `<Input type="email" name="email" inputMode="email" autoComplete="email" required className="text-ink h-11 bg-white text-base" />` with a `Label` (`text-ink text-sm font-semibold`). The vendored `Input` default is `h-8` (`ui/input.tsx` line 11) — the `h-11` override is mandatory (UI-SPEC 44px).

**Button + live status** (`core-experience.tsx` lines 155-169, 185-194):
```tsx
  const [copied, setCopied] = useState(false);
  ...
  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      // T-04-14: degrade silently — the URL bar still carries the share link.
    }
  }
  ...
        <Button
          type="button"
          onClick={handleCopyLink}
          // Sanctioned accent use #2 + UI-SPEC 44px touch target (h-11).
          className="bg-terracotta hover:bg-terracotta/90 h-11 min-w-44 self-start px-6 text-base font-semibold text-white"
        >
          <span aria-live="polite">
            {copied ? "Link copied" : "Copy my link"}
          </span>
        </Button>
```
For the tease: `Button type="submit" disabled={pending}` using the **default variant** (`ui/button.tsx` line 12: `bg-primary text-primary-foreground` — ink-on-cream, NOT terracotta; the only terracotta button is "Copy my link"), with `h-11 px-6 text-base font-semibold` and `<p aria-live="polite">{state.message}</p>` for the result. State comes from `useActionState(joinAdvisorWaitlist, { status: "idle", message: "" })` (React 19 — `import { useActionState } from "react"`), replacing the `useState` + handler pair. Honeypot `<input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />`.

**Section wrapper** — server-rendered `<section className="flex flex-col gap-6">` with `SECTION_HEADING_CLASS` heading (`core-experience.tsx` lines 80-81) and `text-ink/70 text-base leading-6` body copy (line 256); `mt-12` top spacing like `almost-there.tsx` line 26 (UI-SPEC 2xl section break). Import ONLY the action function reference from `@/app/actions/interest` — never `@/db` (grep gate; header comment at `core-experience.tsx` lines 17-20 states the rule).

---

### `src/components/core-experience.tsx` (modify — methodology link)

**Analog:** itself, lines 206-211:
```tsx
        <div className="flex flex-col">
          {results.bookableNow.length > 0 && (
            <section className="flex flex-col gap-6">
              <h2 className={SECTION_HEADING_CLASS}>Bookable now</h2>
              {/* Engine array order is the ranking (RANK-01) — never re-sort. */}
              <ul className="flex flex-col gap-6">
```
Insert one `next/link` immediately after the `<h2>`: `<Link href="/methodology" className="text-ink/70 text-sm leading-5 underline-offset-4 hover:underline">How we calculate these numbers →</Link>` — ink/muted (stamp class from `result-card.tsx` line 125), not terracotta. Add `import Link from "next/link";` in the external block (line 3-4 area). Literal `href="/methodology"` required by the grep gate.

---

### `vitest.config.ts` (modify — `resolve.alias`)

**Analog:** itself (entire file, 7 lines):
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
```
Add `resolve: { alias: { "@": path.resolve(__dirname, "src") } }` (`import path from "node:path"`), mirroring `tsconfig.json` lines 21-23 `"@/*": ["./src/*"]`. Leave `include` and `environment` untouched — RESEARCH verified this exact addition resolves `@/data`, `@/engine`, `@/lib/*`, `react-dom/server`, `nuqs/server`.

---

### `tests/share-content.test.ts` (unit)

**Analog:** `tests/path-display.test.ts` + `tests/engine-ranking.test.ts`.

**Header + real seed arrays** (`tests/path-display.test.ts` lines 1-12):
```ts
import { describe, expect, it } from "vitest";

import { programs, routes } from "../src/data";
import { formatTransferPath } from "../src/lib/path-display";
import type { TransferPath } from "../src/engine/types";

// RANK-04 transfer-path display tests against the REAL seed arrays from
// src/data — not inline route fixtures — so a seed rename or ratio change
// fails these tests exactly like a display regression would.
```
Test files use **relative** `../src/...` imports (every existing test does); only the module under test needs the `@` alias transitively.

**Pinned `asOf` + rank helper** (`tests/engine-ranking.test.ts` lines 12-22):
```ts
// asOf values are pinned (never the clock): "2026-09-15" sits inside the live
// Amex→Hilton +30% window (2026-09-01 → 2026-10-14); "2026-10-15" is the first
// day after it.

const dataset: EngineDataset = { programs, routes, bonuses, redemptions };

function rank(balances: Balances, asOf = "2026-09-15", options?: EngineOptions) {
  return rankRedemptions({ balances, dataset, asOf, options });
}
```
Cases: baseline copy for `{}`; `{ "chase-ur": 90_000 }` headline equals `formatDollars(heroDelta(rank(...).bookableNow[0]))`; hotel framing branch for a Hyatt-only balance; `queryString` canonical order (`{ "amex-mr": 50_000, "chase-ur": 90_000 }` → `"ur=90000&mr=50000"`); description `≤ 200` chars. `describe` titles cite requirement IDs (PLAT-03) like line 28.

---

### `tests/interest-validation.test.ts` (unit, hostile input)

**Analog:** `tests/balance-params.test.ts` lines 14-19, 61-104 (hostile-value table) and `tests/format.test.ts` (exact-string pins):
```ts
// INPUT-03 codec tests: the URL query string is an attacker-controllable
// boundary (T-04-01), so the codec is exercised with hostile values (0,
// negative, fractional, unsafe-huge, unknown keys) alongside the happy-path
// round-trip.
...
  it("drops negative values (-500)", () => {
    expect(paramsToBalances({ ur: -500 })).toEqual({});
  });
```
Cases: `" Nick@Example.com "` → `"nick@example.com"`; not-an-email rejected; 255+ chars rejected; honeypot `website: "x"` rejected; `website: ""`/absent accepted. Assert on `safeParse(...).success` and `.data.email`.

---

### `tests/methodology-page.test.ts` (SSR string assertions)

**Analog (partial):** `tests/balance-params.test.ts` lines 142-162 for a `describe` that reads a source artifact and asserts substrings; `tests/seed-data.test.ts` lines 19-28 for iterating the real enterable programs:
```ts
describe("server-safety (importable from server components)", () => {
  const source = readFileSync(join(__dirname, "..", "src", "lib", "balance-params.ts"), "utf8");

  it('contains no "use client" directive', () => {
    expect(source).not.toContain('"use client"');
  });
```
Here the "source" is `renderToStaticMarkup(createElement(MethodologyPage))` (`react-dom/server` verified in node by RESEARCH). Loop `programs.filter((p) => p.isUserEnterable)` and assert each `name` and `formatCpp(baseline)` (or the null-branch string) appear; assert the worked example string `formatCpp(cppX100(...))` appears; assert A2 wording ("high end" / "conservative"), "not financial advice", taxes/fees and dynamic-pricing headings. Import the page with a relative path: `../src/app/methodology/page`.

---

### `tests/og-route.test.ts` (binary response)

**Analog:** none. Use RESEARCH §"Code Examples" verbatim (executed this session): `GET(new Request("http://localhost/og?ur=90000&mr=50000"))` → status 200, `content-type` `image/png`, `cache-control` contains `s-maxage`, bytes 1-3 spell `PNG`; hostile params `?ur=-5&mr=abc&zz=1` → 200. Keep to 2-3 cases (~3 s/file). Depends on the vendored fonts existing — order the font task first.

---

### `src/assets/fonts/*.woff` (asset)

**Analog:** none. Two files from `@fontsource/fraunces@5.3.0` and `@fontsource/inter@5.3.0` (`files/fraunces-latin-600-normal.woff` 22,512 B; `files/inter-latin-400-normal.woff` 30,696 B) obtained via `npm pack` or jsDelivr — never added to `package.json`. Attribution lives in the `og/route.tsx` header comment (CLAUDE.md: no ad-hoc README). Font names passed to `ImageResponse` must exactly equal the `fontFamily` strings in the JSX ("Fraunces", "Inter").

---

## Shared Patterns

### Module-header comment convention
**Source:** every `src/**` file — e.g. `src/lib/format.ts` lines 3-17, `src/components/result-card.tsx` lines 20-27, `src/db/schema.ts` lines 13-18
**Apply to:** every new file
```ts
// The wow card (VAL-01, VAL-04, RANK-03/04/05). Pure presentation: every
// figure on this card is a pre-computed integer field on RankedResult passed
// through a plan 04-02 formatter — zero arithmetic lives here. ...
//
// Accent discipline (UI-SPEC): terracotta is used for exactly two things on
// this card — the hero delta and the active transfer-bonus badge.
```
A `//` block after imports naming requirement IDs (VAL-03, PLAT-03, PLAT-04), threat IDs (T-01-07 etc.), and the one rule the file enforces. JSDoc on every exported function (`format.ts` lines 45-50).

### Import ordering + barrel discipline
**Source:** `src/components/result-card.tsx` lines 1-18; `src/lib/path-display.ts` lines 8-11; `src/engine/index.ts` lines 5-7; `src/data/index.ts` lines 6-9
**Apply to:** all new source files
- Order: framework/external → blank line → `@/components/*` → `@/data` → `@/engine` → `@/lib/*`; `import type` for type-only.
- `@/data` and `@/engine` **barrels only**. Known collisions: `transfers` (data arrays vs engine fns), `programs`/`redemptions` (data arrays vs db tables), `cashOutValueCents` (engine vs `@/lib/format`). Alias when importing both sides.

### Neutral error handling (T-01-07)
**Source:** `src/lib/balance-storage.ts` lines 74-82, 101-105; `src/components/core-experience.tsx` lines 93-103, 162-169, 235-242
**Apply to:** `og/route.tsx`, `actions/interest.ts`, `share-content.ts`, `advisor-tease.tsx`
```ts
    try {
      return rankRedemptions({ balances: paramsToBalances(params), dataset, asOf });
    } catch {
      return null;
    }
...
/** T-04-12: neutral copy only — no error detail ever reaches the DOM. */
function ErrorState() {
  return (<p className="text-ink text-base leading-6">Something went wrong showing your results. Refresh the page to try again.</p>);
}
```
Bare `catch {` (no binding), a comment citing the threat ID, and a designed fallback value/copy. Never `console.error(err)`, never render the error.

### Formatter reuse — no new arithmetic outside `src/lib/format.ts`
**Source:** `src/lib/format.ts` lines 3-7 ("the ONLY sanctioned place UI-adjacent arithmetic lives"), lines 51-115
**Apply to:** `methodology/page.tsx`, `share-content.ts`, `og/route.tsx`
`formatDollars(cents)` → "$4,500"; `formatCpp(cppX100)` → "9.3¢"; `formatPoints(n)` → "90,000"; `formatVerifiedDate("2026-09-01")` → "Sep 1, 2026" (no `Date`); `heroDelta(result)` → `atMax ?? atMin`; `cashOutValueCents(points, baseline | null)`. Engine functions (`cppX100`) are called only to feed a formatter.

### `asOf` discipline (Pitfall 7/10)
**Source:** `src/app/page.tsx` lines 26-29; `src/components/core-experience.tsx` lines 48-54; `tests/engine-purity.test.ts` lines 114-124
**Apply to:** `page.tsx` `generateMetadata`, `og/route.tsx`; NOT `advisor-tease.tsx` or the island
`const asOf = new Date().toISOString().slice(0, 10);` — server-only, once per request; the engine takes it as input and tests pin it (`"2026-09-15"`).

### UI-SPEC class vocabulary (copy verbatim, no new tokens)
**Source:** `src/components/core-experience.tsx` lines 80-81, 174, 178, 189, 256; `src/components/result-card.tsx` lines 63, 73, 82-83, 97, 125; `src/app/globals.css` lines 53-64
**Apply to:** `methodology/page.tsx`, `site-footer.tsx`, `advisor-tease.tsx`, `core-experience.tsx` link
| Role | Class string |
|------|--------------|
| Page container | `mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 md:py-16` |
| Page h1 | `font-display text-ink text-display font-semibold` (+ `md:text-display-xl` ONLY on `/`) |
| Section heading (28px) | `font-heading text-ink text-[1.75rem] leading-tight font-semibold` |
| Body (16px) | `text-ink text-base leading-6`; muted: `text-ink/70 text-base leading-6` |
| Label (14px) | `text-ink/70 text-sm font-semibold`; stamp/link: `text-ink/70 text-sm leading-5` |
| Chip | `bg-ink/5 text-ink/70 inline-flex w-fit items-center rounded-full px-2 py-1 text-sm font-semibold` |
| Input (44px) | `text-ink h-11 bg-white text-base` on shadcn `Input` |
| Primary CTA (terracotta — "Copy my link" ONLY) | `bg-terracotta hover:bg-terracotta/90 h-11 min-w-44 self-start px-6 text-base font-semibold text-white` |
| Secondary button (tease submit) | shadcn `Button` default variant + `h-11 px-6 text-base font-semibold` |
| Section spacing | `gap-6` within, `mt-12` between sections |
Terracotta is reserved for: wow-delta figures (incl. the OG headline), "Copy my link", the bonus badge. Nothing on `/methodology`, the footer, or the tease.

### DB-free client tree (grep gate)
**Source:** `.planning/phases/04-core-experience/04-04-PLAN.md` line 189; `src/components/core-experience.tsx` lines 17-20; `tests/engine-purity.test.ts` lines 31-43 (denylist gate shape if promoted to a test)
**Apply to:** verification step of every plan touching `src/app` or `src/components`
`grep -rlE 'from "@/db|drizzle' src/components src/app` → must list exactly `src/app/actions/interest.ts`. `@/db` is imported by that file and `scripts/*` only. If a test is preferred, copy `engine-purity.test.ts` `SPECIFIER_RE` + `FORBIDDEN_PATTERNS` (lines 24, 32-43) over `src/components` + `src/app` with an allowlist for the action file.

### Test-file conventions
**Source:** `tests/format.test.ts` lines 1-16, 26-29; `tests/path-display.test.ts` lines 1-12; `tests/engine-ranking.test.ts` lines 12-22
**Apply to:** all four new test files
- `import { describe, expect, it } from "vitest";` then relative `../src/...` imports (types from `../src/engine/types`).
- Header comment stating what boundary is under test and why fixtures are real seed data.
- `describe("<fn> (<REQ-ID> <what>)")`, `it("<input> → <exact expected string>")`; pinned `asOf`, never the clock.
- Exact-string expectations for every rendered string (`format.test.ts` line 28: `expect(formatDollars(450_000)).toBe("$4,500")`).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/app/og/route.tsx` | route handler | request → PNG | No `route.ts(x)` handlers exist; no `ImageResponse` use. RESEARCH Pattern 4 is an executed, verified template — use it directly, layering the repo's loader/asOf/T-01-07 conventions listed above. |
| `src/assets/fonts/*.woff` | asset | file-I/O | No vendored binary assets in the repo (`public/` has none; fonts come from `next/font`). Follow RESEARCH §"Supporting". |
| `tests/og-route.test.ts` | test | binary response | No test today exercises a `Response`/binary body. RESEARCH §"Code Examples" shape was executed this session. |
| `tests/methodology-page.test.ts` (partial) | test | SSR string | No test renders React; `react-dom/server` verified in node by RESEARCH. Assertion style borrowed from the source-scan `describe` in `tests/balance-params.test.ts`. |

## Metadata

**Analog search scope:** `src/app/**`, `src/components/**` (incl. `ui/`), `src/lib/**`, `src/engine/{index,valuation,ranking,types}.ts`, `src/data/{index,programs,redemptions,types}.ts`, `src/db/**`, `scripts/**`, `tests/**`, `vitest.config.ts`, `drizzle.config.ts`, `tsconfig.json`, `package.json`, `src/app/globals.css`, `.planning/phases/04-core-experience/04-04-PLAN.md` (grep gate line)
**Files scanned:** 34 (each read once; large files read by targeted ranges)
**Pattern extraction date:** 2026-09-02
