---
phase: quick-260914-ei5
plan: 01
subsystem: branding / infra
status: checkpoint
tags: [rename, branding, github, vercel, metadata]
requires: []
provides:
  - "App, tests, manifests, root docs, and all .planning docs branded Milesworth"
  - "SITE_URL fallback https://milesworth.vercel.app"
  - "GitHub repo nickthx/milesworth; origin remote switched"
affects: [06-accounts-legal, 07-launch]
tech-stack:
  added: []
  patterns: []
key-files:
  created: []
  modified:
    - src/app/layout.tsx
    - src/app/methodology/page.tsx
    - src/app/page.tsx
    - src/components/site-footer.tsx
    - src/lib/share-content.ts
    - src/lib/site.ts
    - tests/share-content.test.ts
    - package.json
    - package-lock.json
    - CLAUDE.md
    - PROJECT-BRIEF.md
    - .planning/**/*.md (42 committed + STATE.md left for orchestrator docs commit)
decisions:
  - "Local folder C:\\Users\\geoca\\points-unlocked intentionally NOT renamed (mid-session rename breaks the session; optional manual step later)"
  - ".planning/STATE.md rename line left uncommitted per orchestrator instruction (orchestrator owns the docs commit)"
  - "No npm install run; package-lock.json edited only at the two exact \"name\": \"points-unlocked\" strings"
metrics:
  duration: ~8 min (Tasks 1-2)
  completed: 2026-09-14
  tasks_completed: 2
  tasks_total: 3
---

# Quick Task 260914-ei5: Rename Points Unlocked to Milesworth — Summary

**Status: CHECKPOINT (Task 3 — human-action, blocking).** Code and planning docs are renamed, committed, and pushed; GitHub repo is `nickthx/milesworth`. The Vercel project still carries the old name until renamed in the dashboard.

One-liner: Full-surface rename to Milesworth (metadata, share card, footer, methodology, `SITE_URL` fallback `https://milesworth.vercel.app`, package name, 42 planning docs) plus GitHub repo rename and remote switch, with all four gates green.

## Commits

| Task | Commit | Message | Files |
|------|--------|---------|-------|
| 1 | `4790a5b` | chore: rename Points Unlocked to Milesworth in app code, tests, and manifests | 11 files, 22 lines |
| 2 | `642ba0e` | docs: rename Points Unlocked to Milesworth across planning docs | 42 files, 179 lines |

Both pushed: `git push origin main` succeeded (`0f9260f..642ba0e main -> main`) — no TTY/credential gate this time.

## Gate results (Task 1, after rename)

| Gate | Result |
|------|--------|
| `npm run lint` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm test` | 15 files, 186/186 passed (count unchanged) |
| `npm run build` | exit 0 — routes `/`, `/_not-found`, `/methodology`, `/og` |

Residual grep `Points Unlocked|points-unlocked|PointsUnlocked` over `src tests package.json package-lock.json CLAUDE.md PROJECT-BRIEF.md`: 0 hits. Same grep over `.planning/**/*.md` (excluding this quick task's folder): 0 hits.

## Remote / hosting state

| Item | Before | After |
|------|--------|-------|
| GitHub repo | `nickthx/points-unlocked` | `nickthx/milesworth` (renamed via `gh repo rename`; GitHub redirects the old URL) |
| `origin` remote | `https://github.com/nickthx/points-unlocked.git` | `https://github.com/nickthx/milesworth.git` (`git ls-remote origin HEAD` OK) |
| `points-unlocked.vercel.app` | live | still HTTP 200, and **already serving the renamed build** ("Milesworth" x12 in HTML) — the push triggered a Production deploy, proving Vercel's Git link followed the GitHub rename |
| `milesworth.vercel.app` | — | HTTP 404 (project not yet renamed in Vercel) |

## Task 3 — HUMAN ACTION REQUIRED (Vercel dashboard)

Vercel CLI is not installed and there is no `VERCEL_TOKEN`, so this cannot be automated. Do the following:

1. Open https://vercel.com → the `points-unlocked` project → **Settings → General → Project Name**. Change it to `milesworth` and save. Vercel's default domain becomes `milesworth.vercel.app`; `points-unlocked.vercel.app` stops resolving.
2. On **Settings → Git**, confirm the Connected Git Repository shows `nickthx/milesworth`. (Evidence says it already follows the rename — the latest push deployed — but confirm; reconnect to `nickthx/milesworth` if it shows disconnected.)
3. Push is **not** deferred — main is already pushed and the Production deployment of `642ba0e` has built. No terminal step needed.
4. Deployments tab → confirm the latest Production deployment is Ready.
5. Open https://milesworth.vercel.app — page title and footer should read "Milesworth".

**Resume signal:** type `vercel-renamed` when steps 1–5 are done.

**Post-resume automated verify:**
`test "$(curl -s -o /dev/null -w '%{http_code}' https://milesworth.vercel.app)" = "200" && curl -s https://milesworth.vercel.app | grep -c "Milesworth" | grep -qv '^0$'`

## Deviations from Plan

None in substance. Two bookkeeping notes:

- `.planning/STATE.md` received its one-line rename in the working tree but was **excluded from the Task 2 commit** per the orchestrator's constraint that it owns the STATE.md/SUMMARY docs commit. It must go into the orchestrator's docs commit.
- `sed -i` rewrote mtimes on 16 planning files that contained no old-name strings; they appeared as "modified" in `git status` but were byte-identical to HEAD (verified with `cmp`). Their index stat was refreshed with a no-op `git add` (nothing staged). No content changed.

## Not done on purpose

- **Local folder `C:\Users\geoca\points-unlocked` was NOT renamed.** Renaming it mid-session breaks the session. Optional later step: close the session, then `Rename-Item C:\Users\geoca\points-unlocked C:\Users\geoca\milesworth`. Nothing in the repo depends on the folder name (`.vercel/project.json` is gitignored and re-creatable with `vercel link`).
- `.vercel/project.json`, `.env*`, `node_modules`, `.next`, `.git` were not touched. No secret was printed or committed.
- `npm install` was not run (no dependency change).

## Downstream notes (do not act on here)

- **Clerk production instance is now possible.** Phase 6 plan 06-01 (assumption A1, threat T-06-12) assumed v1 ships on a Clerk DEVELOPMENT instance because `*.vercel.app` cannot host a production instance. Once `milesworth.app` is purchased and attached to the Vercel project, a Clerk PRODUCTION instance becomes possible; the cut-over belongs in the Phase 7 launch checklist. Until then 06-01 Task 3 uses the privacy URL `https://milesworth.vercel.app/privacy` (already rewritten in the plan by Task 2).
- **Origin flip when the custom domain attaches.** `src/lib/site.ts` falls back to `https://milesworth.vercel.app`. When `milesworth.app` is live, set `NEXT_PUBLIC_SITE_URL=https://milesworth.app` on Vercel (Production) — or change the fallback — so `metadataBase`, the `/og` card footer, and share links advertise the custom domain. Do not hard-code `milesworth.app` before the domain is purchased and attached.
- **Optional local folder rename** — see "Not done on purpose" above.
- **Default-domain DoS accepted (T-Q-02):** after the Vercel rename `points-unlocked.vercel.app` will 404. No external links to it are published (site is noindex, pre-launch).

## Threat Flags

None — no new network surface, auth path, or schema change. Bulk replaces were scoped exactly as the threat register required (T-Q-01) and verified by `git diff --stat` before each commit.

## Self-Check: PASSED

- `src/lib/site.ts` contains `https://milesworth.vercel.app` — FOUND
- `package.json` contains `"name": "milesworth"` — FOUND
- `src/lib/share-content.ts` contains `Milesworth` — FOUND
- Commit `4790a5b` — FOUND in `git log`
- Commit `642ba0e` — FOUND in `git log`, pushed to `origin/main`
- `git remote get-url origin` = `https://github.com/nickthx/milesworth.git` — FOUND
