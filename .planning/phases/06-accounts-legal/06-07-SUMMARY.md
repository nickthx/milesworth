---
phase: 06-accounts-legal
plan: 07
subsystem: infra
tags: [vercel, deploy, curl, clerk, neon, human-verify, validation-signoff]

# Dependency graph
requires:
  - phase: 06-accounts-legal
    plan: 05
    provides: Save my balances + BookmarkButton on / (the surfaces the human exercised in steps 4–5)
  - phase: 06-accounts-legal
    plan: 06
    provides: /account page, goals, bookmarks, DeleteAccountDialog (steps 6, 9)
  - phase: 06-accounts-legal
    plan: 03
    provides: src/proxy.ts clerkMiddleware() with the /og exclusion re-proven here; /privacy page probed here
  - phase: 06-accounts-legal
    plan: 02
    provides: scripts/db-check.ts six-line row counts used for the before/after delete proof
  - phase: 05-credibility-layer
    plan: 05
    provides: deploy-by-push flow, curl probe set, MISS→HIT proof pattern for /og
provides:
  - Phase 6 live on https://milesworth.vercel.app (push 0cd9898..c2c8dad), every automatable route and cache property re-proven by curl
  - Human-approved end-to-end account walkthrough on production (sign-up with consent, save, bookmark, goal, cross-session restore, delete, guest flow)
  - Post-delete row-count proof: users rows: 0, programs rows: 21
  - .planning/phases/06-accounts-legal/06-VALIDATION.md signed off — nyquist_compliant: true, status: approved, zero pending rows
affects: [07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Deploy-by-push + poll: push origin main, poll /privacy every ~15 s until 200 AND the body carries a string only the new build has ('Retention and deletion')"
    - "Cookie-free CDN proof for /og under the Clerk proxy: zero set-cookie on both the 308 canonicalizer and the PNG, X-Vercel-Cache MISS then HIT"
    - "Delete-cascade proof: scripts/db-check.ts before the human test and after approval; users rows must return to the baseline"

key-files:
  created:
    - .planning/phases/06-accounts-legal/06-07-SUMMARY.md
  modified:
    - .planning/phases/06-accounts-legal/06-VALIDATION.md

key-decisions:
  - "The plan's literal /og probe (bare ur/mr query → image/png) is satisfied through the Phase 5 canonicalizer: the bare URL returns a cookie-free 308 to /og?…&d=YYYY-MM-DD, and that URL is the cookie-free MISS→HIT PNG; recorded as an interpretation deviation, not a gap (05-05 precedent for the stripped s-maxage)"
  - "Steps 4 and 8 of the human checklist were approved without notes; recorded verbatim as such rather than inferring observations — A5 was not reported as failed, and the consent timestamp was not separately described"
  - "Row 6-07-3 in VALIDATION.md was reworded so it no longer quotes the literal pending marker its own grep gate forbids; gate semantics unchanged"

patterns-established:
  - "VALIDATION sign-off: automated rows `✅ green`, manual rows `✅ human-verified <date> (<plan> Task <n> …)` with the checkpoint step numbers; legend line rewritten so the file-wide pending grep reaches 0"

requirements-completed: [ACCT-01, ACCT-02, ACCT-03, ACCT-04]

# Metrics
duration: ~40min wall (Task 1 ~8 min; ~30 min human walkthrough gate; Task 3 ~3 min)
completed: 2026-09-14
---

# Phase 06 Plan 07: Ship Phase 6, Prove It on Production, Sign Off Validation Summary

**Phase 6 deployed to milesworth.vercel.app by fast-forward push, re-proven with curl (/privacy static 200 with the retention section, /account 200 signed-out with no redirect, /og still a cookie-free MISS→HIT PNG behind the Clerk proxy), walked end to end by a human on production (modal sign-up with required consent → save → bookmark → goal → fresh-session restore into the URL → delete), with `users rows: 0` after the delete and 06-VALIDATION.md signed off `nyquist_compliant: true`.**

## Performance

- **Duration:** ~40 min wall, of which ~30 min was the blocking human-verify gate
- **Started:** 2026-09-14T18:07Z (after 06-06 closed at 18:06:46Z)
- **Task 1 complete / paused at Task 2:** 2026-09-14T18:14:35Z (`f00e707`)
- **Completed:** 2026-09-14T18:47Z
- **Tasks:** 3 (Task 1 auto, Task 2 checkpoint:human-verify, Task 3 auto)
- **Files modified:** 1 (06-VALIDATION.md) + this SUMMARY

## Accomplishments

- Ran every local gate on the merged tree `c2c8dad` and pushed it to production as a fast-forward; polled until the new build was serving.
- Probed every Phase 6 route and the /og cache on production and recorded the header sets below (T-06-08 / T-06-07 mitigations).
- Paused for the human walkthrough; received "approved"; re-ran db-check and proved the delete cascade emptied every user table.
- Signed off the Phase 6 validation contract: 17 automated rows green, 3 manual rows human-verified with step citations, all Wave 0 and Sign-Off boxes ticked, `status: approved`.

## Task Commits

1. **Task 1: Full local gates, deploy by push, probe production with curl** — no tracked changes (deploy = push `0cd9898..c2c8dad` to origin/main); checkpoint position recorded in `f00e707` (docs)
2. **Task 2: End-to-end account walkthrough on production** — checkpoint:human-verify, APPROVED (no commit)
3. **Task 3: Sign off 06-VALIDATION.md** — `7fe0be4` (docs)

**Plan metadata:** see final docs commit for this SUMMARY, STATE.md, ROADMAP.md

## Task 1 Evidence

### Local gates on c2c8dad

- `npm test` → 20 files / 289 passed
- `npm run typecheck` → exit 0
- `npm run lint` → exit 0
- env-exported `npm run build` → exit 0 (env sourced inside a subshell; no value printed)
- Route table: `ƒ /`, `○ /_not-found`, `ƒ /account`, `○ /methodology`, `ƒ /og`, `○ /privacy`

### db-check baseline BEFORE the human test

```
programs rows: 21
interest_signups rows: 1
users rows: 0
user_balances rows: 0
bookmarks rows: 0
travel_goals rows: 0
```

## Push Gate / Production Probes

- `git status --porcelain` empty; `git merge-base --is-ancestor origin/main HEAD` exit 0; `git push origin HEAD:main` → `0cd9898..c2c8dad` (fast-forward, no force)
- Deploy poll on `/privacy`: 404 at 18:12:29Z and 18:12:45Z, 200 at 18:13:01Z; body contains "Retention and deletion" (new build live)

| Route | Result |
|-------|--------|
| `/privacy` | 200 · text/html · `Cache-Control: public, max-age=0, must-revalidate` · `X-Vercel-Cache: HIT` · `mailto:` count 1 · "Retention and deletion" count 1 |
| `/account` | 200 · text/html · `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` · `X-Vercel-Cache: MISS` · no `location` header · "Sign in" count 1 |
| `/` | 200 · "Sign in" count 1 · set-cookie lines 0 |
| `/methodology` | 200 · `X-Vercel-Cache: PRERENDER` |
| `/og?ur=90000&mr=50000` | #1: 308 → `Location: /og?ur=90000&mr=50000&d=2026-09-14` · `X-Vercel-Cache: MISS` · set-cookie 0; #2: 308 · `HIT` · set-cookie 0 |
| `/og?ur=90000&mr=50000&d=2026-09-14` | #1: 200 `image/png` · `Cache-Control: public, max-age=0` · `MISS` · set-cookie 0; #2: 200 · `HIT` · set-cookie 0 |
| `curl -sIL` on the plan URL | final 200 `image/png` · `HIT` · set-cookie across the whole chain 0 · 76015 bytes |

T-06-08 holds: no `set-cookie` anywhere on `/og` (308 or PNG), and the CDN goes MISS → HIT on both the redirect and the image, so the `src/proxy.ts` matcher exclusion for `/og` works in production.

URLs handed to the human: `https://milesworth.vercel.app/?ur=90000&mr=50000`, `https://milesworth.vercel.app/account`, `https://milesworth.vercel.app/privacy`.

## Human Walkthrough (Task 2, checkpoint:human-verify)

- **Resume signal:** "approved".
- **Step 4 (A5 — Save button switches after modal sign-in without a reload):** approved without notes. The human did not report "A5 failed", so A5 is treated as holding; no observation beyond the approval is recorded, and none is inferred.
- **Step 8 (Clerk Dashboard legal-acceptance timestamp on the test user):** approved without notes. No separate description of the timestamp field was provided; the step is recorded as approved, not as independently observed by the executor.
- Steps 1–3, 5–7, 9 (guest flow in a private window, modal in place with the required consent checkbox linking to `/privacy`, save/bookmark/goal, sign-out to `/`, fresh private-window sign-in restoring `/?ur=90000&mr=50000`, delete landing on `/` signed out with the Clerk user gone): covered by the single "approved" reply; no failing step was described.

## Post-Delete Row Counts

`npx tsx scripts/db-check.ts` after approval (2026-09-14, ~18:45Z):

```
programs rows: 21
interest_signups rows: 1
users rows: 0
user_balances rows: 0
bookmarks rows: 0
travel_goals rows: 0
```

`users rows: 0` equals the Task 1 baseline and `programs rows: 21` is unchanged — the test account's user, balances, bookmarks, and goals were all removed by the delete cascade (T-06-06), and the seeded data was untouched. No gap.

## Task 3: VALIDATION Sign-Off

- `npm test` re-run → 20 files / 289 passed (exit 0)
- `06-VALIDATION.md`: `status: approved`, `nyquist_compliant: true`, `wave_0_complete: true` (already true since 06-04); 17 rows `✅ green`; `6-01-2`, `6-01-3`, `6-07-2` `✅ human-verified 2026-09-14 (…)` citing the checkpoint tasks and steps; Manual-Only table rows annotated with their verification outcome; both Wave 0 human-gate boxes and all six Sign-Off boxes `[x]`; `**Approval:** approved 2026-09-14 (…)`
- Task 3 automated verify: `npm test` green; `grep -c '^nyquist_compliant: true'` = 1; `grep -c '^wave_0_complete: true'` = 1; `grep -c '⬜ pending'` = 0 → PASS

## Deviations from Plan

### Interpretation (not a gap)

**1. `/og` bare-URL probe returns a 308, not `image/png` directly**
- **Found during:** Task 1 step 3
- **Issue:** The plan's literal `curl -sI "https://milesworth.vercel.app/og?ur=90000&mr=50000"` expects `content-type: image/png`. Phase 5 code-review fixes (`0ba153b` CR-01, `350e50f` WR-02 in `src/app/og/route.tsx`) canonicalize the OG URL to `/og?…&d=YYYY-MM-DD` with a 308 so the CDN key includes the as-of date, and `tests/og-route.test.ts` asserts exactly that.
- **Resolution:** Probed both the bare URL (308, cookie-free, MISS→HIT) and the canonical URL (PNG, cookie-free, MISS→HIT), plus `curl -sIL` on the plan URL (final 200 `image/png`, zero set-cookie across the chain). The gate's substance — PNG served cookie-free from the CDN with the proxy live — holds. Recorded the same way 05-05 recorded Vercel stripping `s-maxage` from the client-facing header.
- **Files modified:** none

**2. Row 6-07-3 of VALIDATION.md quoted the literal pending marker**
- **Found during:** Task 3 verify
- **Issue:** The row's Secure Behavior / Automated Command cells contained the literal token that the file-wide `grep -c '⬜ pending' = 0` gate forbids, so the gate could never reach 0 with the row text as written.
- **Fix:** Reworded the two cells ("zero pending-status cells", "`grep -c` of the pending marker = 0"); the legend line below the table was likewise rewritten. No gate semantics changed.
- **Files modified:** `.planning/phases/06-accounts-legal/06-VALIDATION.md`
- **Commit:** `7fe0be4`

### Auto-fixed Issues

None.

## Issues Encountered

- None. The push was a clean fast-forward; the deploy was live within ~45 s of the push; every probe matched expectations modulo the 308 interpretation above.
- `.vscode/` remains untracked and unrelated; left alone.
- Secrets hygiene: `.env.development.local` was sourced only inside a subshell for the Task 1 build; no value was printed at any point; `git status --porcelain | grep '\.env'` was empty at every commit.

## Gaps

None. Human resume signal was "approved" with no failing step described; post-approval `users rows: 0` matches the baseline; `programs rows: 21` unchanged.

## Known Stubs

None — this plan changed no application code.

## Threat Flags

None. No new endpoints, auth paths, schema, or packages. T-06-08 (cookie-free CDN `/og`), T-06-10 (consent), T-06-06 (delete cascade), and T-06-07 (no secrets in probes or this SUMMARY) are each evidenced above; T-06-13 (admin deletion orphaning rows) and T-06-12 (development-instance badge / 100-user cap) remain accepted as documented in the plan.

## Next Phase Readiness

- Phase 6 is complete: all 7 plans executed, validation contract signed off, production carrying accounts + `/privacy`.
- Phase 7 inherits: Clerk production-instance cut-over (A1 / T-06-12, requires a custom domain), the `user.deleted` webhook backstop (RESEARCH Open Question 2 / T-06-13), and the LinkedIn in-app WebView launch gate already tracked in STATE.md.
- Still deferred from Phase 2: the DATA-04 ≥30-verified-entries gate.

## Self-Check: PASSED

- `.planning/phases/06-accounts-legal/06-VALIDATION.md` — FOUND, `nyquist_compliant: true`
- `.planning/phases/06-accounts-legal/06-07-SUMMARY.md` — FOUND
- Commits `f00e707`, `7fe0be4` — present in `git log`; production push `0cd9898..c2c8dad` present on `origin/main`

---
*Phase: 06-accounts-legal*
*Completed: 2026-09-14*
