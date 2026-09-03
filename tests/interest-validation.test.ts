import { describe, expect, it } from "vitest";

import { interestSchema } from "../src/lib/interest-validation";

// PLAT-04 waitlist boundary tests. The advisor-tease form posts FormData that
// is entirely attacker-controllable (T-05-03), so the schema is exercised
// with a hostile-input table — malformed, empty, non-string, oversized, and
// bot-filled honeypot — alongside the happy-path normalization. Nothing here
// touches the database: the schema must reject junk before any DB code runs.

describe("interestSchema (PLAT-04 waitlist email boundary)", () => {
  it("trims and lowercases a padded mixed-case email", () => {
    const result = interestSchema.safeParse({ email: " Nick@Example.com " });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.email).toBe("nick@example.com");
    expect(result.data.website).toBeUndefined();
  });

  it("accepts an empty honeypot string (the value a human's browser submits)", () => {
    const result = interestSchema.safeParse({
      email: "nick@example.com",
      website: "",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.email).toBe("nick@example.com");
    expect(result.data.website).toBe("");
  });

  it("rejects a string that is not an email", () => {
    expect(interestSchema.safeParse({ email: "not-an-email" }).success).toBe(
      false,
    );
  });

  it("rejects an empty email", () => {
    expect(interestSchema.safeParse({ email: "" }).success).toBe(false);
  });

  it("rejects a non-string email (42)", () => {
    expect(interestSchema.safeParse({ email: 42 }).success).toBe(false);
  });

  it("rejects an oversized email (255+ chars, RFC 5321 cap)", () => {
    const email = "a".repeat(250) + "@x.io";
    expect(email.length).toBeGreaterThan(254);
    expect(interestSchema.safeParse({ email }).success).toBe(false);
  });

  it("rejects a filled honeypot (bot submission)", () => {
    expect(
      interestSchema.safeParse({
        email: "nick@example.com",
        website: "http://spam.example",
      }).success,
    ).toBe(false);
  });

  it("rejects a null honeypot (only \"\" or absent is accepted)", () => {
    expect(
      interestSchema.safeParse({ email: "nick@example.com", website: null })
        .success,
    ).toBe(false);
  });

  it("rejects a File honeypot (multipart submission smuggling a file into a text field)", () => {
    const result = interestSchema.safeParse({
      email: "nick@example.com",
      website: new File(["spam"], "spam.txt", { type: "text/plain" }),
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    // The Server Action routes on this path to return the bot success copy.
    expect(result.error.issues.some((issue) => issue.path[0] === "website")).toBe(
      true,
    );
  });
});
