---
phase: 07-editorial-polish-launch
plan: 08
subsystem: data
tags: [redemptions, seed-data, verification, launch-week-recheck, transfer-bonus, ci-floor, bookkeeping, d7-03]
status: checkpoint-pending
---

# Phase 07 Plan 08: Batch 2 + Launch-Week Re-check Summary (DRAFT — awaiting Task 2 rulings)

**Draft status:** Task 1 complete on the zero-draft path (batch2 = 0 per D7-03). This file holds the launch-week re-check dossier for Nick's Task 2 checkpoint. Task 3 (apply rulings, footer re-confirm, Pitfall 13 bookkeeping) has not run. The final SUMMARY replaces this draft after Task 3.

## Task 1: Draft batch 2 — zero-draft path

Per 07-01-SUMMARY (D7-03): `N=34`, `batch1=0`, `batch2=0`. 07-06 executed batch 1 with zero entries (V1 = 34) and raised the CI floor to 34.

**No new drafts per D7-03.** No entries drafted, no photos sourced, no imageSlugs added. `src/data/redemptions-hotels-2.ts` and `src/data/redemptions-flights-americas.ts` were not created (nothing to put in them). No batch-1 entry was flagged for re-draft (batch 1 was empty; both Marriott drafts stay held by Nick's 2026-09-21 ruling — not re-opened here).

### Task 1 verification (run on the unchanged tree, 2026-09-21)

- `npx vitest run tests/seed-data.test.ts tests/image-manifest.test.ts` -> 2 files, 23/23 passed (floor at 34 green)
- Count script (scratchpad `tsx` file, static import — the plan's `tsx -e` one-liner does not work, 07-06 Deviation 2):
  ```
  36 total, 34 verified, 2 drafts
  drafts: st-regis-maldives, gritti-palace-venice
  featured 8
  featured+verified 8; teaser (first in seed order): ana-business-tokyo-roundtrip
  ```
- `wc -l`: redemptions.ts 14, redemptions-flights.ts 256, redemptions-flights-europe.ts 279, redemptions-hotels.ts 380 — all < 500
- `npm run build` exit 0 (generates gitignored `next-env.d.ts`), then `npm run typecheck` exit 0, `npm run lint` exit 0
- `git status --short` empty afterwards — Task 1 changed nothing in `src/` or `tests/`

## Launch-week re-check dossier (for Task 2)

All eight featured entries currently carry `verifiedAt: "2026-09-01"` and a sourceNote beginning `Verified 2026-09-01 — …`. The teaser on `/` shows `ana-business-tokyo-roundtrip` (first featured + verified in seed order); `/og` shows the top-ranked result for the shared balances. The "Verified <date>" badge on these cards is what a recruiter sees first — a re-check date from launch week is the point of this pass.

Money values below are in cents as stored (`cashFareCents` / `taxesFeesCents`); dollar figures in parentheses. Points are one-way for flights unless noted; per night for hotels.

| # | Slug (file) | Partner | pointsMin – pointsMax | cashFareCents | taxesFeesCents | verifiedAt | What to re-check |
|---|-------------|---------|-----------------------|---------------|----------------|------------|------------------|
| 1 | `ana-business-tokyo-roundtrip` (redemptions-flights.ts) | ana-mileage-club | 75,000 – 90,000 (round trip) | 900,000 ($9,000 RT) | 60,000 ($600) | 2026-09-01 | ANA Mileage Club award chart, North America–Japan, business, round trip: still 75K low / 90K high season? Cash benchmark: discounted retail RT business JFK–HND, a spring 2027 date pair. Surcharges ~$600 RT still typical? |
| 2 | `ana-first-tokyo-via-virgin` (redemptions-flights.ts) | virgin-atlantic | 72,500 – (single) | 1,400,000 ($14,000 OW) | 40,000 ($400) | 2026-09-01 | Virgin Atlantic Flying Club partner chart for ANA First, US West Coast–Japan: still 145K RT / 72.5K one-way? (Some sources quote 55K one-way — confirm which figure Virgin's chart shows today.) Cash benchmark: retail one-way F LAX–HND. |
| 3 | `jal-business-tokyo-via-alaska` (redemptions-flights.ts) | alaska-mileage-plan | 60,000 – (single) | 450,000 ($4,500 OW) | 5,000 ($50) | 2026-09-01 | alaskaair.com (Atmos Rewards) partner award for JAL business, US–Tokyo one-way: still 60K? Confirm JAL First still not bookable via Alaska. Cash benchmark: discounted one-way business LAX–HND. |
| 4 | `singapore-first-777-frankfurt` (redemptions-flights-europe.ts) | singapore-krisflyer | 156,000 – (single) | 1,400,000 ($14,000 OW) | 25,000 ($250) | 2026-09-01 | KrisFlyer saver award, JFK–FRA First (777-300ER): still 156K one-way? Confirm the fifth-freedom route still operates with F. Cash benchmark: one-way retail F JFK–FRA. |
| 5 | `emirates-first-dubai` (redemptions-flights-europe.ts) | emirates-skywards | 136,000 – 188,000 | 1,800,000 ($18,000 OW) | 100,000 ($1,000) | 2026-09-01 | Skywards saver award JFK–DXB First, post-May-2026 devaluation: still 136K zone base / ~188K saver? Surcharges still ~$1,000 per leg? Cash benchmark: one-way retail F JFK–DXB. |
| 6 | `park-hyatt-tokyo` (redemptions-hotels.ts) | world-of-hyatt | 35,000 – 75,000 / night | 130,000 ($1,300/night) | 0 | 2026-09-01 | hyatt.com: Park Hyatt Tokyo still Category 8; five-tier (May 20 2026) chart still 35K off-peak to 75K peak for a standard room? Cash benchmark: high-season nightly rate incl. tax (a cherry-blossom or autumn 2027 date). |
| 7 | `conrad-maldives` (redemptions-hotels.ts) | hilton-honors | 160,000 – 200,000 / night | 220,000 ($2,200/night) | 0 | 2026-09-01 | hilton.com: standard-award points for a base room on a high-season date (Feb/Mar 2027) and a shoulder date — still 160K–200K? 5th-night-free still applies? Cash benchmark: nightly rate incl. taxes/service, seaplane excluded. |
| 8 | `st-regis-bora-bora` (redemptions-hotels.ts) | marriott-bonvoy | 70,000 – 100,000 / night | 200,000 ($2,000/night) | 0 | 2026-09-01 | marriott.com: standard-award points for a base overwater villa — still 70K off-peak / 85K standard / 100K peak? 5th-night-free on awards still in force? Cash benchmark: dry-season (May–Oct 2027) nightly rate incl. taxes/service. |

For each row, reply **"unchanged"** or corrected figures (points range, cash benchmark, taxes/fees), plus the **date to stamp as the new `verifiedAt`** (one date for all re-confirmed rows is fine). Rows not re-confirmed keep `2026-09-01` and are listed as such in the final SUMMARY.

### Dated transfer bonus (src/data/transfers.ts `bonuses[0]`)

| Field | Stored value |
|-------|--------------|
| route | amex-mr → hilton-honors |
| bonusPercent | 30 (effective 1:2.6 on the 1:2 base rate) |
| startDate | 2026-09-01 |
| endDate | 2026-10-14 |
| sourceNote | "Verified 2026-09-01 — Amex MR→Hilton Honors 30% transfer bonus (effective 1:2.6 with the 1:2 base rate), live Sept 1–Oct 14 2026 per Amex/point.me/AwardWallet." |

Question for Nick: is this bonus still **live** as stored / **extended to <date>** / **replaced by <program → partner, %, dates, source>** / **ended**? Check the Amex transfer-partner page (or point.me / AwardWallet's bonus tracker). The engine ignores the row automatically after `endDate`; the "+30% transfer bonus through …" badge disappears after 2026-10-14. If it ended early, the row can stay as history (default) unless you prefer deletion.

### Final-count confirmation

With batch2 = 0 the verified count after Task 3 is unchanged at **34 = N** (D7-03) unless Nick's re-check drops an entry. Confirm N = 34 stands, or state an amended N.

## Task 2: Nick's ruling

_(pending — checkpoint returned to orchestrator)_

## Task 3: Apply rulings, footer re-confirm, bookkeeping

_(not started)_

### Footer credit pre-check (read-only, for Task 3)

`grep -o 'source: "[A-Za-z]*"' src/images/destinations.ts | sort | uniq -c` -> `21 source: "Unsplash"` (single source value). `src/components/site-footer.tsx` line 36 reads `Photos via Unsplash` — already matches; Task 3 expects a no-op.

## New photo sources

None — no photos sourced (batch2 = 0).

## Deviations from Plan

**1. [Rule 3 - Blocking] Worktree base behind the expected commit** — startup branch check found HEAD at `30428ed` (merge-base with `9bee33a` was `30428ed`); applied the sanctioned `git reset --hard 9bee33a` from the spawn instructions on a clean tree.

**2. [Rule 3 - Blocking] Plan's `tsx -e` count one-liner** — not usable (CJS namespace, 07-06 Deviation 2); replaced by a scratchpad script with a static import. No repo change.

---
*Phase: 07-editorial-polish-launch*
*Draft written: 2026-09-21*
