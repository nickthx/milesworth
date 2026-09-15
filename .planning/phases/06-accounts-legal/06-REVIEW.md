---
phase: 06-accounts-legal
reviewed: 2026-09-15T00:00:00Z
depth: standard
files_reviewed: 30
files_reviewed_list:
  - scripts/db-check.ts
  - src/app/account/page.tsx
  - src/app/actions/account.ts
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/app/privacy/page.tsx
  - src/components/account/bookmark-list.tsx
  - src/components/account/delete-account-dialog.tsx
  - src/components/account/goal-form.tsx
  - src/components/account/goal-list.tsx
  - src/components/almost-there.tsx
  - src/components/bookmark-button.tsx
  - src/components/core-experience.tsx
  - src/components/result-card.tsx
  - src/components/save-balances-button.tsx
  - src/components/site-footer.tsx
  - src/components/site-header.tsx
  - src/db/schema.ts
  - src/lib/account-validation.ts
  - src/lib/balance-params.ts
  - src/lib/balance-storage.ts
  - src/lib/server/account-data.ts
  - src/lib/site.ts
  - src/proxy.ts
  - tests/account-actions.test.ts
  - tests/account-data.test.ts
  - tests/account-validation.test.ts
  - tests/balance-storage.test.ts
  - tests/guest-flow-gate.test.ts
  - tests/privacy-page.test.ts
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-09-15T00:00:00Z
**Depth:** standard
**Files Reviewed:** 30
**Status:** issues_found

## Summary

Phase 06 adds optional Clerk accounts on top of the guest flow: a public-by-default `proxy.ts`, `ClerkProvider` in the root layout, five Server Actions in `src/app/actions/account.ts`, a server-only read module, the `/account` page with balances/bookmarks/goals/delete-account, session-aware Save and Bookmark affordances in the island, and a static `/privacy` page.

The security posture of the write path is solid and I could not break it: every action opens with `await auth()` and refuses on a null `userId`; the `userId` is never accepted from the client; every `UPDATE`/`DELETE` is scoped by the session user; Zod schemas run before any DB code and derive their slug sets from the same sources the URL codec uses; error copy is fixed and neutral; `deleteAccount` removes DB rows before the Clerk user; and the `@/db` importer set is pinned by a test. No injection, XSS, secret, or authorization-bypass finding.

What I did find is behavioral, not security: (1) the island's account-balance hydration is guarded by a one-shot ref, so a user who signs in via the modal on an empty `/` never gets their saved balances until a hard reload; (2) the two `useTransition`-driven affordances await Server Actions with no `try/catch` and there is no `error.tsx` anywhere under `src/app`, so a transport failure replaces the whole results page with Next's default crash screen; (3) the `/privacy` cookie disclosure makes claims about Clerk cookies that are not true of how Clerk actually behaves; (4) the "T-06-02 scoping" test only asserts that `.where()` was called, not that the predicate includes the session user, so the property it names is not actually pinned.

## Warnings

### WR-01: Signing in on an empty `/` never applies the account's saved balances (one-shot hydration guard swallows the `savedBalances` prop change)

**File:** `src/components/core-experience.tsx:134-167`
**Issue:** The mount effect that runs `resolveInitialBalances(urlBalances, stored, savedBalances)` is guarded by `hydratedRef` and returns immediately on any subsequent run. `savedBalances` is in the dependency array (line 166) but the guard makes it dead: when a signed-out visitor lands on `/` with an empty URL and empty storage (source `"none"`), then signs in through the modal `SignInButton`, Clerk performs a soft `router.refresh()`. The RSC re-renders with a non-null `savedBalances`, the client component keeps its refs, the effect fires, `hydratedRef.current` is already `true`, and the account branch is skipped. The user sees the empty state with "Save my balances" disabled, which contradicts A1 rule 3 ("a fresh device lands on the last explicit save") on the most likely path a returning user takes: open the site, sign in. A hard reload fixes it, which is why a walkthrough that reloads between steps would not catch this. The ref guard itself is necessary for the storage branch (removing it would make "clear every field" instantly re-hydrate from storage), so the fix has to be a targeted second effect, not a guard removal.
**Fix:**
```tsx
// Keep the existing one-shot mount effect as-is. Add a second effect that
// reacts only to the account prop arriving after mount, and only when the
// visitor has not edited and the URL is still empty:
const appliedAccountRef = useRef(false);
useEffect(() => {
  if (appliedAccountRef.current || hasEditedRef.current) return;
  if (savedBalances === null || Object.keys(savedBalances).length === 0) return;
  if (Object.keys(paramsToBalances(params)).length > 0) return;
  const storage = getSafeStorage();
  const stored = storage === null ? null : readStoredBalances(storage);
  if (stored !== null && Object.keys(stored).length > 0) return; // storage still outranks account
  appliedAccountRef.current = true;
  void setParams(balancesToParams(savedBalances), { history: "replace" });
}, [savedBalances, params, setParams]);
```
Add a test in `tests/balance-storage.test.ts` or a component test documenting "account balances arriving after mount are applied when URL and storage are empty".

### WR-02: Transport failure of `setBookmark` / `saveBalances` is an uncaught error with no error boundary in the tree

**File:** `src/components/bookmark-button.tsx:54-61`, `src/components/save-balances-button.tsx:70-73`
**Issue:** Both components call a Server Action inside `startTransition(async () => { ... await action(...) ... })` with no `try/catch`. The action bodies catch driver errors and return neutral copy, but the *transport* can still reject (network drop, Vercel 5xx, action ID mismatch after a deploy, ad-blocker interfering with the POST). In React 19 a rejection inside a transition's async function is surfaced to the nearest error boundary. There is no `error.tsx` or `global-error.tsx` anywhere under `src/app` (verified), so Next renders its default "Application error: a client-side exception has occurred" screen, replacing the entire results page, including the wow card the user was looking at. For a portfolio demo where a recruiter clicks "Save to my account" on flaky Wi-Fi this is the worst possible failure mode, and it contradicts the T-06-04 intent that account failures degrade to fixed copy. The `useActionState` forms (`goal-form.tsx`, `goal-list.tsx`, `delete-account-dialog.tsx`, and the pre-existing `advisor-tease.tsx`) have the same exposure via form submission.
**Fix:**
```tsx
// bookmark-button.tsx
onClick={() =>
  startTransition(async () => {
    const next = !optimistic;
    setOptimistic(next);
    try {
      const result = await setBookmark(slug, next);
      setError(result.status === "error" ? result.message : "");
    } catch {
      setError("Something went wrong. Try again in a moment.");
    }
  })
}

// save-balances-button.tsx
onClick={() =>
  startTransition(async () => {
    try {
      setState(await saveBalances(balances));
    } catch {
      setState({ status: "error", message: "Something went wrong. Try again in a moment." });
    }
  })
}
```
Independently, add `src/app/error.tsx` (a `"use client"` component rendering the neutral ErrorState copy with a "Try again" button calling `reset()`) so the `useActionState` forms and any future thrown error degrade to a designed state instead of the framework default. Export the neutral string from a shared constant so the client fallback and the action's `NEUTRAL_ERROR` cannot drift.

### WR-03: `/privacy` cookie disclosure is factually wrong about Clerk's behavior

**File:** `src/app/privacy/page.tsx:150-157`
**Issue:** The Cookies section states that the only cookies are `__session` and `__client_uat`, that "they are set only once you sign in", and that "The guest flow sets no cookies at all." That does not match what `ClerkProvider` + `clerkMiddleware()` actually do. `layout.tsx` mounts `ClerkProvider` on every route (including `/` and `/privacy`), so clerk-js loads for every visitor; clerk-js writes `__client_uat` (value `0`) for a signed-out browser so the middleware can skip the handshake, so a guest does receive a Clerk cookie. Clerk 7 additionally sets a `__refresh_<suffix>` cookie on sign-in in production, and `__clerk_db_jwt` on development instances; `__clerk_handshake` is transient. The page is the consent target configured in the Clerk Dashboard and the project explicitly trades on "data integrity ... methodology stays transparent"; a disclosure that says "no cookies" while a cookie is being set is exactly the kind of inaccuracy a privacy policy must not contain. `tests/privacy-page.test.ts` pins headings and processors but not this claim, so nothing catches it.
**Fix:** Open the deployed site signed out in a fresh profile, list the cookies in DevTools, then rewrite the paragraph to match reality, for example:

> The only cookies come from Clerk and are strictly necessary. As soon as the page loads, Clerk's script sets a small `__client_uat` cookie (value `0` when you are signed out) so the site can tell whether a session exists without a redirect. Once you sign in, Clerk also sets `__session` and a `__refresh_…` cookie to keep you signed in. Nothing optional is set, so there is no cookie banner. We run no analytics.

Then add a test in `tests/privacy-page.test.ts` that asserts the prose does *not* contain "sets no cookies" and *does* name `__client_uat`. If the intent is genuinely "guests get no cookies", the fix is architectural instead: move `ClerkProvider` out of the root layout and into a layout that wraps only `/` and `/account`, and re-verify `/privacy` and `/methodology` in DevTools.

### WR-04: The "T-06-02 scoping" test does not assert scoping

**File:** `tests/account-actions.test.ts:155-161`, `tests/account-actions.test.ts:179-184`
**Issue:** The test names ("a scoped delete", "T-06-02 ... where clause invoked once") promise that the DELETE is scoped by the session user, but the assertions are only `mocks.del.toHaveBeenCalledTimes(1)` and `mocks.where.toHaveBeenCalledTimes(1)`. A regression that changes `deleteGoal` to `.where(eq(travelGoals.id, parsed.data))` (dropping the `userId` term) passes every test in this file. The same is true for `setBookmark(false)` and for `deleteAccount` (`eq(users.clerkUserId, userId)`). Since this file is the codebase's stated pin for T-06-02, the security property is currently unguarded by tests despite the header comment saying it is.
**Fix:**
```ts
import { PgDialect } from "drizzle-orm/pg-core";
const dialect = new PgDialect();

function whereParams(): unknown[] {
  const predicate = mocks.where.mock.calls[0][0];
  return dialect.sqlToQuery(predicate).params;
}

it('goalId "7" → delete scoped by BOTH the id and the session user', async () => {
  await deleteGoal(IDLE, form({ goalId: "7" }));
  expect(whereParams()).toEqual(expect.arrayContaining([7, "user_123"]));
});

it("bookmarked=false → delete scoped by the session user and the slug", async () => {
  await setBookmark(KNOWN_SLUG, false);
  expect(whereParams()).toEqual(expect.arrayContaining(["user_123", KNOWN_SLUG]));
});

it("deleteAccount → users delete scoped by the session user", async () => {
  await deleteAccount();
  expect(whereParams()).toEqual(["user_123"]);
});
```
For `saveBalances`, the delete is inside the batch; capture `mocks.where.mock.calls[0][0]` the same way and assert `"user_123"` is among the params.

## Info

### IN-01: The zero-balance save path in `saveBalances` is unreachable from the UI

**File:** `src/components/save-balances-button.tsx:70`, `src/app/actions/account.ts:99-105`
**Issue:** The button is `disabled` when `Object.keys(balances).length === 0`, so the action's carefully documented "Pitfall 10" branch (save `{}` → scoped delete of all `user_balances`) can never be invoked by a user. Consequence: a signed-in user has no way to remove their saved balances short of deleting the whole account. It is consistent with `/privacy` ("kept until you delete your account"), so this is a product gap plus dead code rather than a defect.
**Fix:** Either enable the button with a "Clear my saved balances" label when the URL is empty and `savedBalances` is non-null (the action already supports it), or add a "Clear saved balances" affordance on `/account`; if neither, delete the `else` branch and its test and let Zod's `min(1)`-style check reject an empty object.

### IN-02: `signOut` after deletion is fire-and-forget

**File:** `src/components/account/delete-account-dialog.tsx:38-44`
**Issue:** `void signOut({ redirectUrl: "/" })` runs after the Clerk user has already been deleted server-side, so the client's session revoke call is against a session that no longer exists. If clerk-js rejects instead of tolerating the 4xx, the rejection is unhandled and the user stays on `/account` with the dialog open and no message. The 06-07 walkthrough reportedly passed, so treat this as hardening.
**Fix:** `signOut({ redirectUrl: "/" }).catch(() => { window.location.assign("/"); })` so a rejected revoke still lands the user on the guest flow (a full navigation also clears any stale client state).

### IN-03: `deleteAccount` has a narrow window where a concurrent write resurrects the `users` row

**File:** `src/app/actions/account.ts:236-238`
**Issue:** Between `db.delete(users)` and `client.users.deleteUser(userId)`, any in-flight `setBookmark`/`saveBalances`/`addGoal` from another tab runs `ensureUser`, re-inserting the `users` row and a child row. After Clerk deletion there is no session to delete them with, leaving orphaned rows that contradict "Deletion is immediate and irreversible". Low probability (requires two tabs and a click race) but it is a data-retention promise.
**Fix:** After the Clerk deletion succeeds, run `db.delete(users).where(eq(users.clerkUserId, userId))` a second time (idempotent, cascades) before returning `ok`; or run the DB delete inside a batch that also inserts a `deleted_users` tombstone that `ensureUser` checks.

### IN-04: `balance-storage.isValidBalance` claims to be "the same guard as the URL boundary" but omits the `MAX_BALANCE` ceiling

**File:** `src/lib/balance-storage.ts:27-35`
**Issue:** The comment says the guard matches `balance-params`, but `balance-params.isValidBalance` also enforces `value <= MAX_BALANCE` (10,000,000) and `account-validation`/`account-data` enforce it too. Storage is the only boundary without the ceiling. In practice `balancesToParams` drops the value before it reaches the URL, so the user just sees an empty state with a stale storage entry that never self-heals, but the three boundaries were meant to be one rule.
**Fix:** Import `MAX_BALANCE` (already imported from the same module for `PARAM_KEY_BY_SLUG`) and add `&& value <= MAX_BALANCE`; add a `readStoredBalances` test for `10_000_001` returning null.

### IN-05: `/account` has no route-level `robots` and relies on the pre-launch global noindex

**File:** `src/app/account/page.tsx:31-34`
**Issue:** The root layout's `robots: { index: false }` is explicitly slated for removal as a Phase 7 launch-gate task. Once it goes, `/account` becomes indexable; crawlers would only ever see the signed-out prompt, but a per-user account page should never be a search result regardless.
**Fix:** Add `robots: { index: false, follow: false }` to this route's `metadata` export now so the Phase 7 change cannot accidentally expose it.

---

_Reviewed: 2026-09-15T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
