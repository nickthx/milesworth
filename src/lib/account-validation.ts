import { z } from "zod";

import { redemptions } from "@/data";
import type { Balances, EnterableProgramSlug } from "@/engine";
import { MAX_BALANCE, PARAM_KEY_BY_SLUG } from "@/lib/balance-params";

// Write boundary for the account Server Actions (ACCT-01 balances, ACCT-02
// bookmarks, ACCT-03 travel goals). Every Server Action input is
// attacker-controllable (T-06-03), so it is validated here before any DB code
// runs. The slug sets derive from PARAM_KEY_BY_SLUG (enterable programs) and
// the @/data redemptions array — never re-listed — and the balance ceiling is
// the URL codec's MAX_BALANCE, so the account and share-link boundaries can
// never drift apart.
//
// DB-free and framework-free on purpose (T-06-05): importable by the Server
// Actions and by node tests without DATABASE_URL, no client directive. House
// style follows interest-validation.ts. Importing @/data (arrays) is safe
// here; @/db (tables of the same names) must never be imported in a lib.

const ENTERABLE_SLUGS = Object.keys(PARAM_KEY_BY_SLUG) as [
  EnterableProgramSlug,
  ...EnterableProgramSlug[],
];

/**
 * Saved balances: a partial map of enterable slug → positive integer points
 * within MAX_BALANCE. `z.partialRecord` (not `z.record`) because zod 4's
 * `z.record` with an enum key is EXHAUSTIVE — it would reject a user who
 * enters two of the eight programs. Unknown keys fail, so "delta" or a
 * partner program can never be stored as a balance.
 */
export const balancesSchema = z.partialRecord(
  z.enum(ENTERABLE_SLUGS),
  z.number().int().positive().max(MAX_BALANCE),
);

export type BalancesInput = z.infer<typeof balancesSchema>;

// Compile-time proof that a parsed balances object is a valid engine
// `Balances` — the action can pass it straight through without mapping.
type _BalancesInputIsBalances = BalancesInput extends Balances ? true : never;
const _balancesCheck: _BalancesInputIsBalances = true;
void _balancesCheck;

/**
 * Bookmark slug: must be a redemption that exists in the curated dataset.
 * This enum is the read-time truth for bookmarks — there is deliberately no
 * FK into the redemptions table (Pitfall 6: the seed script does a full
 * delete-then-insert, which a FK from user data would block).
 */
export const bookmarkSlugSchema = z.enum(
  redemptions.map((r) => r.slug) as [string, ...string[]],
);

/**
 * Travel goal from FormData. Values arrive raw (string, or absent → undefined
 * after the action's null-to-undefined mapping), so the optionals accept ""
 * as well as absence; the action maps "" to null when inserting. targetDate
 * is ISO yyyy-mm-dd only (zod 4 `z.iso.date`, which also rejects month 13).
 */
export const goalSchema = z.object({
  text: z.string().trim().min(1).max(280),
  destination: z.string().trim().max(80).optional(),
  targetDate: z.literal("").or(z.iso.date()).optional(),
});

export type GoalInput = z.infer<typeof goalSchema>;

/**
 * Goal id from a hidden FormData input (arrives as a string). Coerced to a
 * positive integer only — the action always combines it with the session
 * userId in the WHERE clause, so a guessed id can never touch another
 * user's row (T-06-02).
 */
export const goalIdSchema = z.coerce.number().int().positive();
