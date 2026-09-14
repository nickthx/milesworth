# Phase 6: Accounts & Legal - Pattern Map

**Mapped:** 2026-09-03
**Files analyzed:** 24 (14 new, 10 modified)
**Analogs found:** 21 / 24 (exact: 9, role-match: 12, none: 3)

Source of file list: `06-RESEARCH.md` §Recommended Project Structure + §Validation Architecture (no CONTEXT.md exists for this phase).

## File Classification

| New/Modified File | Status | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|--------|------|-----------|----------------|---------------|
| `src/proxy.ts` | NEW | middleware/config | request-response | — (no middleware exists) | none → use RESEARCH Pattern 1 |
| `src/app/layout.tsx` | MOD | provider/layout | — | itself, lines 74-81 | exact (self) |
| `src/app/page.tsx` | MOD | route (RSC, dynamic) | request-response | itself, lines 68-95 | exact (self) |
| `src/app/account/page.tsx` | NEW | route (RSC, dynamic, auth-gated) | CRUD read | `src/app/methodology/page.tsx` (shell/classes) + `src/app/page.tsx` (async RSC) | role-match |
| `src/app/privacy/page.tsx` | NEW | route (RSC, static) | — | `src/app/methodology/page.tsx` | exact |
| `src/app/actions/account.ts` | NEW | controller (Server Actions) | CRUD | `src/app/actions/interest.ts` | exact |
| `src/lib/account-validation.ts` | NEW | utility (Zod boundary) | transform | `src/lib/interest-validation.ts` + `src/lib/balance-params.ts` | exact |
| `src/lib/server/account-data.ts` | NEW | service (DB read) | CRUD read | `src/app/actions/interest.ts` (db import + neutral failure) | role-match (no server DB *read* exists yet) |
| `src/lib/balance-storage.ts` | MOD | utility (pure) | transform | itself, lines 108-138 | exact (self) |
| `src/db/schema.ts` | MOD | model | — | itself: `interestSignups` lines 129-147 (runtime-written table), `transferRoutes`/`transferBonuses` lines 49-96 (FK/PK fix) | exact (self) |
| `src/components/site-header.tsx` | NEW | component (server) | — | `src/components/site-footer.tsx` | exact |
| `src/components/site-footer.tsx` | MOD | component (server) | — | itself, lines 21-26 | exact (self) |
| `src/components/core-experience.tsx` | MOD | component (client island) | event-driven | itself, lines 48-56, 114-134, 153-195 | exact (self) |
| `src/components/save-balances-button.tsx` | NEW | component (client) | request-response (action call) | `src/components/advisor-tease.tsx` + `core-experience.tsx` lines 153-195 | role-match |
| `src/components/bookmark-button.tsx` | NEW | component (client, optimistic) | request-response | `src/components/advisor-tease.tsx` | role-match (no `useOptimistic` in codebase) |
| `src/components/result-card.tsx` | MOD | component (presentational) | — | itself, lines 29-35 | exact (self) |
| `src/components/account/goal-form.tsx` | NEW | component (client form) | request-response | `src/components/advisor-tease.tsx` | exact |
| `src/components/account/bookmark-list.tsx` | NEW | component (server/presentational) | — | `src/components/result-card.tsx` + `methodology/page.tsx` table (lines 208-232) | role-match |
| `src/components/account/delete-account-dialog.tsx` | NEW | component (client dialog) | request-response | `src/components/advisor-tease.tsx` + `src/components/ui/dialog.tsx` | role-match |
| `tests/account-validation.test.ts` | NEW | test | — | `tests/interest-validation.test.ts` | exact |
| `tests/balance-storage.test.ts` | MOD | test | — | itself, lines 145-172 | exact (self) |
| `tests/privacy-page.test.ts` | NEW | test | — | `tests/methodology-page.test.ts` | exact |
| `tests/account-actions.test.ts` | NEW | test (mocked) | — | — (no `vi.mock`/`vi.fn` anywhere in `tests/`) | none → RESEARCH Pitfall 9 shape; borrow file/describe style from `og-route.test.ts` |
| `tests/guest-flow-gate.test.ts` | NEW | test (source scan) | — | `tests/methodology-page.test.ts` lines 152-171 + `tests/balance-storage.test.ts` lines 174-187 | exact |
| `tests/account-data.test.ts` | NEW | test (pure filter) | — | `tests/balance-storage.test.ts` (injected fakes, no jsdom) | role-match |

Not pattern-mapped (config/ops, no code analog needed): `package.json` (add `@clerk/nextjs@^7.9.1`), `drizzle-kit push` two-run gate, Clerk Dashboard settings, Vercel env vars.

---

## Pattern Assignments

### `src/app/actions/account.ts` (controller / Server Actions, CRUD)

**Analog:** `src/app/actions/interest.ts` (67 lines — copy the whole shape, add `auth()` as the first gate)

**Imports + header comment pattern** (lines 1-22): `"use server"` first, `@/db` barrel exports both `db` and the table, validation from `@/lib/*`, and a header comment that cites requirement IDs and threat IDs and states the DB-import gate.
```ts
"use server";

import { db, interestSignups } from "@/db";
import { interestSchema } from "@/lib/interest-validation";

// PLAT-04: the advisor-waitlist Server Action. This is the ONLY file under
// src/app + src/components permitted to import "@/db" (grep gate, T-05-13) —
// the client tree stays DB-free so the Phase 4 guest-flow gate holds.
// ...
// T-05-14 (information disclosure): zod issue text is never returned (it can
// echo the input); driver errors are never returned or logged (they can embed
// connection details). Every message below is fixed, neutral copy.
```
Phase 6 delta: add `import { auth, clerkClient } from "@clerk/nextjs/server";`, `import { revalidatePath } from "next/cache";`, `import { and, eq, notInArray, sql } from "drizzle-orm";`. Update the header comment: `account.ts` becomes the SECOND file permitted to import `@/db` (with `src/lib/server/account-data.ts` the third) — re-baseline the grep gate.

**State type pattern** (lines 24-27) — reuse verbatim as `ActionState`:
```ts
export type InterestState = {
  status: "idle" | "ok" | "error";
  message: string;
};
```

**Action signature for `useActionState` forms** (lines 29-32) — `addGoal` and `deleteAccount` use this `(prev, formData)` shape so `useActionState` works unchanged; `saveBalances(input)` / `toggleBookmark(slug)` take a plain argument because they are called from `startTransition`, not a `<form action>`:
```ts
export async function joinAdvisorWaitlist(
  _prev: InterestState,
  formData: FormData,
): Promise<InterestState> {
```

**Boundary pattern** (lines 37-53): raw `FormData.get` values go straight to `safeParse`; on failure only the issue *path* is inspected, never `message`:
```ts
  const parsed = interestSchema.safeParse({
    email: formData.get("email"),
    website: website ?? undefined,
  });

  if (!parsed.success) {
    // Only the issue PATH is read, never its message (T-05-14).
    ...
    return { status: "error", message: "Enter a valid email address." };
  }
```

**Write + error handling pattern** (lines 55-66): idempotent write via `onConflictDoNothing`, catch-all returns neutral fixed copy, nothing logged:
```ts
  try {
    await db
      .insert(interestSignups)
      .values({ email: parsed.data.email })
      .onConflictDoNothing({ target: interestSignups.email });
    return { status: "ok", message: "You're on the list." };
  } catch {
    return {
      status: "error",
      message: "Something went wrong. Try again in a moment.",
    };
  }
```
Phase 6 additions on top of this shape (RESEARCH Pattern 4/6/9): first line of every action is `const { userId } = await auth(); if (!userId) return { status: "error", message: "Sign in to …" };`; multi-statement writes use `db.batch([...])` (see Shared Patterns → Batch writes); every `delete`/`update` filters by `eq(table.userId, userId)` (IDOR guard); `revalidatePath("/")` + `revalidatePath("/account")` after successful writes; `deleteAccount` orders `db.delete(users)` BEFORE `(await clerkClient()).users.deleteUser(userId)`.

---

### `src/lib/account-validation.ts` (utility / Zod boundary, transform)

**Analog:** `src/lib/interest-validation.ts` (31 lines) + `src/lib/balance-params.ts` lines 20-29, 62-77

**Module header + import pattern** (interest-validation.ts lines 1-11) — DB-free, framework-free, no client directive, importable by both the action and node tests:
```ts
import { z } from "zod";

// Form-submission boundary for the advisor waitlist (PLAT-04, T-05-03): the
// tease form's FormData is attacker-controllable, so every field is validated
// here before any DB code runs. Hand-written Zod v4 schema in the src/data/
// types.ts house style; the `email` key mirrors the `interest_signups`
// Drizzle column property so the Server Action can insert the parsed object
// without field mapping.
//
// DB-free and framework-free on purpose: importable by the Server Action
// (05-04) and by node tests without DATABASE_URL, no client directive.
```

**Schema + inferred type pattern** (lines 26-31): zod 4 top-level validators (`z.email()`), chained normalization before format check, `z.infer` export:
```ts
export const interestSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  website: z.literal("").optional(),
});

export type InterestInput = z.infer<typeof interestSchema>;
```

**Slug + ceiling source of truth** (balance-params.ts lines 20-29 and 62): derive the enterable-slug enum from `PARAM_KEY_BY_SLUG` keys, never re-list them; reuse the `10_000_000` ceiling. `MAX_BALANCE` is currently a non-exported `const` in balance-params.ts (line 62) — either export it from there or duplicate with a comment citing T-05-08:
```ts
export const PARAM_KEY_BY_SLUG = {
  "chase-ur": "ur",
  "amex-mr": "mr",
  ...
} as const satisfies Record<EnterableProgramSlug, string>;
// ...
const MAX_BALANCE = 10_000_000;
```
Same derivation already appears in `balance-storage.ts` line 25: `const KNOWN_SLUGS = new Set<string>(Object.keys(PARAM_KEY_BY_SLUG));`.

For `bookmarkSlugSchema`, import `redemptions` from `"@/data"` (barrel, `src/data/index.ts`) — note the ARRAY-vs-TABLE name collision comment there: never import `@/db` in this file.

---

### `src/app/privacy/page.tsx` (route / static RSC)

**Analog:** `src/app/methodology/page.tsx` (323 lines) — copy the file shape exactly; swap content

**Imports + header comment** (lines 1-21): only `next` types, `next/link`, and data/format modules. No client directive, no `searchParams`, no `new Date`, no `@/db`, no `@clerk/nextjs/server`:
```tsx
import type { Metadata } from "next";
import Link from "next/link";

// The methodology page (VAL-03). Static server component: no client
// directive, no request-time input, no clock read, no database — the route
// prerenders at build and ships zero client JS (T-05-05).
// ...
// Accent discipline (UI-SPEC): ink only.
```

**Metadata export** (lines 22-26):
```tsx
export const metadata: Metadata = {
  title: "Methodology — Milesworth",
  description:
    "How we source cash fares, treat taxes and fees, value points, and why award prices are ranges.",
};
```

**Class constants** (lines 91-98) — reuse verbatim so `/privacy` and `/account` look like `/methodology`:
```tsx
const SECTION_CLASS = "flex flex-col gap-6";
const HEADING_CLASS =
  "font-heading text-ink text-[1.75rem] leading-tight font-semibold";
const BODY_CLASS = "text-ink text-base leading-6";
const MUTED_CLASS = "text-ink/70 text-base leading-6";
const LABEL_CLASS = "text-ink/70 text-sm font-semibold";
const LINK_CLASS =
  "text-ink/70 text-sm leading-5 underline-offset-4 hover:underline";
```

**Page shell + section structure** (lines 110-140, 317-322): `<main className="bg-cream flex flex-1 flex-col">` → `<article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 md:py-16">` → `<header>` with `<h1 className="font-display text-ink text-display font-semibold">` → one `<section className={SECTION_CLASS}>` per `<h2 className={HEADING_CLASS}>` → trailing `<Link href="/" className={LINK_CLASS}>Back to your results</Link>`:
```tsx
  return (
    <main className="bg-cream flex flex-1 flex-col">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 md:py-16">
        <header className="flex flex-col gap-6">
          <h1 className="font-display text-ink text-display font-semibold">
            How we value your points
          </h1>
          <p className={MUTED_CLASS}>…</p>
        </header>

        <section className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>What you&apos;re looking at</h2>
          <p className={BODY_CLASS}>…</p>
        </section>
        ...
        <Link href="/" className={LINK_CLASS}>
          Back to your results
        </Link>
      </article>
    </main>
  );
```
"Last updated" date: render from a `const LAST_UPDATED = "2026-09-03";` — the test source-scan forbids `new Date` (methodology-page.test.ts line 165). Use `&apos;` for apostrophes in JSX (the test decodes `&#x27;`).

---

### `src/app/account/page.tsx` (route / dynamic auth-gated RSC, CRUD read)

**Analog:** `src/app/methodology/page.tsx` for shell/classes (above) + `src/app/page.tsx` lines 68-95 for the async RSC shape

**Async RSC + island handoff pattern** (page.tsx lines 68-95):
```tsx
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await loadBalanceParams(searchParams);
  const asOf = new Date().toISOString().slice(0, 10);

  return (
    <main className="bg-cream flex flex-1 flex-col">
      <CoreExperience asOf={asOf} />
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
        <AdvisorTease />
      </div>
    </main>
  );
}
```
Phase 6: `/account` takes no `searchParams`; `const { userId } = await auth();` makes it dynamic. Signed-out branch renders the methodology-style shell with a `<SignInButton mode="modal">`; signed-in branch calls `loadAccountSnapshot(userId)` from `@/lib/server/account-data` and renders server-side lists plus the client forms. Never `export const dynamic`.

**"Open my saved results" link**: build with `balancesToParams` (balance-params.ts lines 103-110) — drop `null` values, then `new URLSearchParams(...)`. The same helper is used by the island; see core-experience.tsx line 130.

**Bookmark title lookup**: mirror `methodology/page.tsx` lines 29-31 (`redemptions.find((r) => r.slug === …)`) and filter unknown slugs out (RESEARCH Pitfall 6).

---

### `src/lib/server/account-data.ts` (service / DB read)

**Analog (role-match):** `src/app/actions/interest.ts` for the `@/db` import + neutral failure; `src/db/index.ts` for why importing `@/db` is safe at build time

**DB import pattern** (interest.ts line 3): `import { db, userBalances, bookmarks, travelGoals } from "@/db";` — the barrel re-exports the schema (`src/db/index.ts` line 24: `export * from "./schema";`).

**Lazy connection guarantee** (src/db/index.ts lines 5-22) — importing never connects, so this module can be imported by `page.tsx` and spread in `vi.mock("@/db", …)`:
```ts
// Lazily initialized so importing this module never throws at build time
// ...
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    cached ??= makeDb();
    const value = Reflect.get(cached, prop, cached);
    return typeof value === "function" ? value.bind(cached) : value;
  },
});
```

**Return shape**: expose one function `loadAccountSnapshot(userId): Promise<{ balances: Balances | null; bookmarkedSlugs: string[]; goals: … }>` and one pure, exported filter (`filterKnownBookmarks(slugs, redemptions)`) so `tests/account-data.test.ts` can test it without the DB (same "inject the I/O" rationale as balance-storage.ts lines 5-9). Keep the `Balances` type from `@/engine` (`src/engine/types.ts` line 55: `Partial<Record<EnterableProgramSlug, number>>`).

**No-analog note**: there is no existing RSC-time DB read (Phase 4 deleted the Phase 1 count query — see page.tsx lines 9-13). Follow the same neutral-failure rule as interest.ts lines 61-66: catch, return `null`, never log.

---

### `src/db/schema.ts` (model) — MODIFIED

**Analog:** itself

**Runtime-written table pattern** (lines 129-147) — the `interestSignups` table is the only existing table with a runtime writer; copy its column idioms (`serial` id, `text`, `timestamp(..., { withTimezone: true }).notNull().defaultNow()`, comment explaining who writes it):
```ts
// PLAT-04 advisor-waitlist signal. Written only by the joinAdvisorWaitlist
// Server Action (src/app/actions/interest.ts) — never by the seed script.
export const interestSignups = pgTable("interest_signups", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  source: text("source").notNull().default("advisor-tease"),
  unsubscribeToken: uuid("unsubscribe_token").notNull().defaultRandom().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```
Phase 6 deviation: do NOT use `.unique()` column constraints or composite `primaryKey()` on the new tables — use `uniqueIndex(...)` in the third `pgTable` argument (RESEARCH Pitfall 1 / A3). `uniqueIndex` must be added to the import block (lines 1-13).

**FK / PK fix targets** (lines 71 and 87-95) — exact code to change:
```ts
  (t) => [primaryKey({ columns: [t.fromProgramSlug, t.toProgramSlug] })],   // line 71 → reorder to [t.toProgramSlug, t.fromProgramSlug]
// ...
  (t) => [
    foreignKey({                                                            // lines 88-94 → add name: "transfer_bonuses_route_fk"
      columns: [t.fromProgramSlug, t.toProgramSlug],
      foreignColumns: [
        transferRoutes.fromProgramSlug,
        transferRoutes.toProgramSlug,
      ],
    }),
  ],
```

**Cascade FK idiom** (lines 52-57 show `.references(() => programs.slug)`); Phase 6 adds the options object: `.references(() => users.clerkUserId, { onDelete: "cascade" })`.

**Header comment** (lines 15-22): extend the block to name the four new tables and state that `scripts/seed.ts` never touches them and that no user table has an FK into a seeded table (Pitfall 6).

---

### `src/components/site-header.tsx` (component / server)

**Analog:** `src/components/site-footer.tsx` (34 lines) — exact

**Whole-file pattern** (lines 1-34): server component, no directive, `next/link`, header comment with accent-discipline note, `mx-auto … max-w-3xl` container, `<nav aria-label>`:
```tsx
import Link from "next/link";

// Site footer (VAL-03 link placement). Server component: no client directive,
// no hooks, no data — ...
// Accent discipline (UI-SPEC): ink only.

export function SiteFooter() {
  return (
    <footer className="border-ink/10 mt-auto border-t">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-ink text-sm font-semibold">Milesworth</p>
        <nav
          aria-label="Footer"
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
        >
          <Link
            href="/methodology"
            className="text-ink/70 text-sm leading-5 underline-offset-4 hover:underline"
          >
            Methodology
          </Link>
```
Phase 6: `<header className="border-ink/10 border-b">`, same container, wordmark left, `<Show when="signed-out">`/`<Show when="signed-in">` from `@clerk/nextjs` right (RESEARCH Pattern 2). `Show`, `SignInButton`, `UserButton` are client-safe imports inside a server component — do not add `"use client"`.

**Footer delta** (lines 21-26): duplicate the `<Link>` block with `href="/privacy"` and label `Privacy`. Validation grep: `grep -c 'href="/privacy"' src/components/site-footer.tsx`.

---

### `src/app/layout.tsx` (provider) — MODIFIED

**Analog:** itself, lines 72-81

**Current wrap** — insert `<ClerkProvider>` (no `dynamic` prop) as the outermost child of `<body>`, and `<SiteHeader />` as the first child inside `NuqsAdapter`:
```tsx
      <body className="flex min-h-full flex-col">
        <NuqsAdapter>
          {children}
          <SiteFooter />
        </NuqsAdapter>
      </body>
```
Imports follow the existing order (lines 1-7): framework → `"./globals.css"` → `@/components/*` → `@/lib/*`. Add `import { ClerkProvider } from "@clerk/nextjs";` with the framework group. The STATE.md `grep -c NuqsAdapter` gate currently reads 3 and stays 3 (one import + open + close).

---

### `src/app/page.tsx` (route / dynamic RSC) — MODIFIED

**Analog:** itself, lines 68-95 (excerpt above under `/account`)

Delta: `import { auth } from "@clerk/nextjs/server";` + `import { loadAccountSnapshot } from "@/lib/server/account-data";`; after `await loadBalanceParams(searchParams);` add `const { userId } = await auth(); const account = userId ? await loadAccountSnapshot(userId) : null;`; thread `isSignedIn`, `savedBalances`, `bookmarkedSlugs` into `<CoreExperience>`. Keep the two clock reads exactly as commented (lines 78-83); do not touch `generateMetadata` (lines 29-66). Never add `export const dynamic` (lines 15-18).

---

### `src/components/core-experience.tsx` (client island) — MODIFIED

**Analog:** itself

**Props interface pattern** (lines 48-56) — extend with the three new props, each documented the same way:
```tsx
interface CoreExperienceProps {
  /**
   * Pitfall 7: the engine's `asOf` is derived ONCE on the server per request
   * ...
   */
  asOf: string;
}
```

**Mount-effect precedence pattern** (lines 114-134) — add the `"account"` branch beside `"storage"`; both push into the URL with `history: "replace"`; neither writes storage:
```tsx
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const storage = getSafeStorage();
    if (storage === null) return;

    const action = resolveInitialBalances(
      paramsToBalances(params),
      readStoredBalances(storage),
    );
    if (action.source === "storage") {
      void setParams(balancesToParams(action.balances), {
        history: "replace",
      });
    }
  }, [params, setParams]);
```
Caution: the early `return` on `storage === null` currently skips the whole resolve — with `savedBalances` in play, restructure so `readStoredBalances` is called only when storage is non-null (`storage === null ? null : readStoredBalances(storage)`) and the account branch still runs in restricted WebViews.

**Header CTA pattern** (lines 186-195) — the Save button sits beside this; it must NOT use `bg-terracotta` (sanctioned accent use #2 is "Copy my link" only):
```tsx
        <Button
          type="button"
          onClick={handleCopyLink}
          className="bg-terracotta hover:bg-terracotta/90 h-11 min-w-44 self-start px-6 text-base font-semibold text-white"
        >
          <span aria-live="polite">
            {copied ? "Link copied" : "Copy my link"}
          </span>
        </Button>
```

**ResultCard threading** (lines 222-230): pass `bookmarked={bookmarkedSlugs.includes(result.redemption.slug)}` and `isSignedIn` alongside `programs`/`routes`; `ResultCard` (result-card.tsx lines 29-35) gains two optional props and renders `<BookmarkButton>` in `CardFooter` — it stays free of hooks and of `"use client"`.

---

### `src/components/save-balances-button.tsx`, `bookmark-button.tsx`, `account/goal-form.tsx`, `account/delete-account-dialog.tsx` (client components calling Server Actions)

**Analog:** `src/components/advisor-tease.tsx` (122 lines) — exact for `goal-form`; role-match for the others

**Imports pattern** (lines 1-10): `"use client"`, React hooks, shadcn primitives, then the action + its state TYPE (type-only import keeps the driver out of the bundle):
```tsx
"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { joinAdvisorWaitlist } from "@/app/actions/interest";
import type { InterestState } from "@/app/actions/interest";
```

**useActionState + focus-on-success pattern** (lines 35-47):
```tsx
const INITIAL: InterestState = { status: "idle", message: "" };

export function AdvisorTease() {
  const [state, formAction, pending] = useActionState(joinAdvisorWaitlist, INITIAL);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state.status === "ok") {
      statusRef.current?.focus();
    }
  }, [state.status]);
```

**Form markup pattern** (lines 68-103): `<form action={formAction}>`, `<Label htmlFor>` + `<Input id name … className="text-ink h-11 bg-white text-base">` (44px touch target), submit `<Button type="submit" disabled={pending} className="h-11 px-6 text-base font-semibold">{pending ? "Sending" : "Notify me"}</Button>`.

**Persistent live-region pattern** (lines 105-120) — mount once, text-only updates, `tabIndex={-1}` so it can receive focus:
```tsx
      <p
        ref={statusRef}
        tabIndex={-1}
        aria-live="polite"
        className={
          state.status === "ok"
            ? "text-ink text-base leading-6 focus:outline-none"
            : "text-ink/70 text-sm leading-5 focus:outline-none"
        }
      >
        {state.status === "idle" ? "…helper copy…" : state.message}
      </p>
```

Per-component deltas:
- **save-balances-button**: signed-out → render `<SignInButton mode="modal"><Button type="button" …>Sign in to save</Button></SignInButton>`; signed-in → `startTransition(() => saveBalances(balances).then(setState))` with the same live region. Copy the 2s "Link copied" swap idiom (core-experience.tsx lines 156-161) for "Saved".
- **bookmark-button**: `useOptimistic(bookmarked)` + `startTransition(async () => { setOptimistic(!b); await toggleBookmark(slug); })`. No existing `useOptimistic` usage — this is new; keep it to one boolean.
- **goal-form**: exact copy of advisor-tease with `text` (`maxLength={280}`), `destination` (`maxLength={80}`), `targetDate` (`type="date"`) inputs and `addGoal` action. Reset the form on `ok` (advisor-tease unmounts the form instead; for goals use `key={state.status === "ok" ? submitCount : 0}` or a `formRef.current?.reset()` in the same effect).
- **delete-account-dialog**: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose` are exported from `src/components/ui/dialog.tsx` (line 157). Confirm button submits a `<form action={formAction}>` bound to `deleteAccount`; on `ok`, `const { signOut } = useClerk(); await signOut({ redirectUrl: "/" })` in the existing `useEffect([state.status])` slot.

---

### `src/lib/balance-storage.ts` (pure utility) — MODIFIED

**Analog:** itself, lines 108-138

**Current union + function** — add `| { source: "account"; balances: Balances }` and a third optional parameter; keep the numbered doc comment style:
```ts
export type InitialBalancesSource =
  | { source: "url" }
  | { source: "storage"; balances: Balances }
  | { source: "none" };

/**
 * A1 precedence (pure, so the product rule is unit-tested):
 * 1. URL has any balance → `{ source: "url" }`. ...
 * 2. URL empty + valid stored balances → `{ source: "storage", balances }`. ...
 * 3. Both empty → `{ source: "none" }` ...
 */
export function resolveInitialBalances(
  urlBalances: Balances,
  storedBalances: Balances | null,
): InitialBalancesSource {
  if (Object.keys(urlBalances).length > 0) {
    return { source: "url" };
  }
  if (storedBalances !== null && Object.keys(storedBalances).length > 0) {
    return { source: "storage", balances: storedBalances };
  }
  return { source: "none" };
}
```
The purity test (balance-storage.test.ts lines 174-187) forbids the string `localStorage` in this file — keep the new param name `savedBalances`.

---

### `tests/account-validation.test.ts` (test)

**Analog:** `tests/interest-validation.test.ts` (81 lines) — exact

**File pattern** (lines 1-18): relative import from `../src/lib/...` (tests never use the `@/` alias for the module under test), header comment naming the requirement + threat IDs, `describe("schemaName (REQ-ID …)")`, `safeParse` + `if (!result.success) return;` narrowing:
```ts
import { describe, expect, it } from "vitest";

import { interestSchema } from "../src/lib/interest-validation";

// PLAT-04 waitlist boundary tests. The advisor-tease form posts FormData that
// is entirely attacker-controllable (T-05-03), so the schema is exercised
// with a hostile-input table — ...

describe("interestSchema (PLAT-04 waitlist email boundary)", () => {
  it("trims and lowercases a padded mixed-case email", () => {
    const result = interestSchema.safeParse({ email: " Nick@Example.com " });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.email).toBe("nick@example.com");
  });
```

**Hostile-input table** (lines 31-78): one `it` per rejection class — wrong type (`42`), empty, oversized (`"a".repeat(…)`), null, `File`. For `balancesSchema` cover: unknown slug, negative, float, string `"90000"`, `> 10_000_000`; for `goalSchema`: 281-char text, 81-char destination, non-ISO date; for `bookmarkSlugSchema`: iterate `redemptions.map(r => r.slug)` from `../src/data` like `seed-data.test.ts` lines 31-37 does.

---

### `tests/privacy-page.test.ts` (test)

**Analog:** `tests/methodology-page.test.ts` (171 lines) — exact

**Render-once pattern** (lines 11-28):
```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import MethodologyPage from "../src/app/methodology/page";

// Rendered once; JSX escapes apostrophes as &#x27;, so decode for prose checks.
const html = renderToStaticMarkup(createElement(MethodologyPage)).replace(
  /&#x27;/g,
  "'",
);
```

**Ordered-headings assertion** (lines 30-40, 61-72):
```ts
const SECTION_HEADINGS = [ "What you're looking at", … ] as const;

  it("renders all nine section headings verbatim, as <h2>, in order", () => {
    let cursor = 0;
    for (const heading of SECTION_HEADINGS) {
      const match = html.indexOf(`>${heading}</h2>`, cursor);
      expect(match, `missing or out-of-order <h2> "${heading}"`).toBeGreaterThan(-1);
      cursor = match;
    }
    expect(html.match(/<h2[^>]*>/g)).toHaveLength(SECTION_HEADINGS.length);
  });
```

**Source-scan block** (lines 152-171) — copy verbatim, point at `privacy/page.tsx`, and add `expect(source).not.toContain("@clerk/nextjs/server")`:
```ts
describe("/methodology source scan (T-05-05 static, DB-free route)", () => {
  const source = readFileSync(
    join(__dirname, "..", "src", "app", "methodology", "page.tsx"),
    "utf8",
  );

  it('contains no "use client" directive', () => {
    expect(source).not.toContain('"use client"');
  });

  it("reads no request-time input and forces no dynamic rendering", () => {
    expect(source).not.toContain("searchParams");
    expect(source).not.toContain("export const dynamic");
    expect(source).not.toContain("new Date");
  });

  it("never imports the database", () => {
    expect(source).not.toContain('from "@/db');
  });
});
```
Content assertions to add (RESEARCH §Privacy Content): `toContain("Clerk")`, `toContain("Neon")`, `toContain("pu:balances:v1")`, `toContain("Delete my account")`, `toContain('href="/account"')`, `not.toContain("terracotta")`.

---

### `tests/guest-flow-gate.test.ts` (test / source scan)

**Analog:** `tests/methodology-page.test.ts` lines 152-171 (above) + `tests/balance-storage.test.ts` lines 174-187

**Purity-scan pattern** (balance-storage.test.ts lines 174-187):
```ts
describe("purity (storage I/O is injected — module references no browser global)", () => {
  const source = readFileSync(
    join(__dirname, "..", "src", "lib", "balance-storage.ts"),
    "utf8",
  );

  it("never references the localStorage global", () => {
    expect(source).not.toContain("localStorage");
  });
```
Phase 6: glob `src/components/**/*.tsx` with `node:fs` `readdirSync({ recursive: true })` and assert none contain `from "@/db`, `drizzle-orm`, or `@clerk/nextjs/server`; assert `src/app/page.tsx` lacks `export const dynamic`; assert `methodology/page.tsx`, `privacy/page.tsx`, `og/route.tsx` lack `@clerk/nextjs/server`; assert `src/db/schema.ts` has no `references(() => programs` / `references(() => redemptions` inside the user-table block (Pitfall 6 — simplest: assert the count of `references(() => users.clerkUserId` equals 3 and that `bookmarks`/`user_balances` blocks contain no other `references(`).

---

### `tests/balance-storage.test.ts` (test) — MODIFIED

**Analog:** itself, lines 145-172

**Precedence describe** — extend with account cases using the same one-line `toEqual` style:
```ts
describe("resolveInitialBalances (A1 precedence: URL wins; storage hydrates only when URL is empty)", () => {
  it('URL non-empty → { source: "url" } even when storage also has balances', () => {
    expect(
      resolveInitialBalances({ "chase-ur": 90_000 }, VALID_BALANCES),
    ).toEqual({ source: "url" });
  });
  ...
  it('URL empty + null stored → { source: "none" }', () => {
    expect(resolveInitialBalances({}, null)).toEqual({ source: "none" });
  });
```
Add: `({}, null, SAVED)` → `{ source: "account", balances: SAVED }`; `({}, VALID_BALANCES, SAVED)` → `storage`; `({ "chase-ur": 1 }, null, SAVED)` → `url`; `({}, null, {})` → `none`; existing two-arg calls must still pass (third param defaults to `null`).

---

### `tests/account-actions.test.ts` (test / mocked Server Actions)

**Analog:** none — `grep -rn "vi.mock\|vi.fn" tests/` returns nothing. Borrow the file/describe style from `tests/og-route.test.ts` lines 1-9 (imports the real route module, header comment explains the environment constraint), and the fake-object idiom from `tests/balance-storage.test.ts` lines 21-43 (`fakeStorage`, `throwingGetter`).

Shape to write (RESEARCH Pitfall 9, `[ASSUMED]` — verify the first test runs green before adding more):
```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const deleteUserMock = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
  clerkClient: vi.fn(async () => ({ users: { deleteUser: deleteUserMock } })),
}));

const batchMock = vi.fn();
const deleteMock = vi.fn(() => ({ where: vi.fn(async () => undefined) }));
vi.mock("@/db", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/db")>()),   // schema re-exports; lazy Proxy never connects
  db: { batch: batchMock, delete: deleteMock, insert: vi.fn(), select: vi.fn() },
}));

import { deleteAccount, saveBalances } from "../src/app/actions/account";
```
Also mock `next/cache` (`revalidatePath: vi.fn()`) — it throws outside a request scope. Assert call ORDER for `deleteAccount` with `deleteMock.mock.invocationCallOrder[0] < deleteUserMock.mock.invocationCallOrder[0]`, and that `deleteUserMock` is not called when the DB delete rejects.

---

## Shared Patterns

### Server Action contract (auth → Zod → write → neutral copy)
**Source:** `src/app/actions/interest.ts` lines 24-66 (excerpts above)
**Apply to:** every export in `src/app/actions/account.ts`
- `"use server"` on line 1; `ActionState = { status: "idle" | "ok" | "error"; message: string }`.
- First statement: `const { userId } = await auth();` → neutral error if null.
- `schema.safeParse(rawInput)` — pass FormData values raw; on failure read only `issue.path`, never `issue.message`.
- `try { …db… ; return ok } catch { return { status: "error", message: "Something went wrong. Try again in a moment." } }` — nothing logged, nothing from the driver or zod reaches the client (T-05-14 / T-01-07).
- Every mutation `where` includes `eq(table.userId, userId)`.

### DB-import gate
**Source:** `src/app/actions/interest.ts` lines 6-8; `src/components/core-experience.tsx` lines 18-21; `src/components/advisor-tease.tsx` lines 12-14
**Apply to:** all new components and pages
Only `src/app/actions/*.ts` and `src/lib/server/*.ts` import `@/db`. Components import the Server Action *reference* and `import type { ActionState }` only. `src/components/**` never imports `@clerk/nextjs/server` (use `@clerk/nextjs` client-safe components). Enforced by `tests/guest-flow-gate.test.ts`.

### Zod boundary modules are DB-free and framework-free
**Source:** `src/lib/interest-validation.ts` lines 9-11; `src/lib/balance-storage.ts` lines 5-9
**Apply to:** `src/lib/account-validation.ts`, the pure filter in `src/lib/server/account-data.ts`
No client directive, no `@/db`, no browser globals; I/O is injected so node tests run without jsdom or `DATABASE_URL`.

### Batch writes on neon-http with empty-array guards
**Source:** `scripts/seed.ts` lines 52-74
**Apply to:** `saveBalances` in `account.ts`
```ts
import type { BatchItem } from "drizzle-orm/batch";
// ...
  const statements: BatchItem<"pg">[] = [
    db.delete(transferBonuses),
    ...
  ];
  if (programData.length > 0) {
    statements.push(db.insert(programs).values(programData));
  }
  await db.batch(statements as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
```
Copy the `BatchItem<"pg">[]` accumulation + `length > 0` guard idiom; `drizzle`'s `.values([])` throws and `notInArray(col, [])` is invalid SQL (RESEARCH Pitfall 10) — when zero balances, push a plain `db.delete(userBalances).where(eq(userBalances.userId, userId))` and skip the insert.

### Idempotent writes
**Source:** `src/app/actions/interest.ts` lines 56-60 (`.onConflictDoNothing({ target })`)
**Apply to:** `users` upsert (`onConflictDoNothing`), bookmark insert (`onConflictDoNothing`), `user_balances` (`onConflictDoUpdate({ target: [userId, programSlug], set: {...} })`).

### Static-route conventions
**Source:** `src/app/methodology/page.tsx` lines 1-26, 91-98; enforced by `tests/methodology-page.test.ts` lines 152-171
**Apply to:** `src/app/privacy/page.tsx`; partially to `src/app/account/page.tsx` (classes/shell only — it IS dynamic)
No `"use client"`, no `searchParams`, no `new Date`, no `@/db`, no `@clerk/nextjs/server`; `export const metadata: Metadata`; reuse `SECTION_CLASS`/`HEADING_CLASS`/`BODY_CLASS`/`MUTED_CLASS`/`LABEL_CLASS`/`LINK_CLASS`.

### Design tokens and accent discipline
**Source:** `src/components/core-experience.tsx` lines 44-46, 177-195; `src/components/advisor-tease.tsx` lines 16-17, 89-101; `src/components/result-card.tsx` lines 25-27
**Apply to:** every new component/page
`bg-cream`, `text-ink`, `text-ink/70`, `font-display text-display` (h1), `font-heading text-[1.75rem] leading-tight font-semibold` (h2), `border-ink/10`. `h-11` (44px) on every input/button. `bg-terracotta` is reserved for "Copy my link", the hero delta, and the bonus badge — no accent on Save, Bookmark, Sign in, goals, or delete.

### Header-comment convention
**Source:** every file read (e.g. `interest.ts` lines 6-22, `site-footer.tsx` lines 3-10, `balance-storage.ts` lines 5-15)
**Apply to:** every new file
A block comment directly under the imports naming the requirement IDs (ACCT-01..04), the RESEARCH pattern/pitfall being honored, the threat IDs, and the accent-discipline note for UI files.

### Test conventions
**Source:** `tests/interest-validation.test.ts`, `tests/methodology-page.test.ts`, `tests/balance-storage.test.ts`
**Apply to:** all new tests
`import { describe, expect, it } from "vitest"`; module under test via relative `../src/...`; `describe("<subject> (<REQ-ID> …)")`; `it("<behavior sentence>")` with threat IDs in parentheses; `expect(x, "message").toBe(...)` for loops; source scans via `readFileSync(join(__dirname, "..", "src", …), "utf8")`; `environment: "node"`, no jsdom (`vitest.config.ts` lines 11-14).

---

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason | Use Instead |
|------|------|-----------|--------|-------------|
| `src/proxy.ts` | middleware | request-response | No `middleware.ts`/`proxy.ts` exists; nothing runs on the request path today | RESEARCH Pattern 1 verbatim (matcher excludes `_next`, static files, and `/og`) |
| `tests/account-actions.test.ts` | test (mocked) | — | No `vi.mock`/`vi.fn` usage anywhere in `tests/`; all existing tests hit real modules | RESEARCH Pitfall 9 mock shape (sketched above); first test must go green before expanding (A10) |
| `src/components/bookmark-button.tsx` (`useOptimistic` part) | component | optimistic request-response | No optimistic-UI code in the codebase | RESEARCH Pattern 6; wrap the action in `startTransition`, one boolean of optimistic state |

## Metadata

**Analog search scope:** `src/app/**`, `src/components/**`, `src/lib/**`, `src/db/**`, `src/data/index.ts`, `src/engine/types.ts`, `scripts/seed.ts`, `tests/**`, `vitest.config.ts`, `drizzle.config.ts`, `package.json`
**Files scanned:** 23 read in full or in part; 66 files enumerated
**Pattern extraction date:** 2026-09-03
