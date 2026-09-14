// SSR string assertions over the REAL /privacy page (ACCT-04 / T-06-10).
// The policy must name exactly the stores and processors the app actually
// has — the localStorage key, the Clerk account, the four account tables,
// the waitlist, and the three processors — and point at the deletion path.
// Pinning the section list here means a future edit that drops a disclosure
// fails a test instead of shipping a quietly narrower policy.
//
// No router mock: in the vitest node environment next/link renders as a plain
// <a href> under renderToStaticMarkup (see tests/methodology-page.test.ts).
// The source scan (T-06-16) borrows the same describe shape.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import PrivacyPage from "../src/app/privacy/page";
import { PRIVACY_CONTACT_EMAIL, PRIVACY_LAST_UPDATED } from "../src/lib/site";

// Rendered once; JSX escapes apostrophes as &#x27;, so decode for prose checks.
const html = renderToStaticMarkup(createElement(PrivacyPage)).replace(
  /&#x27;/g,
  "'",
);

/** Visible text only — attribute values (hrefs, classes) are not prose. */
const prose = html.replace(/<[^>]+>/g, " ");

const SECTION_HEADINGS = [
  "What we collect",
  "Who processes it",
  "What we never do",
  "Cookies",
  "Retention and deletion",
  "Consent",
  "Children and changes",
] as const;

describe("/privacy (ACCT-04)", () => {
  it("renders exactly one <h1> and it names Privacy", () => {
    const h1s = html.match(/<h1[^>]*>[^<]*<\/h1>/g) ?? [];
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toContain("Privacy");
  });

  it("renders all seven section headings verbatim, as <h2>, in order", () => {
    let cursor = 0;
    for (const heading of SECTION_HEADINGS) {
      const match = html.indexOf(`>${heading}</h2>`, cursor);
      expect(
        match,
        `missing or out-of-order <h2> "${heading}"`,
      ).toBeGreaterThan(-1);
      cursor = match;
    }
    expect(html.match(/<h2[^>]*>/g)).toHaveLength(SECTION_HEADINGS.length);
  });

  it("names every processor the app actually uses", () => {
    expect(html).toContain("Clerk");
    expect(html).toContain("Neon");
    expect(html).toContain("Vercel");
  });

  it("names the guest localStorage key exactly as balance-storage.ts defines it", () => {
    expect(html).toContain("pu:balances:v1");
  });

  it("points at the in-app deletion path", () => {
    expect(html).toContain("Delete my account");
    expect(html).toContain('href="/account"');
  });

  it("links to the methodology page", () => {
    expect(html).toContain('href="/methodology"');
  });

  it("renders the contact address as a mailto link from the site constant", () => {
    expect(PRIVACY_CONTACT_EMAIL).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
    expect(html).toContain(`href="mailto:${PRIVACY_CONTACT_EMAIL}"`);
    expect(prose).toContain(PRIVACY_CONTACT_EMAIL);
  });

  it("renders the Last updated line from the site constant, not a clock", () => {
    expect(PRIVACY_LAST_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(html).toMatch(
      new RegExp(`Last updated[^<]*${PRIVACY_LAST_UPDATED}`),
    );
  });

  it("never uses the accent color and never shouts", () => {
    expect(html).not.toContain("terracotta");
    expect(prose).not.toContain("!");
  });
});

describe("/privacy source scan (T-06-16 static, DB-free, auth-free route)", () => {
  const source = readFileSync(
    join(__dirname, "..", "src", "app", "privacy", "page.tsx"),
    "utf8",
  );

  it('contains no "use client" directive', () => {
    expect(source).not.toContain('"use client"');
  });

  it("reads no request-time input and forces no dynamic rendering", () => {
    expect(source).not.toContain("searchParams");
    expect(source).not.toContain("export const dynamic");
    expect(source).not.toContain("new Date");
  });

  it("never imports the database", () => {
    expect(source).not.toContain('from "@/db');
  });

  it("never imports Clerk's server entry point (auth() would make it dynamic)", () => {
    expect(source).not.toContain("@clerk/nextjs/server");
  });
});

describe("site footer (ACCT-04 link placement)", () => {
  const source = readFileSync(
    join(__dirname, "..", "src", "components", "site-footer.tsx"),
    "utf8",
  );

  it("links to /privacy exactly once", () => {
    expect((source.match(/href="\/privacy"/g) ?? []).length).toBe(1);
  });
});
