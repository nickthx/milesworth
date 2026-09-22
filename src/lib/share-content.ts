// Filename-collision hazard: src/data/transfers.ts (seed ARRAYS) and
// src/engine/transfers.ts (engine FUNCTIONS) share a name — import arrays
// ONLY from the "@/data" barrel and the engine ONLY from "@/engine".
import { bonuses, programs, redemptions, routes } from "@/data";
import { rankRedemptions } from "@/engine";
import type { Balances, RankedResult } from "@/engine";
// "@/engine" also exports a cashOutValueCents(spentSourcePoints, program);
// the framing copy uses the @/lib/format variant (points, rawBaseline) —
// the same one result-card.tsx renders — so share text and card agree.
import {
  cashOutValueCents,
  formatDollars,
  formatPoints,
  heroDelta,
} from "@/lib/format";
import { toShareQuery } from "@/lib/share-url";

// The single source of share text (PLAT-03): generateMetadata (title,
// description, og:image alt) and the /og ImageResponse (eyebrow, headline,
// subline) both consume this so the link preview and the card can never
// drift. Pure and isomorphic — no client directive, no clock read (asOf is
// an input, Pitfall 7/10), no DB, no throws.
//
// T-05-01: every string is assembled from curated seed fields
// (redemption.title, program.name) plus integer formatters. The only
// user-influenced input is a balance, which the engine sanitizes to a
// positive safe integer before it reaches formatPoints. No user-typed free
// text ever enters these strings; consumers render them as JSX / Satori text
// nodes (auto-escaped), never as raw HTML.

/** Share strings for one balance set. `kind` tells consumers which branch rendered. */
export interface ShareContent {
  kind: "baseline" | "result";
  /** Small label above the headline — the balance being showcased. */
  eyebrow: string;
  /** The big number (result) or the question (baseline). */
  headline: string;
  /** `<title>` / og:title. */
  title: string;
  /** Framing line under the headline — cash-out comparison or pure-travel copy. */
  subline: string;
  /** og:description, ≤ 200 chars. */
  description: string;
  /** og:image alt text. */
  imageAlt: string;
  /** Canonical `ur=90000&mr=50000` query (no leading `?`), "" when empty. */
  queryString: string;
}

/** Hard cap for og:description — most platforms truncate beyond this. */
const DESCRIPTION_MAX_LENGTH = 200;

const CLOSING_LINE = "See every redemption these balances unlock.";

/** The engine dataset, assembled once (core-experience.tsx pattern). */
const dataset = { programs, routes, bonuses, redemptions };

// The canonical `ur=…&mr=…` query comes from src/lib/share-url.ts — the
// single implementation shared with the "Copy my link" CTA (PLAT-02,
// PATTERNS "Single source of truth for share query").

function baselineContent(queryString: string): ShareContent {
  return {
    kind: "baseline",
    queryString,
    title: "Milesworth",
    headline: "What are your points actually worth?",
    eyebrow: "Milesworth",
    subline:
      "Enter your balances. See the business-class flight hiding in them.",
    description:
      "See what your credit card points are actually worth. Enter your balances to get ranked, concrete redemptions — with the cash-out comparison.",
    imageAlt: "Milesworth — what are your points actually worth?",
  };
}

/**
 * Fit `${title}${rest}` into DESCRIPTION_MAX_LENGTH by truncating the title
 * portion deterministically (slice + "…"); `rest` is never cut.
 */
function fitDescription(title: string, rest: string): string {
  const full = `${title}${rest}`;
  if (full.length <= DESCRIPTION_MAX_LENGTH) {
    return full;
  }
  const titleBudget = DESCRIPTION_MAX_LENGTH - rest.length - 1;
  return `${title.slice(0, Math.max(titleBudget, 0))}…${rest}`;
}

function resultContent(
  top: RankedResult,
  balances: Balances,
  queryString: string,
): ShareContent {
  const sourceSlug = top.chosenPath.fromProgramSlug;
  const sourceProgram = programs.find((program) => program.slug === sourceSlug);
  const sourceName = sourceProgram?.name ?? sourceSlug;
  const balance = balances[sourceSlug as keyof Balances];

  const eyebrow =
    balance !== undefined
      ? `${formatPoints(balance)} ${sourceName} points`
      : `${sourceName} points`;
  // The ONLY hero-number path (T-04-06): the conservative figure the ranking sorted on.
  const headline = formatDollars(heroDelta(top));
  const title = `${eyebrow} → ${top.redemption.title}`;

  // Pitfall 10 / A2 (mirrors result-card.tsx): a null baseline is a
  // partner-only currency with no cash-out path — frame as pure travel value.
  const baseline = sourceProgram?.cashOutBaselineCppX100 ?? null;
  const subline =
    baseline === null
      ? "Pure travel value — these points have no cash-out option"
      : `vs. ~${formatDollars(
          cashOutValueCents(top.chosenPath.requiredSourcePoints, baseline),
        )} cashing out`;

  const descriptionRest =
    baseline === null
      ? ` — ${headline} of pure travel value. ${CLOSING_LINE}`
      : ` — ${headline} more than cashing out. ${CLOSING_LINE}`;

  return {
    kind: "result",
    eyebrow,
    headline,
    title,
    subline,
    description: fitDescription(title, descriptionRest),
    imageAlt: `${title} — ${headline}`,
    queryString,
  };
}

/**
 * Build the share strings for a balance set at a given engine date.
 *
 * The top bookable result is `bookableNow[0]` exactly as the engine ranked
 * it — never re-sorted. An engine throw or an empty bookable list degrades
 * to the branded baseline copy, keeping the computed query string so the
 * link still round-trips.
 */
export function buildShareContent(input: {
  balances: Balances;
  asOf: string;
}): ShareContent {
  const { balances, asOf } = input;
  const queryString = toShareQuery(balances);

  let top: RankedResult | undefined;
  try {
    top = rankRedemptions({ balances, dataset, asOf }).bookableNow[0];
  } catch {
    // T-05-01 / T-04-12: the caught error is never rendered or logged —
    // the share surface simply falls back to the baseline card.
    top = undefined;
  }

  if (top === undefined) {
    return baselineContent(queryString);
  }
  return resultContent(top, balances, queryString);
}
