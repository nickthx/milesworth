import { BookmarkButton } from "@/components/bookmark-button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProgramSeed, TransferRouteSeed } from "@/data";
import type { RankedResult } from "@/engine";
import {
  cashOutValueCents,
  formatCpp,
  formatDollars,
  formatPoints,
  formatVerifiedDate,
  heroDelta,
} from "@/lib/format";
import { formatTransferPath } from "@/lib/path-display";

// The wow card (VAL-01, VAL-04, RANK-03/04/05). Pure presentation: every
// figure on this card is a pre-computed integer field on RankedResult passed
// through a plan 04-02 formatter — zero arithmetic lives here. Server-
// compatible (no client directive); it renders inside the island regardless.
//
// Accent discipline (UI-SPEC): terracotta is used for exactly two things on
// this card — the hero delta and the active transfer-bonus badge. Everything
// else stays ink/muted so the delta carries the drama.
//
// ACCT-02: when the island passes `bookmarked`, the footer carries an ink
// BookmarkButton (a client child; this file stays server-compatible). Both
// props are optional so the plan 04-03 callers and tests need no change.

interface ResultCardProps {
  result: RankedResult;
  programs: ProgramSeed[];
  routes: TransferRouteSeed[];
  bookmarked?: boolean;
  isSignedIn?: boolean;
}

export function ResultCard({
  result,
  programs,
  routes,
  bookmarked,
  isSignedIn,
}: ResultCardProps) {
  const { redemption, chosenPath } = result;

  const sourceProgram = programs.find(
    (program) => program.slug === chosenPath.fromProgramSlug,
  );
  const sourceName = sourceProgram?.name ?? chosenPath.fromProgramSlug;
  const cashOutBaselineCppX100 = sourceProgram?.cashOutBaselineCppX100 ?? null;

  // Pitfall 10 / A2: hotel currencies have no cash-out path (null baseline),
  // so a cash-out comparison would be misleading — frame as pure travel value.
  // Bank points (incl. Bilt's ratified 0.1¢ stand-in) get the cash-out delta.
  const framingLine =
    cashOutBaselineCppX100 === null
      ? "Pure travel value — these points have no cash-out option"
      : `vs. ~${formatDollars(
          cashOutValueCents(
            chosenPath.requiredSourcePoints,
            cashOutBaselineCppX100,
          ),
        )} cashing out`;

  // Conservative end, consistent with the hero (A2 / Pitfall 4).
  const valuePerPoint = formatCpp(
    result.effectiveCppX100.atMax ?? result.effectiveCppX100.atMin,
  );

  return (
    <Card className="text-ink [--card-spacing:--spacing(4)] sm:[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-ink text-[1.75rem] leading-tight font-semibold">
          {redemption.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Hero — the ONLY terracotta number; A2: this is the ranking key. */}
        <div className="flex flex-col gap-2">
          <p className="font-display text-display text-terracotta font-semibold">
            {formatDollars(heroDelta(result))}
          </p>
          <p className="text-ink/70 text-base leading-6">{framingLine}</p>
        </div>

        {/* VAL-01: cash fare and value-per-point side by side. */}
        <dl className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <dt className="text-ink/70 text-sm font-semibold">Cash fare</dt>
            <dd className="text-ink text-base leading-6">
              {formatDollars(redemption.cashFareCents)}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-ink/70 text-sm font-semibold">
              Value per point
            </dt>
            <dd className="text-ink text-base leading-6">{valuePerPoint}</dd>
          </div>
        </dl>

        {/* RANK-03 balance tag + RANK-04 explicit path. */}
        <div className="flex flex-col gap-2">
          <span className="bg-ink/5 text-ink/70 inline-flex w-fit items-center rounded-full px-2 py-1 text-sm font-semibold">
            Uses {formatPoints(chosenPath.requiredSourcePoints)} {sourceName}{" "}
            points
          </span>
          <p className="text-ink/70 text-sm leading-5">
            {formatTransferPath(chosenPath, routes, programs)}
          </p>
          {chosenPath.activeBonus !== null && (
            // VAL-05 surfacing — sanctioned accent use #3.
            <p className="text-terracotta text-sm leading-5 font-semibold">
              +{chosenPath.activeBonus.bonusPercent}% transfer bonus through{" "}
              {formatVerifiedDate(chosenPath.activeBonus.endDate)}
            </p>
          )}
        </div>

        {/* RANK-05: booking guidance verbatim; seed text uses \n separators.
            whitespace-pre-line renders them without any HTML injection
            (T-04-07 — JSX auto-escaping; raw HTML injection is prohibited). */}
        <p className="text-ink text-base leading-6 whitespace-pre-line">
          {redemption.bookingHint}
        </p>
      </CardContent>

      {/* VAL-04: engine output is A5-filtered so verifiedAt is non-null, but
          guard with a conditional rather than a non-null assertion. */}
      {redemption.verifiedAt !== null && (
        <CardFooter className="flex items-center justify-between gap-4">
          <p className="text-ink/70 text-sm leading-5">
            Verified {formatVerifiedDate(redemption.verifiedAt)}
          </p>
          {bookmarked !== undefined && (
            <BookmarkButton
              slug={redemption.slug}
              bookmarked={bookmarked}
              isSignedIn={isSignedIn ?? false}
            />
          )}
        </CardFooter>
      )}
    </Card>
  );
}
