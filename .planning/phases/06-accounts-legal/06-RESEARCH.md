# Phase 6: Accounts & Legal - Research

**Researched:** 2026-09-03
**Domain:** Optional Clerk auth bolted onto a guest-first Next.js 16 App Router app; Drizzle/Neon persistence for balances, bookmarks, goals; privacy page + consent + account deletion
**Confidence:** HIGH on Clerk/Next/Drizzle APIs (Context7 + registry verified); MEDIUM on the drizzle-kit push fix (root cause verified by live introspection, fix unverified until a push runs); LOW on legal-content specifics (assumed, not legal advice)

<user_constraints>
## User Constraints

No `06-CONTEXT.md` exists — the user chose to plan without `/gsd:discuss-phase`. Scope is therefore the ROADMAP entry plus ACCT-01..04 verbatim:

### Locked (from ROADMAP.md / REQUIREMENTS.md / CLAUDE.md)
- **Goal:** Optional persistence bolts on without touching the guest flow. Depends on Phase 4.
- **Success criteria:** (1) User can sign up via Clerk and their balances save to their profile; the core flow still works fully logged out. (2) Signed-in user can bookmark redemptions and record travel goals, and both persist across sessions. (3) Privacy policy and consent are in place; a user can delete their account and data.
- **Stack (CLAUDE.md):** Clerk `@clerk/nextjs` v7, `src/proxy.ts` (never `middleware.ts`), no NextAuth, Drizzle `neon-http`, nuqs URL balances, public-by-default `clerkMiddleware()`, app data in **your own Postgres `users` table keyed by Clerk `userId`** — not Clerk metadata.
- **Guest-flow gates carried forward (Phase 4/5 decisions in STATE.md):** the client island never imports `@/db`; `/` awaits `searchParams` (implicitly dynamic) and must not add `export const dynamic`; A1 precedence — storage-restored balances are pushed into the URL with `history: "replace"`, storage is written only after the visitor edits, share links never clobber stored balances; `/methodology` and `/og` stay DB-free; `/methodology` stays statically prerendered (`○`).
- **Deferred item Phase 6 must resolve first:** `drizzle-kit push` currently exits 1 on every run (deferred-items.md). Phase 6's schema push must exit 0 non-interactively.

### Claude's Discretion
Everything not listed above: schema shape, which deletion mechanism, where the sign-in affordances live, privacy-page structure, test layout.

### Deferred Ideas (OUT OF SCOPE)
- V2-03 goal-personalized ranking (goals are stored only; no ranking effect in v1).
- Waitlist unsubscribe route (Phase 5 note).
- `/og` edge rate limiting (05-REVIEW-FIX operational item).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ACCT-01 | User can optionally sign up (Clerk) to save balances to their profile — core flow never requires login | §Standard Stack (Clerk v7 + `src/proxy.ts`), §Pattern 1 (public-by-default proxy), §Pattern 2 (ClerkProvider inside `<body>`, no `dynamic` prop), §Pattern 4 (Save-balances Server Action + `user_balances` upsert via `db.batch`), §Pattern 5 (URL > storage > account precedence) |
| ACCT-02 | Signed-in user can bookmark redemptions they're working toward | §Schema (`bookmarks`, no FK to `redemptions` — see Pitfall 6), §Pattern 6 (bookmark toggle Server Action + `revalidatePath`), §Pattern 3 (server-fetched `bookmarkedSlugs` prop) |
| ACCT-03 | Signed-in user can record travel goals (stored only; no v1 ranking effect) | §Schema (`travel_goals`), §Pattern 7 (`/account` page with `useActionState` forms mirroring `advisor-tease.tsx`) |
| ACCT-04 | Privacy policy, consent, and account/data deletion are available | §Pattern 8 (`/privacy` static page mirroring `/methodology`), §Consent (Clerk Dashboard "Require express consent"), §Pattern 9 (delete Server Action: DB cascade → `clerkClient().users.deleteUser` → client `signOut`) |
</phase_requirements>

## Summary

Phase 6 adds an *optional* account layer to an app whose entire value is delivered logged-out. The research confirms the stack decisions in CLAUDE.md are current: `@clerk/nextjs` 7.9.1 (published today, 2026-09-03) supports Next 16.3.4 (peer range `^16.1.0-0`), its docs name the middleware file `src/proxy.ts` for Next 16+, and `clerkMiddleware()` protects nothing by default — exactly the public-by-default shape this phase needs. Two Clerk v7/Next 16 specifics change how the layout is written: `<ClerkProvider>` must sit **inside `<body>`** (Core 3 upgrade guide), and it must be used **without the `dynamic` prop** so `/methodology` and the new `/privacy` page stay statically prerendered. Auth state for `/` should be read server-side with `await auth()` in `page.tsx` (the route is already dynamic) and passed to the client island as props, not via `useAuth()`.

The blocking discovery is in the database layer. The live Neon database runs **PostgreSQL 18.6**, and `drizzle-kit pull` (read-only, run three times) shows drizzle-kit 0.31.10 introspects the `transfer_routes` composite primary key with its columns **reversed** (`[to_program_slug, from_program_slug]`) even though the catalog order is `(from, to)`. drizzle-kit builds composite-PK/unique column lists from an unordered `information_schema` query, and PG18 returns those rows in a different order — so every push sees a "changed" PK, emits DROP/ADD, and dies with `2BP01`. The deferred-items diagnosis (63-char FK-name truncation) explains the FK churn but not the PK churn; both must be fixed. The fix is cheap: name the FK explicitly and reorder the `primaryKey()` columns in `schema.ts` to match what drizzle-kit introspects, then prove idempotence with a second push that prints "No changes detected". New Phase 6 tables must avoid composite PKs/unique *constraints* entirely (use `serial` id + `uniqueIndex`) so they don't reintroduce the same churn.

Two more findings shape the plan. First, a Clerk **production instance requires a custom domain** ("you cannot use a `*.vercel.app` domain for production"); on the current free `points-unlocked.vercel.app` host the app will run on a Clerk *development* instance (100-user cap, "Development mode" badge in the modal). Second, the seed script does a full delete-then-insert of `programs`/`redemptions`, so any FK from `bookmarks`/`user_balances` into those tables would break `npm run db:seed` the moment one bookmark exists — store validated slugs as plain text instead.

**Primary recommendation:** Wave 0 fixes the push (FK name + PK column order, prove idempotent) and provisions Clerk env vars; then add `src/proxy.ts`, `<ClerkProvider>` inside `<body>`, four `users`-anchored tables with `ON DELETE CASCADE`, thin Zod-guarded Server Actions in `src/app/actions/account.ts`, a dynamic `/account` page, a static `/privacy` page, and a delete flow that cascades the DB *before* calling `clerkClient().users.deleteUser()` — no webhook in v1.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Sign-in / sign-up UI (modal) | Browser / Client (Clerk components) | Clerk (SaaS) | `<SignInButton mode="modal">` keeps the user on `/` with balances still in the URL |
| Session verification | Frontend Server (`src/proxy.ts` → `clerkMiddleware`) | — | Runs in the Node proxy; `auth()` in server code reads what it attached to the request |
| Reading auth state for `/` | Frontend Server (RSC `page.tsx`, `await auth()`) | — | `/` is already dynamic; server-read state avoids the `useAuth()` hydration flip and the `dynamic` prop |
| Save balances / bookmark / goals writes | API / Backend (Server Actions) | Database | Server Actions are the existing boundary pattern (`interest.ts`); Zod at the boundary; `auth()` gates every write |
| Initial balances precedence (URL > storage > account) | Browser / Client (island effect) | Frontend Server (supplies `savedBalances` prop) | Extends the pure `resolveInitialBalances` rule; hydration-safe because the prop is identical on server and client |
| Bookmark/goal reads for `/account` | Frontend Server (RSC) | Database | Dynamic, auth-gated route; DB-free client tree preserved |
| Account deletion | API / Backend (Server Action) | Clerk Backend API | DB cascade first, then Clerk delete, then client `signOut` |
| Privacy policy | CDN / Static (`○ /privacy`) | — | Same static pattern as `/methodology`; no auth calls |
| Consent capture | Clerk (Dashboard "Require express consent") | — | Zero code; `legalAcceptedAt` recorded on the Clerk user |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@clerk/nextjs` | 7.9.1 `[VERIFIED: npm registry]` (published 2026-09-03; peer `next ^16.0.10 \|\| ^16.1.0-0`, `react ~19.2.3`) | Auth: `clerkMiddleware`, `auth()`, `clerkClient()`, `<ClerkProvider>`, `<Show>`, `<SignInButton>`, `<UserButton>`, `verifyWebhook` (unused in v1) | CLAUDE.md locked; explicitly supports `proxy.ts` on Next 16 `[CITED: clerk-docs prompts/nextjs-quickstart.md]` |
| `drizzle-orm` | 0.45.2 (installed) `[VERIFIED: npm registry]` | Schema + queries; `db.batch()` on neon-http for multi-statement atomic writes | Already in use; `db.batch` verified `[CITED: orm.drizzle.team latest-releases v0.29.4]` |
| `drizzle-kit` | 0.31.10 (installed; `latest`) `[VERIFIED: npm registry]` | `push` for schema changes | Stay on 0.31.10. 1.0.0-rc.4 exists under the `rc` tag but is not paired with drizzle-orm 0.45 — do not upgrade in this phase |
| `zod` | 4.5.4 (installed) | Boundary validation for balances, bookmark slugs, goals | Mirrors `interest-validation.ts` |
| `nuqs` | 2.10.1 (installed) | URL balances; `balancesToParams` builds the "Open my saved results" link | Unchanged |

No other runtime packages are needed. `verifyWebhook` ships inside `@clerk/nextjs/webhooks` (export confirmed via `npm view @clerk/nextjs exports`), so **`svix` is not installed**.

### Supporting (dev-only, optional)
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `clerk` CLI (`npx clerk@latest`) | 3.3.0 `[VERIFIED: npm registry, repo github.com/clerk/cli, slopcheck OK]` | `clerk init` writes `.env.local` keys; `clerk webhooks listen --forward-to http://localhost:3000/api/webhooks` streams webhooks locally `[CITED: clerk-docs webhooks/billing.mdx]` | Only if the planner opts into the webhook backstop. Not required for the recommended v1 flow. Run via `npx`, never `npm i -g` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Own "Delete my account" Server Action | Clerk `<UserProfile>` built-in "Delete account" + `user.deleted` webhook | Webhook needs a public URL (deployed or `clerk webhooks listen`), a `CLERK_WEBHOOK_SIGNING_SECRET`, retries, and eventual consistency; the action is synchronous and unit-testable. Use the action; turn Clerk's self-serve delete **off** in the Dashboard so there is one deletion path |
| Server-read auth in `page.tsx` (`await auth()`) | `<ClerkProvider dynamic>` + `useAuth()` in the island | `dynamic` on the root provider makes every route dynamic, un-prerendering `/methodology` and `/privacy`; `useAuth()` without it flips from `isLoaded=false` after hydration `[CITED: clerk-docs rendering-modes.mdx]` |
| `serial` id + `uniqueIndex` on new tables | Composite `primaryKey()` | Composite PK/unique *constraints* churn under drizzle-kit 0.31.10 on PG18 (verified below). Indexes are introspected from `pg_index` and are not affected by the row-order bug (`[ASSUMED]` — prove with the second-push no-op gate) |
| `user_balances` rows (one per program) | `users.balances jsonb` | jsonb would avoid multi-statement writes, but rows keep the integer-only house style and make "which programs" queryable. `db.batch` makes the two-statement upsert atomic on neon-http `[CITED: drizzle docs]` |
| Explicit "Save my balances" button | Auto-sync balances on every edit when signed in | Auto-sync fights the A1 precedence rule and writes on every keystroke; explicit save is what ACCT-01 says |

**Installation:**
```bash
npm install @clerk/nextjs@^7.9.1
```

**Version verification (run 2026-09-03):** `npm view @clerk/nextjs version` → 7.9.1; `npm view drizzle-kit version` → 0.31.10; `npm view clerk version` → 3.3.0; `npm view @clerk/nextjs scripts.postinstall` → none.

## Package Legitimacy Audit

slopcheck 0.6.1 was installed (`pip install slopcheck`) and run via `python -m slopcheck scan --pkg npm <pkg> --json`.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `@clerk/nextjs` | npm | since 2021-08 | (not sampled) | github.com/clerk/javascript | OK | Approved — `[VERIFIED: npm registry]`, discovered via Context7 `/clerk/clerk-docs` |
| `clerk` (CLI, dev-only, `npx`) | npm | package name dates to 2011; current owner Clerk, repo github.com/clerk/cli, docs reference `npx clerk@latest` | (not sampled) | github.com/clerk/cli | OK | Approved for `npx` use only; optional |
| `svix` | npm | since 2021-05 | — | github.com/svix/svix-webhooks | not run | **Not needed** — `verifyWebhook` is bundled in `@clerk/nextjs/webhooks` |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none
No `postinstall` scripts on `@clerk/nextjs` or `clerk`.

## Architecture Patterns

### System Architecture Diagram

```
                 ┌──────────────────────────────────────────────────────────────┐
  Request ───►   │ src/proxy.ts  (Node runtime)                                 │
                 │ clerkMiddleware()  — public by default, verifies __session,  │
                 │ attaches auth to request; matcher skips _next/static + /og   │
                 └───────────────┬──────────────────────────────────────────────┘
                                 │
      ┌──────────────────────────┼─────────────────────────────┬──────────────────────┐
      ▼                          ▼                             ▼                      ▼
 ○ /methodology, ○ /privacy   ƒ /  (page.tsx)              ƒ /account (RSC)        ƒ /og (unchanged,
 static, no auth()            await searchParams            await auth()            excluded from matcher)
 (layout has ClerkProvider    await auth() ──► userId?      signed-out → prompt
  but no dynamic prop)            │ yes                      signed-in  → reads
                                  ▼                            users/balances/
                     src/lib/server/account-data.ts            bookmarks/goals
                     (imports @/db; server-only by gate)         │
                                  │ savedBalances,               ▼
                                  │ bookmarkedSlugs        forms (useActionState)
                                  ▼                              │
                       <CoreExperience …props>                   │
                       client island — DB-free                   │
                       URL > storage > account precedence        │
                       Save / Bookmark buttons ──────────────────┤
                                  │ FormData / args               │
                                  ▼                               ▼
                    src/app/actions/account.ts  ("use server")
                    auth() → Zod → db.batch / insert / delete → revalidatePath
                                  │                          │
                                  ▼                          ▼
                          Neon Postgres 18.6            Clerk Backend API
                    users ─┬─ user_balances (cascade)   clerkClient().users.deleteUser(userId)
                           ├─ bookmarks    (cascade)    (called AFTER the DB cascade)
                           └─ travel_goals (cascade)
```

### Recommended Project Structure
```
src/
├── proxy.ts                         # NEW — clerkMiddleware(), matcher (Pattern 1)
├── app/
│   ├── layout.tsx                   # ClerkProvider inside <body>, wraps NuqsAdapter; SiteHeader added
│   ├── page.tsx                     # + await auth(); passes savedBalances/bookmarkedSlugs props
│   ├── account/page.tsx             # NEW — dynamic, auth-gated: balances, bookmarks, goals, delete
│   ├── privacy/page.tsx             # NEW — static, mirrors methodology/page.tsx
│   └── actions/
│       ├── interest.ts              # unchanged
│       └── account.ts               # NEW — saveBalances, toggleBookmark, addGoal, deleteGoal, deleteAccount
├── components/
│   ├── site-header.tsx              # NEW — wordmark + <Show> sign-in / UserButton (server component)
│   ├── site-footer.tsx              # + Privacy link
│   ├── core-experience.tsx          # + savedBalances/bookmarkedSlugs/isSignedIn props, Save CTA
│   ├── save-balances-button.tsx     # NEW — client; SignInButton modal when signed out
│   ├── bookmark-button.tsx          # NEW — client; useOptimistic/useActionState toggle
│   └── account/                     # NEW — goal form, bookmark list, delete-account dialog (client)
├── db/schema.ts                     # + users, user_balances, bookmarks, travel_goals; FK name + PK order fix
└── lib/
    ├── account-validation.ts        # NEW — Zod: balances, bookmark slug, goal (DB-free, testable)
    ├── balance-storage.ts           # resolveInitialBalances gains a third `savedBalances` arg
    └── server/account-data.ts       # NEW — the only read path into user tables (imports @/db)
tests/
├── account-validation.test.ts       # NEW
├── balance-storage.test.ts          # + account-precedence cases
├── privacy-page.test.ts             # NEW — renderToStaticMarkup + source scan (copy methodology test)
├── account-actions.test.ts          # NEW — vi.mock('@clerk/nextjs/server') + vi.mock('@/db')
└── guest-flow-gate.test.ts          # NEW — source scans: no @/db in src/components; no auth() in /methodology, /privacy, /og
```

### Pattern 1: `src/proxy.ts` — public by default
**What:** Next 16 renamed `middleware.ts` → `proxy.ts` (root or `src/`); the runtime is Node only, edge is unsupported; a default export or a named `proxy` export is accepted `[CITED: nextjs.org upgrading/version-16, next/src/lib/constants.ts PROXY_LOCATION_REGEXP]`. Clerk's canonical file is `export default clerkMiddleware()` `[CITED: clerk.com/docs/reference/nextjs/clerk-middleware]`. With no `auth.protect()` calls, every route stays public.
**When to use:** Always — Clerk's `auth()` throws without it.
**Example:**
```ts
// src/proxy.ts — Source: clerk-docs reference/nextjs/clerk-middleware.mdx (matcher), with /og added
import { clerkMiddleware } from "@clerk/nextjs/server";

// Public by default: nothing calls auth.protect(); every route works signed out (ACCT-01).
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next internals, static files, and /og (the crawler-fetched, CDN-cached
    // PNG must never see Clerk cookies or handshake logic — see Pitfall 8).
    "/((?!_next|og(?:$|\\?)|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
```
The `og(?:$|\?)` exclusion is the researcher's addition `[ASSUMED]` — verify with `curl -sI http://localhost:3000/og` showing no `set-cookie` after the change.

### Pattern 2: `<ClerkProvider>` inside `<body>`, no `dynamic` prop
**What:** Clerk Core 3 (v7) requires `ClerkProvider` inside `<body>` for Next 16 cache-components compatibility `[CITED: clerk-docs upgrade-guides/core-3.mdx]`. Without the `dynamic` prop, routes remain statically renderable `[CITED: clerk-docs rendering-modes.mdx]`.
**Example:**
```tsx
// src/app/layout.tsx (delta only)
import { ClerkProvider } from "@clerk/nextjs";
// ...
<body className="flex min-h-full flex-col">
  <ClerkProvider>
    <NuqsAdapter>
      <SiteHeader />
      {children}
      <SiteFooter />
    </NuqsAdapter>
  </ClerkProvider>
</body>
```
Order (Clerk outside nuqs or inside) is not load-bearing; keep Clerk outermost so `<Show>` in the header works and the `grep -c NuqsAdapter` gate (STATE.md: reads 3) is re-baselined in the plan.

```tsx
// src/components/site-header.tsx — server component; Show/SignInButton/UserButton are client-safe
// Source: clerk-docs getting-started/quickstart.mdx (Show when="signed-in"/"signed-out")
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

export function SiteHeader() {
  return (
    <header>…wordmark…
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button type="button">Sign in</button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <a href="/account">My account</a>
        <UserButton />
      </Show>
    </header>
  );
}
```
`<Show when="…">` is the v7 replacement for `<SignedIn>/<SignedOut>` (both still exported) `[CITED: clerk-docs _partials/components/upgrade-guide-for-show.mdx]`. `mode="modal"` opens in place; if an OAuth flow needs to transfer to sign-up and no `signUpUrl` is configured it falls back to the Account Portal (`accounts.dev` on a dev instance) — acceptable for v1 `[CITED: clerk-docs reference/components/unstyled/sign-in-button.mdx]`.

### Pattern 3: Server-read auth for `/` → props into the island
**What:** `page.tsx` already awaits `searchParams` (dynamic). Add `const { userId } = await auth()`; when non-null, read `savedBalances` + `bookmarkedSlugs` from `src/lib/server/account-data.ts`; pass them (plus `isSignedIn`) to `<CoreExperience>`. Guests hit zero DB code (`userId === null` short-circuits before any import of the data module is *executed*; the import itself lives in server-only code).
```tsx
// src/app/page.tsx (delta)
import { auth } from "@clerk/nextjs/server";
import { loadAccountSnapshot } from "@/lib/server/account-data";
// ...
const { userId } = await auth();
const account = userId ? await loadAccountSnapshot(userId) : null;
<CoreExperience asOf={asOf} isSignedIn={userId !== null}
  savedBalances={account?.balances ?? null} bookmarkedSlugs={account?.bookmarkedSlugs ?? []} />
```
`auth()` in Server Components/Actions/Route Handlers must be awaited `[CITED: clerk-docs guides/users/reading.mdx]`. After a modal sign-in `@clerk/nextjs` refreshes the router so server props re-render with the new session `[ASSUMED — MEDIUM; verify manually: after modal sign-in the Save button switches without a manual reload]`.

### Pattern 4: Save-balances Server Action with atomic upsert
```ts
// src/app/actions/account.ts — mirrors interest.ts: fixed neutral copy, no zod messages, no driver errors
"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { and, eq, notInArray } from "drizzle-orm";
import { db, userBalances, users } from "@/db";
import { balancesSchema } from "@/lib/account-validation";

export type ActionState = { status: "idle" | "ok" | "error"; message: string };

export async function saveBalances(input: unknown): Promise<ActionState> {
  const { userId } = await auth();                       // Source: clerk-docs guides/secure/protect-content.mdx
  if (!userId) return { status: "error", message: "Sign in to save your balances." };
  const parsed = balancesSchema.safeParse(input);
  if (!parsed.success) return { status: "error", message: "Enter whole-number balances." };
  const entries = Object.entries(parsed.data);           // [slug, points][]
  try {
    await db.batch([                                     // neon-http: batch, not transaction
      db.insert(users).values({ clerkUserId: userId }).onConflictDoNothing(),
      db.delete(userBalances).where(and(eq(userBalances.userId, userId),
        notInArray(userBalances.programSlug, entries.map(([s]) => s)))),
      db.insert(userBalances)
        .values(entries.map(([programSlug, points]) => ({ userId, programSlug, points })))
        .onConflictDoUpdate({ target: [userBalances.userId, userBalances.programSlug],
                              set: { points: sql`excluded.points`, updatedAt: sql`now()` } }),
    ]);
    revalidatePath("/"); revalidatePath("/account");
    return { status: "ok", message: "Balances saved." };
  } catch { return { status: "error", message: "Something went wrong. Try again in a moment." }; }
}
```
`onConflictDoUpdate({ target, set })` `[CITED: drizzle docs insert.mdx]`; `db.batch([...])` on neon-http `[CITED: drizzle docs v0.29.4 release]` — the seed script already uses it. Guard: `entries.length === 0` → skip the insert item (drizzle throws on empty `values([])`). `notInArray` with an empty list must also be guarded (delete all rows instead).

### Pattern 5: Initial-balances precedence — URL > storage > account
Extend the pure function so the product rule stays unit-tested:
```ts
// src/lib/balance-storage.ts
export function resolveInitialBalances(urlBalances, storedBalances, savedBalances: Balances | null = null) {
  if (Object.keys(urlBalances).length > 0) return { source: "url" };
  if (storedBalances && Object.keys(storedBalances).length > 0) return { source: "storage", balances: storedBalances };
  if (savedBalances && Object.keys(savedBalances).length > 0) return { source: "account", balances: savedBalances };
  return { source: "none" };
}
```
Island: treat `"account"` exactly like `"storage"` — `setParams(balancesToParams(b), { history: "replace" })`, and do **not** write localStorage (A1: storage is written only after an edit). Rationale: a share link must still win; a device's own recent edits (storage) outrank the last explicit save; a fresh device with no storage lands on the saved set. The `/account` page also renders "Open my saved results" as `/?${new URLSearchParams(cleanParams)}` built from `balancesToParams`, which needs no new client state.

### Pattern 6: Bookmark toggle
- Server Action `toggleBookmark(slug: string)` → `auth()` → `bookmarkSlugSchema` (`z.enum` built from `redemptions.map(r => r.slug)` in `@/data`) → `db.insert(bookmarks).values(...).onConflictDoNothing()` or `db.delete(...)` → `revalidatePath("/")`.
- Client `<BookmarkButton slug bookmarked>`: `useOptimistic` for instant flip, calls the action in a transition; signed-out renders `<SignInButton mode="modal">` with copy "Sign in to save this". ResultCard stays presentational: it receives `bookmarked` + `isSignedIn` via props threaded from the island.

### Pattern 7: `/account` page
Dynamic RSC (`await auth()`), no `searchParams`. Signed-out: short prompt with `<SignInButton mode="modal">` (no redirect — keep `/account` linkable). Signed-in: saved balances (+ "Open my saved results" link), bookmark list (title looked up from `@/data` by slug; unknown slugs filtered out — Pitfall 6), goals form/list using `useActionState` + the persistent live-region pattern from `advisor-tease.tsx`, and the delete-account dialog (shadcn `dialog.tsx` already vendored). Link to `/privacy`.

### Pattern 8: `/privacy` static page
Copy the `/methodology` file shape: no client directive, no `searchParams`, no `new Date`, no `@/db`, exported `metadata`. Test with `renderToStaticMarkup` + a source scan like `tests/methodology-page.test.ts`. Content checklist in §Privacy Content below. Add a "Privacy" link in `SiteFooter` beside "Methodology".

### Pattern 9: Delete account — DB first, then Clerk, then sign out
```ts
// src/app/actions/account.ts
export async function deleteAccount(): Promise<ActionState> {
  const { userId } = await auth();
  if (!userId) return { status: "error", message: "Sign in first." };
  try {
    await db.delete(users).where(eq(users.clerkUserId, userId)); // cascades balances/bookmarks/goals
    const client = await clerkClient();                            // Source: clerk-docs _partials/delete-user.mdx
    await client.users.deleteUser(userId);
    return { status: "ok", message: "Your account and data were deleted." };
  } catch { return { status: "error", message: "Something went wrong. Try again in a moment." }; }
}
```
Client (dialog): on `ok`, `const { signOut } = useClerk(); await signOut({ redirectUrl: "/" })` `[CITED: useClerk().signOut; the redirectUrl option name is ASSUMED]`. Ordering rationale: if Clerk deletion fails after the DB cascade the user can retry (still signed in); the reverse leaves orphan rows with no session to retry from. Dashboard: turn **off** "Allow users to delete their accounts" (User & Authentication → User model) so Clerk's own UI cannot delete a user without our cascade `[CITED: clerk-docs sign-up-sign-in-options.mdx]`. Admin deletions from the Dashboard remain possible and would orphan rows — acceptable for v1; the `user.deleted` webhook is the v2 backstop.

### Schema (Drizzle, `src/db/schema.ts` additions)
```ts
export const users = pgTable("users", {
  clerkUserId: text("clerk_user_id").primaryKey(),      // Clerk userId; the cascade anchor
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userBalances = pgTable("user_balances", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.clerkUserId, { onDelete: "cascade" }),
  programSlug: text("program_slug").notNull(),           // validated against the 8 enterable slugs; NO FK (Pitfall 6)
  points: integer("points").notNull(),                   // positive safe int ≤ MAX_BALANCE, same guard as balance-params
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("user_balances_user_program_uidx").on(t.userId, t.programSlug)]);

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.clerkUserId, { onDelete: "cascade" }),
  redemptionSlug: text("redemption_slug").notNull(),     // validated against @/data slugs; NO FK (Pitfall 6)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("bookmarks_user_redemption_uidx").on(t.userId, t.redemptionSlug)]);

export const travelGoals = pgTable("travel_goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.clerkUserId, { onDelete: "cascade" }),
  text: text("text").notNull(),                          // ≤ 280 chars, trimmed
  destination: text("destination"),                      // optional, ≤ 80
  targetDate: date("target_date"),                       // optional ISO date
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```
`onDelete: "cascade"` via `.references()` `[CITED: drizzle docs indexes-constraints / relations]`. Single-column FKs get auto-names well under 63 chars (`user_balances_user_id_users_clerk_user_id_fk` = 44). Keep `serial` for consistency with existing tables.

### Anti-Patterns to Avoid
- **`<ClerkProvider dynamic>` in the root layout:** un-prerenders every route; `/methodology` and `/privacy` must stay `○`.
- **`useAuth()` to decide the Save CTA on `/`:** flips after hydration; read on the server and pass props.
- **Composite `primaryKey()` or `unique()` constraints on new tables:** re-creates the drizzle-kit/PG18 churn (Pitfall 1).
- **FKs from user tables into seeded tables:** breaks `npm run db:seed` (Pitfall 6).
- **Importing `@/db` anywhere under `src/components/`:** the client island must stay DB-free (T-04-11); reads go through `src/lib/server/account-data.ts`, writes through `src/app/actions/*.ts`.
- **Storing app data in Clerk metadata:** CLAUDE.md says Postgres keyed by `userId`.
- **Returning zod issue text or driver errors to the client:** T-05-14 precedent — fixed neutral copy only.
- **Auto-saving balances on every keystroke when signed in:** fights A1 and multiplies writes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session cookies, JWT verification, OAuth, email codes | Custom auth | `clerkMiddleware()` + `auth()` | Locked decision; Clerk handles handshake/refresh (`__session` 60s JWT, `__client_uat`) `[CITED: clerk-docs how-clerk-works/overview.mdx]` |
| Sign-in/up UI + consent checkbox | Custom forms | `<SignInButton mode="modal">` + Dashboard "Require express consent to legal documents" | Consent checkbox appears in the `<SignUp>` modal automatically; `legalAcceptedAt` recorded `[CITED: clerk-docs guides/secure/legal-compliance.mdx]` |
| Deleting a Clerk user | Raw REST call | `(await clerkClient()).users.deleteUser(userId)` | Official helper; uses `CLERK_SECRET_KEY` `[CITED: clerk-docs _partials/delete-user.mdx]` |
| Webhook signature verification (if ever used) | Manual svix HMAC | `verifyWebhook(req)` from `@clerk/nextjs/webhooks` | Reads `CLERK_WEBHOOK_SIGNING_SECRET` `[CITED: clerk-docs webhooks/syncing.mdx]` |
| Multi-statement atomic writes on neon-http | Sequential awaits | `db.batch([...])` | HTTP driver has no interactive transactions; batch is atomic `[CITED: drizzle docs]` |
| Upsert | select-then-insert | `.onConflictDoUpdate({ target, set })` / `.onConflictDoNothing()` | Idempotent under retries (interest.ts precedent) |
| Cascade deletes | Per-table deletes in app code | `references(..., { onDelete: "cascade" })` on every `user_id` FK | One `DELETE FROM users` statement removes everything |

**Key insight:** every hard problem here (auth, consent capture, atomicity, cascade) has a one-line owner in the stack; the phase's real work is wiring, the push fix, and the copy.

## Common Pitfalls

### Pitfall 1: `drizzle-kit push` churns `transfer_routes` PK on PostgreSQL 18 (root cause verified)
**What goes wrong:** Every push emits `DROP CONSTRAINT transfer_routes_..._pk` / `ADD CONSTRAINT ...` and fails `2BP01` because `transfer_bonuses`' FK depends on the PK index (deferred-items.md).
**Why it happens:** Live DB is `PostgreSQL 18.6` (`select version()` on 2026-09-03). `drizzle-kit pull` (read-only, 3 runs, identical) introspects the PK as `primaryKey({ columns: [table.toProgramSlug, table.fromProgramSlug], name: "transfer_routes_from_program_slug_to_program_slug_pk" })` — reversed vs. the catalog (`pg_index.indkey = 1 2`, `key_column_usage` ordinal 1→from, 2→to) and vs. `schema.ts`. drizzle-kit 0.31.10 builds `primaryKeys[...].columns = cprimaryKey.map(c => c.column_name)` from an un-ordered `information_schema` result (`node_modules/drizzle-kit/api.js` ≈ line 23325), and PG18 returns those rows in the other order. Same code path collects composite `UNIQUE` columns. Upstream tracks the class of bug as "fixed-in-beta" (`[CITED: github.com/drizzle-team/drizzle-orm/issues/4789, /issues/2626, /issues/4944]`); 0.31.8–0.31.10 release notes contain no PG18 fix. The FK churn is separate: the auto-name is 100 chars, Postgres stored the 63-char truncation `transfer_bonuses_from_program_slug_to_program_slug_transfer_rou`.
**How to avoid (Wave 0, before any new table):**
1. In `schema.ts`: `foreignKey({ name: "transfer_bonuses_route_fk", columns: [...], foreignColumns: [...] })` and `primaryKey({ columns: [t.toProgramSlug, t.fromProgramSlug] })` with a comment naming this pitfall (column order of a PK constraint is semantically irrelevant to the app and the seed).
2. `npx drizzle-kit push --verbose` **with a TTY** — expected statements: DROP old FK, ADD `transfer_bonuses_route_fk`, and nothing about the PK. (If a PK DROP still appears, abort — do not confirm — and fall back to renaming the live PK/FK by hand via `ALTER TABLE … RENAME CONSTRAINT` until the diff is empty.)
3. Gate: run `npx drizzle-kit push` a second time → must print "No changes detected" and exit 0. This is the phase's proof that the push is idempotent.
4. Only then add the Phase 6 tables and push again; repeat the second-push gate.
**Warning signs:** any `ALTER TABLE "transfer_routes"` in a push preview; exit code 1 with `2BP01`.

### Pitfall 2: Clerk production instance needs a domain you control
**What goes wrong:** Planner assumes `pk_live` keys; Clerk refuses — "you cannot use a `*.vercel.app` domain for production" `[CITED: clerk.com/docs/guides/development/deployment/vercel]`; DNS CNAMEs are required for production `[CITED: clerk-docs deployment/production.mdx]`.
**How to avoid:** Ship v1 on the Clerk **development** instance (`pk_test`/`sk_test`) — works on `points-unlocked.vercel.app`; limits: 100 users, "Development mode" badge in Clerk UI, shared OAuth credentials, emails from `@accounts.dev` `[CITED: clerk-docs managing-environments.mdx]`. Record as an assumption for Nick (A1). If a custom domain is bought later, production cut-over is a config task, not code.

### Pitfall 3: Build fails or every route 500s when Clerk env vars are missing
**What goes wrong:** `<ClerkProvider>` in the root layout means `next build` (which prerenders `/methodology`) and every request need `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`; `auth()` needs `CLERK_SECRET_KEY` and a running `clerkMiddleware`. Locally, keyless mode auto-generates temporary keys when none are set `[CITED: clerk-docs prompts (keyless mode)]`, which can mask a missing Vercel var.
**How to avoid:** Wave 0 checkpoint: keys exist in Vercel for Production **and** Preview (Clerk ↔ Vercel Marketplace integration syncs exactly `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` `[CITED: clerk-docs integrations/platforms/vercel-marketplace.mdx]`; manual entry is equivalent), plus `vercel env pull .env.development.local` locally. Verify with a preview deploy before merging the layout change.

### Pitfall 4: Making static routes dynamic by accident
**What goes wrong:** `auth()` in any server component opts that route into dynamic rendering `[CITED: clerk-docs rendering-modes.mdx]`; `<ClerkProvider dynamic>` does it globally.
**How to avoid:** `auth()` only in `page.tsx` (`/`), `account/page.tsx`, and Server Actions. Build-output gate: `○ /methodology`, `○ /privacy`, `ƒ /`, `ƒ /account`, `ƒ /og`. Source-scan test forbids `@clerk/nextjs/server` imports in `methodology/page.tsx`, `privacy/page.tsx`, `og/route.tsx`.

### Pitfall 5: Hydration mismatch from account-restored balances
**What goes wrong:** Reading `savedBalances` into state during render produces server/client HTML drift (Phase 4 Pitfall 2).
**How to avoid:** `savedBalances` is a prop (identical on both sides); it is only consumed inside the existing ref-guarded mount effect via `resolveInitialBalances(url, stored, saved)`, pushing to the URL with `history: "replace"` exactly like the storage branch.

### Pitfall 6: FKs into seeded tables break `npm run db:seed`
**What goes wrong:** `scripts/seed.ts` does `db.delete(redemptions)` / `db.delete(programs)` inside one batch; a `bookmarks.redemption_slug → redemptions.slug` FK makes that delete fail once a bookmark exists (or, with `onDelete: cascade`, silently wipes users' bookmarks on every reseed).
**How to avoid:** No FK from user tables into `programs`/`redemptions`. Validate slugs at the boundary with Zod enums derived from `@/data` (`PARAM_KEY_BY_SLUG` keys for balances; `redemptions.map(r => r.slug)` for bookmarks). At read time, drop bookmarks whose slug no longer exists in `@/data`. Add a `tests/seed-data.test.ts`-style assertion that no user table references a seeded table.

### Pitfall 7: Deleting the Clerk user before the DB rows
**What goes wrong:** Orphan rows with no session to retry from. **Avoid:** Pattern 9 order (DB → Clerk → signOut). Also turn off Clerk's self-serve delete so it cannot bypass the cascade.

### Pitfall 8: Clerk in the `/og` crawler path
**What goes wrong:** `/og` is CDN-cached per URL (`s-maxage=86400`, X-Vercel-Cache HIT proof in Phase 5). If the proxy touches it, any `Set-Cookie`/`Vary` header or a dev-instance handshake redirect could defeat caching or 307 a crawler.
**How to avoid:** exclude `/og` in the matcher (Pattern 1) and re-run the Phase 5 curl gate: `curl -sI "https://points-unlocked.vercel.app/og?ur=90000&mr=50000"` twice → `image/png`, no `set-cookie`, second `x-vercel-cache: HIT`. `[ASSUMED]` that clerkMiddleware would otherwise add headers — the exclusion is cheap insurance either way.

### Pitfall 9: Testing Server Actions that call `auth()`
**What goes wrong:** Importing `src/app/actions/account.ts` in vitest pulls `@clerk/nextjs/server`, which expects request context, and `@/db`, which expects `DATABASE_URL` at first query.
**How to avoid:** keep validation pure in `src/lib/account-validation.ts` (tested directly, like `interest-validation.test.ts`), keep actions thin, and in `tests/account-actions.test.ts` use `vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(), clerkClient: vi.fn() }))` and `vi.mock("@/db", async (orig) => ({ ...(await orig()), db: fakeDb }))`. The Phase 1 lazy `db` Proxy means importing `@/db` never connects, so the schema re-export is safe to spread. Vitest `environment: "node"`, no jsdom — no component rendering of Clerk UI in tests. `[ASSUMED]` standard `vi.mock` hoisting semantics; verify the first test runs green before writing more.

### Pitfall 10: Empty-array footguns in drizzle
`db.insert(t).values([])` throws and `notInArray(col, [])` produces invalid SQL — guard both branches in `saveBalances` (zero balances → delete all rows, skip insert).

## Privacy Content (what `/privacy` must say) — `[ASSUMED]`, not legal advice
Minimal, honest, plain-language sections (mirror the `/methodology` h1/h2 structure so the same test shape applies):
1. **What we collect, by mode.** Guests: balances you type live in the page URL and in your browser's localStorage (`pu:balances:v1`) — never sent to our server unless you share the link or sign in. Signed-in: your Clerk account (email, optional name, sign-in method), the balances you choose to save, bookmarks, travel goals. Waitlist: the email you enter in the advisor tease (`interest_signups`), stored separately from accounts.
2. **Who processes it.** Clerk (authentication; US-hosted; see clerk.com/legal/subprocessors and clerk.com/legal/dpa `[CITED: WebSearch-verified URLs]`), Neon (Postgres, AWS `us-east-2` — derived from `PGHOST`), Vercel (hosting, request logs).
3. **What we do not do.** No analytics or ad trackers (verified: no analytics packages in `package.json`/`src`), no selling data, no card credentials ever requested (Out-of-Scope table: manual entry is the privacy feature), no affiliate links.
4. **Cookies.** Clerk session cookies only (`__session`, `__client_uat`, `__client` on Clerk's domain) — strictly necessary, so no cookie banner `[ASSUMED]`.
5. **Retention & deletion.** Account data kept until you delete your account (`/account` → Delete my account, immediate, irreversible); waitlist email removable on request until the single launch email; contact address for requests (Nick's email — Open Question 3).
6. **Consent.** You accept this policy at sign-up (Clerk checkbox, timestamp recorded); continuing to use the guest flow requires no account.
7. **Children / changes.** Not directed at children under 13; "last updated" date rendered from a constant, not `new Date()`.
Clerk Dashboard → Legal: paste `https://points-unlocked.vercel.app/privacy` as the Privacy Policy URL and enable "Require express consent to legal documents" `[CITED: clerk-docs legal-compliance.mdx]`. Whether a Terms URL is mandatory alongside Privacy is `[ASSUMED: optional]` — check the Dashboard form during the checkpoint.

## Code Examples

### Reading auth in a Server Action (official shape)
```ts
// Source: clerk-docs guides/secure/protect-content.mdx
"use server";
import { auth } from "@clerk/nextjs/server";
export async function createPost(formData: FormData) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) throw new Error("You must be signed in.");
  // use userId
}
```

### Deleting the current user (official shape)
```ts
// Source: clerk-docs _partials/delete-user.mdx
import { auth, clerkClient } from "@clerk/nextjs/server";
const { isAuthenticated, userId } = await auth();
if (!isAuthenticated) return new NextResponse("Unauthorized", { status: 401 });
const client = await clerkClient();
await client.users.deleteUser(userId);
```

### Zod boundary (house style from interest-validation.ts)
```ts
// src/lib/account-validation.ts — DB-free, framework-free
import { z } from "zod";
import { redemptions } from "@/data";
import { PARAM_KEY_BY_SLUG } from "@/lib/balance-params";

const SLUGS = Object.keys(PARAM_KEY_BY_SLUG) as [string, ...string[]];
const MAX_BALANCE = 10_000_000; // same ceiling as balance-params (T-05-08)

export const balancesSchema = z.record(
  z.enum(SLUGS),
  z.number().int().positive().max(MAX_BALANCE),
);
export const bookmarkSlugSchema = z.enum(redemptions.map((r) => r.slug) as [string, ...string[]]);
export const goalSchema = z.object({
  text: z.string().trim().min(1).max(280),
  destination: z.string().trim().max(80).optional().or(z.literal("")),
  targetDate: z.iso.date().optional().or(z.literal("")),
});
```
(`z.iso.date()` is the zod 4 top-level ISO-date validator, same family as the `z.email()` already used `[ASSUMED — verify against installed zod 4.5 types at write time]`.)

### Named FK + reordered PK (the push fix)
```ts
// src/db/schema.ts — Pitfall 1
(t) => [primaryKey({ columns: [t.toProgramSlug, t.fromProgramSlug] })], // order matches drizzle-kit 0.31.10 introspection on PG18
// ...
foreignKey({
  name: "transfer_bonuses_route_fk", // ≤ 63 chars; auto-name was 100 and truncated by Postgres
  columns: [t.fromProgramSlug, t.toProgramSlug],
  foreignColumns: [transferRoutes.fromProgramSlug, transferRoutes.toProgramSlug],
}),
```
`name` on `foreignKey`/`primaryKey` `[CITED: orm.drizzle.team docs/indexes-constraints, v0.29.0 release]`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` + `export function middleware` | `proxy.ts` + `export default clerkMiddleware()` (Node runtime only) | Next 16 | File name only; edge runtime unavailable in proxy |
| `<ClerkProvider>` wrapping `<html>` | `<ClerkProvider>` inside `<body>` | Clerk Core 3 (`@clerk/nextjs` v7) | Layout structure |
| `<SignedIn>/<SignedOut>` | `<Show when="signed-in" \| "signed-out">` | Clerk v7 | Old components still work; use `Show` in new code |
| `auth.protect()` → 404 for unauthenticated Server Actions | → 401 | Core 3 | Irrelevant here (no protect calls) but note for tests |
| `svix` + manual `Webhook.verify` | `verifyWebhook()` from `@clerk/nextjs/webhooks` | Clerk 2025 | No extra dependency if the webhook is ever added |
| ngrok for local webhooks | `npx clerk@latest webhooks listen --forward-to …` | Clerk CLI 3.x | Optional; unused in v1 |
| `drizzle-kit push --strict` | default behavior; `--force` auto-accepts data-loss prompts; `--explain` (v1 only) | drizzle-kit 0.32+/1.0 | `--force` does not help with the `2BP01` failure — it is a SQL error, not a prompt |

**Deprecated/outdated:**
- `@vercel/postgres`, `middleware.ts`, `tailwindcss-animate` — already listed in CLAUDE.md.
- drizzle-kit 1.0 `--explain`/`--strict` removal — not applicable on 0.31.10.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | v1 ships on a Clerk **development** instance because the app lives on `*.vercel.app`; Nick accepts the "Development mode" badge and 100-user cap for the LinkedIn launch, or buys a domain | Pitfall 2 | Production cut-over needs a domain + DNS + `pk_live` keys — a config task, no code change |
| A2 | Reordering `primaryKey` columns in `schema.ts` (to, from) makes drizzle-kit's diff match its PG18 introspection and removes the PK churn | Pitfall 1 | Push still emits PK DROP; fallback is manual `RENAME CONSTRAINT` alignment or hand-written SQL for the new tables. Detected immediately by the second-push gate |
| A3 | `uniqueIndex` (not `unique()` constraint) on the new tables does not churn on PG18 | Schema | Second-push gate catches it; fallback: drop the index and enforce uniqueness in the action |
| A4 | Excluding `/og` from the proxy matcher is safe and keeps the CDN cache byte-identical | Pattern 1 / Pitfall 8 | Re-run the Phase 5 curl gate; if the exclusion regex mis-matches, `/og` simply runs through Clerk (benign) |
| A5 | `@clerk/nextjs` refreshes server components after a modal sign-in so `page.tsx` props update without a reload | Pattern 3 | If not, call `router.refresh()` in a `useEffect` keyed on `useAuth().isSignedIn` |
| A6 | `useClerk().signOut({ redirectUrl: "/" })` is the option name | Pattern 9 | Fallback: `await signOut(); router.push("/")` |
| A7 | Privacy-page content items and "no cookie banner" are adequate for a US portfolio app with possible EU visitors | Privacy Content | Nick should read it once; not legal advice |
| A8 | Clerk Dashboard Legal page accepts a Privacy URL without a Terms URL | Privacy Content | Add a short `/terms` page (same static pattern) if required |
| A9 | `z.iso.date()` exists in zod 4.5 | Code Examples | Use `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` |
| A10 | Standard `vi.mock` hoisting mocks `@clerk/nextjs/server` and `@/db` in the node environment | Pitfall 9 | Keep actions thin; fall back to testing only the pure validation modules |

## Open Questions

1. **Does Nick want a custom domain before launch?**
   - What we know: Clerk production requires one; the current host is `points-unlocked.vercel.app`; Phase 7 owns launch polish.
   - What's unclear: budget/timing.
   - Recommendation: plan Phase 6 on the dev instance; put "production instance cut-over" in Phase 7's launch checklist.
2. **Webhook backstop now or later?**
   - What we know: `user.deleted` fires on self-serve, Dashboard, and Backend API deletions `[CITED]`; `verifyWebhook` needs no new package; local testing via `npx clerk@latest webhooks listen`.
   - Recommendation: defer. v1 has one deletion path (our action) with Clerk self-serve delete disabled.
3. **Contact address for privacy requests.** The page needs one. Use a dedicated alias Nick controls; confirm during the plan's human checkpoint.
4. **Where does the Save CTA live?** Suggested: next to "Copy my link" in the island header as a secondary (ink) button; terracotta stays reserved (UI-SPEC sanctioned uses). Planner's discretion; `04-UI-SPEC.md` governs.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | build/tests | ✓ | v24.11.0 | — |
| npm | installs | ✓ | 10.9.8 | — |
| Vercel CLI | `vercel env pull` | ✓ | 57.0.0 | Vercel dashboard |
| Neon Postgres (live) | schema push, actions | ✓ | PostgreSQL 18.6, region `us-east-2`; tables: programs, redemptions, transfer_bonuses, transfer_routes, interest_signups (1 row) | — |
| `DATABASE_URL` | drizzle-kit, actions | ✓ (`.env.development.local`) | — | `vercel env pull` |
| Clerk keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) | ClerkProvider, `auth()`, `clerkClient()` | ✗ not present locally or (as far as env pull shows) on Vercel | — | **Blocking** — Wave 0 checkpoint: create Clerk app, add keys to Vercel (Production + Preview) via Marketplace integration or manually, `vercel env pull`. Local dev can use keyless mode but Vercel cannot |
| `@clerk/nextjs` | everything Clerk | ✗ not installed | 7.9.1 on npm | `npm install @clerk/nextjs@^7.9.1` |
| drizzle-kit | push | ✓ | 0.31.10 | — |
| slopcheck | package audit | ✓ (`python -m slopcheck`) | 0.6.1 | — |
| ngrok / cloudflared | webhook testing | ✗ | — | Not needed (webhook deferred; `npx clerk webhooks listen` if ever) |
| `NEON_AUTH_BASE_URL`, `VITE_NEON_AUTH_URL` present in env | — | present but **unused** | — | Neon Auth is not the auth choice; ignore, do not wire |

**Missing dependencies with no fallback:** Clerk keys on Vercel (must exist before the layout change deploys).
**Missing dependencies with fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11, `environment: "node"`, no jsdom; alias `@` → `src` (vitest.config.ts) |
| Config file | `vitest.config.ts` (no changes required) |
| Quick run command | `npx vitest run tests/<file>.test.ts` |
| Full suite command | `npm test && npm run typecheck && npm run lint && npm run build` (180 tests green pre-phase) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| Wave 0 | `drizzle-kit push` exits 0 and a second run prints "No changes detected" | manual gate (TTY) | `npx drizzle-kit push --verbose; npx drizzle-kit push; echo $?` | — (checkpoint:human-verify; paste both outputs into SUMMARY) |
| ACCT-01 | `balancesSchema` accepts the 8 slugs with positive ints ≤ 10M, rejects unknown slugs/negatives/floats/strings | unit | `npx vitest run tests/account-validation.test.ts` | ❌ Wave 0 |
| ACCT-01 | `resolveInitialBalances(url, stored, saved)`: URL wins; storage beats saved; saved used only when both empty; `"none"` otherwise | unit | `npx vitest run tests/balance-storage.test.ts` | ✅ extend |
| ACCT-01 | `saveBalances` returns error when `auth()` yields no userId; on success calls `db.batch` with delete+upsert; zero balances skips insert | unit (mocked Clerk + db) | `npx vitest run tests/account-actions.test.ts` | ❌ Wave 0 |
| ACCT-01 | Guest flow unchanged: `src/components/**` has no `@/db` / `drizzle` / `@clerk/nextjs/server` import; `page.tsx` has no `export const dynamic`; `/methodology`, `/privacy`, `/og` never import `@clerk/nextjs/server` | source-scan test | `npx vitest run tests/guest-flow-gate.test.ts` | ❌ Wave 0 |
| ACCT-01 | Build output: `ƒ /`, `ƒ /account`, `ƒ /og`, `○ /methodology`, `○ /privacy` | build | `npm run build` and inspect route table | ✅ build script |
| ACCT-01 | Sign up via modal on `/?ur=90000`, click Save, reload in a fresh profile/device → balances restored into the URL | **manual** (checkpoint:human-verify) | preview deploy; evidence = URL after reload + `user_balances` row count | — (Clerk modal cannot run in node) |
| ACCT-02 | `bookmarkSlugSchema` accepts every `@/data` slug, rejects others; `toggleBookmark` inserts/deletes with `onConflictDoNothing` | unit | `tests/account-validation.test.ts`, `tests/account-actions.test.ts` | ❌ Wave 0 |
| ACCT-02 | Bookmark persists across sign-out/sign-in; unknown slug filtered on `/account` | manual + unit (filter helper) | checkpoint + `tests/account-data.test.ts` (pure filter) | ❌ Wave 0 |
| ACCT-03 | `goalSchema` trims, caps 280/80, optional date must be ISO; `addGoal`/`deleteGoal` require auth and scope deletes by `userId` | unit | same files | ❌ Wave 0 |
| ACCT-04 | `/privacy` renders h1 + required h2 sections, mentions Clerk, Neon, localStorage key, "Delete my account", no `new Date`, no client directive, no `@/db` | unit (renderToStaticMarkup + source scan) | `npx vitest run tests/privacy-page.test.ts` | ❌ Wave 0 |
| ACCT-04 | `deleteAccount` order: `db.delete(users)` called **before** `clerkClient().users.deleteUser`; no Clerk call when DB delete throws | unit (mock call order) | `tests/account-actions.test.ts` | ❌ Wave 0 |
| ACCT-04 | Consent checkbox visible in the sign-up modal; `legalAcceptedAt` set on the Clerk user; delete flow removes rows and Clerk user, lands on `/` signed out | **manual** (checkpoint:human-verify) | Clerk Dashboard user view + `scripts/db-check.ts`-style count = 0 | — |
| ACCT-04 | Footer has `href="/privacy"` | grep | `grep -c 'href="/privacy"' src/components/site-footer.tsx` ≥ 1 | — |
| all | `/og` still CDN-cached with no cookies after proxy | smoke | `curl -sI "<prod>/og?ur=90000&mr=50000"` ×2 → `image/png`, no `set-cookie`, `x-vercel-cache: HIT` | — |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/<touched>.test.ts` + `npm run typecheck`
- **Per wave merge:** `npm test && npm run typecheck && npm run lint && npm run build`
- **Phase gate:** full suite green; second-push no-op evidence; preview-deploy manual checklist (sign-up with consent, save, bookmark, goal, cross-device restore, delete); `/og` curl gate — before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Clerk app + keys in Vercel (Production + Preview) + `vercel env pull` — human checkpoint
- [ ] Push fix in `schema.ts` (FK name + PK order) and the two-run push gate — human checkpoint (TTY)
- [ ] `npm install @clerk/nextjs@^7.9.1`
- [ ] `tests/account-validation.test.ts`, `tests/account-actions.test.ts`, `tests/privacy-page.test.ts`, `tests/guest-flow-gate.test.ts`, `tests/account-data.test.ts`
- [ ] Clerk Dashboard: Legal → consent on with `/privacy` URL; User model → self-serve delete **off** — human checkpoint
- No framework install needed.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Clerk (`clerkMiddleware`, `auth()`); no custom credential handling; `CLERK_SECRET_KEY` server-only, never `NEXT_PUBLIC_` |
| V3 Session Management | yes | Clerk `__session` (60 s JWT, SameSite=Lax) + handshake refresh `[CITED: how-clerk-works]`; app never reads cookies directly |
| V4 Access Control | yes | Every Server Action starts with `await auth()` and scopes every query by `userId` (never trusts a client-supplied user id); `deleteGoal(id)` must include `and(eq(id), eq(userId))` |
| V5 Input Validation | yes | Zod at every action boundary (`account-validation.ts`); slug enums from `@/data`; balance ceiling; FormData values passed raw to the schema (interest.ts precedent) |
| V6 Cryptography | no (delegated) | Clerk signs/verifies JWTs; `verifyWebhook` if ever used |
| V8 Data Protection / Privacy | yes | Cascade delete; `/privacy` disclosure; minimal data (no PII beyond Clerk's email); no logging of user data or driver errors (T-05-14) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR on goals/bookmarks (delete another user's row by id) | Elevation | All mutations filter by `userId` from `auth()`; ids never trusted alone |
| Server Action invoked directly (curl) without session | Spoofing | `auth()` check first; return neutral error, no data |
| Oversized/forged inputs (huge goal text, bogus slugs, 1e18 balances) | Tampering / DoS | Zod caps (280/80 chars, slug enums, `MAX_BALANCE`); fixed error copy |
| Leaking Clerk/driver errors | Information disclosure | catch-all returns neutral copy; nothing logged (T-01-07 precedent) |
| Secret key in client bundle | Information disclosure | `CLERK_SECRET_KEY` only in `src/app/actions/*` and server modules; grep gate on `src/components/**` |
| CSRF on Server Actions | Tampering | Next.js Server Actions enforce same-origin (`Origin`/`Host` check) by default `[ASSUMED — MEDIUM]`; Clerk cookies SameSite=Lax |
| Orphaned data after Clerk-side deletion | Repudiation / privacy | Disable self-serve delete in Dashboard; webhook backstop deferred and documented |
| Dev-instance shared OAuth credentials | Spoofing | Accepted for v1 (A1); production instance in Phase 7 if domain acquired |

## Sources

### Primary (HIGH confidence)
- Context7 `/clerk/clerk-docs` — clerkMiddleware reference + matcher; `proxy.ts` naming for Next 16 (prompts/nextjs-quickstart.md, nextjs-15-callout); Core 3 upgrade guide (ClerkProvider inside `<body>`, 401 change); rendering-modes (`auth()` dynamic, `dynamic` prop); `auth()` in Server Actions (protect-content.mdx); `currentUser()`; `_partials/delete-user.mdx` (`clerkClient().users.deleteUser`); webhooks/syncing.mdx (`verifyWebhook`, `user.deleted`, `CLERK_WEBHOOK_SIGNING_SECRET`); webhooks/billing.mdx (`npx clerk@latest webhooks listen`); legal-compliance.mdx + `legalAcceptedAt`; sign-up-sign-in-options.mdx ("Allow users to delete their accounts"); sign-in-button.mdx (`mode="modal"` fallback); upgrade-guide-for-show.mdx; managing-environments.mdx (dev instance limits); vercel-marketplace.mdx (synced env vars); how-clerk-works/overview.mdx (cookies, handshake)
- Context7 `/vercel/next.js` — proxy.ts convention, `PROXY_LOCATION_REGEXP` (`(?:src/)?proxy`), Node-only runtime, version-16 upgrade guide
- Context7 `/drizzle-team/drizzle-orm-docs` — `foreignKey`/`primaryKey` `name` option; `onDelete('cascade')`; `onConflictDoUpdate`; neon-http `db.batch`; `push --force`
- npm registry (2026-09-03): `@clerk/nextjs` 7.9.1 + peerDependencies + exports; `drizzle-kit` 0.31.10 / dist-tags; `clerk` 3.3.0; repo URLs; no postinstall scripts
- Live Neon introspection (read-only, 2026-09-03): `select version()` → PostgreSQL 18.6; `pg_constraint` names; `pg_index.indkey`; `drizzle-kit pull` ×3 → reversed composite-PK column order; `node_modules/drizzle-kit/api.js` composite-PK collection code
- Codebase: `src/db/schema.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/core-experience.tsx`, `src/lib/balance-params.ts`, `src/lib/balance-storage.ts`, `src/app/actions/interest.ts`, `src/lib/interest-validation.ts`, `src/components/advisor-tease.tsx`, `scripts/seed.ts`, `tests/methodology-page.test.ts`, `vitest.config.ts`, `drizzle.config.ts`, `.planning/phases/05-credibility-layer/deferred-items.md`, STATE.md decisions

### Secondary (MEDIUM confidence)
- [Clerk: Deploying to Vercel](https://clerk.com/docs/guides/development/deployment/vercel) — "cannot use a `*.vercel.app` domain for production" (WebFetch)
- [github.com/clerk/cli](https://github.com/clerk/cli) — official CLI, `webhooks` command (WebFetch)
- drizzle-orm issues [#4789](https://github.com/drizzle-team/drizzle-orm/issues/4789) (composite unique/FK order-dependent churn, 0.31.4, fixed-in-beta), [#2626](https://github.com/drizzle-team/drizzle-orm/issues/2626) (composite PK push fails after first run), [#4944](https://github.com/drizzle-team/drizzle-orm/issues/4944) (PG18 unnecessary DROP on push, 0.31.5); [drizzle-kit 0.31.8–0.31.10 release notes](https://github.com/drizzle-team/drizzle-orm/releases) — no PG18 fix listed
- [Clerk DPA](https://clerk.com/legal/dpa), [Clerk subprocessors](https://clerk.com/legal/subprocessors) — URLs for the privacy page (WebSearch)

### Tertiary (LOW confidence / assumed)
- Privacy-page content adequacy, cookie-banner exemption, `signOut({ redirectUrl })` option name, post-modal router refresh, `/og` matcher exclusion benefit, Server Action CSRF defaults — see Assumptions Log

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions and APIs verified on the registry and Context7 today
- Architecture: HIGH for Clerk/Next placement rules (cited); MEDIUM for the balances-precedence and props-vs-hooks choices (reasoned from Phase 4 decisions, not externally cited)
- Pitfalls: HIGH on the push root cause (live introspection evidence); MEDIUM on the fix until the two-run push gate passes; LOW on legal content

**Research date:** 2026-09-03
**Valid until:** 2026-10-03 (Clerk publishes daily canaries; re-check `@clerk/nextjs` minor before install; drizzle-kit 1.0 GA would change the push story)
