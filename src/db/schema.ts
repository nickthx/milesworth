import {
  boolean,
  date,
  foreignKey,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// D-16 fulfilled: the Phase 1 health_check placeholder is replaced by the four
// real curated tables (programs, transfer_routes, transfer_bonuses, redemptions).
// Integer-only quantities everywhere — money in cents, cpp x100, transfer
// ratios as numerator/denominator — no floats, no numeric (Pitfall 2: float
// ratios fail Marriott math and compose wrong with bonuses). Derived values
// (cpp, wow delta) are never persisted; the engine computes them.
// interest_signups (PLAT-04) is the first table with a runtime writer; the
// curated four remain seed-only and scripts/seed.ts never touches it.
//
// Phase 6 accounts (ACCT-01..03): users, user_balances, bookmarks and
// travel_goals are written ONLY by the Server Actions in
// src/app/actions/account.ts; scripts/seed.ts never touches them. No user
// table has a FK into a seeded table (programs / redemptions) — the seed is a
// full delete-then-insert, and a FK from user data would make it fail the
// moment one bookmark exists (RESEARCH Pitfall 6). Slugs are validated at
// write time by src/lib/account-validation.ts and filtered at read time.
// Every child row cascades from users.clerk_user_id, so deleting the users
// row (deleteAccount) removes the whole account in one statement.

export const programKind = pgEnum("program_kind", ["bank", "airline", "hotel"]);

export const availabilityRating = pgEnum("availability_rating", [
  "wide_open",
  "plan_ahead",
  "hard_to_find",
]);

export const redemptionCategory = pgEnum("redemption_category", [
  "flight",
  "hotel",
  "other",
]);

export const programs = pgTable("programs", {
  // Natural key: kebab-case slug ("chase-ur", "world-of-hyatt", "ana-mileage-club").
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  kind: programKind("kind").notNull(),
  // True for exactly the user-enterable currencies (balance-entry form).
  isUserEnterable: boolean("is_user_enterable").notNull().default(false),
  // 100 = 1.0 cents/pt; null for partner-only programs with no cash-out path.
  cashOutBaselineCppX100: integer("cash_out_baseline_cpp_x100"),
});

export const transferRoutes = pgTable(
  "transfer_routes",
  {
    fromProgramSlug: text("from_program_slug")
      .notNull()
      .references(() => programs.slug),
    toProgramSlug: text("to_program_slug")
      .notNull()
      .references(() => programs.slug),
    // Ratio = ratioNumerator partner units per ratioDenominator source points
    // (Marriott→air: 1/3; MR→Hilton: 2/1; Bilt→air: 1/1).
    ratioNumerator: integer("ratio_numerator").notNull(),
    ratioDenominator: integer("ratio_denominator").notNull(),
    // Transfer block size in source points.
    incrementPoints: integer("increment_points").notNull(),
    // Structural bonus (Marriott: 5000 miles per 60000 points); null elsewhere.
    bonusMilesPerBlock: integer("bonus_miles_per_block"),
    bonusBlockPoints: integer("bonus_block_points"),
    transferTimeDays: integer("transfer_time_days"),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
  },
  // Phase 6 RESEARCH Pitfall 1: drizzle-kit 0.31.10 introspects composite-PK
  // columns from an unordered information_schema query and PostgreSQL 18
  // returns them (to, from); matching that order removes the DROP/ADD churn
  // on every push. PK column order is semantically irrelevant to the app/seed.
  (t) => [primaryKey({ columns: [t.toProgramSlug, t.fromProgramSlug] })],
);

export const transferBonuses = pgTable(
  "transfer_bonuses",
  {
    id: serial("id").primaryKey(),
    fromProgramSlug: text("from_program_slug").notNull(),
    toProgramSlug: text("to_program_slug").notNull(),
    // 30 = +30% on the base-converted amount (dated manual promo rows).
    bonusPercent: integer("bonus_percent").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    // Where the promo was seen (DATA-03: methodology stays transparent).
    sourceNote: text("source_note").notNull(),
  },
  (t) => [
    foreignKey({
      // Explicit short name: the auto-generated name is 100 chars and Postgres
      // truncates identifiers to 63, so every push saw a phantom rename
      // (Phase 5 deferred-items.md). Renamed live once via a TTY push (06-01).
      name: "transfer_bonuses_route_fk",
      columns: [t.fromProgramSlug, t.toProgramSlug],
      foreignColumns: [
        transferRoutes.fromProgramSlug,
        transferRoutes.toProgramSlug,
      ],
    }),
  ],
);

export const redemptions = pgTable("redemptions", {
  // e.g. "ana-business-tokyo-via-virgin"
  slug: text("slug").primaryKey(),
  partnerProgramSlug: text("partner_program_slug")
    .notNull()
    .references(() => programs.slug),
  title: text("title").notNull(),
  category: redemptionCategory("category").notNull(),
  origin: text("origin"),
  destination: text("destination"),
  cabin: text("cabin"),
  // Range framing per Pitfall 1; pointsMax null = fixed-price program/chart.
  pointsMin: integer("points_min").notNull(),
  pointsMax: integer("points_max"),
  // Money is always integer cents.
  taxesFeesCents: integer("taxes_fees_cents").notNull(),
  cashFareCents: integer("cash_fare_cents").notNull(),
  availabilityRating: availabilityRating("availability_rating").notNull(),
  // 2-4 lines of booking guidance; RANK-05 consumes this.
  bookingHint: text("booking_hint").notNull(),
  methodologyNote: text("methodology_note"),
  // Pitfall 1: non-negotiable provenance.
  sourceNote: text("source_note").notNull(),
  // NULL = draft, not shippable (DATA-04 draft-vs-verified workflow).
  verifiedAt: date("verified_at"),
  // Stable string mapped to static image imports in a typed manifest.
  imageSlug: text("image_slug"),
  featured: boolean("featured").notNull().default(false),
  notes: text("notes"),
});

// PLAT-04 advisor-waitlist signal. Written only by the joinAdvisorWaitlist
// Server Action (src/app/actions/interest.ts) — never by the seed script.
export const interestSignups = pgTable("interest_signups", {
  id: serial("id").primaryKey(),
  // Lower-cased + trimmed by interestSchema before insert; unique so repeat
  // submits are idempotent via onConflictDoNothing (T-05-12).
  email: text("email").notNull().unique(),
  // Where the signal came from — lets v2 filter ("advisor-tease" today), and
  // doubles as the consent record: which surface the address was entered on.
  source: text("source").notNull().default("advisor-tease"),
  // Minted at insert so the v2 send can carry a working opt-out link from its
  // very first email rather than retrofitting tokens onto addresses already
  // collected. Nothing reads it yet; the unsubscribe route is a v2 task and
  // the tease copy does not promise one until it exists.
  unsubscribeToken: uuid("unsubscribe_token")
    .notNull()
    .defaultRandom()
    .unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ACCT-01 cascade anchor. Written only by src/app/actions/account.ts (upsert
// on first save); the seed script never touches it. Deleting this row removes
// every child row below via ON DELETE CASCADE.
export const users = pgTable("users", {
  // The Clerk userId from auth() — the only identity key the app stores.
  clerkUserId: text("clerk_user_id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ACCT-01 saved balances, one row per (user, program). Written only by
// src/app/actions/account.ts; never by the seed script.
export const userBalances = pgTable(
  "user_balances",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.clerkUserId, { onDelete: "cascade" }),
    // Validated against the 8 enterable slugs by balancesSchema. Deliberately
    // NO FK into programs (Pitfall 6): the seed does delete-then-insert.
    programSlug: text("program_slug").notNull(),
    // Positive safe int <= MAX_BALANCE — the same guard as balance-params.
    points: integer("points").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  // uniqueIndex, not a composite PK / .unique(): composite constraints churn
  // under drizzle-kit 0.31.10 on PG18 (RESEARCH Pitfall 1 / A3).
  (t) => [
    uniqueIndex("user_balances_user_program_uidx").on(t.userId, t.programSlug),
  ],
);

// ACCT-02 bookmarked redemptions. Written only by src/app/actions/account.ts;
// never by the seed script.
export const bookmarks = pgTable(
  "bookmarks",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.clerkUserId, { onDelete: "cascade" }),
    // Validated against the @/data slugs by bookmarkSlugSchema. NO FK into
    // redemptions (Pitfall 6); a slug that later leaves the dataset is
    // filtered at read time rather than blocking the seed.
    redemptionSlug: text("redemption_slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("bookmarks_user_redemption_uidx").on(
      t.userId,
      t.redemptionSlug,
    ),
  ],
);

// ACCT-03 travel goals — stored only, no ranking effect (V2-03 deferred).
// Written only by src/app/actions/account.ts; never by the seed script.
export const travelGoals = pgTable("travel_goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.clerkUserId, { onDelete: "cascade" }),
  // <= 280 chars, trimmed by goalSchema.
  text: text("text").notNull(),
  // Optional, <= 80 chars; "" from FormData is stored as null.
  destination: text("destination"),
  // Optional ISO yyyy-mm-dd; "" from FormData is stored as null.
  targetDate: date("target_date"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
