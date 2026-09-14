import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  balancesSchema,
  bookmarkSlugSchema,
  goalIdSchema,
  goalSchema,
} from "../src/lib/account-validation";
import { redemptions } from "../src/data";

// ACCT-01/02/03 write-boundary tests. Every account Server Action input —
// balances, bookmark slugs, goal text, goal ids — is attacker-controllable
// (T-06-03), so each schema is exercised with a hostile-input table alongside
// the legitimate shapes. Nothing here touches the database or Clerk: the
// schemas must reject junk before any DB code runs, and they run in the node
// environment with no jsdom.

const ALL_EIGHT_AT_CEILING = {
  "chase-ur": 10_000_000,
  "amex-mr": 10_000_000,
  "capital-one": 10_000_000,
  "citi-ty": 10_000_000,
  bilt: 10_000_000,
  "world-of-hyatt": 10_000_000,
  "hilton-honors": 10_000_000,
  "marriott-bonvoy": 10_000_000,
};

describe("balancesSchema (ACCT-01 saved-balances boundary)", () => {
  it("accepts an empty object (a user who cleared every balance)", () => {
    const result = balancesSchema.safeParse({});
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual({});
  });

  it("accepts a partial two-program set with numbers unchanged", () => {
    const input = { "chase-ur": 90_000, "world-of-hyatt": 1 };
    const result = balancesSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(input);
  });

  it("accepts all 8 enterable slugs at the 10_000_000 ceiling", () => {
    const result = balancesSchema.safeParse(ALL_EIGHT_AT_CEILING);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(ALL_EIGHT_AT_CEILING);
  });

  it("rejects an unknown program key (delta is not enterable)", () => {
    expect(balancesSchema.safeParse({ delta: 1 }).success).toBe(false);
  });

  it("rejects a negative balance", () => {
    expect(balancesSchema.safeParse({ "chase-ur": -1 }).success).toBe(false);
  });

  it("rejects a zero balance (0 is omitted, never stored)", () => {
    expect(balancesSchema.safeParse({ "chase-ur": 0 }).success).toBe(false);
  });

  it("rejects a fractional balance", () => {
    expect(balancesSchema.safeParse({ "chase-ur": 1.5 }).success).toBe(false);
  });

  it("rejects a numeric string (no coercion at this boundary)", () => {
    expect(balancesSchema.safeParse({ "chase-ur": "90000" }).success).toBe(
      false,
    );
  });

  it("rejects a balance above MAX_BALANCE (10_000_001)", () => {
    expect(balancesSchema.safeParse({ "chase-ur": 10_000_001 }).success).toBe(
      false,
    );
  });

  it("rejects null", () => {
    expect(balancesSchema.safeParse(null).success).toBe(false);
  });

  it("rejects an array", () => {
    expect(balancesSchema.safeParse([]).success).toBe(false);
  });

  it("rejects a bare string", () => {
    expect(balancesSchema.safeParse("x").success).toBe(false);
  });
});

describe("bookmarkSlugSchema (ACCT-02 bookmark boundary)", () => {
  it("accepts every slug in the curated redemptions dataset", () => {
    expect(redemptions.length).toBeGreaterThan(0);
    for (const { slug } of redemptions) {
      const result = bookmarkSlugSchema.safeParse(slug);
      expect(result.success, slug).toBe(true);
    }
  });

  it("rejects a slug that is not in the dataset", () => {
    expect(bookmarkSlugSchema.safeParse("not-a-redemption").success).toBe(
      false,
    );
  });

  it("rejects an empty string", () => {
    expect(bookmarkSlugSchema.safeParse("").success).toBe(false);
  });

  it("rejects a number", () => {
    expect(bookmarkSlugSchema.safeParse(42).success).toBe(false);
  });

  it("rejects null", () => {
    expect(bookmarkSlugSchema.safeParse(null).success).toBe(false);
  });
});

describe("goalSchema (ACCT-03 travel-goal boundary)", () => {
  it("trims padded goal text", () => {
    const result = goalSchema.safeParse({ text: "  Tokyo in J  " });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.text).toBe("Tokyo in J");
  });

  it("accepts text of exactly 280 chars after trim", () => {
    const text = "a".repeat(280);
    const result = goalSchema.safeParse({ text: `  ${text}  ` });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.text).toHaveLength(280);
  });

  it("accepts empty-string optionals (what an untouched FormData field submits)", () => {
    const result = goalSchema.safeParse({
      text: "Maldives",
      destination: "",
      targetDate: "",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.destination).toBe("");
    expect(result.data.targetDate).toBe("");
  });

  it("accepts absent optionals", () => {
    const result = goalSchema.safeParse({ text: "Maldives" });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.destination).toBeUndefined();
    expect(result.data.targetDate).toBeUndefined();
  });

  it("accepts an ISO yyyy-mm-dd target date", () => {
    const result = goalSchema.safeParse({
      text: "Maldives",
      targetDate: "2027-03-01",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.targetDate).toBe("2027-03-01");
  });

  it("rejects empty text", () => {
    expect(goalSchema.safeParse({ text: "" }).success).toBe(false);
  });

  it("rejects whitespace-only text (empty after trim)", () => {
    expect(goalSchema.safeParse({ text: "   " }).success).toBe(false);
  });

  it("rejects 281-char text", () => {
    expect(goalSchema.safeParse({ text: "a".repeat(281) }).success).toBe(false);
  });

  it("rejects an 81-char destination", () => {
    expect(
      goalSchema.safeParse({ text: "Maldives", destination: "d".repeat(81) })
        .success,
    ).toBe(false);
  });

  it("rejects a US-format date (03/01/2027)", () => {
    expect(
      goalSchema.safeParse({ text: "Maldives", targetDate: "03/01/2027" })
        .success,
    ).toBe(false);
  });

  it("rejects an impossible ISO date (month 13)", () => {
    expect(
      goalSchema.safeParse({ text: "Maldives", targetDate: "2027-13-01" })
        .success,
    ).toBe(false);
  });

  it("rejects non-string text (42)", () => {
    expect(goalSchema.safeParse({ text: 42 }).success).toBe(false);
  });

  it("rejects null text", () => {
    expect(goalSchema.safeParse({ text: null }).success).toBe(false);
  });
});

describe("goalIdSchema (ACCT-03 hidden-input id, T-06-02)", () => {
  it('coerces the FormData string "12" to the number 12', () => {
    const result = goalIdSchema.safeParse("12");
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toBe(12);
  });

  it('rejects a non-numeric string ("abc")', () => {
    expect(goalIdSchema.safeParse("abc").success).toBe(false);
  });

  it('rejects a negative id ("-1")', () => {
    expect(goalIdSchema.safeParse("-1").success).toBe(false);
  });

  it('rejects zero ("0")', () => {
    expect(goalIdSchema.safeParse("0").success).toBe(false);
  });

  it('rejects a fractional id ("1.5")', () => {
    expect(goalIdSchema.safeParse("1.5").success).toBe(false);
  });

  it("rejects an empty string (Number('') is 0)", () => {
    expect(goalIdSchema.safeParse("").success).toBe(false);
  });

  it("rejects null (Number(null) is 0)", () => {
    expect(goalIdSchema.safeParse(null).success).toBe(false);
  });
});

describe("purity (DB-free, framework-free, server-importable)", () => {
  const source = readFileSync(
    join(__dirname, "..", "src", "lib", "account-validation.ts"),
    "utf8",
  );

  it('has no "use client" directive', () => {
    expect(source).not.toContain('"use client"');
  });

  it("never imports the DB barrel", () => {
    expect(source).not.toContain('from "@/db');
  });

  it("never references drizzle", () => {
    expect(source).not.toContain("drizzle");
  });

  it("never references Clerk", () => {
    expect(source).not.toContain("@clerk");
  });
});
