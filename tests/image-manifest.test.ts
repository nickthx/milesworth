// Destination-imagery coverage gate (PLAT-05, T-07-04). Holds three sets in
// sync without a database: the seed's non-null imageSlug values, the WebP
// files under src/images/destinations/, and the entries in the typed manifest.
//
// Never import the manifest — vitest cannot load .webp. The manifest is read
// as SOURCE TEXT (readFileSync) and the assets as a directory listing
// (readdirSync); the seed is a plain in-memory import like seed-data.test.ts.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { redemptions } from "../src/data";

const IMAGES_DIR = join(__dirname, "..", "src", "images", "destinations");
const MANIFEST_PATH = join(__dirname, "..", "src", "images", "destinations.ts");
const MAX_BYTES = 204800;

const files = readdirSync(IMAGES_DIR).filter((f) => f.endsWith(".webp"));
const fileSlugs = new Set(files.map((f) => f.slice(0, -".webp".length)));
const manifest = readFileSync(MANIFEST_PATH, "utf8");
const manifestLines = manifest.split(/\r?\n/);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("image manifest coverage (PLAT-05)", () => {
  it("(a) every seed imageSlug has a committed WebP", () => {
    const seedSlugs = new Set(
      redemptions
        .map((r) => r.imageSlug)
        .filter((s): s is string => s !== null),
    );
    const missing = [...seedSlugs].filter((s) => !fileSlugs.has(s)).sort();
    expect(missing, `missing images: ${missing.join(", ")}`).toEqual([]);
  });

  it("(b) every WebP has a manifest import and entry — no orphans either way", () => {
    expect(fileSlugs.size).toBeGreaterThan(0);
    for (const slug of fileSlugs) {
      expect(
        manifest,
        `manifest lacks import for ${slug}`,
      ).toContain(`from "./destinations/${slug}.webp"`);
      const entryRe = new RegExp(`^\\s*"?${escapeRe(slug)}"?:`, "m");
      expect(entryRe.test(manifest), `manifest lacks entry for ${slug}`).toBe(
        true,
      );
    }
    // Reverse direction: every import in the manifest points at a real file.
    const imported = [
      ...manifest.matchAll(/from "\.\/destinations\/([a-z0-9-]+)\.webp"/g),
    ].map((m) => m[1]);
    const orphanEntries = imported.filter((s) => !fileSlugs.has(s));
    expect(
      orphanEntries,
      `manifest imports without a file: ${orphanEntries.join(", ")}`,
    ).toEqual([]);
    expect(new Set(imported).size).toBe(fileSlugs.size);
  });

  it("(c) every WebP is at or under the 200 KB gate", () => {
    const over = files
      .filter((f) => statSync(join(IMAGES_DIR, f)).size > MAX_BYTES)
      .map((f) => `${f} (${statSync(join(IMAGES_DIR, f)).size} B)`);
    expect(over, `over ${MAX_BYTES} B: ${over.join(", ")}`).toEqual([]);
  });

  it("(d) no runtime URL — http(s) only inside // comments; lookup exported", () => {
    const offending = manifestLines.filter((line) => {
      const commentAt = line.indexOf("//");
      const code = commentAt === -1 ? line : line.slice(0, commentAt);
      return /https?:\/\//.test(code);
    });
    expect(offending, `URL outside comments: ${offending.join(" | ")}`).toEqual(
      [],
    );
    expect(manifest).toContain("getDestinationImage");
    expect(manifest).toContain("satisfies Record<string, DestinationImage>");
  });

  it("(e) every entry carries an Unsplash or Pexels source credit", () => {
    // Entry shape only: a literal photographer followed by a literal source.
    // The DestinationImage interface line (`photographer: string; source:
    // "Unsplash" | "Pexels"`) does not match and is not counted.
    const credits =
      manifest.match(/credit: \{ photographer: "[^"]+", source: "[^"]+" \}/g) ??
      [];
    expect(credits.length, "one credit per WebP").toBe(fileSlugs.size);
    const bad = credits.filter(
      (c) => !/source: "(Unsplash|Pexels)" \}$/.test(c),
    );
    expect(bad, `unknown source: ${bad.join(" | ")}`).toEqual([]);
  });
});
