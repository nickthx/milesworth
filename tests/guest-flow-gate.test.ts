import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// Phase 4/5 guest-flow gates promoted from plan-time greps into a permanent
// test. The guest flow (/, /methodology, /privacy, /og) must stay untouched
// by the account work: no DB driver or Clerk server code can reach the client
// bundle (T-06-05), no static route may read request context (T-06-16), and
// user data may never FK into the seeded tables (T-06-15 / Pitfall 6).

const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src");

/** Every .ts/.tsx under `dir`, as POSIX-style paths relative to `dir`. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true })
    .map(String)
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .map((f) => f.replace(/\\/g, "/"))
    .sort();
}

function read(...parts: string[]): string {
  return readFileSync(join(ROOT, ...parts), "utf8");
}

describe("src/components/** stays free of server-only code (T-06-05)", () => {
  const dir = join(SRC, "components");
  const files = sourceFiles(dir);

  it("has component files to scan", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  const forbidden = [
    'from "@/db',
    "drizzle-orm",
    "@clerk/nextjs/server",
    "CLERK_SECRET_KEY",
  ];

  for (const token of forbidden) {
    it(`no component contains ${token}`, () => {
      for (const file of files) {
        expect(readFileSync(join(dir, file), "utf8"), file).not.toContain(
          token,
        );
      }
    });
  }
});

describe("static and cached routes never read auth or the database (T-06-16)", () => {
  it("src/app/page.tsx does not force dynamic rendering", () => {
    expect(read("src", "app", "page.tsx")).not.toContain(
      "export const dynamic",
    );
  });

  const routes: [string, string[]][] = [
    ["methodology", ["src", "app", "methodology", "page.tsx"]],
    ["privacy", ["src", "app", "privacy", "page.tsx"]],
    ["og", ["src", "app", "og", "route.tsx"]],
  ];

  for (const [name, parts] of routes) {
    it(`/${name} imports neither Clerk server helpers nor the database`, () => {
      const source = read(...parts);
      expect(source).not.toContain("@clerk/nextjs/server");
      expect(source).not.toContain('from "@/db');
    });
  }
});

describe("Clerk proxy is public by default (T-06-01 / T-06-08)", () => {
  it("src/proxy.ts exports clerkMiddleware() and protects nothing", () => {
    expect(existsSync(join(SRC, "proxy.ts"))).toBe(true);
    const source = read("src", "proxy.ts");
    expect(source).toContain("export default clerkMiddleware()");
    expect(source).not.toContain("auth.protect");
  });

  it("no middleware.ts exists (Next 16 renamed it; a stale one would not run)", () => {
    expect(existsSync(join(SRC, "middleware.ts"))).toBe(false);
    expect(existsSync(join(ROOT, "middleware.ts"))).toBe(false);
  });
});

describe("user tables FK only into users, never into seeded tables (T-06-15)", () => {
  const schema = read("src", "db", "schema.ts");
  const start = schema.indexOf('pgTable("users"');
  const userBlock = schema.slice(start);

  it('the user-table block follows pgTable("users"', () => {
    expect(start).toBeGreaterThan(-1);
  });

  it("exactly three cascade references to users.clerkUserId", () => {
    const count = userBlock.match(/references\(\(\) => users\.clerkUserId/g);
    expect(count).toHaveLength(3);
  });

  it("zero references into programs or redemptions", () => {
    expect(userBlock).not.toContain("references(() => programs");
    expect(userBlock).not.toContain("references(() => redemptions");
  });
});

describe("the @/db importer set is exactly the three server files (T-06-05)", () => {
  it("under src/app, src/components, src/lib", () => {
    const importers: string[] = [];
    for (const top of ["app", "components", "lib"]) {
      const dir = join(SRC, top);
      for (const file of sourceFiles(dir)) {
        if (readFileSync(join(dir, file), "utf8").includes('from "@/db')) {
          importers.push(`src/${top}/${file}`);
        }
      }
    }
    expect(importers.sort()).toEqual([
      "src/app/actions/account.ts",
      "src/app/actions/interest.ts",
      "src/lib/server/account-data.ts",
    ]);
  });
});
