# Feature Research

**Domain:** Credit-card points & miles redemption visualizer (award-travel tools)
**Researched:** 2026-08-31
**Confidence:** HIGH for competitor feature sets (verified via current reviews/announcements); MEDIUM for user-expectation weighting (inferred from tool positioning and community commentary, not primary user research)

## Competitive Landscape Snapshot

The market splits into four tool categories, and Milesworth sits in a gap between them:

1. **Valuation references** (TPG monthly valuations, AwardWallet valuations) — static cents-per-point tables updated monthly, with published methodology. No personalization; you look up "Amex MR = 2.0cpp" yourself.
2. **Award search engines** (point.me $12/mo, Seats.aero, PointsYeah, Roame) — real-time award availability for a route you already chose. Powerful but require the user to know where they want to go, and the best ones are paid.
3. **Card/balance trackers** (Travel Freely, AwardWallet, MaxRewards, CardPointers) — track cards, bonuses, annual fees, 5/24 status; balance tracking via manual entry or account sync.
4. **Discovery/inspiration tools** (Roame SkyView, point.me Explore, Daily Drop deal alerts) — "where can I go?" maps and deal feeds; the newest, fastest-growing category.

**The gap Milesworth fills:** none of these takes "here are my balances across 8 programs" as the *input* and answers "here is the most jaw-dropping thing those specific points buy, with the cash-value receipt." Hilton's Points Explorer does a single-program version of this; point.me Explore does destination discovery but is search-driven and paywalled. The multi-program, balance-first, wow-delta-ranked framing is genuinely underserved — that is the differentiator to protect.

## Feature Landscape

### Table Stakes (Users Expect These)

Missing these makes the product feel broken or untrustworthy for its category. Note: table stakes for a *visualizer* are different from table stakes for a *search engine* — Milesworth does not need live availability, but it absolutely needs credible numbers.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Multi-program balance entry (the 8 programs) | The entire premise; every tracker (Travel Freely, AwardWallet) has balance entry. Must be fast — no account creation, no bank linking | LOW | Simple form + local state/localStorage. Number inputs with sensible formatting (90,000 not 90000). Already decided |
| Cents-per-point valuation on every result | TPG normalized cpp as *the* metric; point.me now shows Good/Great value labels. A points tool without cpp reads as amateur | LOW | Computed from curated data: (cash fare − taxes/fees) ÷ points × 100. Formula must match TPG convention or the finance credibility pitch breaks |
| Transparent valuation methodology | TPG publishes methodology monthly; it's why they're citable. "Where did $4,500 come from?" is the first skeptical question — from beginners AND recruiters | LOW | One static page/modal: how cash fares were sourced, when, taxes-and-fees treatment, "award prices are dynamic" disclaimer. Cheap insurance for the finance-credibility positioning |
| Transfer-partner mapping with ratios | Any tool touching Chase UR/Amex MR must know UR→Hyatt 1:1, MR→ANA 1:1 etc. point.me shows transfer paths in results; this is core domain literacy | MEDIUM | Static data in the redemption DB (already decided). The mapping itself is table stakes; keeping it *current* is the real cost — rates and partners change a few times a year |
| "How to book" guidance per redemption | point.me's core paid value is step-by-step booking instructions. A visualizer that shows a dream and gives zero path to it feels like a brochure | LOW-MEDIUM | 2–4 line static text per DB entry: "Transfer MR→ANA (instant), search on ANA site, book round-trip only." Written once during curation, not generated |
| Works instantly, no login wall | Free tools (Travel Freely, AwardHacker) set the expectation; paid tools' paywalls are their #1 complaint. Also decided: LinkedIn demo requires zero friction | LOW | Already decided. Guest-first with optional Clerk save |
| Mobile-responsive UI | Points people live on phones (Travel Freely and AwardWallet are app-first). LinkedIn traffic is majority mobile | MEDIUM | No native app needed; the responsive web bar is high because "production quality" is part of the pitch |
| Honest data freshness signaling | Award pricing is dynamic post-award-chart era; every credible tool caveats this. A "Last verified: Aug 2026" stamp separates curation from staleness | LOW | `verified_date` field per DB entry, rendered subtly. Protects against the #1 credibility attack on curated databases |
| Privacy policy + data deletion | Legally required once Clerk saves emails/balances; already an Active requirement | LOW | Static page + Clerk user deletion. Boring, mandatory |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Balance-first ranked "wow" feed | The core inversion: every competitor asks "where do you want to go?"; Milesworth asks "what do you have?" and answers with the best thing it buys. No mainstream tool does this across programs | MEDIUM | The product. Ranking = wow delta (cash value − cash-out value) filtered to affordable-now. Depends entirely on DB quality |
| Dual valuation side-by-side (cash fare vs cpp, with delta) | point.me added value labels only in 2026 and shows them per-search; leading with the *delta in dollars* ("worth $4,500, you were about to take $900") is more visceral than a cpp number alone. Fits the finance-author brand | LOW-MEDIUM | Already decided. Presentation is the work: big numbers, the delta as the hero stat. This is where the editorial design earns its keep |
| "Almost there" section | Turns a dead-end ("you can't afford this") into aspiration and a return visit ("18K more MR unlocks Lufthansa First"). No competitor frames near-miss redemptions as a product surface; closest analog is Travel Freely's goal tracking, which is manual | MEDIUM | Already decided. Needs a threshold rule (e.g., within 25–30% of required points) and a "you're X points away" callout. Also the natural hook for the v2 advisor tease: "a card bonus would cover this" |
| Curated sweet-spot database with expert voice | AwardHacker died because it was a stale exhaustive table; blogs publish sweet-spot listicles that aren't interactive. A curated, opinionated 80–120-entry DB with an active churner's picks is a moat competitors' aggregation can't fake | HIGH (effort, not tech) | The single largest v1 work item and the v2 advisor's knowledge base. Schema decisions here cascade everywhere — get program/partner/ratio/pricing/verified-date fields right early |
| Combined-currency awareness (which balance to use) | A user with UR *and* MR both transferable to the same partner should see the cheapest path. Even point.me only recently surfaced transfer-bonus-adjusted pricing | MEDIUM | V1 can do the simple version: show each redemption reachable from *any* held program, tagged with which balance it uses. Pooling multiple currencies toward one award is a v1.x refinement, not v1 |
| Transfer-bonus field (manual) | point.me lists live transfer bonuses as a headline 2026 feature. Even a manually maintained banner ("MR→Virgin +30% through 9/15") shows domain currency | LOW | Already decided (manual entry). Bonus-adjusted cpp math is a nice touch if cheap; otherwise just display the bonus |
| Editorial travel aesthetic with destination imagery | Every competitor is a data-dense SaaS dashboard. A Condé-Nast-like reveal ("your points → Tokyo, in pictures and big numbers") differentiates on emotion — and it's the screenshot that travels on LinkedIn | MEDIUM | Already decided as design direction. Imagery licensing/sourcing needs a plan (Unsplash-class is fine for v1) |
| Shareable result card | The wow moment wants to be shared; none of the incumbents produce a share artifact. Doubles as organic distribution and the LinkedIn demo asset | MEDIUM | Cut-line candidate: v1 can ship with a good OG image + clean URL; a per-result generated share image is v1.x |
| Bookmarked redemptions (with save) | Gives the optional Clerk account a reason to exist beyond storing balances | LOW | Already decided. Simple join table |

### Anti-Features (Deliberately Do Not Build for v1)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Live award availability search | It's what point.me/Seats.aero/Roame do; users may expect "can I book this tonight?" | Requires scraping/API deals with airlines, constant breakage (even Seats.aero runs a partner-outage status page), and it's a full-time engineering product. Guaranteed to miss the 2–4 week window and dilute the curation premise | Curated entries + "last verified" dates + booking guidance linking users to the airline's own search. Already Out of Scope — hold the line |
| Account aggregation / balance auto-sync | AwardWallet's signature feature; removes manual entry friction | Credential handling, scraping fragility (loyalty programs actively block AwardWallet), security/liability blast radius, weeks of work. Travel Freely built a beloved product *specifically* by refusing to touch credentials | Manual entry of 8 numbers takes 30 seconds; frame it as privacy-respecting ("we never ask for your logins") — competitors' users cite this as a feature |
| Card recommendation engine / eligibility rules (5/24 etc.) | Travel Freely's CardGenie, CardPointers do this; adjacent and monetizable (affiliate) | It's the v2 advisor by another name — 2–3x scope, plus affiliate-content credibility taint that undercuts the "defensible numbers" brand | The decided "coming soon" tease. Capture email interest for v2 |
| Full program coverage (30+ airline/hotel programs) | Completeness instinct; AwardHacker covered 50+ | AwardHacker is the cautionary tale: exhaustive + stale = dead. Every added program multiplies curation and maintenance load; the 8 chosen programs cover the actual beginner audience | 8 programs, done credibly. A "request a program" signal collector if desired (one text field) |
| Auto-updating valuations / fare-price feeds | "Cash fares change daily, shouldn't the $4,500 update?" | Fare APIs (Amadeus, Skyscanner) add cost, keys, rate limits, and reconciliation work; a *representative* fare with a verified date is defensible, a live-but-wrong one is not | Manual quarterly-ish refresh of the curated fares; methodology page explains representative pricing |
| Travel-goal-personalized ranking | Goals are already being captured; "rank my results by my goals" is the obvious next ask | Personalization logic on top of an unvalidated ranking algorithm = tuning two unknowns at once. Also decided Out of Scope | Store goals in v1 (decided), use them in v2 ranking |
| Points-earning tracker (bonuses, annual fees, spend deadlines) | Travel Freely's whole product; users conflate "points tool" categories | Different job-to-be-done (managing cards vs. dreaming about redemptions); a second product's worth of CRUD and notifications | Stay redemption-side. The v2 advisor tease covers the earn-side ambition |
| Native mobile app | App-first competitors; "points people live on phones" | 2–4 week timeline; responsive web reaches LinkedIn viewers with zero install friction | Polished responsive web. PWA manifest if trivially cheap |
| User-submitted redemptions / community content | Scales the DB for free in theory | Moderation, data-quality erosion of the curation premise, and the expert voice *is* the product | Nick curates. Maybe a "suggest a redemption" mailto link |
| Real-time transfer-bonus ingestion | point.me does it; bonuses churn monthly | Scraping/feed maintenance for a field that changes ~monthly and that Nick already tracks as a hobbyist | Manual entry field (already decided) |

## Feature Dependencies

```
Curated redemption DB (schema: program, partner, ratio, points, cash fare, taxes, verified_date, booking notes)
    └──required by──> Dual valuation display (cpp + cash + delta)
    └──required by──> Ranked "wow" feed (bookable-now)
    └──required by──> "Almost there" section
    └──required by──> Transfer-partner mapping display
    └──required by──> How-to-book guidance
    └──feeds (v2)──> AI card advisor knowledge base

Balance entry (8 programs)
    └──required by──> Ranked "wow" feed
    └──required by──> "Almost there" section
    └──required by──> Combined-currency awareness

Methodology page ──credibility-gates──> Dual valuation display
    (shipping big dollar claims without it invites the credibility attack)

Clerk optional save
    └──required by──> Bookmarks
    └──required by──> Stored travel goals
    └──required by──> Privacy policy / deletion (legal trigger)
    └──NOT required by──> anything in the core flow (guest-first, decided)

Transfer-bonus manual field ──enhances──> Dual valuation (bonus-adjusted cpp)
"Almost there" ──sets up──> v2 advisor tease ("a signup bonus covers this gap")
Shareable result card ──depends on──> Ranked feed + editorial design being screenshot-worthy

Live award search ──conflicts──> Curated DB premise (dynamic truth vs. curated representative truth)
Auto-sync balances ──conflicts──> No-login instant flow
```

### Dependency Notes

- **Everything hangs off the DB schema.** Ranking, dual valuation, "almost there," transfer mapping, and the v2 knowledge base all read the same entries. Schema design should be an early, deliberate step — adding `verified_date`, `taxes_fees`, and `booking_notes` later is painful; adding them now is free.
- **Methodology gates the wow claim.** The dual-valuation hero number is also the most attackable surface; the methodology page must ship in v1, not v1.x.
- **Clerk is fully detachable.** Nothing in the core demo path depends on auth — this is correct and should be preserved in the build order (core flow first, save layer last).
- **"Almost there" is the cheapest bridge to v2.** It naturally motivates the advisor tease without building any advisor logic.

## MVP Definition

### Launch With (v1)

- [ ] Balance entry for 8 programs, guest-first, persisted in localStorage — the input to everything
- [ ] Curated DB, 80–120 entries with ratios, points, representative cash fares, taxes/fees, verified dates, booking notes — the product's substance
- [ ] Ranked feed: bookable-now by wow delta, then "almost there" with points-away callouts — the wow moment
- [ ] Dual valuation per result: cash fare + cpp + dollar delta, TPG-consistent math — the credibility moment
- [ ] Transfer path shown per result ("via Chase UR → Hyatt 1:1") — domain literacy
- [ ] How-to-book static guidance per entry — closes the loop from dream to action
- [ ] Methodology page + per-entry verified dates — defends the numbers
- [ ] Manual transfer-bonus field surfaced in results — domain currency signal
- [ ] Optional Clerk save (balances, goals stored, bookmarks) + privacy policy/deletion — decided scope
- [ ] v2 advisor "coming soon" tease — decided scope
- [ ] Editorial responsive design, deployed on Vercel — the portfolio bar

### Add After Validation (v1.x)

- [ ] Per-result shareable image cards — trigger: organic sharing observed or LinkedIn post planned; ship good OG tags in v1 regardless
- [ ] Combined-currency pooling (UR+MR toward one award) — trigger: users with multiple transferable balances report confusion
- [ ] Bonus-adjusted cpp math (auto-apply active transfer bonus to valuation) — trigger: a juicy bonus is live at launch time
- [ ] "Request a program" signal collection — trigger: repeated asks for AA/United/Alaska/etc.
- [ ] DB refresh workflow/admin affordance for Nick — trigger: first quarterly re-verification pass feels painful in raw SQL/seed files

### Future Consideration (v2+)

- [ ] AI card-roadmap advisor — decided v2 milestone; DB is the knowledge base
- [ ] Goal-personalized ranking — after ranking algorithm is validated on real users
- [ ] Automated transfer-bonus ingestion — after manual cadence proves annoying
- [ ] Card eligibility rules (5/24, 48-month, lifetime language) — part of the advisor
- [ ] Any live-availability integration — only if the product pivots from visualizer to booking assistant, which would be a different product

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Curated redemption DB | HIGH | HIGH (effort) | P1 |
| Balance entry + ranked wow feed | HIGH | MEDIUM | P1 |
| Dual valuation + delta display | HIGH | LOW | P1 |
| "Almost there" section | HIGH | MEDIUM | P1 |
| Methodology page + verified dates | MEDIUM (HIGH for credibility) | LOW | P1 |
| Transfer path + booking guidance | MEDIUM | LOW | P1 |
| Editorial design + responsive polish | HIGH (for both audiences) | MEDIUM | P1 |
| Clerk save + bookmarks + legal pages | MEDIUM | MEDIUM | P1 (late in build order) |
| Transfer-bonus manual field | MEDIUM | LOW | P1 |
| v2 tease | LOW (strategic) | LOW | P1 |
| Shareable result cards | MEDIUM | MEDIUM | P2 |
| Combined-currency pooling | MEDIUM | MEDIUM | P2 |
| Bonus-adjusted cpp | LOW | LOW | P2 |
| Admin/refresh tooling | LOW (user), HIGH (maintainer) | MEDIUM | P2 |
| Goal-personalized ranking | MEDIUM | HIGH | P3 |
| AI advisor | HIGH | HIGH | P3 (v2) |

## Competitor Feature Analysis

| Feature | point.me | Seats.aero / Roame | TPG valuations | Travel Freely / AwardWallet | Our Approach |
|---------|----------|--------------------|----------------|------------------------------|--------------|
| Input model | Route + dates (search) | Route or map (search/discovery) | None (static tables) | Cards/accounts (tracking) | **Balances → ranked output** (unique) |
| Valuation | Good/Great labels; 3-way price comparison (2026) | Points price only | Monthly cpp per program, published methodology | AwardWallet has its own valuations | Dual valuation with **dollar delta as hero**, TPG-consistent math, per-entry verified dates |
| Availability | Real-time, 150+ airlines | Real-time cached | N/A | N/A | **None — curated representative pricing** with honest freshness labels |
| Transfer bonuses | Live, auto-surfaced in results | Partial | Mentioned editorially | N/A | Manual field, surfaced in results |
| Pricing | $12/mo–$260/yr | Free tier + Pro | Free (ad/affiliate) | Free / freemium | **Free, no login wall** |
| Discovery/inspiration | Explore map (2026) | SkyView map / deal feeds | Sweet-spot listicles | N/A | Wow-ranked feed + "almost there" aspiration |
| Booking help | Step-by-step (core paid value) | Links out | Editorial | N/A | Short static booking notes per entry |
| Account sync | N/A | N/A | N/A | AwardWallet auto-sync; Travel Freely deliberately manual | **Deliberately manual** (Travel Freely's playbook: privacy as a feature) |

**Positioning takeaway:** Milesworth is not competing with award search engines and should never frame itself as one — it competes with *ignorance* (the 1¢ cash-out) the way TPG valuations do, but personalized and interactive the way trackers are. The honest pitch: "point.me tells you how to book the trip you chose; Milesworth shows you the trip you didn't know you could afford."

## Sources

- point.me 2026 feature launches (Explore map, value labels, transfer bonuses, 3-way price comparison, pricing tiers): [NerdWallet point.me guide](https://www.nerdwallet.com/travel/learn/point-me-guide), [Upgraded Points — point.me new features 2026](https://upgradedpoints.com/news/point-me-new-features-2026/), [PR Newswire — point.me Explore launch](https://www.prnewswire.com/news-releases/pointme-launches-explore-a-new-map-based-discovery-tool-for-award-flights-302827571.html), [TPG on point.me features](https://thepointsguy.com/news/point-me-new-features/)
- Award search tool landscape and AwardHacker decline: [Thrifty Traveler — 10 best award search tools](https://thriftytraveler.com/guides/points/award-search-tools/), [Frequent Miler — which award search tool is best](https://frequentmiler.com/which-award-search-tool-is-best/), [Nurse Michael Travels — the truth about award search tools](https://nursemichaeltravels.com/award-search-tools-problems/), [PointsHacking — best award flight search tools 2026](https://pointshacking.com/blog/best-award-flight-search-tools-2026)
- TPG valuation methodology (cpp formula, trimmed average/median, monthly cadence): [TPG monthly valuations](https://thepointsguy.com/loyalty-programs/monthly-valuations/), [TPG valuations methodology](https://thepointsguy.com/loyalty-programs/points-miles-valuations-methodology/), [TPG — points or cash](https://thepointsguy.com/loyalty-programs/calculate-redemption-values/)
- Travel Freely feature set (free, no-credential tracking, CardGenie, 5/24): [Thrifty Traveler — Travel Freely review](https://thriftytraveler.com/guides/travel-freely-review/), [ChooseFI — Travel Freely review](https://choosefi.com/travel-freely-review-unleashing-the-power-of-travel-rewards), [Frequent Miler — Travel Freely](https://frequentmiler.com/take-the-stress-out-of-credit-card-bonus-hunting-travel-freely/)
- Balance-filtered redemption exploration precedent (Hilton Points Explorer) and tool roundups: [Upgraded Points — best points and miles tools](https://upgradedpoints.com/news/points-and-miles-tools-expert-recommendations/), [NerdWallet — Hilton points guide](https://www.nerdwallet.com/travel/learn/the-complete-guide-to-using-hilton-honors-points), [AwardWallet — sweet spots roundup](https://awardwallet.com/travel/award-program-sweet-spots/)
- Project context: `C:\Users\geoca\milesworth\.planning\PROJECT.md`

---
*Feature research for: points & miles redemption visualizer (Milesworth)*
*Researched: 2026-08-31*
