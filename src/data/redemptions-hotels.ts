import type { RedemptionSeed } from "./types";

// Hotel redemptions (DATA-01/DATA-04). 13 of 15 entries verified by Nick on
// 2026-09-01 against live 2026 sources (ruling log: .planning/phases/
// 02-redemption-database/02-05-corrections.md); st-regis-maldives and
// gritti-palace-venice remain verifiedAt: null — re-ruled "keep as drafts" by
// Nick on 2026-09-21 (Phase 7 batch 1, plan 07-06; the launch dataset is the
// 34 verified entries per D7-03). They stay invisible to the engine until a
// manual marriott.com check. The three featured entries (park-hyatt-tokyo,
// conrad-maldives, st-regis-bora-bora) were re-confirmed unchanged by Nick in
// launch week (2026-09-21, plan 07-08) and carry that date.
// Hotel points/cash values are PER NIGHT; dynamic programs (Hyatt
// peak/off-peak, Hilton, Marriott) use pointsMin/pointsMax ranges.
// taxesFeesCents is 0 where award nights typically include taxes — verify per
// property (resort/destination fees can still apply).

export const hotelRedemptions = [
  // ── World of Hyatt (direct use — Chase UR / Bilt transfer 1:1) ───────────
  {
    slug: "park-hyatt-tokyo",
    partnerProgramSlug: "world-of-hyatt",
    title: "Park Hyatt Tokyo — the Lost in Translation stay",
    category: "hotel",
    origin: null,
    destination: "Tokyo, Japan",
    cabin: null,
    pointsMin: 35000,
    pointsMax: 75000,
    taxesFeesCents: 0,
    cashFareCents: 130000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "Book standard-room awards on hyatt.com; peak dates price at the top of the range.\nStandard rooms are limited — book early for cherry-blossom or autumn seasons.\nTransfer Chase UR or Bilt 1:1 to top up.",
    methodologyNote:
      "Cash rate benchmarked as a representative high-season nightly rate incl. taxes.",
    sourceNote:
      "Verified 2026-09-21 — re-confirmed unchanged in launch week (first verified 2026-09-01): Category 8; May 20 2026 five-tier chart tops out at 75K/night. Reopened Dec 2025 post-renovation.",
    verifiedAt: "2026-09-21",
    imageSlug: "tokyo",
    featured: true,
    notes: null,
  },
  {
    slug: "alila-ventana-big-sur",
    partnerProgramSlug: "world-of-hyatt",
    title: "Alila Ventana Big Sur — adults-only, all-inclusive cliffside",
    category: "hotel",
    origin: null,
    destination: "Big Sur, California",
    cabin: null,
    pointsMin: 35000,
    pointsMax: 75000,
    taxesFeesCents: 0,
    cashFareCents: 220000,
    availabilityRating: "hard_to_find",
    bookingHint:
      "Award nights include the all-inclusive food and activities (alcohol NOT included) — enormous per-point value.\nStandard award inventory is tiny; set alerts and book the moment dates open.\nTransfer Chase UR or Bilt 1:1.",
    methodologyNote:
      "Cash rate benchmarked as a representative nightly all-inclusive rate incl. taxes.",
    sourceNote:
      "Verified 2026-09-01 — base tiers 35/40/45K with the five-tier Top at 75K; all-inclusive package confirmed but excludes alcohol.",
    verifiedAt: "2026-09-01",
    imageSlug: "big-sur",
    featured: false,
    notes: null,
  },
  {
    slug: "park-hyatt-paris-vendome",
    partnerProgramSlug: "world-of-hyatt",
    title: "Park Hyatt Paris-Vendôme",
    category: "hotel",
    origin: null,
    destination: "Paris, France",
    cabin: null,
    pointsMin: 35000,
    pointsMax: 75000,
    taxesFeesCents: 0,
    cashFareCents: 160000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "Steps from Place Vendôme; cash rates routinely clear €1,200 in summer.\nBook standard awards on hyatt.com well ahead for fashion-week and summer dates.\nTransfer Chase UR or Bilt 1:1.",
    methodologyNote:
      "Cash rate benchmarked as a representative high-season nightly rate incl. taxes.",
    sourceNote:
      "Verified 2026-09-01 — currently 35/40/45K but moving to the new Category 9; range widened to the upcoming tier top.",
    verifiedAt: "2026-09-01",
    imageSlug: "paris",
    featured: false,
    notes: null,
  },
  {
    slug: "grand-hyatt-kauai",
    partnerProgramSlug: "world-of-hyatt",
    title: "Grand Hyatt Kauai Resort & Spa",
    category: "hotel",
    origin: null,
    destination: "Kauai, Hawaii",
    cabin: null,
    pointsMin: 35000,
    pointsMax: 45000,
    taxesFeesCents: 0,
    cashFareCents: 95000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "Award nights sidestep Hawaii's brutal cash rates and the resort fee.\nStandard rooms open reliably outside holiday weeks — book on hyatt.com.\nTransfer Chase UR or Bilt 1:1.",
    methodologyNote:
      "Cash rate benchmarked as a representative nightly rate incl. taxes and resort fee.",
    sourceNote:
      "Verified 2026-09-01 — actually Category 8 (the draft used a category too low): 35–45K/night.",
    verifiedAt: "2026-09-01",
    imageSlug: "kauai",
    featured: false,
    notes: null,
  },
  {
    slug: "miraval-austin",
    partnerProgramSlug: "world-of-hyatt",
    title: "Miraval Austin — all-inclusive wellness resort",
    category: "hotel",
    origin: null,
    destination: "Austin, Texas",
    cabin: null,
    pointsMin: 40000,
    pointsMax: 72000,
    taxesFeesCents: 0,
    cashFareCents: 200000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "Points nights include meals, classes, and a spa/activity credit.\nBook by phone or hyatt.com; two-night minimums often apply.\nTransfer Chase UR or Bilt 1:1.",
    methodologyNote:
      "Cash rate benchmarked as a representative nightly all-inclusive rate incl. taxes.",
    sourceNote:
      "Verified 2026-09-01 — 40K single/off-peak up to 72K double/peak; includes a $175/person nightly credit.",
    verifiedAt: "2026-09-01",
    imageSlug: "austin",
    featured: false,
    notes: null,
  },
  {
    slug: "hyatt-zilara-cancun",
    partnerProgramSlug: "world-of-hyatt",
    title: "Hyatt Zilara Cancún — adults-only all-inclusive",
    category: "hotel",
    origin: null,
    destination: "Cancún, Mexico",
    cabin: null,
    pointsMin: 20000,
    pointsMax: 32000,
    taxesFeesCents: 0,
    cashFareCents: 85000,
    availabilityRating: "wide_open",
    bookingHint:
      "All-inclusive award nights cover food and drink for two — points stretch far here.\nAvailability is generous outside spring break and holidays.\nTransfer Chase UR or Bilt 1:1.",
    methodologyNote:
      "Cash rate benchmarked as a representative all-inclusive nightly rate for two, incl. taxes.",
    sourceNote:
      "Verified 2026-09-01 — peak 24K with the five-tier Top at 32K; the draft range was too high.",
    verifiedAt: "2026-09-01",
    imageSlug: "cancun",
    featured: false,
    notes: null,
  },

  // ── Hilton Honors (direct use — Amex MR transfers 1:2) ───────────────────
  {
    slug: "conrad-maldives",
    partnerProgramSlug: "hilton-honors",
    title: "Conrad Maldives Rangali Island — overwater villa",
    category: "hotel",
    origin: null,
    destination: "Maldives",
    cabin: null,
    pointsMin: 160000,
    pointsMax: 200000,
    taxesFeesCents: 0,
    cashFareCents: 220000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "Standard awards book into base rooms; upgrade to overwater with points or cash at the property.\n5th-night-free on award stays cuts the effective nightly rate.\nAmex MR transfers 1:2 — 60K MR becomes 120K Hilton points.",
    methodologyNote:
      "Cash rate benchmarked as a representative nightly rate incl. taxes/service; seaplane transfer excluded.",
    sourceNote:
      "Verified 2026-09-21 — re-confirmed unchanged in launch week (first verified 2026-09-01): 160K/night observed Mar 2026 after the Nov 2025 devaluation (partially walked back).",
    verifiedAt: "2026-09-21",
    imageSlug: "maldives",
    featured: true,
    notes: null,
  },
  {
    slug: "waldorf-astoria-maldives",
    partnerProgramSlug: "hilton-honors",
    title: "Waldorf Astoria Maldives Ithaafushi",
    category: "hotel",
    origin: null,
    destination: "Maldives",
    cabin: null,
    pointsMin: 250000,
    pointsMax: null,
    taxesFeesCents: 0,
    cashFareCents: 300000,
    availabilityRating: "hard_to_find",
    bookingHint:
      "One of the highest cash-rate hotels bookable on points anywhere ($3,000+ nights).\nStandard award space is scarce — search wide date ranges and pounce.\nAmex MR transfers 1:2; 5th night free applies on award stays.",
    methodologyNote:
      "Cash rate benchmarked as a representative nightly rate incl. taxes/service; transfers excluded.",
    sourceNote:
      "Verified 2026-09-01 — prices at Hilton's 250K standard-room cap.",
    verifiedAt: "2026-09-01",
    imageSlug: "maldives",
    featured: false,
    notes: null,
  },
  {
    slug: "conrad-bora-bora",
    partnerProgramSlug: "hilton-honors",
    title: "Conrad Bora Bora Nui — overwater bungalow",
    category: "hotel",
    origin: null,
    destination: "Bora Bora, French Polynesia",
    cabin: null,
    pointsMin: 130000,
    pointsMax: 200000,
    taxesFeesCents: 0,
    cashFareCents: 160000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "Overwater bungalows sometimes book as standard awards here — rare among chains.\nUse 5th-night-free and go shoulder season (May/October) for space.\nAmex MR transfers 1:2 to Hilton.",
    methodologyNote:
      "Cash rate benchmarked as a representative nightly rate incl. taxes/service.",
    sourceNote:
      "Verified 2026-09-01 — 130K/night from mid-Mar 2026; post-devaluation spikes to 200K observed.",
    verifiedAt: "2026-09-01",
    imageSlug: "bora-bora",
    featured: false,
    notes: null,
  },
  {
    slug: "grand-wailea-maui",
    partnerProgramSlug: "hilton-honors",
    title: "Grand Wailea Maui, a Waldorf Astoria Resort",
    category: "hotel",
    origin: null,
    destination: "Maui, Hawaii",
    cabin: null,
    pointsMin: 110000,
    pointsMax: 150000,
    taxesFeesCents: 0,
    cashFareCents: 110000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "Award nights dodge a $1,000+ nightly cash rate plus resort fee in high season.\nBook on hilton.com; standard space is steadiest midweek.\nAmex MR transfers 1:2 to Hilton.",
    methodologyNote:
      "Cash rate benchmarked as a representative high-season nightly rate incl. taxes and resort fee.",
    sourceNote:
      "Verified 2026-09-01 — from ~110K/night, running higher post-devaluation.",
    verifiedAt: "2026-09-01",
    imageSlug: "maui",
    featured: false,
    notes: null,
  },

  // ── Marriott Bonvoy (direct use — Chase UR / Amex MR transfer 1:1) ───────
  {
    slug: "st-regis-bora-bora",
    partnerProgramSlug: "marriott-bonvoy",
    title: "St. Regis Bora Bora — overwater villa",
    category: "hotel",
    origin: null,
    destination: "Bora Bora, French Polynesia",
    cabin: null,
    pointsMin: 70000,
    pointsMax: 100000,
    taxesFeesCents: 0,
    cashFareCents: 200000,
    availabilityRating: "hard_to_find",
    bookingHint:
      "The honeymoon-poster redemption: overwater villas from five figures of points per night.\n5th-night-free on awards; book 6–12 months out for dry season (May–October).\nTop up via Chase UR or Amex MR at 1:1.",
    methodologyNote:
      "Cash rate benchmarked as a representative nightly rate incl. taxes/service.",
    sourceNote:
      "Verified 2026-09-21 — re-confirmed unchanged in launch week (first verified 2026-09-01): 70K off-peak / 85K standard / 100K high season; the draft range was too high.",
    verifiedAt: "2026-09-21",
    imageSlug: "bora-bora",
    featured: true,
    notes: null,
  },
  {
    slug: "al-maha-dubai",
    partnerProgramSlug: "marriott-bonvoy",
    title: "Al Maha Desert Resort Dubai — all-inclusive desert suites",
    category: "hotel",
    origin: null,
    destination: "Dubai, UAE",
    cabin: null,
    pointsMin: 85000,
    pointsMax: 120000,
    taxesFeesCents: 0,
    cashFareCents: 250000,
    availabilityRating: "hard_to_find",
    bookingHint:
      "Every suite has a private pool; awards include meals and two desert activities daily.\nAward inventory is tightly capped — book far ahead or go midweek.\nTop up via Chase UR or Amex MR at 1:1.",
    methodologyNote:
      "Cash rate benchmarked as a representative all-inclusive nightly rate incl. taxes.",
    sourceNote:
      "Verified 2026-09-01 — 85–120K/night; all-inclusive board plus two daily activities confirmed.",
    verifiedAt: "2026-09-01",
    imageSlug: "dubai",
    featured: false,
    notes: null,
  },
  {
    slug: "st-regis-maldives",
    partnerProgramSlug: "marriott-bonvoy",
    title: "St. Regis Maldives Vommuli — overwater villa",
    category: "hotel",
    origin: null,
    destination: "Maldives",
    cabin: null,
    pointsMin: 100000,
    pointsMax: 160000,
    taxesFeesCents: 0,
    cashFareCents: 280000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "Overwater garden villas bookable on standard awards with 5th night free.\nShoulder-season space (May, November) is the realistic play.\nTop up via Chase UR or Amex MR at 1:1.",
    methodologyNote:
      "Cash rate benchmarked as a representative nightly rate incl. taxes/service; seaplane transfer excluded.",
    sourceNote:
      "DRAFT — no reliable current pricing found in the Sept 2026 research pass; needs a manual marriott.com check before verification.",
    verifiedAt: null,
    imageSlug: "maldives",
    featured: false,
    notes: null,
  },
  {
    slug: "ritz-carlton-kyoto",
    partnerProgramSlug: "marriott-bonvoy",
    title: "The Ritz-Carlton, Kyoto — riverside luxury",
    category: "hotel",
    origin: null,
    destination: "Kyoto, Japan",
    cabin: null,
    pointsMin: 80000,
    pointsMax: 130000,
    taxesFeesCents: 0,
    cashFareCents: 160000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "Kamogawa River views and kaiseki breakfasts; cash rates spike past $1,500 in blossom season.\nAward space vanishes for late March–April — book the moment dates open.\nTop up via Chase UR or Amex MR at 1:1.",
    methodologyNote:
      "Cash rate benchmarked as a representative high-season nightly rate incl. taxes/service.",
    sourceNote:
      "Verified 2026-09-01 — median ~110K/night; the drafted 80–130K range checks out.",
    verifiedAt: "2026-09-01",
    imageSlug: "kyoto",
    featured: false,
    notes: null,
  },
  {
    slug: "gritti-palace-venice",
    partnerProgramSlug: "marriott-bonvoy",
    title: "The Gritti Palace, Venice — Grand Canal grande dame",
    category: "hotel",
    origin: null,
    destination: "Venice, Italy",
    cabin: null,
    pointsMin: 90000,
    pointsMax: 140000,
    taxesFeesCents: 0,
    cashFareCents: 210000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "A 16th-century palazzo on the Grand Canal — the definition of an aspirational city stay.\nBook awards on marriott.com; Venice city tax is collected at the property.\nTop up via Chase UR or Amex MR at 1:1.",
    methodologyNote:
      "Cash rate benchmarked as a representative high-season nightly rate incl. taxes; city tax excluded.",
    sourceNote:
      "DRAFT — only stale 2022-era data found in the Sept 2026 research pass; needs a manual marriott.com check before verification.",
    verifiedAt: null,
    imageSlug: "venice",
    featured: false,
    notes: null,
  },
] satisfies RedemptionSeed[];
