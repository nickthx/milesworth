---
phase: 07-editorial-polish-launch
reviewed: 2026-09-22T04:04:26Z
depth: standard
files_reviewed: 46
files_reviewed_list:
  - config/lighthouserc.cjs
  - scripts/optimize-images.ts
  - src/app/account/loading.tsx
  - src/app/account/page.tsx
  - src/app/apple-icon.tsx
  - src/app/globals.css
  - src/app/icon.tsx
  - src/app/layout.tsx
  - src/app/methodology/page.tsx
  - src/app/not-found.tsx
  - src/app/og/route.tsx
  - src/app/privacy/page.tsx
  - src/app/robots.ts
  - src/app/sitemap.ts
  - src/components/account/bookmark-list.tsx
  - src/components/account/delete-account-dialog.tsx
  - src/components/advisor-tease.tsx
  - src/components/almost-there.tsx
  - src/components/core-experience.tsx
  - src/components/result-card.tsx
  - src/components/save-balances-button.tsx
  - src/components/share-link.tsx
  - src/components/site-footer.tsx
  - src/components/site-header.tsx
  - src/components/ui/button.tsx
  - src/components/ui/card.tsx
  - src/components/ui/dialog.tsx
  - src/components/ui/input.tsx
  - src/components/ui/label.tsx
  - src/data/redemptions-flights.ts
  - src/data/redemptions-flights-europe.ts
  - src/data/redemptions-hotels.ts
  - src/data/transfers.ts
  - src/images/destinations.ts
  - src/lib/brand.ts
  - src/lib/in-app-browser.ts
  - src/lib/share-content.ts
  - src/lib/share-url.ts
  - src/lib/site.ts
  - tests/design-system-gate.test.ts
  - tests/engine-ranking.test.ts
  - tests/image-manifest.test.ts
  - tests/in-app-browser.test.ts
  - tests/launch-gate.test.ts
  - tests/seed-data.test.ts
  - tests/share-url.test.ts
findings:
  critical: 0
  warning: 3
  info: 6
  total: 9
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-09-22T04:04:26Z
**Depth:** standard
**Files Reviewed:** 46
**Status:** issues_found

## Summary

Reviewed the 46 files Phase 7 touched: the launch-flip metadata routes (robots, sitemap, icons, layout), the /og social-card route, the canonical share URL and its clipboard fallback, the in-app-browser detector, the destination-image pipeline and manifest, the editorial design tokens, the account surface, the transfer-bonus data, the verification re-stamps in the three redemption files, and the seven test files.

The security-sensitive surfaces the orchestrator called out hold up:

- **share-url.ts** builds only from `SITE_URL` plus `balancesToParams`, which iterates the fixed slug list, so foreign keys (`__clerk_db_jwt`, `utm_*`) and hash fragments cannot ride along; tests/share-url.test.ts pins this with a hostile-object case. No `window.location` reference anywhere under `src/` (design-system-gate scan).
- **in-app-browser.ts** is a pure substring check over an injected string and gates copy only.
- **scripts/optimize-images.ts** derives every path segment from a `SLUG_FILE_RE` capture group or an argv value that passed `SLUG_RE`, re-asserts both before `join`, and fixes the input/output directories. No traversal path exists.
- **og/route.tsx** treats query params only through the nuqs integer loader, canonicalizes to one cache key per balance set per day before rendering, and returns a neutral 500 with no detail. The redirect/cache interaction across midnight was traced and cannot loop.
- **site.ts / robots.ts / sitemap.ts** derive the host from a fixed constant with an env override, never from a per-deployment Vercel variable.

No file in scope exceeds the 500-line rule (largest: redemptions-hotels.ts at 383 lines, engine-ranking.test.ts at 374).

The findings below are robustness and consistency defects rather than exploitable bugs: an unnormalized `NEXT_PUBLIC_SITE_URL` that silently produces `//` URLs in every share link and the sitemap, a share-link fallback field that goes stale when balances change after it appears, and a Lighthouse gate whose performance assertion is documented as failing on production today. The remainder are duplication and redundant guards.

## Warnings

### WR-01: `SITE_URL` is used unnormalized — a trailing slash or empty env value corrupts every share link, the sitemap URL, and robots.txt

**File:** `src/lib/site.ts:13-22`
**Issue:** `SITE_URL` is `process.env.NEXT_PUBLIC_SITE_URL ?? "https://milesworth.vercel.app"` and is interpolated as `${SITE_URL}/...` in `share-url.ts:33`, `robots.ts:15`, `sitemap.ts:15-17`. If the override is ever set with a trailing slash (`https://milesworth.com/` — the form Vercel's dashboard and most copy-paste sources produce), every "Copy my link" URL becomes `https://milesworth.com//?ur=…`, the sitemap advertises `https://milesworth.com//methodology`, and robots.txt points at `https://milesworth.com//sitemap.xml`. `metadataBase` (`new URL(SITE_URL)`) tolerates the slash, so og:url and the share link would name the host differently — exactly the drift the module comment says it exists to prevent. Separately, `??` does not fall back for an empty string: an env var that exists but is blank (a common Vercel state after creating the key before pasting the value) makes `new URL("")` throw at module load and takes down the build. The custom-domain switch is the one env-var change this module is designed for, so this is the failure mode it will hit.
**Fix:**
```ts
const RAW_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim();

/** Absolute origin with no trailing slash or path, e.g. "https://milesworth.vercel.app". */
export const SITE_URL = new URL(
  RAW_SITE_URL && RAW_SITE_URL.length > 0
    ? RAW_SITE_URL
    : "https://milesworth.vercel.app",
).origin;

export const SITE_HOST = new URL(SITE_URL).host;
```
`origin` strips any trailing slash or path, keeps the boot-time throw for a genuinely malformed value, and adding a `tests/share-url.test.ts` case that stubs `NEXT_PUBLIC_SITE_URL="https://example.com/"` and asserts no `//` would pin it.

### WR-02: Clipboard fallback field shows a stale URL once balances change

**File:** `src/components/share-link.tsx:37,61-62,90-97`
**Issue:** When `navigator.clipboard.writeText` fails (the LinkedIn WebView case this component exists for), the canonical URL is captured into `fallbackUrl` state once. The field then stays mounted for the life of the island, but its `value` is never recomputed: if the visitor edits any balance afterwards, "Your link" keeps showing the URL for the previous balance set while the results above reflect the new one. A visitor who copies from that field shares a link that does not match what they are looking at — the opposite of the T-07-02 "copied string is ALWAYS shareUrl(balances)" invariant, which only holds for the clipboard path. Clicking "Copy my link" again refreshes it, but nothing tells the visitor that is required.
**Fix:** Store only whether the fallback is visible, and derive the value from the current prop every render:
```tsx
const [showFallback, setShowFallback] = useState(false);
// ...
} catch {
  setShowFallback(true);
}
// ...
{showFallback && (
  <Input
    id="share-link-fallback"
    ref={fallbackRef}
    readOnly
    value={shareUrl(balances)}
    onFocus={(e) => e.currentTarget.select()}
    className="text-ink h-11 bg-white text-base"
  />
)}
```
The focus effect keys on `showFallback` instead of `fallbackUrl`.

### WR-03: Lighthouse gate asserts a performance floor the config itself documents as failing on production

**File:** `config/lighthouserc.cjs:44-52`
**Issue:** `categories:performance` is asserted at `"error"` with `minScore: 0.8`, while the comment two lines above records the production baseline as 0.77 for `/` and 0.75 for `/?ur=90000&mr=50000` and says "/ and /?ur sit below the floor". As shipped, `npm run lighthouse` fails every run. A gate that is red by default stops gating: a real regression in accessibility (0.95, error) or SEO (0.90, error — the launch-flip assertion tests/launch-gate.test.ts pins) is indistinguishable from the known noise, and the natural response is to stop running it. The a11y/best-practices/SEO assertions were tuned to their measured baselines; performance was not.
**Fix:** Either apply the plan's own rule (median − 0.03, so 0.72 for `/` and `/?ur`) per-URL with `matchingUrlPattern`, or demote performance to `"warn"` until the Clerk-bundle work lands, mirroring the best-practices treatment:
```js
"categories:performance": [
  "warn",
  { minScore: 0.8, aggregationMethod: "median" },
],
```
Record in the comment which plan re-promotes it, as was done for best-practices.

## Info

### IN-01: `savedResultsHref` re-implements `toShareQuery`

**File:** `src/app/account/page.tsx:48-55`
**Issue:** The function builds the same canonical short-key query that `toShareQuery` in `src/lib/share-url.ts` builds (same `balancesToParams` iteration, same null filter, same `URLSearchParams` serialization). share-content.ts already imports `toShareQuery` for exactly this reason and the file comments cite the PATTERNS rule "Single source of truth for share query". If the key set or ordering ever changes in `share-url.ts`, "Open my saved results" drifts silently. It also yields `/?` (dangling `?`) when every saved balance is null, where `shareUrl` yields `/`.
**Fix:**
```ts
import { toShareQuery } from "@/lib/share-url";

function savedResultsHref(balances: NonNullable<AccountSnapshot["balances"]>) {
  const query = toShareQuery(balances);
  return query === "" ? "/" : `/?${query}`;
}
```

### IN-02: Redundant first clause in the LinkedIn UA check

**File:** `src/lib/in-app-browser.ts:11`
**Issue:** `ua.includes("[LinkedInApp]") || ua.includes("LinkedInApp")` — the second test subsumes the first, so the bracketed form is dead. Harmless, but it reads as if two distinct markers are being checked.
**Fix:** `return ua.includes("LinkedInApp");` (the test file's four UA fixtures still pass).

### IN-03: `pointsAway ?? 0` inside a `pointsAway !== null` guard

**File:** `src/components/almost-there.tsx:70-72`
**Issue:** The `??` fallback can never fire because the enclosing conditional already excludes `null`. It suggests a code path (`$0 away`) that does not exist and would mask a future type change.
**Fix:** `formatPoints(result.pointsAway)`.

### IN-04: Redundant `verifiedAt !== null` re-check on the teaser

**File:** `src/components/core-experience.tsx:100-102,324`
**Issue:** `featuredTeaser` is selected with `redemption.verifiedAt !== null` in the predicate at line 101, then the render at line 324 tests `featuredTeaser.verifiedAt !== null` again. The second check is unreachable-false. Only worth keeping if the intent is to narrow the type for `formatVerifiedDate` at line 358; if so, say so in a comment, otherwise drop it.
**Fix:** Remove the second `&& featuredTeaser.verifiedAt !== null`, or narrow once: `const featuredTeaser = redemptions.find(...) as (RedemptionSeed & { verifiedAt: string }) | undefined`.

### IN-05: Duplicate raw sources resolve nondeterministically

**File:** `scripts/optimize-images.ts:79-84`
**Issue:** If `src/images/raw/` holds both `tokyo.jpg` and `tokyo.png`, `sources.set` keeps whichever `readdirSync` returns first — on NTFS that is alphabetical, on ext4 it is inode order — so the same command can encode a different source on a different machine with no message. The script is careful about everything else; this one is silent.
**Fix:** Treat a duplicate slug as an error (or at least log which file won):
```ts
const prior = sources.get(slug);
if (prior !== undefined) {
  console.error(`duplicate source for slug ${slug}: ${prior} and ${entry}`);
  process.exit(1);
}
sources.set(slug, entry);
```

### IN-06: Privacy copy overstates the guest-flow guarantee

**File:** `src/app/privacy/page.tsx:44-47,56-63`
**Issue:** The header says "nothing you type is sent to our server", then the Guests paragraph correctly notes the balances live in the page URL and reach the server "only when you open a share link … or when you sign in and choose Save". A plain reload, a back/forward navigation, or a bookmark of `/?ur=…` also sends the URL to the server — and per the Vercel paragraph on the same page, that URL lands in short-lived request logs. The policy is internally inconsistent on a point the project treats as part of its credibility pitch. Not a code defect; flagged because the page's own comment says it "must match what … actually" happens.
**Fix:** Soften the header line to "the guest flow keeps your balances in the page address and your own browser; they are never stored on our server" and, in the Guests paragraph, replace "only when you open a share link" with "whenever a page with balances in its address is loaded — a share link, a reload, or a bookmark".

---

_Reviewed: 2026-09-22T04:04:26Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
