// Destination-imagery pipeline (PLAT-05). Implements the CLAUDE.md contract:
// source once, pre-crop to a consistent editorial ratio, WebP ~1600w, commit,
// then expose through the typed manifest in src/images/destinations.ts.
//   src/images/raw/<slug>.{jpg,jpeg,png,webp}  (gitignored sources)
//     → src/images/destinations/<slug>.webp    (3:2, 1600×1067, q75, effort 6)
// T-07-05: sharp re-encodes without carrying source metadata across, so EXIF
// and GPS never reach a committed file.
// T-07-09: a slug is only ever the capture group of SLUG_FILE_RE (directory
// listing) or an argv value that passed SLUG_RE. Nothing else becomes a path
// segment; input and output directories are fixed.
// No env load — this script never touches the database.
// Run with: npm run images:optimize            (every file in src/images/raw/)
//           npm run images:optimize -- tokyo kyoto   (restrict to these slugs)

import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";

const RAW_DIR = join("src", "images", "raw");
const OUT_DIR = join("src", "images", "destinations");

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_FILE_RE = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.(jpe?g|png|webp)$/;

const WIDTH = 1600;
const HEIGHT = 1067;
const MAX_BYTES = 204800; // 200 KB per file (UI-SPEC Imagery Contract — Asset)

async function main(): Promise<void> {
  if (!existsSync(RAW_DIR)) {
    console.error(
      "src/images/raw/ is missing — drop source photos there as <slug>.jpg",
    );
    process.exit(1);
  }

  // slug → source filename. Entries that do not match are ignored outright.
  const sources = new Map<string, string>();
  for (const entry of readdirSync(RAW_DIR)) {
    const match = SLUG_FILE_RE.exec(entry);
    if (match === null) continue;
    const slug = match[1];
    if (!sources.has(slug)) sources.set(slug, entry);
  }

  const requested = process.argv.slice(2);
  for (const arg of requested) {
    if (!SLUG_RE.test(arg)) {
      console.error(`invalid slug argument: ${JSON.stringify(arg)}`);
      process.exit(1);
    }
    if (!sources.has(arg)) {
      console.error(`no source photo in src/images/raw/ for slug: ${arg}`);
      process.exit(1);
    }
  }

  const slugs = (requested.length > 0 ? requested : [...sources.keys()]).sort();
  if (slugs.length === 0) {
    console.error("src/images/raw/ holds no <slug>.jpg|png|webp source photos");
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const offenders: string[] = [];
  for (const slug of slugs) {
    const source = sources.get(slug);
    // Both values passed their regex above; re-assert before building paths.
    if (source === undefined || !SLUG_RE.test(slug)) continue;
    if (!SLUG_FILE_RE.test(source)) continue;
    const input = join(RAW_DIR, source);
    const output = join(OUT_DIR, `${slug}.webp`);

    await sharp(input)
      .resize({
        width: WIDTH,
        height: HEIGHT,
        fit: "cover",
        position: "attention",
      })
      .webp({ quality: 75, effort: 6 })
      .toFile(output);

    const meta = await sharp(output).metadata();
    const bytes = statSync(output).size;
    console.log(`${slug} ${meta.width}x${meta.height} ${bytes} B`);

    if (meta.width !== WIDTH || meta.height !== HEIGHT) {
      offenders.push(`${slug} (${meta.width}x${meta.height}, want 1600x1067)`);
    }
    if (bytes > MAX_BYTES) {
      offenders.push(`${slug} (${bytes} B > ${MAX_BYTES} B)`);
    }
  }

  if (offenders.length > 0) {
    console.error(`image gate failed: ${offenders.join("; ")}`);
    process.exit(1);
  }

  console.log(`optimized: ${slugs.length} image(s)`);
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error(
    "optimize-images failed:",
    err instanceof Error ? err.message : String(err),
  );
  process.exit(1);
});
