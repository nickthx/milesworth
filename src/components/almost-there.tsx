import { BookmarkButton } from "@/components/bookmark-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgramSeed, TransferRouteSeed } from "@/data";
import type { RankedResult } from "@/engine";
import { formatDollars, formatPoints, heroDelta } from "@/lib/format";
import { formatTransferPath } from "@/lib/path-display";

// The "Almost there" tier (RANK-02): near-miss redemptions with a points-away
// callout. Pure presentation — results render in engine array order (never
// re-sorted) and every figure comes through a plan 04-02 formatter.
//
// Accent discipline (UI-SPEC): no accent color anywhere in this section. The
// drama stays in Bookable now; the callout and the potential delta are ink.
//
// ACCT-02 "redemptions they're working toward" — the near-miss tier is exactly
// that, so when the island passes `bookmarkedSlugs` every card ends with an
// ink BookmarkButton. Both props are optional so existing callers are unchanged.

interface AlmostThereProps {
  results: RankedResult[];
  programs: ProgramSeed[];
  routes: TransferRouteSeed[];
  bookmarkedSlugs?: readonly string[];
  isSignedIn?: boolean;
}

export function AlmostThere({
  results,
  programs,
  routes,
  bookmarkedSlugs,
  isSignedIn,
}: AlmostThereProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 flex flex-col gap-6">
      <h2 className="font-heading text-ink text-[1.75rem] leading-tight font-semibold">
        Almost there
      </h2>
      <ul className="flex flex-col gap-6">
        {results.map((result) => {
          const { redemption, chosenPath } = result;

          // pointsAway is denominated in the chosen path's source currency
          // (engine contract) — so the callout names that program.
          const sourceProgram = programs.find(
            (program) => program.slug === chosenPath.fromProgramSlug,
          );
          const sourceName = sourceProgram?.name ?? chosenPath.fromProgramSlug;

          // Pitfall 10: mirror the result-card framing. Hotel-funded (null
          // baseline) has a $0 cash-out, so a cash-out comparison would mislead.
          const deltaLine =
            (sourceProgram?.cashOutBaselineCppX100 ?? null) === null
              ? `worth ${formatDollars(heroDelta(result))} in travel value`
              : `worth ${formatDollars(heroDelta(result))} over cash-out`;

          return (
            <li key={redemption.slug}>
              <Card className="text-ink">
                <CardHeader>
                  <CardTitle className="text-ink text-[1.75rem] leading-tight font-semibold">
                    {redemption.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {result.pointsAway !== null && (
                    <p className="text-ink text-base leading-6 font-semibold">
                      {`You're ${formatPoints(result.pointsAway ?? 0)} ${sourceName} points away`}
                    </p>
                  )}
                  <p className="text-ink/70 text-sm leading-5">
                    {formatTransferPath(chosenPath, routes, programs)}
                  </p>
                  <p className="text-ink/70 text-base leading-6">{deltaLine}</p>
                  {bookmarkedSlugs !== undefined && (
                    <BookmarkButton
                      slug={redemption.slug}
                      bookmarked={bookmarkedSlugs.includes(redemption.slug)}
                      isSignedIn={isSignedIn ?? false}
                    />
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
