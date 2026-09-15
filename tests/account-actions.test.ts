import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ACCT-01/04: the account Server Actions' security behavior, pinned without a
// database or a Clerk session. `@clerk/nextjs/server` expects request context
// and `next/cache` throws outside a request scope, so both are mocked; `@/db`
// is spread from the real module (the lazy Proxy never connects) with only
// `db` swapped for a recording fake. This is the codebase's first vi.mock.
//
// T-06-01 session gate, T-06-03 validation before DB, T-06-04 neutral copy
// (driver error text never reaches the result), T-06-06 DB-before-Clerk
// delete order, T-06-02 scoping (every DELETE's where predicate binds the
// session userId — compiled through PgDialect below, so a regression that
// drops the userId term fails here rather than merely "where was called").

// vi.mock factories are hoisted above every import, so anything they close
// over must come from vi.hoisted.
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  deleteUser: vi.fn(),
  revalidatePath: vi.fn(),
  batch: vi.fn(),
  del: vi.fn(),
  ins: vi.fn(),
  where: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
  clerkClient: vi.fn(async () => ({ users: { deleteUser: mocks.deleteUser } })),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

vi.mock("@/db", async (importOriginal) => {
  // A batch "item": the same object is returned from .values() and from the
  // onConflict* builders so `db.insert(t).values(v)` and
  // `db.insert(t).values(v).onConflictDoNothing(...)` are both batchable.
  const item = {
    onConflictDoNothing: () => item,
    onConflictDoUpdate: () => item,
  };
  const fakeDb = {
    insert: (...args: unknown[]) => {
      mocks.ins(...args);
      return { values: () => item };
    },
    delete: (...args: unknown[]) => {
      mocks.del(...args);
      return { where: mocks.where };
    },
    select: vi.fn(),
    batch: mocks.batch,
  };
  return { ...(await importOriginal<typeof import("@/db")>()), db: fakeDb };
});

import { redemptions } from "../src/data";
import {
  addGoal,
  deleteAccount,
  deleteGoal,
  saveBalances,
  setBookmark,
} from "../src/app/actions/account";
import type { ActionState } from "../src/app/actions/account";

const IDLE: ActionState = { status: "idle", message: "" };
const NEUTRAL = "Something went wrong. Try again in a moment.";
const KNOWN_SLUG = redemptions[0].slug;

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

function dbUntouched(): void {
  expect(mocks.batch).not.toHaveBeenCalled();
  expect(mocks.del).not.toHaveBeenCalled();
  expect(mocks.ins).not.toHaveBeenCalled();
}

// T-06-02 is a property of the predicate, not of `.where()` having run. The
// actions build real drizzle SQL (`and(eq(...), ...)`) against the real
// schema and hand it to the fake's `where`; compiling that SQL with the pg
// dialect exposes the bound params and the column names it filters on.
// Dropping `eq(table.userId, userId)` removes "user_123" from the params and
// the user_id column from the text — either assertion below then fails.
const dialect = new PgDialect();

function whereQuery(call = 0): { sql: string; params: unknown[] } {
  const predicate = mocks.where.mock.calls[call][0];
  const { sql, params } = dialect.sqlToQuery(predicate);
  return { sql, params };
}

/** Asserts the Nth `.where()` predicate is scoped by the session user. */
function expectScopedToSessionUser(call = 0, column = "user_id"): void {
  const { sql, params } = whereQuery(call);
  expect(params).toContain("user_123");
  expect(sql).toContain(`"${column}" = $`);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ userId: "user_123" });
  mocks.batch.mockResolvedValue([]);
  mocks.where.mockResolvedValue(undefined);
  mocks.deleteUser.mockResolvedValue({});
});

describe("session gate (T-06-01)", () => {
  it("with no session every action returns an error and never touches the db", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const results = await Promise.all([
      saveBalances({ "chase-ur": 90000 }),
      setBookmark(KNOWN_SLUG, true),
      addGoal(IDLE, form({ text: "Tokyo" })),
      deleteGoal(IDLE, form({ goalId: "7" })),
      deleteAccount(),
    ]);
    for (const result of results) expect(result.status).toBe("error");
    dbUntouched();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
});

describe("saveBalances (ACCT-01)", () => {
  it("valid balances → ok and one batch of 3 items (users upsert, scoped delete, upsert insert)", async () => {
    const result = await saveBalances({ "chase-ur": 90000 });
    expect(result.status).toBe("ok");
    expect(mocks.batch).toHaveBeenCalledTimes(1);
    expect(mocks.batch.mock.calls[0][0]).toHaveLength(3);
  });

  it("valid balances → the cleanup delete is scoped by the session user AND keeps the saved slugs (T-06-02)", async () => {
    await saveBalances({ "chase-ur": 90000 });
    expect(mocks.del).toHaveBeenCalledTimes(1);
    expectScopedToSessionUser();
    expect(whereQuery().params).toEqual(
      expect.arrayContaining(["user_123", "chase-ur"]),
    );
  });

  it("valid balances → revalidates / and /account", async () => {
    await saveBalances({ "chase-ur": 90000 });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/account");
  });

  it("zero balances → one batch of 2 items and no insert into user_balances (Pitfall 10)", async () => {
    const result = await saveBalances({});
    expect(result.status).toBe("ok");
    expect(mocks.batch).toHaveBeenCalledTimes(1);
    expect(mocks.batch.mock.calls[0][0]).toHaveLength(2);
    // The "clear everything" delete must still be the session user's rows only.
    expectScopedToSessionUser();
    expect(whereQuery().params).toEqual(["user_123"]);
  });

  it("negative balance → error and no db call (T-06-03)", async () => {
    const result = await saveBalances({ "chase-ur": -1 });
    expect(result.status).toBe("error");
    dbUntouched();
  });

  it("driver failure → neutral copy, never the error text (T-06-04)", async () => {
    mocks.batch.mockRejectedValueOnce(new Error("connection refused"));
    const result = await saveBalances({ "chase-ur": 90000 });
    expect(result).toEqual({ status: "error", message: NEUTRAL });
  });
});

describe("setBookmark (ACCT-02)", () => {
  it("unknown slug → error and no db call", async () => {
    const result = await setBookmark("not-a-slug", true);
    expect(result.status).toBe("error");
    dbUntouched();
  });

  it("known slug, bookmarked=true → ok and a batch write", async () => {
    const result = await setBookmark(KNOWN_SLUG, true);
    expect(result.status).toBe("ok");
    expect(mocks.batch).toHaveBeenCalledTimes(1);
  });

  it("known slug, bookmarked=false → a delete scoped by the session user AND the slug (T-06-02)", async () => {
    const result = await setBookmark(KNOWN_SLUG, false);
    expect(result.status).toBe("ok");
    expect(mocks.del).toHaveBeenCalledTimes(1);
    expect(mocks.where).toHaveBeenCalledTimes(1);
    expect(mocks.batch).not.toHaveBeenCalled();
    expectScopedToSessionUser();
    expect(whereQuery().params).toEqual(
      expect.arrayContaining(["user_123", KNOWN_SLUG]),
    );
  });
});

describe("addGoal (ACCT-03)", () => {
  it('text "Tokyo" → ok and a batch write', async () => {
    const result = await addGoal(IDLE, form({ text: "Tokyo" }));
    expect(result.status).toBe("ok");
    expect(mocks.batch).toHaveBeenCalledTimes(1);
  });

  it("281-character text → error and no db call", async () => {
    const result = await addGoal(IDLE, form({ text: "x".repeat(281) }));
    expect(result.status).toBe("error");
    dbUntouched();
  });
});

describe("deleteGoal (ACCT-03, T-06-02)", () => {
  it('goalId "7" → delete scoped by BOTH the id and the session user', async () => {
    const result = await deleteGoal(IDLE, form({ goalId: "7" }));
    expect(result.status).toBe("ok");
    expect(mocks.del).toHaveBeenCalledTimes(1);
    expect(mocks.where).toHaveBeenCalledTimes(1);
    // The id alone must never be enough: `.where(eq(travelGoals.id, 7))`
    // would let any signed-in user delete any goal by guessing ids.
    expectScopedToSessionUser();
    expect(whereQuery().params).toEqual(
      expect.arrayContaining([7, "user_123"]),
    );
  });

  it('goalId "abc" → error and no db call', async () => {
    const result = await deleteGoal(IDLE, form({ goalId: "abc" }));
    expect(result.status).toBe("error");
    dbUntouched();
  });
});

describe("deleteAccount (ACCT-04, T-06-06)", () => {
  it("deletes the users row BEFORE calling Clerk deleteUser", async () => {
    await deleteAccount();
    expect(mocks.del).toHaveBeenCalledTimes(1);
    expect(mocks.deleteUser).toHaveBeenCalledWith("user_123");
    expect(mocks.del.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.deleteUser.mock.invocationCallOrder[0],
    );
  });

  it("the users delete is scoped to exactly the session user (T-06-02)", async () => {
    await deleteAccount();
    expectScopedToSessionUser(0, "clerk_user_id");
    expect(whereQuery().params).toEqual(["user_123"]);
  });

  it("when the DB delete rejects, Clerk is never called and the copy is neutral", async () => {
    mocks.where.mockRejectedValueOnce(new Error("boom"));
    const result = await deleteAccount();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "error", message: NEUTRAL });
    expect(result.message).not.toContain("boom");
  });

  it("success returns the deletion copy and revalidates /", async () => {
    const result = await deleteAccount();
    expect(result).toEqual({
      status: "ok",
      message: "Your account and data were deleted.",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
  });
});

describe("account.ts source scan", () => {
  const source = readFileSync(
    join(__dirname, "..", "src", "app", "actions", "account.ts"),
    "utf8",
  );

  it('starts with "use server" and never logs, throws, or reads zod messages', () => {
    expect(source.split("\n")[0].trim()).toBe('"use server";');
    const offenders = source
      .split("\n")
      .filter((l) => !l.trim().startsWith("//"))
      .filter((l) => /console\.|throw |\.message/.test(l));
    expect(offenders).toEqual([]);
  });
});
