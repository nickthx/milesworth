---
phase: 05-credibility-layer
reviewed: 2026-09-03T20:58:11Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - scripts/db-check.ts
  - src/app/actions/interest.ts
  - src/app/layout.tsx
  - src/app/methodology/page.tsx
  - src/app/og/route.tsx
  - src/app/page.tsx
  - src/components/advisor-tease.tsx
  - src/components/core-experience.tsx
  - src/components/site-footer.tsx
  - src/db/schema.ts
  - src/lib/interest-validation.ts
  - src/lib/share-content.ts
  - tests/interest-validation.test.ts
  - tests/methodology-page.test.ts
  - tests/og-route.test.ts
  - tests/share-content.test.ts
  - vitest.config.ts
findings:
  critical: 1
  warning: 7
  info: 6
  total: 14
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-09-03T20:58:11Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

Phase 05 adds three new network surfaces (the `/og` image route, per-share-link `generateMetadata` on `/`, and the `joinAdvisorWaitlist` Server Action) plus a static `/methodology` page, a footer, and an `interest_signups` table. All 17 files were read in full; the engine modules (`valuation.ts`, `paths.ts`, `transfers.ts`, `ranking.ts`), the seed data (`programs.ts`, `transfers.ts`), `balance-params.ts`, `format.ts`, `db/index.ts`, and `result-card.tsx` were read as call-chain context so that the methodology prose and the share-copy "mirror" claims could be checked against what the code actually does.

The good news first, so it is not mistaken for something unchecked: the Server Action boundary is validated with a hand-written Zod v4 schema before any DB code runs, error copy is fixed and neutral (no Zod issue text, no driver errors), the honeypot short-circuits without a write, `onConflictDoNothing` removes the "already registered" oracle, the `/og` route's param pipeline (nuqs `parseAsInteger` -> `paramsToBalances` -> engine `sanitizeBalances`) does drop every hostile shape the tests throw at it, fonts are vendored and never fetched, the 500 path leaks nothing, no secrets appear in any reviewed file, `.env*` is gitignored, and the Marriott 150,000 / 60,000 example in the methodology prose is arithmetically correct against the seed route (3:1, 3,000 increment, 5K per 60K block).

The concerns are concentrated in three places:

1. **`/og` is an unauthenticated, ~1 s CPU render whose CDN cache key is the full query string.** The threat register (T-05-08) records "the CDN absorbs repeat requests" as the DoS mitigation, but any distinct query string is a CDN miss and an origin render. On a metered serverless plan this is a cheap way to take the demo offline. (CR-01)
2. **The waitlist action's honeypot is hard-wired to `""` before the schema sees it**, so the schema's honeypot rule (and the test that covers it) never runs in production, and a `File`-typed honeypot value bypasses the action-level check. There is also no rate limiting and no ownership verification on the stored email. (WR-04, WR-05)
3. **The methodology page and its test hand-type the Marriott figures** the file header says are "never typed", and the `/og` card's 24 h + 7 d SWR cache means the image and the per-request `og:description` can disagree across a bonus-window boundary despite the "can never disagree" invariant in three separate comments. (WR-02, WR-06)

## Critical Issues

### CR-01: `/og` render cost is unbounded per distinct URL; the documented DoS mitigation does not hold

**File:** `src/app/og/route.tsx:26-32`, `src/app/og/route.tsx:38-39`, `src/app/og/route.tsx:59-64`
**Issue:** The route comment lists T-05-08 (CPU/DoS) as mitigated because "input collapses to at most 8 bounded integers ... and the CDN absorbs repeat requests." The CDN keys on the full request URL (the 05-05 summary itself proves this: `/og?ur=90000` and `/og?hyatt=75000` are distinct cache entries). Every request whose query string has never been seen — `?ur=1`, `?ur=2`, ..., or `?ur=90000&x=<nonce>` — is a CDN MISS and a full Satori PNG render at origin (~1 s each per the test file's own comment). The "8 bounded integers" bound applies to what the engine sees, not to the cache key space, which is effectively infinite (junk keys are ignored by nuqs but still part of the URL). There is no rate limiting anywhere in the project (no `proxy.ts`, no WAF rule, no `@upstash/ratelimit`). A single shell loop can burn through Vercel Hobby's monthly function-execution budget and pause the deployment — the exact failure mode the project brief calls "unacceptable ... during a recruiter's visit."
**Fix:** Two code-level changes shrink the key space substantially; the third is operational and is the one that actually closes the hole.

```tsx
// src/app/og/route.tsx — collapse the cache key space to the canonical query
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const balances = paramsToBalances(loadBalanceParams(url));
  const asOf = new Date().toISOString().slice(0, 10);
  const share = buildShareContent({ balances, asOf });

  // Any non-canonical query (junk keys, duplicate keys, wrong order, invalid
  // values) redirects to the canonical form so the CDN sees ONE key per
  // balance set. The redirect itself is cheap and cacheable.
  const incoming = url.searchParams.toString();
  if (incoming !== share.queryString) {
    const target = share.queryString ? `/og?${share.queryString}` : "/og";
    return Response.redirect(new URL(target, url), 308);
  }
  // ... existing render ...
}
```

Also clamp balances to a plausible ceiling in `paramsToBalances` (e.g. `value <= 10_000_000`) so `ur=9007199254740991`-style values cannot be used to mint fresh cache keys (the engine already treats them as valid safe integers). Then add a rate-limit rule for `/og` (Vercel Firewall rate limiting, or an `@upstash/ratelimit` check keyed on the client IP in a `src/proxy.ts` matcher for `/og`) and update the T-05-08 entry in the threat register to name that rule as the mitigation rather than the CDN.

## Warnings

### WR-01: Memoized font loader caches a rejected promise forever

**File:** `src/app/og/route.tsx:49-57`
**Issue:** `fontsPromise ??= Promise.all([...])` stores the promise on first call and never clears it. If the first `readFile` rejects for a transient reason (EMFILE/EAGAIN under load, a cold-start filesystem hiccup), the rejected promise is cached and every subsequent request in that process returns the neutral 500 until the function instance is recycled. The 500 path deliberately has no logging (T-05-09), so this would present as "OG images randomly broken on some regions" with no diagnostic trail.
**Fix:**
```ts
function loadFonts(): Promise<{ fraunces: Buffer; inter: Buffer }> {
  fontsPromise ??= Promise.all([
    readFile(join(FONT_DIR, "fraunces-latin-600-normal.woff")),
    readFile(join(FONT_DIR, "inter-latin-400-normal.woff")),
  ])
    .then(([fraunces, inter]) => ({ fraunces, inter }))
    .catch((err: unknown) => {
      fontsPromise = undefined; // allow the next request to retry
      throw err;
    });
  return fontsPromise;
}
```

### WR-02: `/og` cache TTL (24 h + 7 d stale-while-revalidate) lets the card and the per-request metadata disagree

**File:** `src/app/og/route.tsx:38-39`, `src/app/og/route.tsx:63`, `src/app/page.tsx:35-36`
**Issue:** `generateMetadata` computes `asOf` and `share.description` fresh on every request. The PNG for the same query is served from the CDN for up to 24 h and then served stale for up to 7 more days while revalidating. The engine's output depends on `asOf` (bonus windows are date-gated; the live Amex -> Hilton +30% promo ends 2026-10-14, and `activeBonusFor` compares dates lexically). Across that boundary the `og:description` will say one dollar figure and the cached card will show another for up to eight days. The same applies to any redemption whose `verifiedAt` flips or whose fare is re-verified. Three separate comments (`og/route.tsx:12`, `page.tsx:22-23`, `share-content.ts:19-21`) state the two "can never disagree"; the cache policy makes that false for exactly the situations the methodology page promises are handled ("When a bonus window ends, every figure that depended on it reverts ... automatically").
**Fix:** Either (a) make `asOf` part of the cache key — have `generateMetadata` emit `/og?${share.queryString}&d=${asOf}` and have the route read `d` (validated as `YYYY-MM-DD`, else today) so a day change is a new key; or (b) shorten the policy to something that bounds the disagreement window, e.g. `s-maxage=3600, stale-while-revalidate=86400`. Option (a) keeps the CDN hit rate and makes the invariant true; if you take it, fold it into the CR-01 canonicalization so `d` is included in the canonical redirect.

### WR-03: Card footer hard-codes `points-unlocked.vercel.app` while the layout supports a `NEXT_PUBLIC_SITE_URL` override

**File:** `src/app/og/route.tsx:138`, `src/app/layout.tsx:28-29`
**Issue:** `layout.tsx` defines `SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://points-unlocked.vercel.app"` specifically so the domain can change without code edits (the 05-03 summary calls this out). The OG card renders the literal string `points-unlocked.vercel.app`. The moment a custom domain is set via the env var — the likely path for a LinkedIn launch — every social card carries the old host while `og:url` and `og:image` carry the new one.
**Fix:** Move the constant to a shared module and derive the display host from it.
```ts
// src/lib/site.ts
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://points-unlocked.vercel.app";
export const SITE_HOST = new URL(SITE_URL).host;
```
```tsx
// src/app/og/route.tsx
import { SITE_HOST } from "@/lib/site";
// ...
<div style={{ display: "flex", fontSize: 22, opacity: 0.6 }}>{SITE_HOST}</div>
```
and `import { SITE_URL } from "@/lib/site"` in `layout.tsx`.

### WR-04: Honeypot value is hard-wired to `""` before validation, so the schema's honeypot rule is dead code and a `File` value bypasses the action-level check

**File:** `src/app/actions/interest.ts:30-38`, `src/lib/interest-validation.ts:25`
**Issue:** Two problems compound here. (1) The action checks `typeof website === "string" && website.length > 0`. `FormData.get()` returns `string | File | null`; a multipart submission that puts a file in the `website` field yields a `File`, fails the `typeof` check, and proceeds to insert as though the honeypot were clean. (2) The action then calls `interestSchema.safeParse({ email, website: "" })` — the honeypot literal is hard-coded, so `website: z.literal("").optional()` can never fail in production. `tests/interest-validation.test.ts:51-65` ("rejects a filled honeypot", "rejects a null honeypot") therefore exercise a branch the runtime never takes, giving false confidence that the schema is the boundary for that field.
**Fix:**
```ts
// interest.ts
const website = formData.get("website");
// Anything other than absent-or-empty is a bot: File, non-empty string, etc.
if (website !== null && website !== "") {
  return { status: "ok", message: "You're on the list." };
}
const parsed = interestSchema.safeParse({
  email: formData.get("email"),
  website: website ?? undefined, // let the schema see the real value
});
```
Alternatively, delete `website` from `interestSchema` and the two tests, and document that the action owns the honeypot. Either way, the schema and the action should not both claim the field while only one of them ever sees it.

### WR-05: Waitlist has no rate limit, no email-ownership check, and promises an unsubscribe path that does not exist

**File:** `src/app/actions/interest.ts:24-55`, `src/components/advisor-tease.tsx:88-91`, `src/db/schema.ts:130-140`
**Issue:** The honeypot is the only abuse control. A script that omits the `website` field (the common case for anything smarter than a form-filler) can insert unlimited unique addresses (`a1@x.io`, `a2@x.io`, ...) at one Neon write each, and — more importantly for a PII table — can enrol any third party's address without their consent, since nothing verifies ownership. The UI copy states "No spam, unsubscribe any time," but the schema stores no unsubscribe token, consent flag, or timestamp beyond `created_at`, and no route exists to honour that promise. For a table whose only purpose is to send marketing email later, that is a compliance gap (CAN-SPAM / GDPR-style consent expectations) as well as a spam-target gap.
**Fix:** At minimum: (a) add an IP-keyed rate limit on the action (same mechanism as CR-01 — a `proxy.ts` matcher on the action POST, or check `headers().get("x-forwarded-for")` against an `@upstash/ratelimit` sliding window inside the action); (b) either change the copy to drop the unsubscribe promise until a mechanism exists, or add `unsubscribe_token text not null default gen_random_uuid()` to `interest_signups` now so the v2 send can honour it; (c) consider double opt-in before any send, or at least record `consent_source`/`user_agent` so unsolicited enrolments can be pruned.

### WR-06: Methodology page hand-types the Marriott figures its own header says are "never typed", and the test pins the literal

**File:** `src/app/methodology/page.tsx:12-15`, `src/app/methodology/page.tsx:187-194`, `tests/methodology-page.test.ts:98`
**Issue:** Lines 12-15 state the page is "the drift guard (T-05-04): every number below is rendered from the seed data through the engine ... never typed." Lines 190-193 then type `5,000`, `60,000`, `60,000`, `150,000`, and `180,000` as prose literals, and the test asserts `toContain("150,000")` as a literal rather than deriving it. The arithmetic is currently correct (verified: `requiredSourcePoints(marriott->alaska, null, 60000)` = 150,000 with the seeded 1/3 ratio, 3,000 increment, 5K/60K block), but the point of the drift guard is that a seed change moves the page. Change `bonusMilesPerBlock` or `incrementPoints` on the Marriott routes and both the page and the test keep asserting stale numbers with a green build — the opposite of the file's stated contract. The same section's "5,000 bonus miles for every 60,000" is also typed rather than read from `route.bonusMilesPerBlock` / `route.bonusBlockPoints`.
**Fix:** Compute the example the same way the ANA anchor is computed.
```tsx
import { routes } from "@/data";
import { cppX100, requiredSourcePoints } from "@/engine";

const marriottAlaska = routes.find(
  (r) => r.fromProgramSlug === "marriott-bonvoy" && r.toProgramSlug === "alaska-mileage-plan",
);
const EXAMPLE_MILES = 60_000;
const marriottCost =
  marriottAlaska === undefined ? null : requiredSourcePoints(marriottAlaska, null, EXAMPLE_MILES);
const naiveCost =
  marriottAlaska === undefined
    ? null
    : (EXAMPLE_MILES * marriottAlaska.ratioDenominator) / marriottAlaska.ratioNumerator;
// render: {formatPoints(EXAMPLE_MILES)} Alaska miles via Marriott cost {formatPoints(marriottCost)} ... not the naive {formatPoints(naiveCost)}
// and: Marriott's {formatPoints(marriottAlaska.bonusMilesPerBlock)} bonus miles for every {formatPoints(marriottAlaska.bonusBlockPoints)} ...
```
Then update `tests/methodology-page.test.ts:98` to derive the expected string from `requiredSourcePoints` the same way lines 76-91 derive the ANA figures.

### WR-07: Success message is rendered into a live region that is mounted with its content, so it is not announced

**File:** `src/components/advisor-tease.tsx:47-51`
**Issue:** When `state.status === "ok"` the component swaps the whole form out for a new `<p aria-live="polite">` that already contains the message. Screen readers only announce *changes* to an existing live region; inserting a live region that is already populated is not reliably announced (Chrome/NVDA and Safari/VoiceOver both commonly skip it). The error path works because the `<p aria-live>` at line 88 persists and only its text changes. A keyboard/screen-reader user who submits gets focus lost (the button they were on unmounts) and no announcement — for the one interaction on the page that stores their PII.
**Fix:** Keep a single persistent live region and toggle its content; keep the form mounted (disabled) or move focus deliberately.
```tsx
<p aria-live="polite" className={state.status === "ok" ? "text-ink ..." : "text-ink/70 ..."}>
  {state.status === "ok"
    ? state.message
    : state.status === "error"
      ? state.message
      : "One email when it launches. No spam, unsubscribe any time."}
</p>
{state.status !== "ok" && <form ...>...</form>}
```
Render the `<p>` before the conditional form so it exists on first paint.

## Info

### IN-01: Dead null-guard on `anchorPoints`

**File:** `src/app/methodology/page.tsx:48-53`, `src/app/methodology/page.tsx:125-127`
**Issue:** `anchor.pointsMax ?? anchor.pointsMin` can never be `null` because `pointsMin` is a non-nullable `number` in the seed type; the `anchorPoints === null` checks on lines 51 and 126 are unreachable. The comment "Guarded, never asserted non-null" is describing a guard that does nothing. Harmless, but it obscures which guard (the `anchor === undefined` one) is real.
**Fix:** Drop `anchorPoints === null` from both conditions, or type `anchorPoints` as `number | undefined` tied to `anchor`.

### IN-02: Stale "deliberately stays unmounted" comment

**File:** `src/components/site-footer.tsx:5-7`
**Issue:** The header says the footer "deliberately stays unmounted until then to avoid a layout.tsx conflict." It is now mounted in `src/app/layout.tsx:81`. The comment describes a wave-ordering constraint that no longer exists.
**Fix:** Replace lines 5-7 with "Mounted once in src/app/layout.tsx so it appears under every route."

### IN-03: Design tokens duplicated as hex literals in the OG route

**File:** `src/app/og/route.tsx:41-42`, `src/app/og/route.tsx:99`
**Issue:** `CREAM`, `INK`, and the inline `"#c05f33"` terracotta duplicate the `@theme` tokens in `globals.css`. Satori cannot read CSS variables, so some duplication is unavoidable, but the terracotta value is inlined without a named constant and none of the three is cross-referenced to the token they mirror.
**Fix:** Add `const TERRACOTTA = "#c05f33";` alongside the other two and a one-line comment naming the `globals.css` tokens they must stay in sync with (or export the raw hex values from a tiny `src/lib/tokens.ts` consumed by both).

### IN-04: Hostile-params test asserts a weaker property than its name claims

**File:** `tests/og-route.test.ts:39-47`
**Issue:** The test is titled "degrades to a 200 PNG on hostile params instead of erroring" and the route comment says bad input "yields the baseline card." The assertion only checks status, content-type, and PNG signature — it cannot tell the baseline card from a result card. `ur=1e9` parses via `parseInt` to `1`, which is a *valid* balance; the test passes regardless of which branch rendered.
**Fix:** Assert the branch, not just the status. Cheapest option: export a tiny pure helper (or reuse `buildShareContent`) and assert `buildShareContent({ balances: paramsToBalances(loadBalanceParams(request)), asOf }).kind === "baseline"` for that URL, or compare the byte length against the no-params render (the 05-05 summary shows distinct sizes per card).

### IN-05: No DB-level length cap on `email`; `process.loadEnvFile` has no `engines` floor

**File:** `src/db/schema.ts:134`, `scripts/db-check.ts:9`, `package.json`
**Issue:** `email` is `text` with no length constraint; the only cap is the app-level 254 in `interestSchema`. Any future writer (a seed, an admin script, a v2 import) can store arbitrary-length values. Separately, `process.loadEnvFile` requires Node >= 20.12 / 21.7, and `package.json` declares no `engines` field, so a contributor on Node 20.11 gets an opaque `TypeError` from the guarded `try` (swallowed) followed by "DATABASE_URL is not set."
**Fix:** `email: varchar("email", { length: 254 }).notNull().unique()` and add `"engines": { "node": ">=22" }` to `package.json`.

### IN-06: Unchecked cast from `string` to `keyof Balances`

**File:** `src/lib/share-content.ts:125`
**Issue:** `balances[sourceSlug as keyof Balances]` silences the type checker because `TransferPath.fromProgramSlug` is `string`. It is correct today (a chosen path's source is always a held, enterable program) but the cast is the only thing standing between a future engine change and a silent `undefined` eyebrow that drops the balance from the share title.
**Fix:** Narrow instead of cast: `const balance = (balances as Partial<Record<string, number>>)[sourceSlug];` (the pattern `paths.ts:132` already uses), or type `fromProgramSlug` as `EnterableProgramSlug` on the engine side.

---

_Reviewed: 2026-09-03T20:58:11Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
