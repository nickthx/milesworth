import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  filterKnownBookmarks,
  rowsToBalances,
} from "../src/lib/server/account-data";

// ACCT-01/02/03 read path. The two pure helpers are exercised directly; the
// I/O function (loadAccountSnapshot) is not called here — importing the module
// pulls "@/db", whose lazy Proxy never connects, so no DATABASE_URL is needed.
// T-06-15: unknown bookmark slugs are dropped at read time (no FK into the
// seeded tables). T-06-03: balance rows are re-checked on the way out even
// though the write side already validated them (defense in depth).

const KNOWN = [{ slug: "a" }, { slug: "b" }];

describe("filterKnownBookmarks (read-time filter — T-06-15)", () => {
  it("drops unknown slugs, dedupes, and preserves first-seen order", () => {
    expect(filterKnownBookmarks(["a", "zzz", "a", "b"], KNOWN)).toEqual([
      "a",
      "b",
    ]);
  });

  it("keeps first-seen order when a later slug appears before an earlier one", () => {
    expect(filterKnownBookmarks(["b", "a", "b"], KNOWN)).toEqual(["b", "a"]);
  });

  it("returns [] for empty input", () => {
    expect(filterKnownBookmarks([], KNOWN)).toEqual([]);
  });

  it("returns [] when nothing is known", () => {
    expect(filterKnownBookmarks(["a", "b"], [])).toEqual([]);
  });
});

describe("rowsToBalances (defense-in-depth on stored rows — T-06-03)", () => {
  it("keeps only enterable slugs with positive safe integers within the ceiling", () => {
    expect(
      rowsToBalances([
        { programSlug: "chase-ur", points: 90000 },
        { programSlug: "delta", points: 5 },
        { programSlug: "amex-mr", points: 0 },
        { programSlug: "bilt", points: 10_000_001 },
      ]),
    ).toEqual({ "chase-ur": 90000 });
  });

  it("returns null when every row is dropped", () => {
    expect(
      rowsToBalances([
        { programSlug: "delta", points: 5 },
        { programSlug: "amex-mr", points: -1 },
        { programSlug: "bilt", points: 1.5 },
      ]),
    ).toBeNull();
  });

  it("returns null for []", () => {
    expect(rowsToBalances([])).toBeNull();
  });

  it("keeps every enterable program when all rows are valid", () => {
    expect(
      rowsToBalances([
        { programSlug: "chase-ur", points: 1 },
        { programSlug: "amex-mr", points: 10_000_000 },
      ]),
    ).toEqual({ "chase-ur": 1, "amex-mr": 10_000_000 });
  });
});

describe("account-data source scan (server-only DB reader — T-06-04 / T-06-05)", () => {
  const source = readFileSync(
    join(__dirname, "..", "src", "lib", "server", "account-data.ts"),
    "utf8",
  );

  it('imports the database (it is the read path, not a component)', () => {
    expect(source).toContain('from "@/db"');
  });

  it('contains no "use client" directive', () => {
    expect(source).not.toContain('"use client"');
  });

  it("never logs (neutral failure returns null)", () => {
    const logging = source
      .split("\n")
      .filter((l) => !l.trim().startsWith("//") && l.includes("console."));
    expect(logging).toEqual([]);
  });
});
