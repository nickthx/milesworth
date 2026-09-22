import type { RedemptionSeed } from "./types";

// Flight redemptions — Asia-Pacific & Hawaii (DATA-01/DATA-04). All entries in
// this file were verified by Nick on 2026-09-01 against live 2026 sources in a
// joint research pass (see .planning/phases/02-redemption-database/
// 02-05-corrections.md for the ruling log). sourceNote records the finding;
// verifiedAt is the verification date. The three featured entries
// (ana-business-tokyo-roundtrip, ana-first-tokyo-via-virgin,
// jal-business-tokyo-via-alaska) were re-confirmed unchanged by Nick in launch
// week (2026-09-21, plan 07-08) and carry that date. Dynamic or uncertain pricing uses
// pointsMin/pointsMax ranges; pointsMax: null is reserved for genuinely fixed
// charts. Money is integer cents. Fare-benchmark convention (confirmed
// 2026-09-01): discounted realistic retail for economy/business, undiscounted
// retail for First — see types.ts. Europe & Middle East flights live in
// redemptions-flights-europe.ts (500-line rule); redemptions.ts concatenates.

export const flightRedemptions = [
  {
    slug: "ana-business-tokyo-roundtrip",
    partnerProgramSlug: "ana-mileage-club",
    title: "ANA business class to Tokyo — round trip",
    category: "flight",
    origin: "New York (JFK)",
    destination: "Tokyo (HND)",
    cabin: "business",
    pointsMin: 75000,
    pointsMax: 90000,
    taxesFeesCents: 60000,
    cashFareCents: 900000,
    availabilityRating: "hard_to_find",
    bookingHint:
      "Transfer Amex MR 1:1 to ANA Mileage Club (allow ~48h; irreversible).\nSearch award space on ANA's own site; ANA's chart requires round-trip bookings.\nBest space opens ~355 days out and again close-in.",
    methodologyNote:
      "Cash fare benchmarked as a discounted retail round-trip business fare, not full-flex.",
    sourceNote:
      "Verified 2026-09-21 — re-confirmed unchanged in launch week (first verified 2026-09-01): ANA 'The Room' round-trip NA–Japan runs 75–90K seasonal per ANA's current chart (2026).",
    verifiedAt: "2026-09-21",
    imageSlug: "tokyo",
    featured: true,
    notes: "The flagship pitch redemption: ~90K Amex MR → Tokyo in business.",
  },
  {
    slug: "ana-first-tokyo-via-virgin",
    partnerProgramSlug: "virgin-atlantic",
    title: "ANA First Class to Tokyo via Virgin Atlantic",
    category: "flight",
    origin: "Los Angeles (LAX)",
    destination: "Tokyo (HND)",
    cabin: "first",
    pointsMin: 72500,
    pointsMax: null,
    taxesFeesCents: 40000,
    cashFareCents: 1400000,
    availabilityRating: "hard_to_find",
    bookingHint:
      "Find ANA F space first (2 seats max, opens sporadically), then call Virgin Atlantic to book.\nTransfer from Amex/Chase/Citi 1:1 only once space is confirmed.\nThis is a unicorn — expect to hunt for weeks.",
    methodologyNote:
      "Cash fare benchmarked as a one-way retail first fare; F is rarely sold discounted.",
    sourceNote:
      "Verified 2026-09-21 — re-confirmed unchanged in launch week (first verified 2026-09-01): Virgin→ANA F West Coast ~72.5K one-way (145K RT SFO ÷ 2, post-2023 chart). Caution: some sources quote 55K one-way; the conservative figure is used.",
    verifiedAt: "2026-09-21",
    imageSlug: "tokyo",
    featured: true,
    notes: null,
  },
  {
    slug: "ana-business-tokyo-via-virgin",
    partnerProgramSlug: "virgin-atlantic",
    title: "ANA business class to Tokyo via Virgin Atlantic",
    category: "flight",
    origin: "San Francisco (SFO)",
    destination: "Tokyo (NRT)",
    cabin: "business",
    pointsMin: 52500,
    pointsMax: null,
    taxesFeesCents: 35000,
    cashFareCents: 450000,
    availabilityRating: "hard_to_find",
    bookingHint:
      "Same ANA metal as booking direct, but one-ways allowed and no ANA account needed.\nConfirm space via ANA/United search tools, then book with Virgin online or by phone.\nTransfer 1:1 from Chase, Amex, Citi, or Bilt.",
    methodologyNote:
      "Cash fare benchmarked as a discounted one-way retail business fare.",
    sourceNote:
      "Verified 2026-09-01 — Virgin→ANA business one-way is 52.5K West Coast / 60K East Coast on the post-2023 chart.",
    verifiedAt: "2026-09-01",
    imageSlug: "tokyo",
    featured: false,
    notes: null,
  },
  {
    slug: "aeroplan-business-tokyo",
    partnerProgramSlug: "air-canada-aeroplan",
    title: "Star Alliance business to Tokyo via Aeroplan",
    category: "flight",
    origin: "Vancouver (YVR)",
    destination: "Tokyo (HND)",
    cabin: "business",
    pointsMin: 75000,
    pointsMax: 115000,
    taxesFeesCents: 10000,
    cashFareCents: 550000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "Aeroplan's zone chart covers ANA, Air Canada, and United to Japan in one search.\nStopovers on one-ways cost just 5K extra — build Tokyo + a second city.\nTransfer 1:1 from Amex, Chase, Capital One, or Bilt.",
    methodologyNote:
      "Cash fare benchmarked as a discounted one-way retail business fare.",
    sourceNote:
      "Verified 2026-09-01 — 75K anchor held through the June 2026 Aeroplan devaluation (5,001–7,500 mi NA–Pacific fixed partner band); the 75–115K range remains realistic.",
    verifiedAt: "2026-09-01",
    imageSlug: "tokyo",
    featured: false,
    notes: null,
  },
  {
    slug: "singapore-business-sfo-singapore",
    partnerProgramSlug: "singapore-krisflyer",
    title: "Singapore Airlines business, SFO to Singapore nonstop",
    category: "flight",
    origin: "San Francisco (SFO)",
    destination: "Singapore (SIN)",
    cabin: "business",
    pointsMin: 112500,
    pointsMax: null,
    taxesFeesCents: 20000,
    cashFareCents: 650000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "One of the world's longest flights, ~17h in Singapore's business product.\nSaver space is decent outside holiday peaks; book on singaporeair.com — Advantage-tier awards cost substantially more than Saver.\nTransfer 1:1 from any of the five bank programs.",
    methodologyNote:
      "Cash fare benchmarked as a discounted one-way retail business fare.",
    sourceNote:
      "Verified 2026-09-01 — KrisFlyer Saver SFO–SIN one-way business = 112,500 miles on the fixed chart (Nov 2025).",
    verifiedAt: "2026-09-01",
    imageSlug: "singapore",
    featured: false,
    notes: null,
  },
  {
    slug: "cathay-business-hong-kong",
    partnerProgramSlug: "cathay-asia-miles",
    title: "Cathay Pacific business to Hong Kong",
    category: "flight",
    origin: "Los Angeles (LAX)",
    destination: "Hong Kong (HKG)",
    cabin: "business",
    pointsMin: 88000,
    pointsMax: null,
    taxesFeesCents: 20000,
    cashFareCents: 500000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "Asia Miles' distance chart keeps trans-Pacific business reasonable.\nBook on cathaypacific.com; space opens in waves ~360 days out and close-in.\nTransfer 1:1 from Amex, Citi, or Capital One.",
    methodologyNote:
      "Cash fare benchmarked as a discounted one-way retail business fare.",
    sourceNote:
      "Verified 2026-09-01 — Asia Miles May 2026 chart: West Coast–HKG business = 88K one-way (~$112 in fees).",
    verifiedAt: "2026-09-01",
    imageSlug: "hong-kong",
    featured: false,
    notes: null,
  },
  {
    slug: "cathay-first-hong-kong",
    partnerProgramSlug: "cathay-asia-miles",
    title: "Cathay Pacific First Class to Hong Kong",
    category: "flight",
    origin: "New York (JFK)",
    destination: "Hong Kong (HKG)",
    cabin: "first",
    pointsMin: 160000,
    pointsMax: null,
    taxesFeesCents: 25000,
    cashFareCents: 1600000,
    availabilityRating: "hard_to_find",
    bookingHint:
      "Caviar and a lie-flat suite on one of aviation's classic F products.\nUsually 1–2 seats, released close to departure — flexibility required.\nTransfer 1:1 from Amex, Citi, or Capital One once space is found.",
    methodologyNote:
      "Cash fare benchmarked as a one-way retail first fare.",
    sourceNote:
      "Verified 2026-09-01 — Asia Miles May 2026 chart: JFK–HKG first = 160K one-way; Cathay still flies F on the route.",
    verifiedAt: "2026-09-01",
    imageSlug: "hong-kong",
    featured: false,
    notes: null,
  },
  {
    slug: "turkish-hawaii-on-united",
    partnerProgramSlug: "turkish-miles-smiles",
    title: "Hawaii on United via Turkish Miles&Smiles",
    category: "flight",
    origin: "US mainland (any United gateway)",
    destination: "Honolulu (HNL)",
    cabin: "economy",
    pointsMin: 25000,
    pointsMax: null,
    taxesFeesCents: 1200,
    cashFareCents: 25000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "The classic small-balance sweet spot: United-operated Hawaii flights priced off Turkish's partner chart.\nFind United saver space first, then book through Miles&Smiles (online or by email/phone).\nTransfer 1:1 from Capital One or Citi.",
    methodologyNote:
      "Cash fare benchmarked as a one-way main-cabin economy fare.",
    sourceNote:
      "Verified 2026-09-01 — Dec 2025 Miles&Smiles devaluation set mainland–Hawaii at 25K economy one-way (was 15K); cash benchmark switched to a one-way fare to match.",
    verifiedAt: "2026-09-01",
    imageSlug: "hawaii",
    featured: false,
    notes: null,
  },
  {
    slug: "avios-alaska-hawaii",
    partnerProgramSlug: "british-airways-avios",
    title: "West Coast to Hawaii on Alaska with Avios",
    category: "flight",
    origin: "Seattle (SEA)",
    destination: "Honolulu (HNL)",
    cabin: "economy",
    pointsMin: 16000,
    pointsMax: 20000,
    taxesFeesCents: 600,
    cashFareCents: 40000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "BA's distance-based chart makes West Coast–Hawaii on Alaska a cheap Avios play.\nBook on ba.com; taxes on domestic partners are trivial.\nTransfer 1:1 from Chase, Amex, Capital One, or Bilt.",
    methodologyNote:
      "Cash fare benchmarked as a one-way main-cabin economy fare.",
    sourceNote:
      "Verified 2026-09-01 — still bookable on ba.com; ≤3,000-mile AA/AS partner pricing (July 2024) puts SEA–HNL at ~16K one-way, with no published chart and up to ~20K observed.",
    verifiedAt: "2026-09-01",
    imageSlug: "hawaii",
    featured: false,
    notes: null,
  },
  {
    slug: "jal-business-tokyo-via-alaska",
    partnerProgramSlug: "alaska-mileage-plan",
    title: "Japan Airlines business class to Tokyo via Alaska",
    category: "flight",
    origin: "Los Angeles (LAX)",
    destination: "Tokyo (HND)",
    cabin: "business",
    pointsMin: 60000,
    pointsMax: null,
    taxesFeesCents: 5000,
    cashFareCents: 450000,
    availabilityRating: "hard_to_find",
    bookingHint:
      "JAL business with Alaska's Atmos Rewards miles is a standout sweet spot when space appears.\nSearch on alaskaair.com; JAL releases premium space sparingly and close-in.\nTransfer 1:1 from Bilt (the only bank path to Alaska), or 3:1 from Marriott.",
    methodologyNote:
      "Cash fare benchmarked as a discounted one-way retail business fare.",
    sourceNote:
      "Verified 2026-09-21 — re-confirmed unchanged in launch week (first verified 2026-09-01): Alaska Atmos Rewards (ex-Mileage Plan, Aug 2025 rebrand) prices JAL business at 60K one-way US–Tokyo; JAL First is NOT bookable via Alaska.",
    verifiedAt: "2026-09-21",
    imageSlug: "tokyo",
    featured: true,
    notes:
      "Reworked from a JAL First draft: JAL F is no longer bookable with Alaska miles, so the business-class redemption is the real play.",
  },
] satisfies RedemptionSeed[];
