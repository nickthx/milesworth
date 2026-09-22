import type { RedemptionSeed } from "./types";

// Flight redemptions — Europe & Middle East (DATA-01/DATA-04). Split from
// redemptions-flights.ts to honor the 500-line rule. All entries in this file
// were verified by Nick on 2026-09-01 against live 2026 sources (ruling log:
// .planning/phases/02-redemption-database/02-05-corrections.md). sourceNote
// records the finding; verifiedAt is the verification date. The two featured
// entries (singapore-first-777-frankfurt, emirates-first-dubai) were
// re-confirmed unchanged by Nick in launch week (2026-09-21, plan 07-08) and
// carry that date. Dynamic pricing
// uses ranges, money is integer cents, and the fare-benchmark convention
// (confirmed 2026-09-01) is: discounted realistic retail for economy/business,
// undiscounted retail for First — see types.ts.

export const flightRedemptionsEurope = [
  {
    slug: "virgin-upper-class-london",
    partnerProgramSlug: "virgin-atlantic",
    title: "Virgin Atlantic Upper Class to London",
    category: "flight",
    origin: "New York (JFK)",
    destination: "London (LHR)",
    cabin: "business",
    pointsMin: 29000,
    pointsMax: 60000,
    taxesFeesCents: 97500,
    cashFareCents: 350000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "Book on virginatlantic.com — award space on Virgin's own metal is relatively generous.\nOff-peak dates price at the low end; carrier surcharges are the real cost here.\nTransfer 1:1 from Chase, Amex, Citi, Capital One, or Bilt.",
    methodologyNote:
      "Cash fare benchmarked as a discounted one-way retail business fare; surcharges shown separately in taxesFeesCents.",
    sourceNote:
      "Verified 2026-09-01 — dynamic pricing since Oct 2024, off-peak from ~29K; Upper Class surcharge ~£720 (~$975) one-way JFK–LHR.",
    verifiedAt: "2026-09-01",
    imageSlug: "london",
    featured: false,
    notes: null,
  },
  {
    slug: "delta-one-london-via-virgin",
    partnerProgramSlug: "virgin-atlantic",
    title: "Delta One to London booked with Virgin points",
    category: "flight",
    origin: "New York (JFK)",
    destination: "London (LHR)",
    cabin: "business",
    pointsMin: 47500,
    pointsMax: 50000,
    taxesFeesCents: 25000,
    cashFareCents: 400000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "Virgin prices Delta One flat — far cheaper than Delta's own dynamic SkyMiles pricing.\nSearch Delta.com for award space, then book the same flight through Virgin Atlantic.\nSurcharges on Delta metal are much lower than on Virgin's own flights.",
    methodologyNote:
      "Cash fare benchmarked as a discounted one-way retail business fare.",
    sourceNote:
      "Verified 2026-09-01 — Virgin flat-prices Delta One transatlantic at 50K one-way (47.5K off-peak UK→US East).",
    verifiedAt: "2026-09-01",
    imageSlug: "london",
    featured: false,
    notes: null,
  },
  {
    slug: "flying-blue-business-paris",
    partnerProgramSlug: "air-france-flying-blue",
    title: "Air France business class to Paris",
    category: "flight",
    origin: "New York (JFK)",
    destination: "Paris (CDG)",
    cabin: "business",
    pointsMin: 60000,
    pointsMax: 75000,
    taxesFeesCents: 60000,
    cashFareCents: 320000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "Flying Blue's three-tier awards: Light fares are cheapest but skip lounge access and allow no changes — Standard is the safer pick.\nWatch monthly Promo Rewards for discounts to ~45K.\nTransfer 1:1 from any of the five bank programs (rare universal partner); book on flyingblue.com.",
    methodologyNote:
      "Cash fare benchmarked as a discounted one-way retail business fare.",
    sourceNote:
      "Verified 2026-09-01 — Sept 8 2026 three-tier chart: Light 60K / Standard 75K / Flex 110K one-way JFK–CDG business, ~$600 fees; promos dip to 45K.",
    verifiedAt: "2026-09-01",
    imageSlug: "paris",
    featured: false,
    notes: null,
  },
  {
    slug: "united-polaris-frankfurt",
    partnerProgramSlug: "united-mileageplus",
    title: "United Polaris business to Frankfurt",
    category: "flight",
    origin: "Newark (EWR)",
    destination: "Frankfurt (FRA)",
    cabin: "business",
    pointsMin: 60000,
    pointsMax: 140000,
    taxesFeesCents: 6000,
    cashFareCents: 380000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "United prices dynamically — saver dates near 60K, peak dates far higher.\nNo fuel surcharges and free changes make this a forgiving first redemption.\nTransfer 1:1 from Chase UR or Bilt.",
    methodologyNote:
      "Cash fare benchmarked as a discounted one-way retail business fare.",
    sourceNote:
      "Verified 2026-09-01 — dynamic pricing; saver ~60K EWR–FRA confirmed realistic in 2026 searches.",
    verifiedAt: "2026-09-01",
    imageSlug: "frankfurt",
    featured: false,
    notes: null,
  },
  {
    slug: "lufthansa-first-via-aeroplan",
    partnerProgramSlug: "air-canada-aeroplan",
    title: "Lufthansa First Class via Aeroplan",
    category: "flight",
    origin: "New York (JFK)",
    destination: "Frankfurt (FRA)",
    cabin: "first",
    pointsMin: 90000,
    pointsMax: null,
    taxesFeesCents: 20000,
    cashFareCents: 1100000,
    availabilityRating: "hard_to_find",
    bookingHint:
      "Lufthansa releases F to partners only ~15 days out — this is a flexible traveler's play.\nSearch on aeroplan.com; book online or by phone.\nTransfer 1:1 from Amex, Chase, Capital One, or Bilt.",
    methodologyNote:
      "Cash fare benchmarked as a one-way retail first fare; F is rarely discounted.",
    sourceNote:
      "Verified 2026-09-01 — JFK–FRA sits in the <4,000-mile band at 90K flat, spared by the June 2026 Aeroplan devaluation; Aeroplan adds no YQ (~$200 taxes).",
    verifiedAt: "2026-09-01",
    imageSlug: "frankfurt",
    featured: false,
    notes:
      "CAVEAT: the A340 fleet retires Oct 2026 and Allegris First is not partner-bookable — this availability window is closing.",
  },
  {
    slug: "singapore-first-777-frankfurt",
    partnerProgramSlug: "singapore-krisflyer",
    title: "Singapore Airlines First Class (777) to Frankfurt",
    category: "flight",
    origin: "New York (JFK)",
    destination: "Frankfurt (FRA)",
    cabin: "first",
    pointsMin: 156000,
    pointsMax: null,
    taxesFeesCents: 25000,
    cashFareCents: 1400000,
    availabilityRating: "hard_to_find",
    bookingHint:
      "Singapore's 777-300ER First on the JFK–FRA fifth-freedom route — a top-tier F product bookable with points.\nBook saver space on singaporeair.com; waitlist often clears.\nTransfer 1:1 from any of the five bank programs; allow a day for transfers.",
    methodologyNote:
      "Cash fare benchmarked as a one-way retail first fare.",
    sourceNote:
      "Verified 2026-09-21 — re-confirmed unchanged in launch week (first verified 2026-09-01): KrisFlyer 777 First JFK–FRA = 156K one-way; the A380 Suites left the route in March 2026.",
    verifiedAt: "2026-09-21",
    imageSlug: "frankfurt",
    featured: true,
    notes:
      "Reworked from an A380 Suites draft: the A380 no longer serves JFK–FRA, so this is the 777-300ER First product.",
  },
  {
    slug: "emirates-first-dubai",
    partnerProgramSlug: "emirates-skywards",
    title: "Emirates First Class (A380 shower spa) to Dubai",
    category: "flight",
    origin: "New York (JFK)",
    destination: "Dubai (DXB)",
    cabin: "first",
    pointsMin: 136000,
    pointsMax: 188000,
    taxesFeesCents: 100000,
    cashFareCents: 1800000,
    availabilityRating: "hard_to_find",
    bookingHint:
      "The onboard shower and bar A380 experience — the definition of a wow redemption.\nBook on emirates.com with Skywards miles; F space favors Skywards members.\nTransfer 1:1 from Chase, Amex, Citi, or Capital One.",
    methodologyNote:
      "Cash fare benchmarked as a one-way retail first fare; Emirates F is rarely discounted.",
    sourceNote:
      "Verified 2026-09-21 — re-confirmed unchanged in launch week (first verified 2026-09-01): May 2026 Skywards devaluation: JFK–DXB First saver ~188K (zone rates from 136K); surcharges run ~$1,000 per leg.",
    verifiedAt: "2026-09-21",
    imageSlug: "dubai",
    featured: true,
    notes: null,
  },
  {
    slug: "turkish-business-istanbul",
    partnerProgramSlug: "turkish-miles-smiles",
    title: "Turkish Airlines business to Istanbul",
    category: "flight",
    origin: "New York (JFK)",
    destination: "Istanbul (IST)",
    cabin: "business",
    pointsMin: 65000,
    pointsMax: null,
    taxesFeesCents: 22000,
    cashFareCents: 380000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "Famous onboard catering (the candle-lit 'flying chef' service) at a low miles price.\nBook on turkishairlines.com; award search can be temperamental — retry.\nTransfer 1:1 from Capital One or Citi.",
    methodologyNote:
      "Cash fare benchmarked as a discounted one-way retail business fare.",
    sourceNote:
      "Verified 2026-09-01 — US–IST business = 65K one-way + ~$218.50 in fees; business award space wide open Aug 2026–Feb 2027.",
    verifiedAt: "2026-09-01",
    imageSlug: "istanbul",
    featured: false,
    notes: null,
  },
  {
    slug: "qsuites-doha-via-avios",
    partnerProgramSlug: "british-airways-avios",
    title: "Qatar Qsuites to Doha with Avios",
    category: "flight",
    origin: "New York (JFK)",
    destination: "Doha (DOH)",
    cabin: "business",
    pointsMin: 70000,
    pointsMax: null,
    taxesFeesCents: 23500,
    cashFareCents: 700000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "Qsuites — a private-door business suite regularly ranked the world's best J.\nAvios are interchangeable: move them to Qatar Privilege Club for cheaper rates if desired.\nFind space on qatarairways.com, book with Avios; transfer 1:1 from Chase, Amex, Capital One, or Bilt.",
    methodologyNote:
      "Cash fare benchmarked as a discounted one-way retail business fare.",
    sourceNote:
      "Verified 2026-09-01 — 70K one-way in both Avios wallets; BA adds ~$235 in fees vs ~$60 via the Qatar wallet.",
    verifiedAt: "2026-09-01",
    imageSlug: "doha",
    featured: false,
    notes: null,
  },
  {
    slug: "lifemiles-star-business-europe",
    partnerProgramSlug: "avianca-lifemiles",
    title: "Lufthansa or SWISS business to Europe via LifeMiles — no surcharges",
    category: "flight",
    origin: "New York (JFK)",
    destination: "Frankfurt (FRA)",
    cabin: "business",
    pointsMin: 70000,
    pointsMax: 80000,
    taxesFeesCents: 5000,
    cashFareCents: 350000,
    availabilityRating: "plan_ahead",
    bookingHint:
      "LifeMiles adds no fuel surcharges on Star Alliance partners — taxes stay under ~$60.\nBook on lifemiles.com; the search shows most Star partners.\nTransfer 1:1 from Amex, Citi, or Capital One.",
    methodologyNote:
      "Cash fare benchmarked as a discounted one-way retail business fare.",
    sourceNote:
      "Verified 2026-09-01 — 2026 NA–Europe business runs 70–80K (East Coast 80K); zero-surcharge policy confirmed.",
    verifiedAt: "2026-09-01",
    imageSlug: "frankfurt",
    featured: false,
    notes: null,
  },
  {
    slug: "delta-one-amsterdam",
    partnerProgramSlug: "delta-skymiles",
    title: "Delta One to Amsterdam (dynamic pricing)",
    category: "flight",
    origin: "New York (JFK)",
    destination: "Amsterdam (AMS)",
    cabin: "business",
    pointsMin: 100000,
    pointsMax: 220000,
    taxesFeesCents: 6000,
    cashFareCents: 380000,
    availabilityRating: "wide_open",
    bookingHint:
      "Delta always has award seats — at a price. Watch for SkyMiles flash sales near 100K.\nBook on delta.com; no surcharges from the US and free changes.\nTransfer 1:1 from Amex MR only.",
    methodologyNote:
      "Cash fare benchmarked as a discounted one-way retail business fare; dynamic award range reflects observed lows/highs, not a chart.",
    sourceNote:
      "Verified 2026-09-01 — the 100–220K observed dynamic range is honest; no published chart exists.",
    verifiedAt: "2026-09-01",
    imageSlug: "amsterdam",
    featured: false,
    notes: "Included honestly: SkyMiles is often the weakest transfer value — the delta view should show that.",
  },
] satisfies RedemptionSeed[];
