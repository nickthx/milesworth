# Phase 7: Editorial Polish & Launch - Pattern Map

**Mapped:** 2026-09-16
**Files analyzed:** 34 (14 new, 20 modified)
**Analogs found:** 30 / 34

Sources: `07-RESEARCH.md` (Recommended Project Structure, Patterns 1–7, Validation Architecture) and `07-UI-SPEC.md` (Design System "new hand-rolled pieces", Typography binding changes, Interaction/Layout/WebView contract, per-route audit). No CONTEXT.md exists for this phase.

Codebase conventions that every new file must follow are collected in **Shared Patterns** at the end — read that section first if you are writing a plan; the per-file sections reference it.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/brand.ts` (new) | config (constants) | static | `src/lib/site.ts` | exact |
| `src/app/globals.css` (mod) | config (tokens) | static | itself, `@theme` block lines 52–64 | exact |
| `src/images/destinations.ts` (new) | utility (typed manifest) | static lookup | `src/lib/balance-params.ts` `PARAM_KEY_BY_SLUG` (lines 20–29) | role-match |
| `src/images/destinations/*.webp` (new) | asset | static | `src/assets/fonts/*.woff` (vendored, header comment in `og/route.tsx` lines 15–20) | role-match |
| `scripts/optimize-images.ts` (new) | script | batch file-I/O | `scripts/seed.ts` | role-match |
| `src/components/result-card.tsx` (mod) | component | request-response (SSR) | itself + `src/components/ui/card.tsx` line 15 (img slot) | exact |
| `src/components/core-experience.tsx` (mod — copy-link + fallback; extract `share-link.tsx` if > 500 lines) | component (client island) | event-driven | itself lines 216–262; `src/components/save-balances-button.tsx` (client child) | exact |
| `src/lib/share-url.ts` (new) | utility (pure) | transform | `src/lib/share-content.ts` `toQueryString` (64–71); `src/app/account/page.tsx` `savedResultsHref` (46–52) | exact |
| `src/lib/in-app-browser.ts` (new) | utility (pure) | transform | `src/lib/balance-storage.ts` (pure, injected input) | role-match |
| `src/app/layout.tsx` (mod — `viewport` export, noindex removal) | config (root layout) | request-response | itself lines 31–63 (`metadata` export) | exact |
| `src/app/robots.ts` (new) | route (metadata file) | request-response (static) | `src/lib/site.ts` (SITE_URL, constant dates) + `src/app/methodology/page.tsx` static-route rules | role-match |
| `src/app/sitemap.ts` (new) | route (metadata file) | request-response (static) | same as robots.ts; `PRIVACY_LAST_UPDATED` constant-date precedent (`site.ts` 31–37) | role-match |
| `src/app/account/page.tsx` (mod — route noindex, `text-lg` → `text-heading`) | route (page) | request-response | itself + `layout.tsx` line 36 | exact |
| `src/app/not-found.tsx` (new) | route (page) | request-response | `src/app/error.tsx` | exact |
| `src/app/account/loading.tsx` (new) | route (loading) | request-response | `src/app/account/page.tsx` `Shell` (58–71) | exact |
| `src/components/site-header.tsx` (mod) | component | request-response | itself + `error.tsx` line 39 (h-11 box) | exact |
| `src/components/site-footer.tsx` (mod) | component | request-response | itself | exact |
| `src/components/ui/{button,card,dialog,input,label}.tsx` (mod) | component (vendored primitive) | — | themselves (grep lines below) | exact |
| `src/app/privacy/page.tsx` (mod — remove `target="_blank"`, `text-heading`) | route (page, static) | request-response | itself lines 96–113 | exact |
| `src/app/methodology/page.tsx` (mod — `text-heading`) | route (page, static) | request-response | itself | exact |
| `src/app/og/route.tsx` (mod — import brand constants) | route handler | request-response | itself lines 51–52, 135–136, 151 | exact |
| `src/components/account/bookmark-list.tsx` (mod) | component | request-response | itself line 34 | exact |
| `src/components/account/delete-account-dialog.tsx` (mod) | component | event-driven | itself lines 57–60 | exact |
| `src/components/{almost-there,advisor-tease}.tsx` (mod — `text-heading`) | component | request-response | `core-experience.tsx` line 103–104 (`SECTION_HEADING_CLASS`) | exact |
| `config/lighthouserc.cjs` (new) | config | batch | `vitest.config.ts` (only config-file precedent; CJS/`module.exports` has none) | partial |
| `package.json` (mod — `lighthouse` script, `sharp` devDep) | config | — | `"db:seed": "tsx scripts/seed.ts"` line 13 | exact |
| `.gitignore` (mod — `.lighthouseci/`, `raw/`) | config | — | itself (`/coverage`, `/.next/` block) | exact |
| `tests/design-system-gate.test.ts` (new) | test (source scan) | file-I/O | `tests/guest-flow-gate.test.ts` | exact |
| `tests/launch-gate.test.ts` (new) | test (source scan) | file-I/O | `tests/guest-flow-gate.test.ts` | exact |
| `tests/image-manifest.test.ts` (new) | test (fs ⟷ seed) | file-I/O | `tests/seed-data.test.ts` | exact |
| `tests/share-url.test.ts`, `tests/in-app-browser.test.ts` (new) | test (pure helper) | transform | `tests/balance-storage.test.ts`, `tests/balance-params.test.ts` | exact |
| `tests/result-card.test.ts` (new, optional) | test (SSR string) | request-response | `tests/methodology-page.test.ts` | role-match (see risk) |
| `src/data/redemptions-*.ts` (mod/new — dataset batches) | model (seed data) | static | `src/data/redemptions-hotels.ts` entry shape (14–37); `src/data/redemptions.ts` barrel | exact |
| `tests/seed-data.test.ts` (mod — raise floor) | test | — | itself lines 157–162 | exact |
| `README.md` (mod — rewrite) | docs | — | none (create-next-app boilerplate) | none |
| `src/app/favicon.ico` → branded + `src/app/apple-icon.png` (new) | asset | static | none (scaffold default) | none |
| `public/*.svg` (delete) | asset | — | none | none |

## Pattern Assignments

### `src/lib/brand.ts` (config constants, static)

**Analog:** `src/lib/site.ts` — the project's precedent for "one constant, many consumers, with a comment explaining why it lives here".

**Module shape** (`src/lib/site.ts` lines 1–14):
```ts
// The site's absolute origin, in ONE place (T-05-10). Every surface that
// needs the production host — metadataBase in layout.tsx, the footer line on
// the /og card — reads it from here, so pointing a custom domain at the app
// is a single env-var change and never leaves a social card advertising the
// old host while og:url advertises the new one.
// ...
/** Absolute origin, e.g. "https://milesworth.vercel.app". */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://milesworth.vercel.app";
```

**What brand.ts copies:** the same header-comment + `/** JSDoc */` + `export const` shape, three constants `CREAM = "#faf7f2"`, `INK = "#262119"`, `TERRACOTTA = "#b25429"` (UI-SPEC A3 re-tune). No env override — these are design tokens, not deployment config. Consumers: `layout.tsx` (`viewport.themeColor: CREAM`), `og/route.tsx` (replaces its local `CREAM`/`INK` at lines 51–52 and the literal `"#c05f33"` at line 151). `globals.css` cannot import TS — the design-system gate asserts the CSS hex strings equal the TS constants (UI-SPEC Color).

**Client-safety rule:** `site.ts` is already imported by the client island indirectly (`SITE_URL` is `NEXT_PUBLIC_` or constant), so `brand.ts` must likewise hold only literals — no `node:` imports, no secrets — because `core-experience.tsx` ships to every visitor (`core-experience.tsx` line 22 comment).

---

### `src/app/globals.css` (design tokens, static)

**Analog:** itself. The Tailwind v4 `@theme` block already carries the display scale; the heading token slots in beside it.

**Existing token block** (`globals.css` lines 52–64):
```css
/* D-13 warm editorial palette + display type scale (starting values — refined in Phase 7) */
@theme {
  --color-cream: #faf7f2; /* warm off-white page ground */
  --color-ink: #262119; /* warm near-black text */
  --color-terracotta: #c05f33; /* warm accent */

  --text-display: 3rem;
  --text-display--line-height: 1.1;
  --text-display--letter-spacing: -0.02em;
  --text-display-xl: 4.5rem;
  --text-display-xl--line-height: 1.05;
  --text-display-xl--letter-spacing: -0.025em;
}
```

**Changes to make here (UI-SPEC Typography + Color tables):**
- Add `--text-heading: 1.75rem; --text-heading--line-height: 1.2;` in this block (same `--text-<name>--line-height` companion convention as lines 58–63).
- Change `--color-terracotta` to `#b25429` (must equal `brand.ts`).
- Rewrite `:root` (lines 66–99): keep `--background`/`--foreground`/`--card`/`--radius`/`--destructive`; replace the achromatic `oklch(… 0 0)` neutrals with the UI-SPEC warm values (`rgb(38 33 25 / 0.12)` for `--border`, `/ 0.24` for `--input`, `#262119` for `--ring`/`--primary`, `#faf7f2` for `--primary-foreground`, `/ 0.05` for `--secondary`/`--muted`/`--accent`, `/ 0.7` for `--muted-foreground`). Delete `--chart-*` and `--sidebar-*` from both `:root` and the `@theme inline` map (lines 14–26).
- Delete the entire `.dark { … }` block (lines 101–133). **Keep** `@custom-variant dark (&:is(.dark *));` (line 5) — UI-SPEC A10.
- Add `html { color-scheme: light; }` inside `@layer base` (lines 135–145 — the existing `html { @apply font-sans; }` rule is the place).
- Add the safe-area utility after the `@theme` block: `@utility pb-safe { padding-bottom: max(--spacing(8), env(safe-area-inset-bottom)); }` (RESEARCH Pattern 3).

**No `color-mix()` in hand-written CSS** (UI-SPEC A4) — plain hex / `rgb(… / a)` only.

---

### `src/images/destinations.ts` (typed manifest, static lookup)

**Analog:** `src/lib/balance-params.ts` — the codebase's canonical "typed map with `as const satisfies Record<…>` + derived union type" pattern.

**Typed-map pattern** (`balance-params.ts` lines 14–32):
```ts
/**
 * Canonical slug → short URL key (A3, locked before launch: changing these
 * breaks previously shared links). ... The `satisfies` constraint makes a
 * misspelled or missing slug a compile error.
 */
export const PARAM_KEY_BY_SLUG = {
  "chase-ur": "ur",
  "amex-mr": "mr",
  // …
} as const satisfies Record<EnterableProgramSlug, string>;

/** The short-key union ("ur" | "mr" | … | "bonvoy"). */
type ShortKey = (typeof PARAM_KEY_BY_SLUG)[EnterableProgramSlug];
```

**Membership-guard pattern** (`balance-form.tsx` lines 27–30 — the `in` check the manifest's `getDestinationImage` should mirror):
```ts
/** Slug set derived from the codec's single source of truth — no second list. */
function isEnterableSlug(slug: string): slug is EnterableProgramSlug {
  return slug in PARAM_KEY_BY_SLUG;
}
```

**Apply:** `DESTINATION_IMAGES = { tokyo: { image, alt, credit }, … } as const satisfies Record<string, DestinationImage>`, `export type ImageSlug = keyof typeof DESTINATION_IMAGES`, and `getDestinationImage(slug: string | null): DestinationImage | null` using `slug in DESTINATION_IMAGES` (RESEARCH Pattern 2 code is already in this shape). Static imports: `import tokyo from "./destinations/tokyo.webp"` — 20 slugs today (list in UI-SPEC Imagery "Asset" row). Header comment must state the CLAUDE.md contract (source once, commit, never hotlink, never a filesystem path).

**Vitest hazard:** the node test environment cannot import `.webp`; nothing under `tests/` may import this manifest (RESEARCH image-manifest example, comment line). Any component test that transitively imports it (`result-card.tsx` after this phase) needs a vitest asset mock — see `tests/result-card.test.ts` risk below.

---

### `src/images/destinations/*.webp` (vendored assets)

**Analog:** `src/assets/fonts/*.woff` — the only vendored binary assets today, documented in the consumer's header.

**Provenance-comment pattern** (`src/app/og/route.tsx` lines 15–20):
```ts
// Fonts: @fontsource/fraunces@5.3.0 files/fraunces-latin-600-normal.woff and
// @fontsource/inter@5.3.0 files/inter-latin-400-normal.woff (latin subsets,
// SIL Open Font License 1.1, https://cdn.jsdelivr.net/npm/@fontsource/fraunces@5.3.0/
// and https://cdn.jsdelivr.net/npm/@fontsource/inter@5.3.0/) — vendored under
// src/assets/fonts, never fetched at runtime (T-05-02).
```

**Apply:** photographer + source live in the manifest's `credit` field per entry (the TS equivalent of this comment); the manifest header names the license basis (Unsplash License, downloaded not API). Files live under `src/images/destinations/<imageSlug>.webp`, 1600×1067, ≤ 200 KB (UI-SPEC Asset row). `raw/` source photos are gitignored.

---

### `scripts/optimize-images.ts` (one-off pipeline, batch file-I/O)

**Analog:** `scripts/seed.ts` — the project's script skeleton (header comment, `main()`, exit codes, terse output).

**Script skeleton** (`scripts/seed.ts` lines 1–10, 21–27, 80–92):
```ts
// Idempotent one-command seed: rebuilds the four curated tables in Neon from
// the repo's typed seed dataset (repo-as-CMS). ...
// Output is row counts only; the connection string is never echoed (T-02-10).
// Run with: npm run db:seed

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set (re-run `vercel env pull .env.development.local`)");
    process.exit(1);
  }
  // …
  console.log(`seeded: ${programData.length} programs, …`);
  process.exit(0);
}

main().catch((err: unknown) => {
  // Print only the error message — never the connection string.
  console.error("seed failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
```

**Apply:** same shape, no env load needed (no DB). Read `raw/<slug>.{jpg,png}`, write `src/images/destinations/<slug>.webp` via `sharp(input).resize({ width: 1600, height: 1067, fit: "cover", position: "attention" }).webp({ quality: 75, effort: 6 }).toFile(...)` (RESEARCH Pattern 2). Print one line per file with the output byte size and fail (`exit 1`) if any output exceeds 200 KB (UI-SPEC budget). Slugs come from a fixed list or the `raw/` directory listing — never user input (RESEARCH Security V5). Add `"images:optimize": "tsx scripts/optimize-images.ts"` beside `"db:seed"` in `package.json` line 13. `sharp` pinned as a devDependency (RESEARCH install line, behind the human checkpoint).

---

### `src/components/result-card.tsx` (component, SSR presentation)

**Analog:** itself + the vendored `Card` image slot.

**Card image slot already wired** (`src/components/ui/card.tsx` line 15):
```
"group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card … has-[>img:first-child]:pt-0 … *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl"
```
The selectors require the `<Image>` to be the **direct first child** of `<Card>` — no wrapper div (UI-SPEC Corners row).

**Where the image goes** (`result-card.tsx` lines 75–81, current):
```tsx
<Card className="text-ink [--card-spacing:--spacing(4)] sm:[--card-spacing:--spacing(6)]">
  <CardHeader>
    <CardTitle className="text-ink text-[1.75rem] leading-tight font-semibold">
      {redemption.title}
    </CardTitle>
  </CardHeader>
```
**Becomes:** insert `{art && <Image src={art.image} alt={art.alt} placeholder="blur" sizes="(min-width: 768px) 768px, 100vw" className="aspect-[3/2] w-full object-cover" />}` between `<Card>` and `<CardHeader>` where `const art = getDestinationImage(redemption.imageSlug);` — and change `text-[1.75rem] leading-tight` → `text-heading`. No `preload`/`priority`/`fill`/`unoptimized` (UI-SPEC Render row; Next 16 deprecates `priority`).

**Imports pattern** (`result-card.tsx` lines 1–19): path-alias `@/` imports grouped components → data types → engine types → lib; add `import Image from "next/image";` at the top with the other framework imports and `import { getDestinationImage } from "@/images/destinations";` in the `@/` group.

**Accent discipline comment** (lines 26–28) stays verbatim — the photo is not a new accent use.

**Same treatment for the teaser card** in `core-experience.tsx` `EmptyState` (lines 343–349): `getDestinationImage(featuredTeaser.imageSlug)` as the leading child of that `<Card>`.

---

### `src/components/core-experience.tsx` (client island — copy-link + clipboard fallback)

**Analog:** itself. The block to replace is lines 216–233; the CTA row is 249–262.

**Current copy-link** (`core-experience.tsx` lines 216–233):
```tsx
// "Copy my link" (UI-SPEC Open Question 1 ruling): clipboard copy of the
// current URL with a 2s "Link copied" swap. T-04-14: clipboard may be
// absent or denied in WebViews — silent no-op, never an error UI.
const [copied, setCopied] = useState(false);
useEffect(() => {
  if (!copied) return;
  const timeout = window.setTimeout(() => setCopied(false), 2000);
  return () => window.clearTimeout(timeout);
}, [copied]);

async function handleCopyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
  } catch {
    // T-04-14: degrade silently — the URL bar still carries the share link.
  }
}
```

**Change:** `writeText(shareUrl(balances))` (from `@/lib/share-url`) and in `catch` → `setFallbackUrl(url)`. Keep the 2 s swap effect and the `aria-live="polite"` span (line 256). The design-system gate greps for the absence of `clipboard.writeText(window.location.href)`.

**Fallback field** (UI-SPEC Copywriting "Clipboard fallback"): render directly under the CTA row, only when `fallbackUrl !== null`: `<Label>` "Your link" (reuse `balance-form.tsx` line 51 label classes `text-ink text-sm font-semibold`), a read-only `<Input>` with the `balance-form.tsx` line 67 override `className="text-ink h-11 bg-white text-base"` plus `readOnly onFocus={(e) => e.currentTarget.select()}`, helper `text-ink/70 text-sm leading-5` "Couldn't reach the clipboard — press and hold the link to copy it." Move focus to the field once when it appears (UI-SPEC Accessibility) via a `useRef` + effect — effects only, never during render (Pitfall 2 comment at lines 143–145).

**Browser-API guard convention** (lines 82–94 — the model for anything touching `navigator`/`window`):
```tsx
/**
 * Pitfall 6 / T-04-14: the ONLY place browser storage is reached for. Access
 * itself can throw in restricted WebViews (LinkedIn in-app browser, private
 * modes) — return null and the island silently degrades to URL-only behavior.
 * Called from effects only (Pitfall 2), never during render.
 */
function getSafeStorage(): StorageLike | null {
  try { return window.localStorage; } catch { return null; }
}
```

**Line budget:** file is 385 lines; RuFlo caps at 500. If the fallback block plus teaser image push it near the cap, extract `src/components/share-link.tsx` as a `"use client"` child taking `{ balances: Balances }` — copy the child-component shape from `src/components/save-balances-button.tsx` (client child, `h-11`, receives props from the island, no `@/db`).

**Reserved in-app hint** (UI-SPEC A5): not rendered at launch. If Wave 0 flips it on, read `navigator.userAgent` in a `useEffect` into state (same effects-only rule) and render the 14px ink/70 line under "Sign in to save".

---

### `src/lib/share-url.ts` (pure helper, transform)

**Analog:** exact — this logic already exists twice; the new module dedupes it.

**Canonical query builder** (`src/lib/share-content.ts` lines 58–71):
```ts
/**
 * Canonical query string: balancesToParams iterates PARAM_KEY_BY_SLUG order
 * and emits null for absent/invalid balances, so filtering nulls and feeding
 * URLSearchParams yields the locked `ur=…&mr=…` ordering regardless of the
 * caller's object key order.
 */
function toQueryString(balances: Balances): string {
  const present = Object.entries(balancesToParams(balances)).filter(
    (entry): entry is [string, number] => entry[1] !== null,
  );
  return new URLSearchParams(
    present.map(([key, value]) => [key, String(value)]),
  ).toString();
}
```

**Second copy** (`src/app/account/page.tsx` lines 45–52):
```ts
/** The same canonical short-key query the share link uses, prefixed for `/`. */
function savedResultsHref(balances: NonNullable<AccountSnapshot["balances"]>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(balancesToParams(balances))) {
    if (value !== null) query.set(key, String(value));
  }
  return `/?${query.toString()}`;
}
```

**Apply:** export `toShareQuery(balances): string` and `shareUrl(balances): string` (`${SITE_URL}/?${q}` or `${SITE_URL}/` when empty) from `src/lib/share-url.ts`; import `SITE_URL` from `@/lib/site` and `balancesToParams` from `@/lib/balance-params`. Optionally have `share-content.ts` and `account/page.tsx` import the shared builder so there is one implementation (plan discretion — both are covered by existing tests). Must stay client-safe and server-safe: no client directive, no browser globals (same rule as `balance-params.ts` header lines 10–12).

---

### `src/lib/in-app-browser.ts` (pure helper, transform)

**Analog:** `src/lib/balance-storage.ts` — pure module whose environment input is injected so tests run in node.

**Injection convention** (`balance-storage.ts` lines 5–9):
```ts
// Browser-storage persistence … Every function here is pure: storage
// I/O is INJECTED (`Pick<Storage, ...>`), never reached for via the browser
// global, so tests/balance-storage.test.ts runs in the node environment with
// a fake storage object and no jsdom.
```

**Apply:** `export function isLinkedInInAppBrowser(ua: string): boolean` — takes the UA string as a parameter, never reads `navigator` itself (RESEARCH Pattern 5). Header comment must say it is presentation-only, never an auth decision (RESEARCH Security "UA-spoofed detection").

---

### `src/app/layout.tsx` (root layout — `viewport` export + noindex removal)

**Analog:** itself. The typed-export shape to copy is the existing `metadata`.

**Existing typed export** (`layout.tsx` lines 1, 31–39):
```tsx
import type { Metadata } from "next";
// …
export const metadata: Metadata = {
  title: "Milesworth",
  description: "See what your credit card points are actually worth.",
  // D-03 noindex gate: keep the pre-launch site out of search indexes.
  // Removing this is an explicit Phase 7 launch-gate task.
  robots: { index: false, follow: false },
  metadataBase: new URL(SITE_URL),
```

**Add** (polish plan): `import type { Metadata, Viewport } from "next";` and
```tsx
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: CREAM,   // from "@/lib/brand"
};
```
No `maximumScale` / `userScalable` (gate test). **Remove** (launch-flip plan) lines 34–36 (`robots: { index: false, follow: false }` + its comment) — only after `/account` has its own route noindex (below).

The shell classes on lines 71 and 76 (`h-full`, `flex min-h-full flex-col`) are the WebView-safe pattern and stay untouched (UI-SPEC Viewport-height row).

---

### `src/app/robots.ts` and `src/app/sitemap.ts` (metadata routes, static)

**Analog:** no metadata-file route exists yet. Combine two precedents: (a) `SITE_URL` from `src/lib/site.ts`, (b) the static-route discipline documented in `src/app/methodology/page.tsx` lines 8–10 and enforced by `tests/guest-flow-gate.test.ts` lines 54–74.

**Static-route header convention** (`methodology/page.tsx` lines 8–10):
```ts
// The methodology page (VAL-03). Static server component: no client
// directive, no request-time input, no clock read, no database — the route
// prerenders at build and ships zero client JS (T-05-05).
```

**Constant-date precedent for `lastModified`** (`site.ts` lines 31–37):
```ts
/**
 * The policy's "Last updated" date, as an ISO calendar date. Rendered from a
 * constant because the static-route source scan forbids `new Date` (the
 * T-05-05 pattern: a clock read would opt the page out of prerendering …
 */
export const PRIVACY_LAST_UPDATED = "2026-09-15";
```

**Apply** (RESEARCH Pattern 7 code):
```ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: "/account" }, sitemap: `${SITE_URL}/sitemap.xml` };
}
```
`sitemap.ts` returns `/`, `/methodology`, `/privacy` with a constant `lastModified` (add e.g. `SITE_LAST_MODIFIED` to `site.ts` next to `PRIVACY_LAST_UPDATED`) — **never `new Date()`**. Add both files to the `routes` array in the launch-gate source scan (see tests below).

---

### `src/app/account/page.tsx` (route noindex + typography)

**Analog:** `layout.tsx` line 36 for the robots shape; itself for everything else.

**Current metadata** (`account/page.tsx` lines 31–34):
```ts
export const metadata: Metadata = {
  title: "Your account — Milesworth",
  description: "Your saved balances, bookmarks, and travel goals.",
};
```
**Add** `robots: { index: false, follow: false },` (closes 06-REVIEW IN-05; must land before the layout noindex is removed).

**Typography fixes:** `HEADING_CLASS` (line 37–38) `text-[1.75rem] leading-tight` → `text-heading`; line 140 `font-heading text-ink text-lg font-semibold` → `font-display text-ink text-heading font-semibold` (UI-SPEC A14).

---

### `src/app/not-found.tsx` (route page)

**Analog:** `src/app/error.tsx` — exact. Same shell, same ink-only rule, same copy voice; `not-found.tsx` is a server component (no `"use client"`, no `reset`).

**Shell + copy shape** (`error.tsx` lines 25–50):
```tsx
<main className="bg-cream flex flex-1 flex-col">
  <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6 md:py-16">
    <h1 className="font-display text-ink text-display font-semibold">
      Something went wrong
    </h1>
    <p className="text-ink/70 text-base leading-6">
      Try again in a moment. Any balances you entered are still in the link
      in your address bar.
    </p>
    {/* … */}
    <Link
      href="/"
      className="text-ink/70 text-sm leading-5 underline-offset-4 hover:underline"
    >
      Back to your results
    </Link>
  </div>
</main>
```
**Apply:** h1 "Page not found"; body "That address doesn't go anywhere. Head back to see what your points are worth."; the same `Link`. Drop the `Button`. Header comment mirrors `error.tsx` lines 7–17 (route convention + T-04-12 neutral copy + accent discipline).

---

### `src/app/account/loading.tsx` (route loading state)

**Analog:** `src/app/account/page.tsx` `Shell` — exact.

**Shell** (`account/page.tsx` lines 58–71):
```tsx
function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="bg-cream flex flex-1 flex-col">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 md:py-16">
        <header className="flex flex-col gap-6">
          <h1 className="font-display text-ink text-display font-semibold">
            Your account
          </h1>
        </header>
        {children}
      </article>
    </main>
  );
}
```
**Apply:** `loading.tsx` renders the same markup inline with one child `<p className="text-ink/70 text-base leading-6">Loading your account…</p>` (`MUTED_CLASS`, line 40). No skeletons, no spinner. Do not import `Shell` from `page.tsx` (it is not exported and `page.tsx` imports `@clerk/nextjs/server`; keep `loading.tsx` free of server-only imports).

---

### `src/components/site-header.tsx` and `site-footer.tsx` (tap targets, masthead, safe-area, credits)

**Analog:** themselves; the 44px box precedent is `error.tsx` line 39 / `site-header.tsx` line 38 (`h-11`).

**Header today** (`site-header.tsx` lines 30–32, 45–50):
```tsx
<Link href="/" className="text-ink text-sm font-semibold">
  Milesworth
</Link>
// …
<Link
  href="/account"
  className="text-ink/70 text-sm leading-5 underline-offset-4 hover:underline"
>
  My account
</Link>
```
**Apply:** wordmark → `font-display text-ink text-heading font-semibold`; every nav link/button → `inline-flex min-h-11 items-center text-ink/70 text-sm leading-5 underline-offset-4 hover:underline`; `border-ink/10` → `border-border` (now warm). Keep the long header comment (lines 6–24) — the `"use client"` rationale is load-bearing (T-06-16).

**Footer today** (`site-footer.tsx` lines 13–19):
```tsx
<footer className="border-ink/10 mt-auto border-t">
  <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
    <p className="text-ink text-sm font-semibold">Milesworth</p>
    <nav aria-label="Footer" className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
```
**Apply:** container `py-8` → `pt-8 pb-safe`; nav `gap-2` → `gap-3` (UI-SPEC; checker flagged 12px — `gap-2 sm:gap-4` is the alternative); wordmark → `font-display text-ink text-base font-semibold`; links get `inline-flex min-h-11 items-center`; add a fourth item `<span className="text-ink/70 text-sm leading-5">Photos via Unsplash</span>` (plain text, no link — UI-SPEC A7). Footer stays a server component (no hooks).

---

### `src/components/ui/{button,card,dialog,input,label}.tsx` (vendored primitives)

**Analog:** themselves. Edit in place (UI-SPEC A12). Exact grep hits:

| File | Line | Change |
|------|------|--------|
| `ui/button.tsx` | 8 | `font-medium` → `font-semibold` |
| `ui/card.tsx` | 41 | `font-medium` → `font-semibold` (CardTitle) |
| `ui/dialog.tsx` | 133 | `font-medium` → `font-semibold` (DialogTitle) |
| `ui/input.tsx` | 11 | `file:font-medium` → `file:font-semibold`; **delete** `md:text-sm` |
| `ui/label.tsx` | 16 | `font-medium` → `font-semibold` |

Gate: `font-medium` count in `src/` = 0, `md:text-sm` count = 0. Leave the `dark:` classes in place — `@custom-variant dark` stays class-scoped so they are inert (UI-SPEC A10).

---

### `src/app/privacy/page.tsx`, `src/app/methodology/page.tsx`, `almost-there.tsx`, `advisor-tease.tsx`, `bookmark-list.tsx`, `delete-account-dialog.tsx` (token sweep)

**Analog:** `core-experience.tsx` lines 103–104 — the class-constant convention every page/component uses:
```ts
const SECTION_HEADING_CLASS =
  "font-heading text-ink text-[1.75rem] leading-tight font-semibold";
```
**Apply:** replace `text-[1.75rem] leading-tight` with `text-heading` in each constant / inline class (9 occurrences; gate count = 0). `bookmark-list.tsx` line 34 `text-lg` → `font-display text-ink text-heading font-semibold`. `delete-account-dialog.tsx` lines 59–60: `<DialogTitle className="font-display text-heading font-semibold text-ink">`, `<DialogDescription className="text-base leading-6 text-ink/70">`.

**External links** (`privacy/page.tsx` lines 96–113): remove `target="_blank"` and `rel="noreferrer"` from the two `<a>` elements (lines 99–100, 108–109); keep `href` and `className={LINK_CLASS}`. Gate: `target="_blank"` count in `src/` = 0. `tests/privacy-page.test.ts` pins the section list — re-run it.

---

### `src/app/og/route.tsx` (brand constants)

**Analog:** itself.

**Current local constants and literal** (`og/route.tsx` lines 51–52, 151):
```ts
const CREAM = "#faf7f2";
const INK = "#262119";
// …
color: "#c05f33",
```
**Apply:** `import { CREAM, INK, TERRACOTTA } from "@/lib/brand";` (alongside the `@/lib/site` import on line 7), delete lines 51–52, replace the literal at line 151 with `TERRACOTTA`. `tests/og-route.test.ts` renders real PNGs (~1 s each) and asserts status/headers only — it will not break on the color change, but run it.

---

### `config/lighthouserc.cjs` + `package.json` script + `.gitignore`

**Analog:** partial — no CommonJS config exists. `vitest.config.ts` is the only root config precedent (ESM `defineConfig`); RuFlo forbids new root configs, hence `config/`. Use the RESEARCH Pattern 6 file verbatim (`module.exports = { ci: { collect, assert, upload } }`, `LHCI_BASE_URL` env override, 4 URLs × 3 runs, `upload.target: "filesystem"`).

**Script precedent** (`package.json` line 13): `"db:seed": "tsx scripts/seed.ts"` → add `"lighthouse": "lhci autorun --config=config/lighthouserc.cjs"`.

**Gitignore precedent** (`.gitignore` "# testing" / "# next.js" blocks): add a `# lighthouse` block with `/.lighthouseci/` and an `# image sources (not committed)` block with `/raw/`.

**SEO assertion sequencing:** `categories:seo` must be `warn` until the launch flip lands, then `error` (RESEARCH Pitfall 10).

---

### `tests/design-system-gate.test.ts` and `tests/launch-gate.test.ts` (source-scan tests)

**Analog:** `tests/guest-flow-gate.test.ts` — exact. Copy its helpers and describe shape.

**Helpers** (`guest-flow-gate.test.ts` lines 1–26):
```ts
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

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
```

**Forbidden-token loop** (lines 36–51):
```ts
const forbidden = ['from "@/db', "drizzle-orm", "@clerk/nextjs/server", "CLERK_SECRET_KEY"];
for (const token of forbidden) {
  it(`no component contains ${token}`, () => {
    for (const file of files) {
      expect(readFileSync(join(dir, file), "utf8"), file).not.toContain(token);
    }
  });
}
```

**Existence + content assertions** (lines 76–87):
```ts
it("src/proxy.ts exports clerkMiddleware() and protects nothing", () => {
  expect(existsSync(join(SRC, "proxy.ts"))).toBe(true);
  const source = read("src", "proxy.ts");
  expect(source).toContain("export default clerkMiddleware()");
  expect(source).not.toContain("auth.protect");
});
```

**Apply — design-system gate:** extend `sourceFiles` to include `.css` (`/\.(ts|tsx|css)$/`); forbidden tokens over `src/`: `text-[1.75rem]`, `text-lg`, `font-medium`, `md:text-sm`, `target="_blank"`, `h-screen`, `min-h-screen`, `100vh`, `dvh`, `remotePatterns` (in `next.config.ts`), `color-mix(` (in `globals.css`); positive assertions: `globals.css` matches `/--text-heading:\s*1\.75rem/`, contains `@utility pb-safe`, contains `color-scheme: light`, does not match `/^\.dark\s*\{/m`; CSS hex strings equal the `brand.ts` constants (import `../src/lib/brand` — it is literal-only, node-safe); `layout.tsx` matches `/export const viewport/` and `/viewportFit:\s*"cover"/`, not `/userScalable:\s*false|maximumScale:\s*1\b/`; `core-experience.tsx` does not contain `clipboard.writeText(window.location.href)`; accent budget: `text-terracotta`/`bg-terracotta` only in `result-card.tsx` (×2) and `core-experience.tsx` (×1).

**Apply — launch gate** (lands with the flip plan): `layout.tsx` does not contain `index: false`; `account/page.tsx` contains `index: false`; `existsSync` for `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/not-found.tsx`, `src/app/account/loading.tsx`; `robots.ts` contains `disallow: "/account"`; neither `robots.ts` nor `sitemap.ts` contains `new Date`; `public/` contains none of `file.svg|globe.svg|next.svg|vercel.svg|window.svg`; `README.md` does not contain `create-next-app`. Add `robots` and `sitemap` to a static-routes array with the `guest-flow-gate.test.ts` lines 61–73 loop (no `@clerk/nextjs/server`, no `@/db`).

---

### `tests/image-manifest.test.ts` (fs ⟷ seed coverage)

**Analog:** `tests/seed-data.test.ts` — DB-free tests over the real seed arrays via relative import.

**Import + assertion shape** (`seed-data.test.ts` lines 1–16, 160–162):
```ts
// DB-free structural tests over the REAL seed dataset (DATA-01/02/03/04).
// Everything runs against in-memory imports from ../src/data — CI holds no
// database credentials by design, and none are needed here.
import { describe, expect, it } from "vitest";

import { bonuses, programSeedSchema, programs, redemptionSeedSchema, redemptions, routes, /* … */ } from "../src/data";
// …
const verified = redemptions.filter((r) => r.verifiedAt !== null);
expect(verified.length).toBeGreaterThanOrEqual(30);
```

**Apply:** `readdirSync(join(__dirname, "..", "src/images/destinations"))` → slug set (strip `.webp`); assert every non-null `redemptions[].imageSlug` is in the set with a `missing images: …` message (RESEARCH code example). **Do not import `src/images/destinations.ts`** (node cannot load `.webp`); instead assert the manifest source *text* contains `${slug}:` for every slug via `readFileSync` (source-scan style) so the manifest and the directory cannot drift. Optionally assert each file's `statSync().size <= 200 * 1024` (UI-SPEC budget).

---

### `tests/share-url.test.ts` and `tests/in-app-browser.test.ts` (pure-helper tests)

**Analog:** `tests/balance-storage.test.ts` / `tests/balance-params.test.ts` — exact.

**Fixture + hostile-input shape** (`balance-storage.test.ts` lines 1–19, 45–49):
```ts
import { describe, expect, it } from "vitest";

import { STORAGE_KEY, readStoredBalances, /* … */ } from "../src/lib/balance-storage";
import type { Balances } from "../src/engine/types";

// INPUT-02 persistence tests: localStorage is a tamperable client-side
// boundary (T-04-02) … Throwing variants model LinkedIn's in-app WebView …

const VALID_BALANCES: Balances = {
  "chase-ur": 90_000,
  "amex-mr": 50_000,
  "world-of-hyatt": 40_000,
};
```

**Apply — share-url:** `shareUrl(VALID_BALANCES)` equals `${SITE_URL}/?ur=90000&mr=50000&hyatt=40000` (PARAM_KEY_BY_SLUG order regardless of object key order — reuse the `SHORT_KEY_CASES` list from `balance-params.test.ts` lines 22–31); empty balances → `${SITE_URL}/`; invalid values dropped; output never contains `__clerk_db_jwt`/`utm_`. Note `SITE_URL` honors `NEXT_PUBLIC_SITE_URL` — assert against the imported constant, not a literal.

**Apply — in-app-browser:** the two verified UA strings from RESEARCH Pattern 5 (iOS `[LinkedInApp]/9.78.4909`, Android `; wv) … [LinkedInApp]/2.312.70`) → `true`; desktop Chrome / iOS Safari / `""` → `false`.

Tests import via **relative `../src/…` paths** (project convention; the `@` alias in `vitest.config.ts` is for modules that themselves import `@/…`).

---

### `tests/result-card.test.ts` (optional SSR render test)

**Analog:** `tests/methodology-page.test.ts` — `renderToStaticMarkup` over the real component, expectations derived from the same modules.

**Render shape** (`methodology-page.test.ts` lines 11–28):
```ts
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import MethodologyPage from "../src/app/methodology/page";
// …
const html = renderToStaticMarkup(createElement(MethodologyPage)).replace(/&#x27;/g, "'");
```

**Risk (why this is role-match, not exact):** after this phase `result-card.tsx` imports `src/images/destinations.ts`, which statically imports `.webp` files — vitest's node environment cannot resolve them. Either (a) skip this test (RESEARCH marks it optional), or (b) add a vitest asset stub for `\.webp$` in `vitest.config.ts` (`resolve.alias` or a `test.alias` mapping to a fixture exporting `{ src, width, height, blurDataURL }`) — a new config surface the plan must call out. `next/image` also needs `next.config`-free rendering; verify at plan time before committing to (b).

---

### `src/data/redemptions-*.ts` (dataset batches) and `tests/seed-data.test.ts` floor

**Analog:** `src/data/redemptions-hotels.ts` entry shape — exact.

**Entry shape** (`redemptions-hotels.ts` lines 14–37):
```ts
{
  slug: "park-hyatt-tokyo",
  partnerProgramSlug: "world-of-hyatt",
  title: "Park Hyatt Tokyo — the Lost in Translation stay",
  category: "hotel",
  origin: null,
  destination: "Tokyo, Japan",
  cabin: null,
  pointsMin: 35000,
  pointsMax: 75000,
  taxesFeesCents: 0,
  cashFareCents: 130000,
  availabilityRating: "plan_ahead",
  bookingHint: "Book standard-room awards on hyatt.com; …\n…",
  methodologyNote: "Cash rate benchmarked as a representative high-season nightly rate incl. taxes.",
  sourceNote: "Verified 2026-09-01 — Category 8; …",
  verifiedAt: "2026-09-01",
  imageSlug: "tokyo",
  featured: true,
  notes: null,
},
```
**File-header convention** (lines 3–10): states verified count, date, ruling-log path, and held slugs. **Draft convention** (seed-data test lines 180–192): drafts carry `verifiedAt: null` and `sourceNote: "CLAUDE DRAFT — check …"`; a verified entry's `sourceNote` must start with `"Verified "`.

**Growth path** (`src/data/redemptions.ts` lines 10–14): new split files (e.g. `redemptions-flights-asia.ts`, `redemptions-hotels-2.ts`) are spread into the barrel; each file under 500 lines. `src/data/index.ts` must **not** re-export the split files (its header, lines 1–4).

**Floor raise** (`tests/seed-data.test.ts` lines 157–162): change `toBeGreaterThanOrEqual(30)` to the agreed N **in the same commit** as the verified batch (RESEARCH Pitfall 12). Every new `imageSlug` needs a WebP + manifest entry first (image-manifest test), and `validateDataset` (`src/data/types.ts` lines 147–213) plus Zod schemas run in CI.

**Human-verify checkpoint shape** (`.planning/phases/02-redemption-database/02-05-PLAN.md` lines 60–72): `<task type="checkpoint:human-verify" gate="blocking">` with `<read_first>` listing the seed files, `<what-built>` naming draft count, `<how-to-verify>` asking Nick for corrected numbers + `verifiedAt` dates per slug. Follow-up auto tasks apply corrections, raise the floor, and reseed (`npm run db:seed`, `scripts/db-check.ts` counts).

---

## Shared Patterns

### File header comment (every new source file)
**Source:** any file — e.g. `src/app/error.tsx` lines 7–17, `src/lib/balance-params.ts` lines 5–12, `scripts/seed.ts` lines 1–10
**Apply to:** all new `.ts`/`.tsx` files
Every file opens with a `//` block naming (1) the requirement ID(s) it serves (PLAT-02 / PLAT-05 here), (2) the rendering mode / client-vs-server reasoning, (3) the threat or pitfall IDs it mitigates, (4) the accent-discipline line where UI is involved:
```ts
// Accent discipline (UI-SPEC): ink only. Nothing here is the wow delta.
```

### Page shell + rail
**Source:** `src/app/error.tsx` lines 26–27; `src/app/account/page.tsx` lines 60–61; `src/components/core-experience.tsx` line 238
**Apply to:** `not-found.tsx`, `account/loading.tsx`
```tsx
<main className="bg-cream flex flex-1 flex-col">
  <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 md:py-16">
```
(`gap-6` on the error/not-found shell, `gap-8` on pages with sections.)

### Class-constant convention
**Source:** `src/app/account/page.tsx` lines 36–43 (also `privacy/page.tsx` 27–34)
**Apply to:** every page/component touched by the token sweep
```ts
const HEADING_CLASS = "font-heading text-ink text-heading font-semibold";   // was text-[1.75rem] leading-tight
const BODY_CLASS    = "text-ink text-base leading-6";
const MUTED_CLASS   = "text-ink/70 text-base leading-6";
const LABEL_CLASS   = "text-ink/70 text-sm font-semibold";
const LINK_CLASS    = "text-ink/70 text-sm leading-5 underline-offset-4 hover:underline";
```
Nav links additionally get `inline-flex min-h-11 items-center` this phase.

### Touch target
**Source:** `src/components/site-header.tsx` line 38, `error.tsx` line 39, `balance-form.tsx` line 67
**Apply to:** every interactive element (header/footer links, fallback input)
`h-11` on buttons/inputs; `inline-flex min-h-11 items-center` on text links inside `<nav>`.

### Browser-API access — effects only, guarded
**Source:** `src/components/core-experience.tsx` lines 82–94 (`getSafeStorage`), 143–145 (Pitfall 2 comment), 226–233 (clipboard try/catch)
**Apply to:** clipboard fallback, any `navigator.userAgent` read
Never read `window`/`navigator` during render or in a `useState` initializer; wrap in `try/catch`; degrade to a designed state (now a visible fallback field, not silence).

### Neutral failure states, no logging
**Source:** `src/lib/site.ts` lines 39–46 (`NEUTRAL_ERROR_MESSAGE`); `og/route.tsx` lines 206–209; `error.tsx` lines 14–15
**Apply to:** `not-found.tsx`, clipboard fallback copy, LHCI/script error paths
No error text, stack, or digest reaches the DOM; scripts print only counts/messages, never env values.

### Static-route discipline
**Source:** `src/app/methodology/page.tsx` lines 8–10; `tests/guest-flow-gate.test.ts` lines 54–74; `site.ts` lines 31–37
**Apply to:** `robots.ts`, `sitemap.ts`, `not-found.tsx`, `account/loading.tsx`
No `new Date()`, no `auth()`, no `@/db`, no `export const dynamic`. Dates are constants in `site.ts`.

### Single source of truth for share query
**Source:** `src/lib/share-content.ts` lines 58–71; `src/lib/balance-params.ts` lines 102–115
**Apply to:** `share-url.ts`, copy-link handler
Always derive from `balancesToParams` → filter nulls → `URLSearchParams`; never from `location.href` or `params` directly.

### Import ordering
**Source:** `src/components/result-card.tsx` lines 1–19; `src/app/page.tsx` lines 1–9
**Apply to:** all new files
Framework/third-party (`next/*`, `@clerk/*`, `react`) first, blank line, then `@/` imports grouped components → data → engine → lib → images, alphabetical within group. Data arrays only from `@/data`, engine only from `@/engine` (collision hazard comment, `core-experience.tsx` lines 19–22).

### Script skeleton
**Source:** `scripts/seed.ts` lines 12–27, 88–92
**Apply to:** `scripts/optimize-images.ts`
`async function main()` → explicit `process.exit(0)`; `main().catch` prints only `err.message` and exits 1. Run via `tsx` npm script.

### Test conventions
**Source:** `tests/guest-flow-gate.test.ts`, `tests/seed-data.test.ts`, `tests/balance-storage.test.ts`
**Apply to:** all five new test files
Node environment, `tests/**/*.test.ts`, relative `../src/…` imports, header comment naming the requirement/threat IDs, `expect(value, "<file or slug>")` messages so a failing loop names the offender, no DB, no jsdom, no mocks (`og-route.test.ts` line 5 — "no mocks" is a stated project value).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `README.md` (rewrite) | docs | — | Current file is untouched create-next-app boilerplate; no project README convention exists. `PROJECT-BRIEF.md` (root) and the project `CLAUDE.md` "Project" section are the only prose about the product — draw the summary from there. Keep it the only `.md` touched (RuFlo: no new docs files). |
| `src/app/favicon.ico` + `src/app/apple-icon.png` | asset | static | Scaffold default; no branded icon precedent. UI-SPEC: Fraunces 600 "M", ink on cream, 32×32 `.ico` + 180×180 PNG, no terracotta. Generate offline (sharp can rasterize an SVG) — no runtime code. |
| `public/*.svg` (delete five files) | asset | — | Deletion only; launch-gate test asserts absence. |
| `config/lighthouserc.cjs` | config | batch | Listed above as partial — no CJS config precedent; use RESEARCH Pattern 6 verbatim. |

## Metadata

**Analog search scope:** `src/app/**`, `src/components/**`, `src/lib/**`, `src/data/**`, `src/images` (absent), `scripts/**`, `tests/**`, `config/` (absent), `.github/workflows/ci.yml`, `package.json`, `.gitignore`, `vitest.config.ts`, `next.config.ts`, `tsconfig.json`, `.planning/phases/02-redemption-database/02-05-PLAN.md` (checkpoint shape)
**Files scanned:** 38 read in full or in targeted ranges; 72 source/test/script files enumerated
**Pattern extraction date:** 2026-09-16
