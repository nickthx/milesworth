---
phase: 05-credibility-layer
fixed_at: 2026-09-03T21:45:30Z
review_path: .planning/phases/05-credibility-layer/05-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
out_of_scope: 6
status: all_fixed
verification:
  typescript: "npx tsc --noEmit -p . — clean"
  lint: "npm run lint — clean"
  tests: "npx vitest run — 15 files, 186 tests passed"
  build: "npm run build — succeeded; /methodology still static, / and /og dynamic"
follow_ups_requiring_human_decision: 3
---

# Phase 05: Code Review Fix Report

**Fixed at:** 2026-09-03T21:45:30Z
**Source review:** `.planning/phases/05-credibility-layer/05-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope (Critical + Warning): 8
- Fixed: 8
- Skipped: 0
- Out of scope (Info, `fix_scope: critical_warning`): 6

**Verification (run once, at the end, on the merged result):**
- `npx tsc --noEmit -p .` — clean
- `npm run lint` — clean
- `npx vitest run` — **15 files, 186 tests passed**
- `npm run build` — succeeded (`/methodology` still prerendered static, `/` and `/og` dynamic as before)

Per-fix verification was `npx tsc --noEmit -p .` plus the affected test file before each commit.

## Fixed Issues

### CR-01: `/og` render cost is unbounded per distinct URL

**Files modified:** `src/app/og/route.tsx`, `src/lib/balance-params.ts`, `tests/og-route.test.ts`, `tests/balance-params.test.ts`
**Commit:** `0ba153b`
**Applied fix:** `/og` now computes the canonical query first and returns a `308` (with a short `s-maxage=60`) for any other spelling — junk keys, duplicate keys, reordered keys, invalid values — so one balance set maps to exactly one CDN key and the redirect costs no Satori render. `paramsToBalances`/`balancesToParams` additionally drop balances above a `MAX_BALANCE = 10_000_000` ceiling, closing the `ur=9007199254740991` key-minting trick. The T-05-08 comment block was rewritten to stop claiming the CDN alone is the mitigation.

**Deliberately not done (operational, requires human decision):** the edge rate-limit rule. The review names two options — a Vercel Firewall rate-limit rule or `@upstash/ratelimit` in `src/proxy.ts` — and the second means adding a new paid dependency. No npm package was installed. The route comment now states explicitly that the key-space bound is not a rate bound and that the rule is still required. See "Follow-ups" below.

### WR-01: Memoized font loader caches a rejected promise forever

**Files modified:** `src/app/og/route.tsx`
**Commit:** `d7ad017`
**Applied fix:** Applied the review's suggested `.catch` that clears `fontsPromise` before rethrowing, so only a fulfilled promise is memoized and a transient `readFile` failure no longer poisons every later request in the instance with the unlogged neutral 500.

### WR-02: `/og` cache TTL lets the card and the per-request metadata disagree

**Files modified:** `src/app/og/route.tsx`, `src/app/page.tsx`, `tests/og-route.test.ts`
**Commit:** `350e50f`
**Applied fix:** Option (a), folded into the CR-01 canonicalization as instructed. `generateMetadata` emits `/og?<canonical>&d=<asOf>` and the route folds the same stamp into its canonical query, so a date change is a new cache key and a 24 h/7 d-stale PNG can never be paired with a description computed on a differently-gated day.

**One deviation from the review's wording, deliberate:** the review suggested the route "read `d` (validated as `YYYY-MM-DD`, else today)". Honouring an arbitrary `d` would re-open CR-01 (each of ~10^8 well-formed dates is a fresh cache key) and would let anyone render a card dated to a bonus window that is not live. Instead `d` is a **cache-key discriminator only** — never read back as the engine date — so a stale or hostile stamp redirects to today's key rather than rendering. A balance-free request needs no stamp because the baseline card is static copy; that also keeps `layout.tsx`'s site-wide `/og` default redirect-free.

### WR-03: Card footer hard-codes the host

**Files modified:** `src/lib/site.ts` (**new file**), `src/app/layout.tsx`, `src/app/og/route.tsx`
**Commit:** `76a3a10`
**Applied fix:** Created `src/lib/site.ts` exporting `SITE_URL` (with the existing `NEXT_PUBLIC_SITE_URL` override and its T-05-10 rationale) and the derived `SITE_HOST`. `layout.tsx` imports `SITE_URL` for `metadataBase`; the OG card renders `{SITE_HOST}`. The literal `points-unlocked.vercel.app` now exists in exactly one place (verified by grep over `src/`).

**New file created:** `src/lib/site.ts` — required by the fix, as the review specified.

### WR-04: Honeypot hard-wired to `""`; `File` value bypasses the check

**Files modified:** `src/app/actions/interest.ts`, `src/lib/interest-validation.ts`, `tests/interest-validation.test.ts`
**Commit:** `877c25e`
**Applied fix:** Chose a variant of the review's primary option that fully closes both halves. The raw `FormData.get("website")` value now goes **straight into** `interestSchema` (`null` → `undefined`, the shape a real browser produces), so the schema — not a duplicate action-level `typeof` check — is the single honeypot boundary and actually sees `File` values. A failed parse routes on the issue **path**: a `website` issue returns the neutral bot success copy with no write; anything else returns the email error. Only paths are read, never issue messages (T-05-14 preserved).

This makes the pre-existing "rejects a filled honeypot" / "rejects a null honeypot" tests exercise the real runtime path instead of dead code, and adds a `File`-honeypot test covering the exact reported bypass.

### WR-05: Waitlist has no rate limit, no ownership check, and promises a non-existent unsubscribe

**Files modified:** `src/db/schema.ts`, `src/components/advisor-tease.tsx`
**Commit:** `6cc6f3d`
**Applied fix:** Both code-level parts of the review's (b), per the scope note:
- `interest_signups` gains `unsubscribe_token uuid not null default gen_random_uuid()` with a unique constraint, so the v2 send can carry a working opt-out link from its first email rather than retrofitting tokens onto addresses already collected. Nothing reads it yet.
- The tease copy no longer promises what the code cannot honour: "No spam, unsubscribe any time" → "One email when it launches — that's the only one you'll get." `source` is documented as the consent record (which surface the address was entered on).

**Deliberately not done (operational, requires human decision):** the IP-keyed rate limit (same mechanism as CR-01) and double opt-in. Neither was implemented, and no npm package was installed. See "Follow-ups" below.

**Requires a deploy step:** the new column needs `drizzle-kit push` (or a generated migration) before the next deploy, or the insert will fail against the existing table.

### WR-06: Methodology page hand-types the Marriott figures its header says are never typed

**Files modified:** `src/app/methodology/page.tsx`, `tests/methodology-page.test.ts`
**Commit:** `95f0ced`
**Applied fix:** The Transfer-math example is now computed exactly as the ANA anchor is: `buildBonusExample()` finds the seeded `marriott-bonvoy` → `alaska-mileage-plan` route, prices 60,000 partner miles through the engine's own `requiredSourcePoints`, reads `bonusMilesPerBlock`/`bonusBlockPoints` off the route, and derives the naive ratio cost. If the route or its bonus fields ever disappear the sentence drops rather than stating a stale figure. The test derives the same four figures instead of pinning `"150,000"`, and additionally asserts the bonus actually beats the naive ratio.

Rendered prose was diffed before and after and is **byte-identical** — this is a pure drift-guard change, not a copy change.

### WR-07: Success message rendered into a live region mounted with its content

**Files modified:** `src/components/advisor-tease.tsx`
**Commit:** `6b38dcf`
**Applied fix:** One persistent `<p aria-live="polite">` is now mounted on first paint and only ever changes its text (idle helper copy → error message → success message); the form is conditionally rendered separately. Because the submit button unmounts on success, focus is moved to the status paragraph via a `useEffect` keyed on `state.status` (`tabIndex={-1}`, `focus:outline-none`), so the confirmation is both announced and reachable. The live region is rendered after the form so the existing visual layout is unchanged.

## Out-of-Scope Findings (not attempted)

`fix_scope` was `critical_warning`, so the six Info findings were not touched and remain open in `05-REVIEW.md`:

| ID | Title | File |
|----|-------|------|
| IN-01 | Dead null-guard on `anchorPoints` | `src/app/methodology/page.tsx:48-53` |
| IN-02 | Stale "deliberately stays unmounted" comment | `src/components/site-footer.tsx:5-7` |
| IN-03 | Design tokens duplicated as hex literals in the OG route | `src/app/og/route.tsx:41-42, 99` |
| IN-04 | Hostile-params test asserts a weaker property than its name claims | `tests/og-route.test.ts:39-47` |
| IN-05 | No DB-level length cap on `email`; no `engines` floor | `src/db/schema.ts:134`, `package.json` |
| IN-06 | Unchecked cast from `string` to `keyof Balances` | `src/lib/share-content.ts:125` |

Two notes for whoever picks these up:
- **IN-01** still applies unchanged; the WR-06 work added a separate guarded example (`bonusExample`) but did not touch `anchorPoints`.
- **IN-04** is partly overtaken by CR-01: the hostile-params case now asserts a `308` and its exact `Location`, which *does* pin the branch. The remaining IN-04 point — that the 200-PNG cases still cannot distinguish the baseline card from a result card — is unaddressed.

## Follow-ups Requiring a Human Decision

These are the parts of CR-01 and WR-05 that are operational rather than code, and were deliberately left out per the scope note (no new npm packages were installed):

1. **Rate-limit `/og`** (CR-01). Either a Vercel Firewall rate-limit rule on the `/og` path (no dependency, configured in the dashboard) or `@upstash/ratelimit` + Upstash Redis in a `src/proxy.ts` matcher (new paid dependency). The canonicalization bounds the *key space* but not the *request rate*; a shell loop hitting one canonical URL still costs origin renders on every CDN revalidation. The route comment says this explicitly.
2. **Rate-limit the waitlist Server Action** (WR-05a). Same mechanism choice. Today the honeypot is still the only abuse control on the POST, so a script that simply omits the `website` field can insert unlimited unique addresses.
3. **Consent model for `interest_signups`** (WR-05c). Double opt-in before any send, versus relying on the now-stored `unsubscribe_token` + `source`. Nothing verifies that the submitter owns the address they entered.

Also queued as a deploy-time action, not a decision: **run `drizzle-kit push`** for the new `unsubscribe_token` column before the next deploy.

## Notes on Method

- All work was done in an isolated git worktree on a temporary branch, then fast-forwarded onto `main`; the worktree, temp branch, and recovery sentinel were all cleaned up. `git worktree list` shows only the main checkout.
- The worktree was placed at `.gsd-worktrees/` inside the repo rather than `/tmp` so Node/TypeScript module resolution would walk up to the repo's `node_modules` — deliberately **not** a `node_modules` junction, per the recorded Windows hazard that `git worktree remove` would wipe the main checkout's `node_modules`.
- `npm run build` cannot run from such a worktree (Turbopack refuses to resolve packages above its detected workspace root), so the build was verified in the main repo after the fast-forward. It succeeded.
- The two pre-existing untracked paths (`.vscode/`, `.planning/phases/03-valuation-ranking-engine/03-PATTERNS.md`) were not staged or committed.

---

_Fixed: 2026-09-03T21:45:30Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
