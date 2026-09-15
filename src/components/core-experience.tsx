"use client";

import Link from "next/link";
import { useQueryStates } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";

import { AlmostThere } from "@/components/almost-there";
import { BalanceForm } from "@/components/balance-form";
import { ResultCard } from "@/components/result-card";
import { SaveBalancesButton } from "@/components/save-balances-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Filename-collision hazard: src/data/transfers.ts (seed ARRAYS) and
// src/engine/transfers.ts (engine FUNCTIONS) share a name — import arrays
// ONLY from the "@/data" barrel and the engine ONLY from "@/engine". Never
// import "@/db" here: this file ships to every visitor (Pitfall 8 / T-04-11).
import { bonuses, programs, redemptions, routes } from "@/data";
import type { RedemptionSeed } from "@/data";
import { rankRedemptions } from "@/engine";
import type { Balances, EnterableProgramSlug, RankedResults } from "@/engine";
import {
  PARAM_KEY_BY_SLUG,
  balanceParsers,
  balancesToParams,
  paramsToBalances,
} from "@/lib/balance-params";
import {
  readStoredBalances,
  resolveInitialBalances,
  writeStoredBalances,
} from "@/lib/balance-storage";
import { formatDollars, formatPoints, formatVerifiedDate } from "@/lib/format";

// The guest-flow client island (INPUT-01/02/03, RANK-01/02, VAL-01). Owns the
// three-way state dance — URL (nuqs) ↔ browser storage ↔ engine — and composes
// the plan 04-03 presentational components. The engine runs in a useMemo per
// edit: no submit button, no spinner, no server round-trip (RESEARCH Pattern 2).
//
// Accent discipline (UI-SPEC): terracotta appears here exactly once — the
// "Copy my link" primary CTA (sanctioned use #2). The page hero heading, the
// section headings, every state copy, and the Save CTA stay ink.
//
// Phase 6 (ACCT-01/02): the island receives account props from the server
// page — isSignedIn, savedBalances, bookmarkedSlugs — and still never imports
// "@/db" (T-06-05) or reads Clerk client hooks (Pitfall 5). Session-aware
// affordances (SaveBalancesButton, BookmarkButton) get the same props.

interface CoreExperienceProps {
  /**
   * Pitfall 7: the engine's `asOf` is derived ONCE on the server per request
   * (src/app/page.tsx) and threaded through this prop. Every client recompute
   * reuses it, so server HTML and hydrated results agree across midnight and
   * transfer-bonus boundaries. This file never reads the clock.
   */
  asOf: string;
  /**
   * Server-read via `auth()` in src/app/page.tsx — never a Clerk client hook
   * here (Pitfall 5): a prop is identical on server and client, so the Save
   * CTA and bookmark labels hydrate exactly (T-06-17).
   */
  isSignedIn: boolean;
  /**
   * The signed-in user's last explicit save (ACCT-01), or null. Consumed ONLY
   * inside the two ref-guarded effects below — never during render — so the
   * first client paint still matches the URL-only server HTML. It can change
   * after mount: a modal sign-in triggers a soft refresh that re-renders the
   * server page with a non-null value while this island stays mounted.
   */
  savedBalances: Balances | null;
  /** Redemption slugs the user has bookmarked (ACCT-02); [] when signed out. */
  bookmarkedSlugs: readonly string[];
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

/**
 * Pitfall 6 / T-04-14: the ONLY place browser storage is reached for. Access
 * itself can throw in restricted WebViews (LinkedIn in-app browser, private
 * modes) — return null and the island silently degrades to URL-only behavior.
 * Called from effects only (Pitfall 2), never during render.
 */
function getSafeStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** A5 teaser default: the first featured, verified redemption in seed order. */
const featuredTeaser: RedemptionSeed | undefined = redemptions.find(
  (redemption) => redemption.featured && redemption.verifiedAt !== null,
);

const dataset = { programs, routes, bonuses, redemptions };

const SECTION_HEADING_CLASS =
  "font-heading text-ink text-[1.75rem] leading-tight font-semibold";

export function CoreExperience({
  asOf,
  isSignedIn,
  savedBalances,
  bookmarkedSlugs,
}: CoreExperienceProps) {
  // nuqs defaults are exactly what INPUT-03 wants: shallow=true (no server
  // round-trip per keystroke) and history="replace" (typing never spams the
  // back button). First render is URL-only on both server and client.
  const [params, setParams] = useQueryStates(balanceParsers);
  const balances = paramsToBalances(params);

  // Live recompute keyed on the URL state + the server clock (Pitfall 7).
  // T-04-12 / T-01-07: an engine throw renders the neutral error copy only —
  // the caught error is never rendered or logged.
  const results = useMemo<RankedResults | null>(() => {
    try {
      return rankRedemptions({
        balances: paramsToBalances(params),
        dataset,
        asOf,
      });
    } catch {
      return null;
    }
  }, [params, asOf]);

  // A1 edit ownership: editing any input claims the balance set as the
  // visitor's own; only then is storage written (Pattern 4 rule 3).
  const hasEditedRef = useRef(false);
  const hydratedRef = useRef(false);
  // One-shot guard for the account branch specifically: set by whichever of
  // the two effects below applies `savedBalances`, so it is applied at most
  // once per mount regardless of whether it was present at mount or arrived
  // later (post-sign-in refresh).
  const appliedAccountRef = useRef(false);

  // Pitfall 2: storage is read in an effect AFTER mount — never during render
  // or in a state initializer — so server HTML and first client paint match.
  // Runs once (ref-guarded; idempotent under Strict Mode double-invoke).
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    // No early return when storage is unreachable: a restricted WebView must
    // still get the account branch below.
    const storage = getSafeStorage();
    const stored = storage === null ? null : readStoredBalances(storage);

    const action = resolveInitialBalances(
      paramsToBalances(params),
      stored,
      savedBalances,
    );
    // A1 precedence — URL > storage > account: source === "url" → do NOTHING.
    // A share link drives the display but must never overwrite the visitor's
    // own stored balances, and a device's own edits outrank the last explicit
    // account save. The account branch never writes storage (T-06-09) — the
    // write effect below still keys on hasEditedRef only.
    if (action.source === "storage" || action.source === "account") {
      if (action.source === "account") appliedAccountRef.current = true;
      // Pattern 4 rule 2: push the restored balances into the URL with a
      // replace so the bare "/" visit is instantly shareable again with no
      // history spam.
      void setParams(balancesToParams(action.balances), {
        history: "replace",
      });
    }
  }, [params, setParams, savedBalances]);

  // A1 rule 3 after mount: the mount effect above is one-shot, so it cannot
  // see `savedBalances` change from null to a saved set — which is exactly
  // what happens when a visitor lands on an empty "/" and signs in through
  // the modal (Clerk soft-refreshes the server page; this island keeps its
  // refs). This effect applies the account save in that case ONLY — same
  // precedence (URL > storage > account, via the same pure resolver), never
  // after the visitor has edited (their own edits outrank the account), and
  // never writing storage (T-06-09). The hydratedRef guard above stays as-is:
  // dropping it would make "clear every field" re-hydrate from storage.
  useEffect(() => {
    if (appliedAccountRef.current || hasEditedRef.current) return;
    const storage = getSafeStorage();
    const stored = storage === null ? null : readStoredBalances(storage);
    const action = resolveInitialBalances(
      paramsToBalances(params),
      stored,
      savedBalances,
    );
    if (action.source !== "account") return;
    appliedAccountRef.current = true;
    void setParams(balancesToParams(action.balances), { history: "replace" });
  }, [params, setParams, savedBalances]);

  // Pattern 4 rule 3: persist the full balance set on every URL change, but
  // only after the visitor has edited (A1 — never on a share-link visit).
  useEffect(() => {
    if (!hasEditedRef.current) return;
    const storage = getSafeStorage();
    if (storage === null) return;
    writeStoredBalances(storage, paramsToBalances(params));
  }, [params]);

  function handleBalanceChange(
    slug: EnterableProgramSlug,
    value: number | null,
  ) {
    hasEditedRef.current = true;
    void setParams({ [PARAM_KEY_BY_SLUG[slug]]: value });
  }

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

  const hasBalances = Object.keys(balances).length > 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 md:py-16">
      <header className="flex flex-col gap-6">
        {/* UI-SPEC: the sole permitted text-display-xl use, clamped to
            text-display below md. Ink, not terracotta — the delta is the drama. */}
        <h1 className="font-display text-ink text-display md:text-display-xl font-semibold">
          What are your points actually worth?
        </h1>
        <BalanceForm
          balances={balances}
          onBalanceChange={handleBalanceChange}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <Button
            type="button"
            onClick={handleCopyLink}
            // Sanctioned accent use #2 + UI-SPEC 44px touch target (h-11).
            className="bg-terracotta hover:bg-terracotta/90 h-11 min-w-44 self-start px-6 text-base font-semibold text-white"
          >
            <span aria-live="polite">
              {copied ? "Link copied" : "Copy my link"}
            </span>
          </Button>
          {/* ACCT-01: explicit save beside the share CTA — ink/outline. */}
          <SaveBalancesButton balances={balances} isSignedIn={isSignedIn} />
        </div>
      </header>

      {/* Pitfall 9: every branch is an explicit, designed state. */}
      {results === null ? (
        <ErrorState />
      ) : !hasBalances ? (
        <EmptyState />
      ) : results.bookableNow.length === 0 &&
        results.almostThere.length === 0 ? (
        <SparseState />
      ) : (
        <div className="flex flex-col">
          {results.bookableNow.length > 0 && (
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h2 className={SECTION_HEADING_CLASS}>Bookable now</h2>
                {/* VAL-03: the methodology link lives under the results heading. */}
                <Link
                  href="/methodology"
                  className="text-ink/70 text-sm leading-5 underline-offset-4 hover:underline"
                >
                  How we calculate these numbers →
                </Link>
              </div>
              {/* Engine array order is the ranking (RANK-01) — never re-sort. */}
              <ul className="flex flex-col gap-6">
                {results.bookableNow.map((result) => (
                  <li key={result.redemption.slug}>
                    <ResultCard
                      result={result}
                      programs={programs}
                      routes={routes}
                      bookmarked={bookmarkedSlugs.includes(
                        result.redemption.slug,
                      )}
                      isSignedIn={isSignedIn}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
          <AlmostThere
            results={results.almostThere}
            programs={programs}
            routes={routes}
            bookmarkedSlugs={bookmarkedSlugs}
            isSignedIn={isSignedIn}
          />
        </div>
      )}
    </div>
  );
}

/** T-04-12: neutral copy only — no error detail ever reaches the DOM. */
function ErrorState() {
  return (
    <p className="text-ink text-base leading-6">
      Something went wrong showing your results. Refresh the page to try again.
    </p>
  );
}

/**
 * Pitfall 9 empty state (no balances) with the A5 featured teaser. The teaser
 * shows ONLY direct seed fields — no wow delta and no engine math, because a
 * delta requires a balance and inventing one would be UI arithmetic.
 */
function EmptyState() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className={SECTION_HEADING_CLASS}>
          Your points are worth more than you think
        </h2>
        <p className="text-ink/70 text-base leading-6">
          Enter a balance above to see your best redemptions — like this one:
        </p>
      </div>
      {featuredTeaser !== undefined && featuredTeaser.verifiedAt !== null && (
        <Card className="text-ink [--card-spacing:--spacing(4)] sm:[--card-spacing:--spacing(6)]">
          <CardHeader>
            <CardTitle className="text-ink text-[1.75rem] leading-tight font-semibold">
              {featuredTeaser.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <dt className="text-ink/70 text-sm font-semibold">Cash fare</dt>
                <dd className="text-ink text-base leading-6">
                  ~{formatDollars(featuredTeaser.cashFareCents)} cash fare
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-ink/70 text-sm font-semibold">From</dt>
                <dd className="text-ink text-base leading-6">
                  {formatPoints(featuredTeaser.pointsMin)} points
                </dd>
              </div>
            </dl>
          </CardContent>
          <CardFooter>
            <p className="text-ink/70 text-sm leading-5">
              Verified {formatVerifiedDate(featuredTeaser.verifiedAt)}
            </p>
          </CardFooter>
        </Card>
      )}
    </section>
  );
}

/** Pitfall 9 sparse state: balances entered, both tiers empty. */
function SparseState() {
  return (
    <p className="text-ink text-base leading-6">
      Nothing bookable with these balances yet. Add more programs above, or keep
      earning — Almost there shows what&apos;s within reach.
    </p>
  );
}
