// Read-only connectivity proof against Neon: count rows in the curated
// programs table, in interest_signups (PLAT-04), and in the four runtime-
// writable Phase 6 account tables — users, user_balances, bookmarks,
// travel_goals (ACCT-01..03) — as proof each exists after drizzle-kit push.
// Prints ONLY row counts (T-01-08: connection string is never echoed).
// Curated tables have no writer besides the seed script; the account tables
// are written only by src/app/actions/account.ts.
// Run with: npx tsx scripts/db-check.ts

// Guarded local env load (Node 22 built-in) — absent on CI/Vercel where env is set.
try {
  process.loadEnvFile(".env.development.local");
} catch {
  // file absent — env vars come from the environment
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error(
      "DATABASE_URL is not set (re-run `vercel env pull .env.development.local`)",
    );
    process.exit(1);
  }

  // Import after env load so src/db/index.ts sees DATABASE_URL.
  const [
    {
      db,
      programs,
      interestSignups,
      users,
      userBalances,
      bookmarks,
      travelGoals,
    },
    { count },
  ] = await Promise.all([import("../src/db"), import("drizzle-orm")]);

  const [row] = await db.select({ n: count() }).from(programs);
  const [signups] = await db.select({ n: count() }).from(interestSignups);
  const [userRows] = await db.select({ n: count() }).from(users);
  const [balanceRows] = await db.select({ n: count() }).from(userBalances);
  const [bookmarkRows] = await db.select({ n: count() }).from(bookmarks);
  const [goalRows] = await db.select({ n: count() }).from(travelGoals);

  console.log(`programs rows: ${row.n}`);
  console.log(`interest_signups rows: ${signups.n}`);
  console.log(`users rows: ${userRows.n}`);
  console.log(`user_balances rows: ${balanceRows.n}`);
  console.log(`bookmarks rows: ${bookmarkRows.n}`);
  console.log(`travel_goals rows: ${goalRows.n}`);
  process.exit(0);
}

main().catch((err: unknown) => {
  // Print only the error class/message — never the connection string.
  console.error(
    "db-check failed:",
    err instanceof Error ? err.message : String(err),
  );
  process.exit(1);
});
