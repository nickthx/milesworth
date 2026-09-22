import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// PLAT-02 launch flip (07-09) pinned as a permanent source scan. The flip has
// a safe order — the private /account route gets its own noindex BEFORE the
// site-wide one is lifted (06-REVIEW IN-05, T-07-06) — and a fixed shape:
// robots.txt disallows /account, sitemap.xml lists only the three public
// pages (T-07-15), and none of the metadata routes may read a clock, auth,
// or the database, which would silently make them dynamic (T-07-26, the
// T-05-05 precedent). Any regression on any of these fails CI, not a
// recruiter's search.

const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src");

function read(...parts: string[]): string {
  return readFileSync(join(ROOT, ...parts), "utf8");
}

const ACCOUNT = "src/app/account/page.tsx";
const ROBOTS = "src/app/robots.ts";
const SITEMAP = "src/app/sitemap.ts";
const SITE = "src/lib/site.ts";

describe("/account is noindex at the route level (06-REVIEW IN-05 / T-07-06)", () => {
  it("account/page.tsx metadata carries robots: { index: false, follow: false }", () => {
    expect(read("src", "app", "account", "page.tsx"), ACCOUNT).toMatch(
      /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/,
    );
  });
});

describe("robots.txt allows the site and disallows /account (T-07-06)", () => {
  it("src/app/robots.ts exists", () => {
    expect(existsSync(join(SRC, "app", "robots.ts")), ROBOTS).toBe(true);
  });

  it("allows /, disallows /account, and advertises the sitemap", () => {
    const source = read("src", "app", "robots.ts");
    expect(source, ROBOTS).toContain('allow: "/"');
    expect(source, ROBOTS).toContain('disallow: "/account"');
    expect(source, ROBOTS).toContain("sitemap.xml");
    expect(source, ROBOTS).toContain("SITE_URL");
  });
});

describe("sitemap.xml lists exactly the public pages (T-07-15)", () => {
  it("src/app/sitemap.ts exists", () => {
    expect(existsSync(join(SRC, "app", "sitemap.ts")), SITEMAP).toBe(true);
  });

  it("lists /methodology and /privacy", () => {
    const source = read("src", "app", "sitemap.ts");
    expect(source, SITEMAP).toContain("/methodology");
    expect(source, SITEMAP).toContain("/privacy");
  });

  it("never lists /account or /og", () => {
    const source = read("src", "app", "sitemap.ts");
    expect(source, SITEMAP).not.toContain("/account");
    expect(source, SITEMAP).not.toContain("/og");
  });

  it("src/lib/site.ts pins SITE_LAST_MODIFIED to a constant ISO date (T-05-05)", () => {
    expect(read("src", "lib", "site.ts"), SITE).toMatch(
      /SITE_LAST_MODIFIED = "\d{4}-\d{2}-\d{2}"/,
    );
  });
});

describe("metadata routes stay static: no clock, no auth, no database (T-07-26)", () => {
  const routes: [string, string[]][] = [
    ["robots.txt", ["src", "app", "robots.ts"]],
    ["sitemap.xml", ["src", "app", "sitemap.ts"]],
  ];

  const forbidden = [
    "new Date",
    "@clerk/nextjs/server",
    'from "@/db',
    "export const dynamic",
  ];

  for (const [name, parts] of routes) {
    for (const token of forbidden) {
      it(`/${name} does not contain ${token}`, () => {
        expect(read(...parts), parts.join("/")).not.toContain(token);
      });
    }
  }
});

// part 2 (07-09 Task 2): the site-wide gate is lifted and SEO is a hard assertion

describe("the site-wide noindex is gone and SEO is a hard Lighthouse assertion (07-09 Task 2)", () => {
  const LAYOUT = "src/app/layout.tsx";
  const LHCI = "config/lighthouserc.cjs";

  it("layout.tsx carries no robots index: false directive", () => {
    expect(read("src", "app", "layout.tsx"), LAYOUT).not.toMatch(
      /index:\s*false/,
    );
  });

  it("layout.tsx never mentions noindex, even in a comment", () => {
    expect(read("src", "app", "layout.tsx"), LAYOUT).not.toMatch(/noindex/i);
  });

  it("lighthouserc.cjs asserts categories:seo at the error level", () => {
    expect(read("config", "lighthouserc.cjs"), LHCI).toMatch(
      /"categories:seo":\s*\[\s*"error"/,
    );
  });
});

// part 3 (07-09 Task 3) below
