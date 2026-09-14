# Pitfalls Research

**Domain:** Credit-card points & miles redemption visualizer (curated valuation database + dual-valuation display)
**Researched:** 2026-08-31
**Confidence:** HIGH (owner has active churner domain expertise; volatile facts verified against 2026 sources)

## Critical Pitfalls

### Pitfall 1: Stale valuation data silently destroys the app's one asset — credibility

**What goes wrong:**
The app ships with a redemption ("90K MR → ANA business to Tokyo via Virgin Atlantic, ~$4,500 value") that was true when researched but has since been devalued. A points-savvy LinkedIn viewer — exactly the kind of person Nick's network contains — spots it in 30 seconds and the "finance-background, defensible numbers" pitch inverts into "this person ships wrong financial data." 2026 alone has seen: Marriott raising award prices 5–10% portfolio-wide, Hyatt's worst-ever devaluation blurring its published chart, Aeroplan raising ~85% of pricing bands on June 1 (premium-cabin partner awards up 20–67%), and Bilt relaunching its entire card portfolio under Cardless in February. Any single entry researched more than ~6 months ago has meaningful odds of being wrong.

**Why it happens:**
Loyalty programs devalue without notice (Delta, Marriott dynamic pricing) or with short notice (Aeroplan). A curated DB of 80–120 entries drafted in one research sprint has no mechanism to notice the world changed. Claude-drafted entries compound this: LLM training data lags devaluations by months, so first drafts will contain pre-devaluation numbers stated confidently.

**How to avoid:**
1. Every DB entry carries `last_verified_date` and `source_note` fields from day one — non-negotiable schema requirement.
2. Nick's correction pass is a *verification gate*, not a copyedit: each entry gets checked against the live program (or a current 2026 source) before ship, and the date is stamped.
3. Display "Verified [Month Year]" on every redemption card. This converts staleness from a hidden landmine into a transparency feature — a finance-credible move (analysts date their marks).
4. Frame all award pricing as ranges ("typically 60K–75K one-way") not points ("60K"), since dynamic pricing makes single numbers wrong on arrival.
5. Add a footer methodology page: how cpp is computed, what "retail fare" means, when data was last reviewed. Cheap to build, disproportionate credibility payoff.

**Warning signs:**
- Schema draft has no `last_verified_date` column.
- Claude-drafted entries cite pre-2026 award charts (Aeroplan pre-June-2026 numbers, pre-devaluation Hyatt categories, Marriott off-peak/peak charts that no longer bind).
- Any entry says a specific single points price for a dynamically priced program (Delta, United, Marriott, Hilton).

**Phase to address:**
Data model phase (schema fields) + database build phase (verification gate) + UI phase (verified-date display).

---

### Pitfall 2: Transfer-ratio math modeled as a simple multiplier

**What goes wrong:**
The naive model is `partner_points = balance × ratio`. Real programs break this in ways that produce visibly wrong numbers:
- **Marriott → airlines:** 3:1 *plus* 5,000 bonus miles per 60,000 points transferred. 120K Bonvoy → 50K miles, not 40K. A pure ratio understates by 25% — and the bonus is step-wise, not linear (59K Bonvoy → ~19.6K miles, no bonus).
- **Amex MR → Hilton:** 1:2 (points double). Modeling all ratios as ≤1 silently halves Hilton redemptions.
- **Bilt → Accor:** 3:2; **Bilt → I Prefer:** 1:2 (added 2026). Even "the 1:1 program" has exceptions.
- **Transfer increments:** most programs transfer in blocks of 1,000 (Marriott in 3,000s for clean airline math); "you need 47,350 more points" outputs look amateur.
- **Transfer bonuses:** the manual bonus field must compose correctly with the base ratio (e.g., 30% bonus on MR→Virgin is 1:1.3, but a 30% bonus on MR→Hilton is 1:2.6).

**Why it happens:**
The simple multiplier covers ~80% of pairs, so it survives early testing; the failures are exactly the entries an expert audience checks first (Marriott's 60K bonus is famous).

**How to avoid:**
Model each transfer route as `{from, to, numerator, denominator, bonus_rule?, increment, notes}` where `bonus_rule` supports step functions (per-60K bonus). Write unit tests for the known edge cases before building UI: Marriott 60K/120K/59K, MR→Hilton 1:2, Bilt→Accor 3:2, a 30% promo bonus stacked on a non-1:1 ratio. This is a half-day of work that prevents the most checkable class of error in the app.

**Warning signs:**
- Transfer ratio stored as a single float.
- No test asserting 120K Bonvoy → 50K airline miles.
- Bonus field implemented as a percentage applied uniformly without route-specific composition tests.

**Phase to address:**
Data model / valuation-engine phase — before any UI consumes the numbers.

---

### Pitfall 3: Overpromising availability — "bookable now" for awards that essentially never exist

**What goes wrong:**
The hybrid ranking's "bookable-now" section implies a user can go book the ANA first-class award today. Premium-cabin saver space is scarce, often released at odd windows (ANA F via Virgin: famously near-impossible since 2023 changes), and 2026's trend is programs locking inventory to their own members. A user (or worse, a savvy recruiter) clicks through to the airline, finds nothing for months, and concludes the app oversells. "Bookable" is a claim the app cannot verify without live award search — which is explicitly out of scope.

**Why it happens:**
"Bookable now" is the natural label for the wow section, and curation can't observe live inventory. The gap between "this redemption exists as a sweet spot" and "seats exist on your dates" is invisible in a static DB.

**How to avoid:**
1. Never use the word "bookable." Use honest tiers stored per entry: `availability_rating` (e.g., "wide open" / "plan ahead" / "hard to find — flexibility required"), set by Nick from churner experience.
2. Rank the wow section by delta × attainability, and show the availability tag on the card.
3. Add one line of expectation-setting copy: "Award space varies — these are the redemptions worth hunting."
4. Frame CTAs as "how to search for this" (link to the program's award search) rather than "book this."
This actually *strengthens* the finance-credibility pitch: honest risk disclosure is what an analyst does.

**Warning signs:**
- Copy drafts containing "bookable," "available now," or "guaranteed."
- Schema has no availability/difficulty field.
- ANA F, Lufthansa F, or similar unicorns ranked at the top of "achievable now" without a difficulty caveat.

**Phase to address:**
Data model phase (availability field) + ranking/UI phase (copy and tiering).

---

### Pitfall 4: The cents-per-point methodology is attackable — dual valuation done sloppily backfires

**What goes wrong:**
The side-by-side "cash fare vs. cpp" display is the app's credibility centerpiece, and it's also where points Twitter loves to fight. Using the retail first-class fare ($18,000 LAX-NRT) as the numerator produces a 20+ cpp figure that experts consider dishonest — nobody pays that fare, so the "value" is inflated. Conversely, cash-out baselines vary by program (Chase 1.0–1.5¢ via portal/pay-yourself-back mechanics, Amex 0.6¢ statement credit vs 1.0¢ Schwab, Capital One 0.5¢ cash-out vs 1.0¢ travel eraser) — using one flat 1¢ baseline misstates the delta the whole app is built on.

**Why it happens:**
Retail fares make the wow number bigger, and flat baselines are simpler. Both shortcuts are invisible to beginners but glaring to the secondary audience (experts who follow Nick, savvy recruiters who google "how points valuations work").

**How to avoid:**
1. Pick a defensible numerator convention and state it: e.g., "we use a reasonable paid-fare estimate (discounted business, not full-fare F)" or show both ("retail fare $18,000; a realistic cash alternative ~$6,500"). Nick's finance background should make this call explicitly — it's a methodology decision, not a display detail.
2. Store per-program cash-out baseline in the DB (it differs per program) and compute delta against that, not a global 1¢.
3. Put the methodology note one click away from every number, as the requirements already demand — and have Nick sign off on its wording as if it were going in a research report.

**Warning signs:**
- A single hardcoded `CASH_OUT_RATE = 0.01` constant.
- Wow deltas above ~15 cpp appearing routinely (signal the numerator is retail-F inflated).
- Methodology note written last, as filler.

**Phase to address:**
Valuation-engine phase (baselines per program, numerator convention decided before DB entries are drafted, since entries encode the convention).

---

### Pitfall 5: Curated-database build becomes the schedule sink (and the maintenance cliff after launch)

**What goes wrong:**
80–120 hand-verified entries × (draft + Nick verifies against live 2026 pricing + corrections) is realistically 15–40 hours of domain work — easily half the 2–4 week budget — and it's on the critical path for everything (ranking, UI, wow moment all need real data). Teams discover this in week 3, then either ship thin data (app feels empty, few matches per user) or ship unverified data (Pitfall 1). Post-launch, the DB silently rots unless maintenance is designed in.

**Why it happens:**
"Curate a database" sounds like a content task, not an engineering task, so it gets no schedule line. Verification is the expensive part and it can't be parallelized away from Nick — he's the single verifier.

**How to avoid:**
1. Treat DB entries as the project's true backlog: define the entry schema in week 1, build a seed of 25–30 *fully verified* entries covering all 8 programs early, and grow toward 80–120 in batches. The app must be demo-complete at 30 entries.
2. Prioritize entries by coverage: every program × balance-band (50K/100K/200K) must yield at least 2–3 matches before adding depth anywhere.
3. Make entry editing frictionless for Nick (even a seed JSON/CSV he edits directly beats an admin UI that eats build time — defer the admin panel).
4. Schedule a standing 30-min monthly "mark review" post-launch and put `last_verified_date` sort in whatever editing surface exists, so the stalest entries surface first.

**Warning signs:**
- Week 1 ends with schema done but zero verified entries.
- Ranking/UI development blocked waiting on data, or being built against fake data that doesn't stress real shapes (Hilton's huge numbers, Marriott's bonus math).
- Plan contains an admin CRUD UI for v1.

**Phase to address:**
Roadmap structure itself: database build must start in phase 1–2 and run parallel to UI, with an explicit "30 verified entries" gate before ranking work.

---

### Pitfall 6: The demo breaks exactly when it matters — LinkedIn share spike on mobile

**What goes wrong:**
The launch post goes up; 70%+ of LinkedIn traffic opens the link on a phone, inside LinkedIn's in-app WebView. The editorial design with large destination imagery was built and tested on a desktop viewport: images blow the mobile layout, big-number typography wraps badly, the balance-entry form (8 numeric inputs) is miserable on a phone keyboard, LCP is 6 seconds on cell connections because hero images are unoptimized, and the OG card shows a default Vercel preview. The single highest-value viewing session — a recruiter tapping the link — is the worst experience the app delivers.

**Why it happens:**
Development happens on desktop; the "audience" in the builder's head is a user at a computer. LinkedIn's WebView and OG scraping are only testable deliberately, so they go untested.

**How to avoid:**
1. Mobile-first is a hard constraint for the balance-entry flow and redemption cards — design them at 390px first.
2. Numeric inputs: `inputmode="numeric"`, sensible defaults/steppers, don't require all 8 programs (blank = 0 must work).
3. Use `next/image` with proper sizing for all destination imagery; budget LCP < 2.5s on Fast 3G before launch.
4. Pre-launch checklist: test in actual LinkedIn mobile in-app browser (post link in a private message to yourself), validate OG image/title/description with a preview tool, run Lighthouse mobile.
5. Neon/Vercel: verify cold-start behavior and DB connection handling under a burst (the share spike is tens of concurrent users, not thousands — serverless handles it *if* connections are pooled; use Neon's pooled connection string).

**Warning signs:**
- No mobile viewport testing by mid-project.
- Hero images committed as multi-MB originals.
- No OG meta tags in the layout by polish phase.

**Phase to address:**
UI phase (mobile-first mandate) + dedicated pre-launch hardening phase (WebView/OG/Lighthouse checklist as exit criteria).

---

### Pitfall 7: Scope creep toward the v2 AI advisor (and other gravity wells)

**What goes wrong:**
The advisor is the *interesting* problem, so it pulls work forward disguised as v1 tasks: "let's make travel goals affect ranking a little," "the teaser could do one real recommendation," "the DB schema should support eligibility rules." Each seems small; together they push the LinkedIn launch past the window where the job search needs it. Live award search is the second gravity well ("just check availability for the top 5 routes...").

**Why it happens:**
The v1 (a form + a ranked list from static data) feels "too simple" for a portfolio piece, creating pressure to add intelligence. The deadline is self-imposed, so it bends.

**How to avoid:**
1. The Out of Scope list in PROJECT.md is already excellent — enforce it at phase planning: any task touching LLMs, goals-based ranking, card eligibility, or live availability gets rejected by default.
2. The teaser is a static marketing section (copy + email capture at most). Timebox it to hours.
3. Channel the "too simple" anxiety into the places that ARE v1 differentiators: data quality, methodology transparency, editorial design polish. A recruiter is more impressed by a flawless simple app than a janky clever one.
4. One forward-compatibility concession is legitimate and cheap: store travel goals and keep the redemption schema extensible (tags/JSON notes column) — storage, not behavior.

**Warning signs:**
- Any v1 task description containing "AI," "recommend," "eligibility," or "availability check."
- Ranking logic gaining inputs beyond balances + curated data.
- Week 2 without a deployed end-to-end slice.

**Phase to address:**
Every phase-planning session; enforce via the Out of Scope list. Deploy a walking skeleton in phase 1 so "deployed and shrinking the gap" is the default state.

---

### Pitfall 8: User-data legal handling treated as a footer link instead of a feature

**What goes wrong:**
Points balances + travel goals + email are financial-adjacent PII. Shipping with a boilerplate privacy policy that doesn't match actual behavior (what's stored, where — Neon, Clerk, Vercel logs — and for how long) is worse than none: it's a documented misrepresentation, a bad look for someone applying to credit/financial analyst roles. Deletion rights promised in requirements but implemented as "email me" with no actual Clerk + Postgres deletion path is the common gap. Balances logged in plaintext to Vercel logs or analytics events is the common leak.

**Why it happens:**
Legal pages are last-day tasks; deletion is annoying to build because it spans Clerk (identity) and the app DB (balances/goals/bookmarks), and nobody tests it.

**How to avoid:**
1. Data inventory first (30 minutes): list every field stored, which system holds it, why. Write the privacy policy from that inventory — it stays short and true.
2. Deletion = one server action: delete app-DB rows keyed to the Clerk user, then call Clerk's user-deletion API (or use Clerk's webhook on user deletion to cascade). Build it the same phase as save-balances, not later — it's ~an hour when the schema is fresh.
3. Anonymous users' balances live in localStorage/URL state only — never persist server-side without sign-up. This keeps the no-login flow genuinely data-free and simplifies the policy.
4. Keep balances out of logs and analytics payloads; if using analytics, track events not values.
5. Consent = clear notice at the save prompt ("we store your email, balances, goals — delete anytime in settings"), not a cookie-banner cargo cult.

**Warning signs:**
- Privacy policy drafted before the data inventory exists, or copied from a template mentioning data the app doesn't collect.
- No `DELETE` account path in the auth phase's task list.
- `console.log(balances)` or balances in analytics events.

**Phase to address:**
Auth/persistence phase (deletion + consent built with save feature); polish phase (policy page from real inventory).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Transfer ratio as single float | Simpler schema | Marriott/Hilton/Accor math wrong; expert-visible errors | Never — edge cases are the checkable core |
| Single points price instead of range for dynamic programs | Cleaner cards | Numbers wrong on arrival; credibility hit | Never for Delta/United/Marriott/Hilton; OK for fixed-chart programs (Hyatt-ish, with date stamp) |
| Seed data via JSON/CSV Nick edits, no admin UI | Saves 3–5 days | Slightly clunky updates | Acceptable for v1 — the right call |
| Flat 1¢ cash-out baseline for all programs | One constant | Delta (the wow number) misstated per program | Never — per-program baseline is ~10 rows of data |
| Skipping availability field, ranking on delta alone | Faster ranking | "Bookable" overpromise; unicorn awards at top | Never — one enum column prevents it |
| Boilerplate privacy policy | Ships fast | Misrepresents actual data handling; professional-reputation risk | Only if edited against a real data inventory |
| Desktop-first build, "make responsive later" | Momentum | Mobile rework in crunch week; broken LinkedIn debut | Never for this distribution channel |
| Hardcoded transfer bonuses in code instead of DB field | Quicker | Nick can't update bonuses without a deploy | Acceptable for launch week only; move to DB field per requirements |
| No `last_verified_date` on entries | One less field | No way to find rot; staleness invisible | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Clerk | Login wall creeping in (middleware protecting the core flow) | Public-by-default middleware; Clerk only wraps save/bookmark actions; test core flow logged-out in incognito |
| Clerk | Deleting app data but orphaning Clerk user (or vice versa) | Single deletion action spanning both, or Clerk `user.deleted` webhook cascading to Postgres |
| Neon/Vercel Postgres | Direct (unpooled) connection string in serverless functions → connection exhaustion under share-spike | Use pooled connection string / Neon serverless driver; verify under a quick load test |
| Neon | Free-tier auto-suspend → first visitor after idle gets multi-second cold start, right when a recruiter clicks | Check tier's suspend behavior before launch; consider keep-warm ping during launch week, or accept + measure |
| Vercel | Default OG preview on the launch post | Explicit OG image/title/description; validate with LinkedIn Post Inspector before posting |
| LinkedIn in-app browser | Never tested; layout/JS quirks discovered by the audience | Send the link to yourself in LinkedIn mobile and click it, pre-launch |
| Destination imagery (Unsplash etc.) | Multi-MB heroes tanking mobile LCP; license ambiguity | `next/image`, sized/compressed; verify license terms for each image used |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unoptimized hero imagery | Mobile LCP 4–8s | next/image, AVIF/WebP, priority on first hero only | Immediately on cell connections — the launch audience |
| DB query per redemption card | Fine locally, slow burst behavior | With ≤120 entries, load the whole dataset in one query (or bake to static/ISR) and rank in memory | Never breaks at this scale if done right — this app's data fits in a single fetch |
| Ranking computed server-side per keystroke of balance entry | Laggy input | Rank client-side from a single loaded dataset; it's arithmetic over ≤120 rows | N/A if client-side |
| Neon cold start on idle DB | First request 2–5s after quiet period | Pooled driver + consider static-generating the redemption dataset (it changes only when Nick edits) | Low traffic makes this *more* likely, not less |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Balances/goals in server logs or analytics events | PII leak of financial-adjacent data; contradicts privacy policy | Log event names, never values; audit log output before launch |
| Anonymous balances persisted server-side "temporarily" | Storing PII with no consent or identity to attach rights to | localStorage/URL-state only until explicit sign-up |
| Balance inputs unvalidated (negative, 10^15, strings) | NaN valuations rendered publicly; XSS via any echoed field | Zod validation at the boundary; clamp to sane ranges (0–10M) |
| Bookmark/save endpoints trusting client-sent userId | One user reads/writes another's balances | Derive user from Clerk session server-side, never from payload |
| Deletion endpoint without auth check | Anyone deletes any account | Same session-derivation rule; test deletion as wrong user |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Requiring all 8 balances before showing results | Beginners with 1–2 programs bounce at the form | Show results from the first nonzero balance; empty = 0 |
| Wow number without the comparison anchor | "$4,500 value" means nothing alone | Always the pair: "cash-out: $900 → this flight: ~$4,500" — the delta IS the product |
| Jargon (cpp, MR, saver space, J) unexplained | Primary audience is beginners; they feel dumb and leave | Plain-language labels with expert detail on hover/expand; "cents per point" spelled out first use |
| "Almost there" section showing goals 500K points away | Aspirational becomes discouraging | Cap "almost there" at ~25–50% above current balance |
| Zero matches for a low-balance user | Empty state = broken app impression | Guarantee matches at 20–30K via hotel/economy entries; design a real "here's how to grow" empty state |
| Save prompt interrupting before the wow moment | Friction before payoff kills the demo | Save prompt appears only after results render, dismissible, never modal-blocking |
| Precision theater ("$4,517.23", "13.7 cpp") | False precision undermines the finance credibility it's meant to build | Round: "$4,500", "~13 cpp"; ranges where honest |

## "Looks Done But Isn't" Checklist

- [ ] **Transfer math:** Often missing Marriott 5K/60K bonus and Amex→Hilton 1:2 — verify unit tests for 120K Bonvoy → 50K miles and MR→Hilton doubling pass
- [ ] **Valuation display:** Often missing methodology note and verified-date — verify every card links to methodology and shows "Verified [date]"
- [ ] **No-login flow:** Often silently broken by auth middleware — verify full wow flow in incognito with no Clerk session
- [ ] **Deletion right:** Often a promise with no implementation — verify delete removes Postgres rows AND Clerk user, tested end-to-end
- [ ] **Mobile:** Often "responsive" but untested in LinkedIn WebView — verify by opening the shared link inside LinkedIn's mobile app
- [ ] **OG tags:** Often defaulted — verify LinkedIn Post Inspector shows custom image/title
- [ ] **Empty/edge states:** Often only happy-path tested — verify 0-balance, single-program, and 5M-point inputs all render sensibly
- [ ] **Database coverage:** Often deep on flights, thin on hotels — verify each of the 8 programs yields ≥2 matches at a 60K balance
- [ ] **Privacy policy:** Often boilerplate — verify every claim matches the actual data inventory (Clerk, Neon, logs, analytics)
- [ ] **Bilt data:** Often based on pre-2026 program — verify entries reflect Bilt 2.0/Cardless era partners (incl. Accor 3:2, I Prefer 1:2)

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Stale entry spotted publicly post-launch | LOW (if fielded well) | Fix within hours (JSON edit + deploy), reply thanking the spotter, point at the verified-date system — turns a hit into a credibility demo |
| Transfer math wrong in production | MEDIUM | Fix engine + add regression test; audit all entries touching that route; re-verify displayed numbers |
| Ranking model needs availability tiers retrofitted | MEDIUM | Add enum column, Nick bulk-tags 80–120 entries (~2 hrs), re-rank — cheaper than it looks if schema was extensible |
| DB build overruns schedule | LOW | Launch with 30–40 verified entries and honest "growing weekly" copy; breadth is a post-launch drip, not a launch blocker |
| Mobile broken during share spike | HIGH | Nothing recovers a recruiter's first impression; only prevention works — this is why the pre-launch checklist is a phase gate |
| Privacy policy mismatch discovered | LOW–MEDIUM | Correct policy same day; if data was over-collected, delete it and say so |

## Pitfall-to-Phase Mapping

Assuming a roadmap shaped like: (1) foundation/schema + walking-skeleton deploy, (2) valuation engine + seed data, (3) full DB build + ranking, (4) UI/design, (5) auth + save + legal, (6) pre-launch hardening.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Stale valuation data | 1 (schema fields) + 3 (verification gate) | Every shipped entry has `last_verified_date` ≤ 60 days old; date visible in UI |
| Transfer-ratio edge cases | 2 (engine + tests) | Unit suite passes: Marriott 60K/120K/59K, MR→Hilton, Bilt→Accor, stacked bonus |
| Availability overpromise | 1 (field) + 3–4 (tags + copy) | No "bookable" language anywhere; every card shows an availability tier |
| Attackable cpp methodology | 2 (convention decided pre-data) | Methodology page exists; per-program cash-out baselines in DB; Nick signs off on wording |
| DB build schedule sink | Roadmap structure (starts phase 2, parallel thereafter) | 30 verified entries exist before ranking work begins; all 8 programs covered |
| Mobile/LinkedIn demo failure | 4 (mobile-first) + 6 (checklist gate) | LinkedIn WebView walkthrough + Lighthouse mobile ≥ 90 + OG inspector pass, as phase-6 exit criteria |
| v2 scope creep | Every phase-planning session | No v1 task references AI/recommendations/eligibility/live availability; deployed slice exists by end of phase 1 |
| Legal/data handling gaps | 5 (built with save feature) | End-to-end deletion test passes; privacy policy diffed against data inventory |

## Sources

- [NerdWallet — How Points and Miles Values Changed in 2026](https://www.nerdwallet.com/travel/learn/how-points-and-miles-values-changed-in-2026)
- [ShopBack — Marriott Bonvoy 2026 Devaluation Explained](https://www.shopback.com/blog/travel/marriott-bonvoy-devaluation-2026-what-changed)
- [Travel on Points — Air Canada Aeroplan Award Chart 2026 Devaluation](https://travel-on-points.com/air-canada-aeroplan-devaluation/)
- [Max Miles Points — Aeroplan Award Chart Changes June 2026](https://www.maxmilespoints.com/blog/aeroplan-award-chart-changes-2026)
- [Bilt Rewards Support — Bilt's Transfer Partners](https://support.biltrewards.com/hc/en-us/articles/19086448638989-Bilt-s-Transfer-Partners)
- [US Credit Card Guide — Bilt Points Review (2026 update: Cardless issuance, I Prefer 1:2)](https://www.uscreditcardguide.com/bilt-points-review/)
- [Roaming Cactus — Bilt Rewards 2.0 (2026)](https://roamingcactus.com/news/bilt-rewards-20-2026)
- [FlightPoints — How Dynamic Pricing Affects Airline Award Redemptions](https://flightpoints.com/blogs/how-dynamic-pricing-affects-airline-redemptions/)
- Domain knowledge: transfer-partner mechanics (Marriott 3:1 + 5K/60K, Amex→Hilton 1:2, transfer increments), cpp-methodology debates in the points community, LinkedIn in-app WebView behavior for shared links
- Project context: `C:\Users\geoca\milesworth\.planning\PROJECT.md`

---
*Pitfalls research for: credit-card points & miles redemption visualizer*
*Researched: 2026-08-31*
