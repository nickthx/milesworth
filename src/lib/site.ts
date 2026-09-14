// The site's absolute origin, in ONE place (T-05-10). Every surface that
// needs the production host — metadataBase in layout.tsx, the footer line on
// the /og card — reads it from here, so pointing a custom domain at the app
// is a single env-var change and never leaves a social card advertising the
// old host while og:url advertises the new one.
//
// Fixed production constant with an optional NEXT_PUBLIC_SITE_URL override —
// never derived from Vercel's injected per-deployment host variable: preview
// hosts sit behind Deployment Protection, so a crawler following an og:image
// on that host gets a 401 and the canonical URL is wrong.

/** Absolute origin, e.g. "https://milesworth.vercel.app". */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://milesworth.vercel.app";

/**
 * Bare host for display, e.g. "milesworth.vercel.app". Derived, never
 * typed. A malformed NEXT_PUBLIC_SITE_URL throws here at module load — the
 * same failure metadataBase already has, surfaced at boot rather than in a
 * rendered card.
 */
export const SITE_HOST = new URL(SITE_URL).host;
