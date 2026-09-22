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

// Privacy policy contacts (ACCT-04). Recorded in 06-01-SUMMARY.md by the
// human during Clerk provisioning; the /privacy page renders both from here
// so the address and the date live in exactly one place.

/** Where privacy and deletion requests go — rendered as a mailto on /privacy. */
export const PRIVACY_CONTACT_EMAIL = "nick@whitflow.com";

/**
 * The policy's "Last updated" date, as an ISO calendar date. Rendered from a
 * constant because the static-route source scan forbids `new Date` (the
 * T-05-05 pattern: a clock read would opt the page out of prerendering and
 * would also lie — the policy changes when its text changes, not daily).
 */
export const PRIVACY_LAST_UPDATED = "2026-09-15";

/**
 * `lastModified` for every entry in sitemap.ts, as an ISO calendar date. A
 * constant for the same reason PRIVACY_LAST_UPDATED is (T-05-05): a clock
 * read would make the sitemap route dynamic and would also lie — the pages
 * change when their content changes, not daily. Bump by hand when `/`,
 * `/methodology`, or `/privacy` content changes.
 */
export const SITE_LAST_MODIFIED = "2026-09-21";

// Shared failure copy (T-04-12 / T-06-04). ONE string so the account Server
// Actions' neutral result and the client buttons' transport-failure fallback
// (a rejected action call whose result never arrived) cannot drift apart.
// Deliberately content-free: no error detail ever reaches the DOM or a log.

/** Fixed neutral copy for any failed write or transport error. */
export const NEUTRAL_ERROR_MESSAGE =
  "Something went wrong. Try again in a moment.";
