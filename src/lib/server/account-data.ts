import { desc, eq } from "drizzle-orm";

import { redemptions } from "@/data";
import { bookmarks, db, travelGoals, userBalances } from "@/db";
import type { Balances } from "@/engine";
import { MAX_BALANCE, PARAM_KEY_BY_SLUG } from "@/lib/balance-params";

// ACCT-01/02/03 read path: the ONE module that reads a user's saved data,
// and the THIRD and last file permitted to import "@/db" (with
// actions/interest.ts and actions/account.ts) — T-06-05, pinned by
// tests/guest-flow-gate.test.ts. Server-only by convention: imported only
// from src/app/**/page.tsx (the `/` and `/account` RSCs), never from
// src/components/**.
//
// The userId MUST come from `await auth()` in the calling page — never from
// a client, a param, or a cookie (T-06-01). Every select below is scoped by
// the session user (T-06-02).
//
// Neutral failure (T-06-04): any driver error yields null — nothing is
// logged (driver errors can embed connection details) and nothing is thrown,
// so the page degrades to the guest experience instead of a 500.
//
// Pitfall 6 / T-06-15: bookmarks carry no FK into the seeded redemptions
// table, so a slug that later left the dataset is dropped here at read time.

export type TravelGoalRow = {
  id: number;
  text: string;
  destination: string | null;
  targetDate: string | null;
};

export type AccountSnapshot = {
  balances: Balances | null;
  bookmarkedSlugs: string[];
  goals: TravelGoalRow[];
};

/** Known slugs only, deduped, first-seen order. Pure (unit-tested, no DB). */
export function filterKnownBookmarks(
  slugs: readonly string[],
  known: ReadonlyArray<{ slug: string }>,
): string[] {
  const knownSet = new Set(known.map((k) => k.slug));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const slug of slugs) {
    if (!knownSet.has(slug) || seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
  }
  return out;
}

/**
 * Stored rows → engine Balances, re-checked with the URL codec's rule
 * (enterable slug, positive safe int <= MAX_BALANCE) even though the write
 * side validated them — defense in depth, T-06-03. Null when nothing survives.
 */
export function rowsToBalances(
  rows: ReadonlyArray<{ programSlug: string; points: number }>,
): Balances | null {
  const balances: Balances = {};
  let kept = 0;
  for (const { programSlug, points } of rows) {
    if (!Object.hasOwn(PARAM_KEY_BY_SLUG, programSlug)) continue;
    if (!Number.isSafeInteger(points) || points <= 0 || points > MAX_BALANCE) {
      continue;
    }
    balances[programSlug as keyof typeof PARAM_KEY_BY_SLUG] = points;
    kept += 1;
  }
  return kept > 0 ? balances : null;
}

/** Three scoped selects in one round. Callers: the `/` and `/account` RSCs. */
export async function loadAccountSnapshot(
  userId: string,
): Promise<AccountSnapshot | null> {
  try {
    const [balanceRows, bookmarkRows, goalRows] = await Promise.all([
      db
        .select({
          programSlug: userBalances.programSlug,
          points: userBalances.points,
        })
        .from(userBalances)
        .where(eq(userBalances.userId, userId)),
      db
        .select({ slug: bookmarks.redemptionSlug })
        .from(bookmarks)
        .where(eq(bookmarks.userId, userId))
        .orderBy(desc(bookmarks.createdAt)),
      db
        .select({
          id: travelGoals.id,
          text: travelGoals.text,
          destination: travelGoals.destination,
          targetDate: travelGoals.targetDate,
        })
        .from(travelGoals)
        .where(eq(travelGoals.userId, userId))
        .orderBy(desc(travelGoals.createdAt)),
    ]);
    return {
      balances: rowsToBalances(balanceRows),
      bookmarkedSlugs: filterKnownBookmarks(
        bookmarkRows.map((r) => r.slug),
        redemptions,
      ),
      goals: goalRows,
    };
  } catch {
    return null;
  }
}
