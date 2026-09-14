# Phase 1: Foundation - Context

**Gathered:** 2026-08-31
**Status:** Ready for planning

<domain>
## Phase Boundary

A deployed, production-grade skeleton: Next.js 16 (App Router) + Tailwind v4 + shadcn/ui building clean and auto-deploying to a public Vercel URL, with Neon Postgres (Vercel Marketplace) connected through Drizzle (env vars flowing locally and in production) and CI running lint, typecheck, and test green on every push. Every later phase ships onto this live infrastructure. Requirement: PLAT-01.

Not in this phase: real database schema (Phase 2), any product UI beyond a minimal homepage (Phase 4), Clerk auth (Phase 6), full design system (Phase 7).

</domain>

<decisions>
## Implementation Decisions

### Public URL while building
- **D-01:** Deploy the real app shell from day one — no holding page, no throwaway work. The production URL always shows the actual app, however minimal.
- **D-02:** Ship on the free `*.vercel.app` subdomain. Custom domain decision is deferred to Phase 7's launch gate.
- **D-03:** Add a `noindex` robots meta tag until launch; removing it is a Phase 7 launch-gate task.
- **D-04:** Phase 1 homepage = "Milesworth" wordmark + one-sentence pitch + an in-progress note. Ten-minute page, intentional-looking, replaced by the real balance-entry flow in Phase 4.

### CI & quality gates
- **D-05:** GitHub Actions workflow runs lint + typecheck + test on every push/PR — visible green checks on the repo are part of the portfolio pitch. Vercel builds/deploys in parallel.
- **D-06:** CI is advisory only — a failing check shows red on GitHub but never blocks the Vercel production deploy. Push to main auto-deploys unconditionally.
- **D-07:** Solo workflow: push straight to main. No feature-branch/PR ceremony.
- **D-08:** No git hooks (no husky/lint-staged). ESLint + Prettier configured as npm scripts + editor-on-save; CI is the enforcement point.

### Testing foundation
- **D-09:** Vitest is the test runner (fast TS/ESM, right fit for Phase 3's pure-TS engine tests).
- **D-10:** Phase 1 ships one trivial placeholder/smoke test so `npm test` runs green in CI from day one. No jsdom/testing-library setup yet.
- **D-11:** No coverage metric or threshold. Qualitative rule: the Phase 3 valuation/ranking engine gets thorough unit tests (cpp math, transfer paths, bonuses — the defensibility story); UI stays largely untested in v1.
- **D-12:** No E2E automation in v1. Critical path verified manually each phase, plus the Phase 7 real-device LinkedIn WebView pass.

### Scaffold scope
- **D-13:** Editorial typography lands in Phase 1: Fraunces (display serif, big numbers/headlines) + Inter (UI sans) via `next/font/google`, with Tailwind v4 `@theme` tokens (type scale, warm palette CSS variables) set up now. Phases 4–5 build on real tokens; Phase 7 refines, doesn't retrofit.
- **D-14:** Full directory skeleton now: `src/app`, `src/db` (schema stub), `src/data`, `src/engine`, `src/components` — every later phase drops into its slot.
- **D-15:** shadcn init plus the form-adjacent component set preinstalled (button, input, label, card, dialog) so Phase 4 doesn't need CLI runs mid-build.
- **D-16:** Database scope: one placeholder table (e.g. `health_check`) pushed via `drizzle-kit push` to prove the full path — `schema.ts` → Neon → query from a server component. Phase 2 replaces it with the real schema. No real table names stubbed early.

### Claude's Discretion
- Exact Vercel project name / subdomain slug
- GitHub Actions workflow details (Node version, caching, job layout)
- Placeholder test content and file layout conventions
- Warm palette starting values (refined in Phase 7)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Stack & versions (locked)
- `.planning/research/STACK.md` — Full stack decisions with versions: Next.js 16.3.x (min 16.3.3), Tailwind v4, shadcn, Drizzle 0.45.x + drizzle-kit, Neon via Vercel Marketplace, `proxy.ts` not `middleware.ts`, what NOT to use. Mirrored into repo-root `CLAUDE.md`.
- `CLAUDE.md` (repo root) — Same stack constraints + project constraints; loaded into every session.

### Architecture & pitfalls
- `.planning/research/ARCHITECTURE.md` — Intended system shape (server-first, cached reads, DB only for writes).
- `.planning/research/PITFALLS.md` — Known failure modes to avoid during setup.

### Project intent
- `PROJECT-BRIEF.md` (repo root) — Original brief.
- `.planning/PROJECT.md` — Requirements, constraints, key decisions.
- `.planning/REQUIREMENTS.md` — PLAT-01 (this phase) and the full v1 requirement set the skeleton must anticipate.

</canonical_refs>

<code_context>
## Existing Code Insights

Greenfield — repo contains only planning docs (`.planning/`, `CLAUDE.md`, `PROJECT-BRIEF.md`). No code to reuse; no codebase maps exist.

### Established Patterns
- GSD commits per-plan to main; CI must tolerate frequent small pushes (advisory checks fit this).

### Integration Points
- The directory skeleton created here (D-14) is the integration surface for Phases 2 (src/db, src/data), 3 (src/engine), and 4 (src/app, src/components).

</code_context>

<specifics>
## Specific Ideas

- The GitHub repo itself is a portfolio artifact — visible CI checks on the repo matter, not just the deployed app.
- "Every phase ships onto live infrastructure" should stay literally true: no staging-only period, no holding page.
- Fraunces was chosen for its optical-size axis — it should carry the big dollar numbers in the wow reveal, not just headlines.

</specifics>

<deferred>
## Deferred Ideas

- Custom domain purchase/setup — Phase 7 launch gate
- Removing the `noindex` tag — Phase 7 launch gate
- Possible single Playwright smoke test against the deployed URL — reconsider at Phase 4 if the shared-link failure mode starts to worry us (current decision: manual only)

</deferred>

---

*Phase: 1-Foundation*
*Context gathered: 2026-08-31*
