import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CREAM, INK, TERRACOTTA } from "../src/lib/brand";

// Phase 7 design-system gates (PLAT-05 editorial consistency, PLAT-02 WebView
// safety) as a permanent source scan. The brand palette has two
// representations — src/lib/brand.ts for TypeScript consumers and the @theme
// block in globals.css — and CSS cannot import TS, so equality is asserted
// here: changing either side alone fails (T-07-04, which also forbids any
// runtime third-party image source). The vendored shadcn primitives are edited
// in place, so a future re-vendor could silently reintroduce the third font
// weight or the desktop 14px input; the scan catches that (T-07-12). brand.ts
// ships to every visitor and must stay literal-only (T-07-17).

const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src");

/** Every .ts/.tsx/.css under `dir`, as POSIX-style paths relative to `dir`. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true })
    .map(String)
    .filter((f) => /\.(ts|tsx|css)$/.test(f))
    .map((f) => f.replace(/\\/g, "/"))
    .sort();
}

function read(...parts: string[]): string {
  return readFileSync(join(ROOT, ...parts), "utf8");
}

const GLOBALS = "src/app/globals.css";

describe("PLAT-05 tokens (07-02)", () => {
  const css = read("src", "app", "globals.css");

  it("defines the 28px heading token with its line-height companion", () => {
    expect(css, GLOBALS).toMatch(/--text-heading:\s*1\.75rem/);
    expect(css, GLOBALS).toMatch(/--text-heading--line-height:\s*1\.2/);
  });

  const palette = [
    `--color-cream: ${CREAM}`,
    `--color-ink: ${INK}`,
    `--color-terracotta: ${TERRACOTTA}`,
  ];

  for (const declaration of palette) {
    it(`globals.css carries the brand.ts value: ${declaration}`, () => {
      expect(css, GLOBALS).toContain(declaration);
    });
  }

  const required = [
    "@utility pb-safe",
    "color-scheme: light",
    "@custom-variant dark",
  ];

  for (const token of required) {
    it(`globals.css contains ${token}`, () => {
      expect(css, GLOBALS).toContain(token);
    });
  }

  it("has no .dark block (the variant stays declared so dark: classes remain inert)", () => {
    expect(css, GLOBALS).not.toMatch(/^\.dark\s*\{/m);
  });

  const forbidden = ["color-mix(", "--sidebar", "--chart-"];

  for (const token of forbidden) {
    it(`globals.css does not contain ${token}`, () => {
      expect(css, GLOBALS).not.toContain(token);
    });
  }

  it("keeps exactly one oklch( value — the destructive token; every neutral derives from ink", () => {
    expect(css.split("oklch(").length - 1, GLOBALS).toBe(1);
  });
});

describe("vendored primitives obey the two-weight / 16px contract (UI-SPEC A12)", () => {
  const dir = join(SRC, "components", "ui");
  const files = sourceFiles(dir);

  it("has vendored primitives to scan", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("no vendored primitive contains font-medium", () => {
    for (const file of files) {
      expect(readFileSync(join(dir, file), "utf8"), file).not.toContain(
        "font-medium",
      );
    }
  });

  it("ui/input.tsx never shrinks below 16px on desktop", () => {
    expect(
      read("src", "components", "ui", "input.tsx"),
      "src/components/ui/input.tsx",
    ).not.toContain("md:text-sm");
  });
});

describe("brand colors have one source (T-07-04 hotlink / drift)", () => {
  it("src/app/og/route.tsx reads brand.ts and holds no six-digit hex literal", () => {
    const source = read("src", "app", "og", "route.tsx");
    expect(source, "src/app/og/route.tsx").toContain('from "@/lib/brand"');
    expect(source, "src/app/og/route.tsx").not.toMatch(/#[0-9a-fA-F]{6}/);
  });

  it("src/lib/brand.ts is literal-only — no environment read ships to the client (T-07-17)", () => {
    expect(read("src", "lib", "brand.ts"), "src/lib/brand.ts").not.toContain(
      "process.env",
    );
  });

  for (const token of ["remotePatterns", "images.unsplash.com"]) {
    it(`next.config.ts does not contain ${token}`, () => {
      expect(read("next.config.ts"), "next.config.ts").not.toContain(token);
    });
  }
});

describe("PLAT-02 viewport-height units never lie inside WebViews", () => {
  const VIEWPORT_UNIT = /\b(h-screen|min-h-screen|h-dvh|\d+vh|\d+dvh)\b/;

  it("the pattern catches raw and arbitrary-value units and ignores h-full", () => {
    expect(VIEWPORT_UNIT.test("100dvh")).toBe(true);
    expect(VIEWPORT_UNIT.test("min-h-[100vh]")).toBe(true);
    expect(VIEWPORT_UNIT.test("h-full")).toBe(false);
  });

  it("no source file under src uses a viewport-height unit", () => {
    const files = sourceFiles(SRC);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(readFileSync(join(SRC, file), "utf8"), file).not.toMatch(
        VIEWPORT_UNIT,
      );
    }
  });
});

describe("accent budget (UI-SPEC: terracotta only on the hero, the CTA, the bonus badge)", () => {
  // share-link.tsx arrives in 07-05; core-experience.tsx leaves the set there.
  const ALLOWED = ["core-experience.tsx", "result-card.tsx", "share-link.tsx"];

  /**
   * Lines of real code naming the accent. Block comments are stripped from the
   * whole source first — that removes JSX comment bodies too, including
   * multi-line continuations a line-prefix filter would miss — then `//` lines
   * are dropped.
   */
  function accentLines(source: string): string[] {
    return source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .filter((line) => !line.trim().startsWith("//"))
      .filter((line) => line.includes("terracotta"));
  }

  it("strips multi-line block comments before looking for the accent", () => {
    const sample = [
      "<h1>",
      "  {/* Ink, not",
      "      terracotta — the delta is the drama. */}",
      "  // terracotta in a line comment",
      "</h1>",
    ].join("\n");
    expect(accentLines(sample)).toEqual([]);
    expect(accentLines('<p className="text-terracotta" />')).toHaveLength(1);
  });

  it("only the budgeted components use the accent in code", () => {
    const dir = join(SRC, "components");
    const users = sourceFiles(dir)
      .filter((file) => file.endsWith(".tsx"))
      .filter(
        (file) => accentLines(readFileSync(join(dir, file), "utf8")).length > 0,
      );
    expect(users.length).toBeGreaterThan(0);
    for (const file of users) {
      expect(ALLOWED, file).toContain(file);
    }
  });
});

// extended in 07-04 (type sweep) and 07-05 (WebView pins)

describe("PLAT-05 type sweep + chrome (07-04)", () => {
  // One heading size token everywhere, 44px nav targets, a safe-area footer
  // with the photo credit (T-07-14), same-tab outbound links (T-07-20), and
  // the two designed states free of server-only imports (T-07-19).
  const codeFiles = sourceFiles(SRC).filter((file) => /\.tsx?$/.test(file));

  const HEADER = "src/components/site-header.tsx";
  const FOOTER = "src/components/site-footer.tsx";
  const NOT_FOUND = "src/app/not-found.tsx";
  const LOADING = "src/app/account/loading.tsx";
  const DIALOG = "src/components/account/delete-account-dialog.tsx";

  it("has source files to scan", () => {
    expect(codeFiles.length).toBeGreaterThan(0);
  });

  it("no source file carries the arbitrary text-[1.75rem] heading size", () => {
    for (const file of codeFiles) {
      expect(readFileSync(join(SRC, file), "utf8"), file).not.toContain(
        "text-[1.75rem]",
      );
    }
  });

  it("no source file uses the undeclared text-lg size as a class token", () => {
    const TEXT_LG = /\btext-lg\b/;
    expect(TEXT_LG.test("font-heading text-lg font-semibold")).toBe(true);
    expect(TEXT_LG.test("text-heading")).toBe(false);
    for (const file of codeFiles) {
      expect(readFileSync(join(SRC, file), "utf8"), file).not.toMatch(TEXT_LG);
    }
  });

  it("no source file opens a new window (WebView-safe same-tab links)", () => {
    for (const file of codeFiles) {
      const source = readFileSync(join(SRC, file), "utf8");
      expect(source, file).not.toContain('target="_blank"');
      expect(source, file).not.toContain('rel="noreferrer"');
    }
  });

  it("site-header.tsx types the masthead with the heading token and keeps a 44px link", () => {
    const source = read("src", "components", "site-header.tsx");
    expect(source, HEADER).toContain("text-heading");
    expect(source, HEADER).toContain("min-h-11");
  });

  it("site-footer.tsx has safe-area padding, the photo credit, and two 44px links", () => {
    const source = read("src", "components", "site-footer.tsx");
    expect(source, FOOTER).toContain("pb-safe");
    // 07-05 Task 3 and 07-08 Task 3 reconcile the wording against the image
    // manifest's sources, so every valid form is accepted here.
    expect(source, FOOTER).toMatch(
      /Photos via (Unsplash( and Pexels)?|Pexels)/,
    );
    expect(source.split("min-h-11").length - 1, FOOTER).toBeGreaterThanOrEqual(
      2,
    );
  });

  it("not-found.tsx is a server component with the locked copy and no server-only imports", () => {
    expect(existsSync(join(ROOT, NOT_FOUND)), NOT_FOUND).toBe(true);
    const source = read("src", "app", "not-found.tsx");
    expect(source.split("\n")[0].trim(), NOT_FOUND).not.toBe('"use client";');
    expect(source, NOT_FOUND).toContain("Page not found");
    expect(source, NOT_FOUND).toContain("Back to your results");
    expect(source, NOT_FOUND).not.toContain("@clerk/nextjs/server");
    expect(source, NOT_FOUND).not.toContain('from "@/db');
  });

  it("account/loading.tsx renders the locked copy without the page module, Clerk server, or the database", () => {
    expect(existsSync(join(ROOT, LOADING)), LOADING).toBe(true);
    const source = read("src", "app", "account", "loading.tsx");
    expect(source, LOADING).toContain("Loading your account");
    expect(source, LOADING).not.toContain("@clerk/nextjs/server");
    expect(source, LOADING).not.toContain('from "@/db');
    expect(source, LOADING).not.toContain('from "./page"');
  });

  it("delete-account-dialog.tsx types its title with the heading token", () => {
    expect(
      read("src", "components", "account", "delete-account-dialog.tsx"),
      DIALOG,
    ).toContain("text-heading");
  });
});
