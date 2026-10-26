// Idempotent one-command seed: rebuilds the four curated tables in Neon from
// the repo's typed seed dataset (repo-as-CMS). Full delete-then-insert in
// FK-safe order inside a single db.batch() request — upsert-only seeding
// would leave deleted rows behind (Pitfall 3). Validation runs BEFORE src/db
// is ever imported, so bad data can never reach a write (T-02-11).
// Convergence (A6): if a batch ever partially applies, re-running converges
// by construction — every run is a full rebuild to exactly the repo state,
// and the curated tables have no runtime writers to race.
// Output is row counts only; the connection string is never echoed (T-02-10).
// Run with: npm run db:seed

// Guarded local env load (Node 22 built-in) — absent on CI/Vercel where env is set.
try {
  process.loadEnvFile(".env.development.local");
} catch {
  // file absent — env vars come from the environment
}

import type { BatchItem } from "drizzle-orm/batch";

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error(
      "DATABASE_URL is not set (re-run `vercel env pull .env.development.local`)",
    );
    process.exit(1);
  }

  // Validate FIRST — any Zod or cross-ref failure throws here, before src/db
  // is imported, so zero writes can happen on bad data. Alias the colliding
  // names: src/data exports ARRAYS, src/db exports Drizzle TABLES.
  const {
    programs: programData,
    routes,
    bonuses,
    redemptions: redemptionData,
  } = await import("../src/data");
  const { validateDataset } = await import("../src/data/schemas");

  validateDataset({
    programs: programData,
    routes,
    bonuses,
    redemptions: redemptionData,
  });

  // Import after env load + validation so src/db sees DATABASE_URL and no
  // client exists until the data is known-good.
  const { db, programs, transferRoutes, transferBonuses, redemptions } =
    await import("../src/db");

  // One batch request (neon-http supports batch, not interactive transactions):
  // deletes child→parent, inserts parent→child. Empty arrays are skipped —
  // drizzle's .values([]) throws, and e.g. bonuses may legitimately be empty.
  const statements: BatchItem<"pg">[] = [
    db.delete(transferBonuses),
    db.delete(redemptions),
    db.delete(transferRoutes),
    db.delete(programs),
  ];
  if (programData.length > 0) {
    statements.push(db.insert(programs).values(programData));
  }
  if (routes.length > 0) {
    statements.push(db.insert(transferRoutes).values(routes));
  }
  if (bonuses.length > 0) {
    statements.push(db.insert(transferBonuses).values(bonuses));
  }
  if (redemptionData.length > 0) {
    statements.push(db.insert(redemptions).values(redemptionData));
  }

  await db.batch(statements as [BatchItem<"pg">, ...BatchItem<"pg">[]]);

  const verifiedCount = redemptionData.filter(
    (r) => r.verifiedAt !== null,
  ).length;

  console.log(
    `seeded: ${programData.length} programs, ${routes.length} routes, ` +
      `${bonuses.length} bonuses, ${redemptionData.length} redemptions ` +
      `(${verifiedCount} verified)`,
  );
  process.exit(0);
}

main().catch((err: unknown) => {
  // Print only the error message — never the connection string.
  console.error(
    "seed failed:",
    err instanceof Error ? err.message : String(err),
  );
  process.exit(1);
});
