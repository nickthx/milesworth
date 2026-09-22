# 02-05 DATA-04 Verification Corrections — working log

User-ruled corrections from the joint verification pass (Claude web research + Nick rulings).
verifiedAt for all confirmed entries: **2026-09-01**.
Sources researched September 2026 via web search; sourceNote for each entry should be updated
to name the finding (replacing "CLAUDE DRAFT").

## Batch 1 — Asia-Pacific & Hawaii flights (RULED: apply all; JAL entry reworked to business)

| slug | field changes | new sourceNote gist |
|------|--------------|---------------------|
| ana-business-tokyo-roundtrip | pointsMax 100000 → 90000 | ANA "The Room" RT NA–Japan 75–90K seasonal (ANA chart, 2026) |
| ana-first-tokyo-via-virgin | pointsMin 85000 → 72500 | Virgin→ANA F West Coast ~72.5K one-way (145K RT SFO/2); sources conflict with a 55K quote — keep caution note in sourceNote |
| ana-business-tokyo-via-virgin | pointsMin 47500 → 52500 | Virgin→ANA J one-way 52.5K West / 60K East (post-2023 chart) |
| aeroplan-business-tokyo | no numeric change — CONFIRMED | 75K anchor held in June 2026 Aeroplan deval (5,001–7,500 mi NA–Pacific fixed partner band); range 75–115K realistic |
| singapore-business-sfo-singapore | pointsMin 95000 → 112500; pointsMax 115000 → null | KrisFlyer Saver SFO–SIN one-way J = 112,500 (fixed chart, Nov 2025); bookingHint should mention Advantage tier costs more |
| cathay-business-hong-kong | pointsMin 70000 → 88000; pointsMax 85000 → null | Asia Miles May 2026 chart: West Coast–HKG J = 88K one-way (~$112 fees) |
| cathay-first-hong-kong | pointsMin 110000 → 160000; pointsMax 125000 → null | Asia Miles May 2026: JFK–HKG F = 160K one-way; CX still flies F on route |
| turkish-hawaii-on-united | pointsMin 15000 → 25000; pointsMax 25000 → null; cashFareCents 45000 → 25000; methodologyNote → one-way main-cabin economy fare | Dec 2025 Miles&Smiles deval: mainland–Hawaii = 25K economy one-way (was 15K); benchmark switched to one-way to match |
| avios-alaska-hawaii | pointsMin 13000 → 16000; pointsMax 16000 → 20000 | Still bookable on ba.com; ≤3,000mi AA/AS pricing (July 2024) puts SEA–HNL ~16K one-way, no published chart, up to ~20K observed |
| jal-first-tokyo-via-alaska | REWORK: slug → jal-business-tokyo-via-alaska; title → "Japan Airlines business class to Tokyo via Alaska"; cabin first → business; pointsMin 80000 → 60000; pointsMax 140000 → null; cashFareCents 1500000 → 450000 (one-way discounted retail J); bookingHint/notes updated (Atmos Rewards rebrand, JAL F NOT bookable via Alaska) | Atmos Rewards (ex-Mileage Plan, Aug 2025 rebrand) cannot book JAL F; JAL J = 60K one-way US–Tokyo |

Program naming note: alaska-mileage-plan display name should mention "Atmos Rewards" (Aug 2025 rebrand) — check programs.ts in apply step.

## Batch 2 — Europe & Middle East flights (RULED: apply all; Suites entry reworked to 777 F)

| slug | field changes | new sourceNote gist |
|------|--------------|---------------------|
| virgin-upper-class-london | pointsMax 47500 → 60000; taxesFeesCents 60000 → 97500 | Dynamic since Oct 2024, off-peak from ~29K; Upper Class surcharge ~£720 (~$975) one-way JFK–LHR |
| delta-one-london-via-virgin | pointsMin 50000 → 47500; pointsMax 60000 → 50000 | Virgin flat-prices Delta One transatlantic: 50K one-way (47.5K off-peak UK→US East) |
| flying-blue-business-paris | pointsMin 50000 → 60000; pointsMax 70000 → 75000; taxesFeesCents 25000 → 60000 | Sept 8 2026 3-tier chart: Light 60K / Standard 75K / Flex 110K; ~$600 fees; promos to 45K. bookingHint: mention Light-fare tradeoffs (no lounge, no changes) |
| united-polaris-frankfurt | no change — CONFIRMED | Dynamic; saver ~60K EWR–FRA verified realistic 2026 |
| lufthansa-first-via-aeroplan | pointsMin 100000 → 90000; pointsMax 160000 → null; taxesFeesCents 55000 → 20000 | JFK–FRA <4,000mi band = 90K flat post-June-2026 (spared); Aeroplan adds no YQ (~$200 taxes). CAVEAT in notes: A340 retires Oct 2026; Allegris F not partner-bookable — availability window closing |
| singapore-suites-frankfurt | REWORK: slug → singapore-first-777-frankfurt; title → "Singapore Airlines First Class (777) to Frankfurt"; pointsMin 86000 → 156000; pointsMax 120000 → null; bookingHint/notes updated (A380 Suites left JFK–FRA March 2026; 777-300ER F product) | KrisFlyer 777 F JFK–FRA = 156K one-way; A380 Suites no longer on route |
| emirates-first-dubai | pointsMin stays 136000; pointsMax 180000 → 188000; taxesFeesCents 60000 → 100000 | May 2026 Skywards deval: JFK–DXB F saver ~188K (zone rates from 136K); surcharges ~$1,000/leg |
| turkish-business-istanbul | pointsMin 45000 → 65000; pointsMax 55000 → null; taxesFeesCents 35000 → 22000 | 65K one-way + ~$218.50; wide-open J space Aug 2026–Feb 2027 |
| qsuites-doha-via-avios | pointsMin stays 70000; pointsMax 90000 → null; taxesFeesCents 30000 → 23500 | 70K one-way both Avios wallets; BA adds ~$235, Qatar wallet ~$60 (hint already covers wallet move) |
| lifemiles-star-business-europe | pointsMin 63000 → 70000; pointsMax 70000 → 80000 | 2026 NA–Europe J: 70–80K (East Coast 80K); zero-surcharge policy confirmed |
| delta-one-amsterdam | no change — CONFIRMED | Dynamic 100–220K observed range honest; no chart exists |

## Batch 3 — Hotels (RULED: apply 13; hold st-regis-maldives + gritti-palace-venice unverified)

| slug | field changes | new sourceNote gist |
|------|--------------|---------------------|
| park-hyatt-tokyo | pointsMax 45000 → 75000 | Cat 8; May 20 2026 five-tier chart, Top = 75K; reopened Dec 2025 post-renovation |
| alila-ventana-big-sur | pointsMax 45000 → 75000 | Base 35/40/45K, Top 75K; all-inclusive EXCLUDES alcohol (note in bookingHint) |
| park-hyatt-paris-vendome | pointsMin 40000 → 35000; pointsMax 50000 → 75000 | Currently 35/40/45K; moving to new Cat 9 — note in sourceNote |
| grand-hyatt-kauai | pointsMin 25000 → 35000; pointsMax 35000 → 45000 | Actually Cat 8 (draft was a category low): 35–45K |
| miraval-austin | pointsMin 45000 → 40000; pointsMax 65000 → 72000 | 40K single/off-peak – 72K double/peak; $175/person nightly credit |
| hyatt-zilara-cancun | pointsMin 25000 → 20000; pointsMax 40000 → 32000 | Peak 24K, five-tier Top 32K (draft too high) |
| conrad-maldives | pointsMin 120000 → 160000; pointsMax 150000 → 200000 | 160K/night observed Mar 2026 post-Nov-2025 deval (partially walked back) |
| waldorf-astoria-maldives | pointsMin 120000 → 250000; pointsMax 150000 → null | Prices at Hilton's 250K standard-room cap |
| conrad-bora-bora | pointsMin 120000 → 130000; pointsMax 150000 → 200000 | 130K from mid-Mar 2026; post-deval spikes to 200K observed |
| grand-wailea-maui | pointsMin 95000 → 110000; pointsMax 130000 → 150000 | From ~110K, higher post-deval |
| st-regis-bora-bora | pointsMin 100000 → 70000; pointsMax 160000 → 100000 | 70K off-peak / 85K standard / 100K high (draft too high) |
| al-maha-dubai | pointsMax 130000 → 120000 | 85–120K; all-inclusive board + 2 activities confirmed |
| st-regis-maldives | NO CHANGE — stays verifiedAt: null; sourceNote → "no reliable current pricing found in Sept 2026 research pass; needs manual marriott.com check" | |
| ritz-carlton-kyoto | no numeric change — CONFIRMED | Median ~110K/night; draft range 80–130K checks out |
| gritti-palace-venice | NO CHANGE — stays verifiedAt: null; sourceNote → "only stale 2022-era data found in Sept 2026 research pass; needs manual marriott.com check" | |

Running verified total after batches 1–3: 34 entries (36 total, 2 held unverified).

## Batch 4 — Transfer routes / A1–A4 / promos (RULED)

**Assumptions — ALL CONFIRMED by user 2026-09-01 (update [ASSUMED] markers in code/tests to verified-with-date):**
- **A1 CONFIRMED**: Marriott 3:1, 3,000-pt increment, 5K bonus per full 60K block. 59,000 → 19,000 test math holds. Note in route comments: bonus excludes AA/LifeMiles/Delta; United gets 10K/60K (neither modeled in seed routes — Alaska + ANA both get standard 5K/60K, confirmed eligible).
- **A2 CONFIRMED** as conservative simplification: 1,000-pt increments standard for Chase/Amex/Citi; Capital One allows finer — modeling 1,000 never overstates transferable amount.
- **A3 NO VETO**: Chase 1.0¢ + Amex 0.6¢ explicitly confirmed; C1 0.5¢ / Citi 1.0¢ / Bilt ~0 (0.1¢ placeholder) match standard published values. Full sign-off remains Phase 3.
- **A4 CONFIRMED**: promo bonuses multiply base-converted amount, no stacking with structural block bonuses. Live Amex→Hilton math (1,000 MR → 2,600 = 2.0 × 1.30) matches model exactly.
- **Cash-fare convention CONFIRMED**: discounted realistic retail for economy/business benchmarks; undiscounted retail for First. Goes on Phase 3 methodology page verbatim.

**Transfer routes — all 46 confirmed structurally; specific verifications:**
- Amex MR → Hilton 1:2: CONFIRMED current (update route note).
- All 7 Bilt routes survive Bilt 2.0/Cardless era: Alaska/Atmos (only issuer path), United, Hyatt, Virgin, BA, Air France, Aeroplan — all 1:1. Update file header + route notes.
- Marriott → Alaska + Marriott → ANA: 3:1 + 5K/60K confirmed eligible.

**Promo bonuses — REPLACE both placeholder rows with the single real live promo:**
```
fromProgramSlug: "amex-mr", toProgramSlug: "hilton-honors",
bonusPercent: 30, startDate: "2026-09-01", endDate: "2026-10-14",
sourceNote: "Verified 2026-09-01 — Amex MR→Hilton Honors 30% transfer bonus (effective 1:2.6 with the 1:2 base rate), live Sept 1–Oct 14 2026 per Amex/point.me/AwardWallet."
```
Delete amex-mr→virgin-atlantic 30% and citi-ty→avianca-lifemiles 25% placeholder rows. Adjust any test expecting 2 bonuses.

**Program naming:** alaska-mileage-plan display name → "Alaska Atmos Rewards" (Aug 2025 rebrand; keep slug stable).

## Apply-step requirements (Tasks 2–3 of 02-05)
1. Apply every table row above to the seed files; verifiedAt: "2026-09-01" on all entries EXCEPT st-regis-maldives and gritti-palace-venice (stay null with needs-manual-check sourceNotes).
2. Update each verified entry's sourceNote: replace "CLAUDE DRAFT — verify …" with "Verified 2026-09-01 — {finding gist from tables above}".
3. Two slug renames: jal-first-tokyo-via-alaska → jal-business-tokyo-via-alaska; singapore-suites-frankfurt → singapore-first-777-frankfurt (update titles/cabins/hints/notes per Batch 1/2 tables).
4. Activate the deferred ≥30-verified / all-8-programs coverage test in tests/seed-data.test.ts (34 verified expected).
5. npm run db:seed (expect 21 programs, 46 routes, 1 bonus, 36 redemptions, 34 verified) + full gate: test, typecheck, lint, build.

## Phase 7 batch 1 (2026-09-21)

Plan 07-06. Ruled by Nick on 2026-09-21.

- **Batch size:** batch1 = 0 per Wave 0 decision D7-03 (`N=34`, "ship the dataset as-is"; 07-01-SUMMARY). No new entries were drafted, so there are no batch-1 slugs to rule on.
- **Held drafts:** `st-regis-maldives` and `gritti-palace-venice` — **keep as drafts** (Nick, 2026-09-21). Both stay `verifiedAt: null` with their needs-manual-check sourceNotes and remain excluded from ranking. No marriott.com figures were supplied; the dossier of what to check lives in 07-06-SUMMARY.md for a future pass.
- **Result:** V1 = 34 verified of 36 total. The CI floor in `tests/seed-data.test.ts` is raised from 30 to 34 (floor follows the data; never above it).
- **Reseed:** no-op — no seed row changed, so Neon (seeded at 02-05 with 36 redemptions / 34 verified) already mirrors the files; `npm run db:seed` was intentionally not run.
- **Ruling text:** "keep as drafts" for both; "batch 1 verified" (zero entries).

## Phase 7 batch 2 + launch-week re-check (2026-09-21)

Plan 07-08. Ruled by Nick on 2026-09-21.

- **Batch size:** batch2 = 0 per D7-03 (`N=34`). No new entries drafted, no photos sourced; nothing to rule on.
- **Featured 8 (launch-week re-check):** `ana-business-tokyo-roundtrip`, `ana-first-tokyo-via-virgin`, `jal-business-tokyo-via-alaska`, `singapore-first-777-frankfurt`, `emirates-first-dubai`, `park-hyatt-tokyo`, `conrad-maldives`, `st-regis-bora-bora` — **all unchanged** (every points range, cash benchmark and taxes/fees figure kept as stored). `verifiedAt` re-stamped `2026-09-01` → `2026-09-21` on all eight; each sourceNote now opens `Verified 2026-09-21 — re-confirmed unchanged in launch week (first verified 2026-09-01): …`. The 26 non-featured verified entries keep `2026-09-01`.
- **Amex MR → Hilton Honors +30% (2026-09-01 → 2026-10-14):** **live as stored**. Dates and percent unchanged; sourceNote re-stamped to `Verified 2026-09-21 — re-confirmed live in launch week (first verified 2026-09-01): …`.
- **Scope addition (Nick-directed):** Nick verified the full set of active transfer bonuses on program transfer pages on 2026-09-21 and asked for all of them in `src/data/transfers.ts`. Added only where both the source program and the partner already exist as a modeled route (no programs invented): Amex MR → British Airways Avios +30% (2026-09-21 → 2026-09-27); Chase UR → Air Canada Aeroplan +20% (2026-09-21 → 2026-09-30); Chase UR → Marriott Bonvoy +70% (2026-09-15 → 2026-10-15); Citi ThankYou → Avianca LifeMiles +25% (2026-09-20 → 2026-10-24). Not added because the partner is not a modeled program/route: Amex MR → Iberia Avios +30%, Amex MR → Aer Lingus Avios +30% (no Iberia / Aer Lingus programs; Avios is modeled only as `british-airways-avios`), Capital One → JAL Mileage Bank +30% and Citi ThankYou → JAL Mileage Bank +30% (no `jal-mileage-bank` program; JAL is reachable only as an Alaska partner award). Where Nick's list gave only an end date the startDate is 2026-09-21.
- **Result:** V2 = 34 verified of 36 total = N. CI floor stays at 34 (already there since 07-06). Bonus rows 1 → 5.
- **Reseed:** required (verifiedAt/sourceNote rows and the bonuses table changed) — run in the main checkout with `DATABASE_URL` after merge; expected post-seed counts 36 redemptions / 34 verified / 5 bonuses.
- **Ruling text:** "ALL UNCHANGED" (featured 8, re-stamp 2026-09-21); "LIVE as stored" (Hilton bonus); "N = 34 stands"; "batch 2 verified".
