"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { and, eq, notInArray, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { revalidatePath } from "next/cache";

import { bookmarks, db, travelGoals, userBalances, users } from "@/db";
import {
  balancesSchema,
  bookmarkSlugSchema,
  goalIdSchema,
  goalSchema,
} from "@/lib/account-validation";

// ACCT-01..04 write path: every mutation of the four account tables. Second
// "@/db" importer under src/app (with actions/interest.ts; the read module
// src/lib/server/account-data.ts is the third) — pinned by the grep gate and
// tests/guest-flow-gate.test.ts (T-06-05).
//
// T-06-01: every action opens with `await auth()`; null userId → fixed copy,
// no DB call. The userId is NEVER accepted from the client.
// T-06-02: every UPDATE/DELETE filters by the session userId.
// T-06-03: the 06-02 Zod schemas run before any DB code.
// T-06-04: zod issue text and driver/Clerk errors are never returned or
// logged — fixed neutral copy, bare `catch`.
// T-06-06: deleteAccount removes the DB rows (cascade) BEFORE the Clerk user.

export type ActionState = {
  status: "idle" | "ok" | "error";
  message: string;
};

const NEUTRAL_ERROR: ActionState = {
  status: "error",
  message: "Something went wrong. Try again in a moment.",
};

const SIGN_IN_FIRST: ActionState = {
  status: "error",
  message: "Sign in first.",
};

type Statement = BatchItem<"pg">;
type Statements = [Statement, ...Statement[]];

// First item of every writing batch: a bookmark or goal saved before any
// balances would otherwise violate the users FK.
function ensureUser(userId: string): Statement {
  return db
    .insert(users)
    .values({ clerkUserId: userId })
    .onConflictDoNothing({ target: users.clerkUserId });
}

function revalidateAccountViews(): void {
  revalidatePath("/");
  revalidatePath("/account");
}

export async function saveBalances(input: unknown): Promise<ActionState> {
  const { userId } = await auth();
  if (!userId) return SIGN_IN_FIRST;

  const parsed = balancesSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Enter whole-number balances." };
  }
  const entries = Object.entries(parsed.data) as [string, number][];

  try {
    const statements: Statements = [ensureUser(userId)];
    if (entries.length > 0) {
      // Rows for programs the user cleared go away; the rest upsert in place.
      statements.push(
        db.delete(userBalances).where(
          and(
            eq(userBalances.userId, userId),
            notInArray(
              userBalances.programSlug,
              entries.map(([slug]) => slug),
            ),
          ),
        ),
        db
          .insert(userBalances)
          .values(
            entries.map(([programSlug, points]) => ({
              userId,
              programSlug,
              points,
            })),
          )
          .onConflictDoUpdate({
            target: [userBalances.userId, userBalances.programSlug],
            set: { points: sql`excluded.points`, updatedAt: sql`now()` },
          }),
      );
    } else {
      // Pitfall 10: notInArray([]) is invalid SQL and .values([]) throws, so a
      // save with zero balances is a plain scoped delete and no insert.
      statements.push(
        db.delete(userBalances).where(eq(userBalances.userId, userId)),
      );
    }
    await db.batch(statements);
    revalidateAccountViews();
    return { status: "ok", message: "Balances saved." };
  } catch {
    return NEUTRAL_ERROR;
  }
}

export async function setBookmark(
  slug: unknown,
  bookmarked: boolean,
): Promise<ActionState> {
  const { userId } = await auth();
  if (!userId) return SIGN_IN_FIRST;

  const parsed = bookmarkSlugSchema.safeParse(slug);
  if (!parsed.success) {
    return {
      status: "error",
      message: "That redemption is no longer available.",
    };
  }
  const redemptionSlug = parsed.data;

  try {
    if (bookmarked === true) {
      // onConflictDoNothing on the unique index makes a retried add a no-op.
      await db.batch([
        ensureUser(userId),
        db
          .insert(bookmarks)
          .values({ userId, redemptionSlug })
          .onConflictDoNothing({
            target: [bookmarks.userId, bookmarks.redemptionSlug],
          }),
      ]);
      revalidateAccountViews();
      return { status: "ok", message: "Saved to your account." };
    }
    await db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.redemptionSlug, redemptionSlug),
        ),
      );
    revalidateAccountViews();
    return { status: "ok", message: "Removed from your account." };
  } catch {
    return NEUTRAL_ERROR;
  }
}

export async function addGoal(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { userId } = await auth();
  if (!userId) return SIGN_IN_FIRST;

  // Raw FormData values reach the schema unchanged (interest.ts discipline);
  // null becomes undefined, the one value a real browser omits.
  const parsed = goalSchema.safeParse({
    text: formData.get("text"),
    destination: formData.get("destination") ?? undefined,
    targetDate: formData.get("targetDate") ?? undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Enter a goal of up to 280 characters.",
    };
  }
  const { text, destination, targetDate } = parsed.data;

  try {
    await db.batch([
      ensureUser(userId),
      db.insert(travelGoals).values({
        userId,
        text,
        destination: destination || null,
        targetDate: targetDate || null,
      }),
    ]);
    revalidatePath("/account");
    return { status: "ok", message: "Goal saved." };
  } catch {
    return NEUTRAL_ERROR;
  }
}

export async function deleteGoal(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { userId } = await auth();
  if (!userId) return SIGN_IN_FIRST;

  const parsed = goalIdSchema.safeParse(formData.get("goalId"));
  if (!parsed.success) return NEUTRAL_ERROR;

  try {
    // The id alone is never trusted: combined with the session user (T-06-02).
    await db
      .delete(travelGoals)
      .where(
        and(eq(travelGoals.id, parsed.data), eq(travelGoals.userId, userId)),
      );
    revalidatePath("/account");
    return { status: "ok", message: "Goal removed." };
  } catch {
    return NEUTRAL_ERROR;
  }
}

// No parameters on purpose: useActionState(deleteAccount, …) still typechecks
// (a zero-arg function is assignable to (state, payload) => …) and eslint's
// no-unused-vars has no underscore exemption in this config.
export async function deleteAccount(): Promise<ActionState> {
  const { userId } = await auth();
  if (!userId) return SIGN_IN_FIRST;

  try {
    // Order matters (Pitfall 7 / T-06-06): the DB row goes first, cascading
    // user_balances, bookmarks and travel_goals. If Clerk then fails, the
    // user is still signed in and can retry; the reverse order would orphan
    // rows with no session left to retry from. A DB failure short-circuits
    // here, so Clerk is never called for a user whose data still exists.
    await db.delete(users).where(eq(users.clerkUserId, userId));
    const client = await clerkClient();
    await client.users.deleteUser(userId);
    revalidatePath("/");
    return { status: "ok", message: "Your account and data were deleted." };
  } catch {
    return NEUTRAL_ERROR;
  }
}
