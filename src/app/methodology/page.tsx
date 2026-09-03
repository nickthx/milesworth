import type { Metadata } from "next";
import Link from "next/link";

import { programs, redemptions, routes } from "@/data";
import { cppX100, requiredSourcePoints } from "@/engine";
import { formatCpp, formatDollars, formatPoints } from "@/lib/format";

// The methodology page (VAL-03). Static server component: no client
// directive, no request-time input, no clock read, no database — the route
// prerenders at build and ships zero client JS (T-05-05).
//
// The page is the drift guard (T-05-04): every number below is rendered from
// the seed data through the engine and the sanctioned formatters, never
// typed. Re-ratifying a cash-out baseline in src/data/programs.ts or
// re-verifying the ANA anchor fare changes this page with zero edits here.
// The prose describes what src/engine ACTUALLY does — valuation.ts,
// paths.ts, ranking.ts — and must be updated alongside them.
//
// Accent discipline (UI-SPEC): ink only. Nothing on this page is the wow
// delta, so the accent color is not used anywhere here.

export const metadata: Metadata = {
  title: "Methodology — Points Unlocked",
  description:
    "How we source cash fares, treat taxes and fees, value points, and why award prices are ranges.",
};

/** The flagship worked example — the same anchor tests/engine-valuation.test.ts pins at 9.3¢. */
const anchor = redemptions.find(
  (redemption) => redemption.slug === "ana-business-tokyo-roundtrip",
);

/** The eight programs a visitor can enter, in seed order. */
const enterablePrograms = programs.filter((program) => program.isUserEnterable);

/** The one figure the structural-bonus example is free to choose. */
const EXAMPLE_PARTNER_MILES = 60_000;

interface BonusExample {
  milesPerBlock: number;
  blockPoints: number;
  partnerMiles: number;
  /** What the transfer actually costs, priced by the engine. */
  sourcePoints: number;
  /** What the ratio alone would suggest, ignoring the block bonus. */
  naiveSourcePoints: number;
}

/**
 * The structural-bonus worked example (T-05-04). Every figure comes from the
 * seed route priced through the same requiredSourcePoints the ranking uses —
 * change bonusMilesPerBlock, bonusBlockPoints or incrementPoints in
 * src/data/transfers.ts and this paragraph moves with it. Returns null if the
 * route or its bonus fields ever disappear, and the paragraph drops the
 * example rather than stating a stale one.
 */
function buildBonusExample(): BonusExample | null {
  const route = routes.find(
    (candidate) =>
      candidate.fromProgramSlug === "marriott-bonvoy" &&
      candidate.toProgramSlug === "alaska-mileage-plan",
  );
  if (route === undefined) {
    return null;
  }
  const { bonusMilesPerBlock, bonusBlockPoints } = route;
  if (bonusMilesPerBlock === null || bonusBlockPoints === null) {
    return null;
  }
  const sourcePoints = requiredSourcePoints(
    route,
    null,
    EXAMPLE_PARTNER_MILES,
  );
  if (sourcePoints === null) {
    return null;
  }
  return {
    milesPerBlock: bonusMilesPerBlock,
    blockPoints: bonusBlockPoints,
    partnerMiles: EXAMPLE_PARTNER_MILES,
    sourcePoints,
    naiveSourcePoints: Math.ceil(
      (EXAMPLE_PARTNER_MILES * route.ratioDenominator) / route.ratioNumerator,
    ),
  };
}

const bonusExample = buildBonusExample();

const SECTION_CLASS = "flex flex-col gap-6";
const HEADING_CLASS =
  "font-heading text-ink text-[1.75rem] leading-tight font-semibold";
const BODY_CLASS = "text-ink text-base leading-6";
const MUTED_CLASS = "text-ink/70 text-base leading-6";
const LABEL_CLASS = "text-ink/70 text-sm font-semibold";
const LINK_CLASS =
  "text-ink/70 text-sm leading-5 underline-offset-4 hover:underline";

export default function MethodologyPage() {
  // A2: the conservative end of the range is the figure the results rank on,
  // so the worked example uses it too. Guarded, never asserted non-null.
  const anchorPoints =
    anchor === undefined ? null : (anchor.pointsMax ?? anchor.pointsMin);
  const anchorCpp =
    anchor === undefined || anchorPoints === null
      ? null
      : cppX100(anchor.cashFareCents, anchor.taxesFeesCents, anchorPoints);

  return (
    <main className="bg-cream flex flex-1 flex-col">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 md:py-16">
        <header className="flex flex-col gap-6">
          <h1 className="font-display text-ink text-display font-semibold">
            How we value your points
          </h1>
          <p className={MUTED_CLASS}>
            Every figure on your results page comes from the same small set of
            rules. This page states those rules exactly, with the live numbers
            the site is using right now, so you can check the math yourself.
          </p>
        </header>

        <section className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>What you&apos;re looking at</h2>
          <p className={BODY_CLASS}>
            Each redemption shows two valuations side by side: the cash fare the
            same trip would cost, and the cents per point you get by paying with
            points instead. The large dollar figure on each card is the
            difference between what your points are worth as travel and what
            those same points would fetch if you cashed them out. We call it the
            wow delta, and it is what the results are ranked on.
          </p>
          <p className={BODY_CLASS}>
            When an award has a price range, we always use the conservative end
            of it. You should never see a number here that a real booking comes
            in below.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>Where cash fares come from</h2>
          <p className={BODY_CLASS}>
            Cash fares are representative, hand-verified benchmarks, not live
            prices. For economy and business class we use a discounted,
            realistic retail fare for the route, not the full-flex fare a
            last-minute traveler pays. For first class we use the undiscounted
            retail fare, because first-class tickets rarely discount.
          </p>
          <p className={BODY_CLASS}>
            Every entry carries a source note naming where the fare came from
            and a methodology note explaining how it was benchmarked. Fares are
            refreshed by hand, and each entry is stamped with the date it was
            last verified.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>Taxes and fees</h2>
          <p className={BODY_CLASS}>
            You pay taxes and carrier fees in cash whether you book with points
            or with dollars, so they are not part of what your points buy. We
            subtract them from the cash fare before dividing by points, and the
            wow delta subtracts them on the value side for the same reason.
          </p>
          <p className={BODY_CLASS}>
            cents per point = (cash fare − taxes and fees) ÷ points
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>Cents per point</h2>
          <p className={BODY_CLASS}>
            We use the standard cents-per-point convention: net cash value
            divided by the points the award costs. The figure on each card is
            per partner point, meaning the points of the airline or hotel
            program that actually issues the award. Here is the flagship
            example, computed from the live entry:
          </p>
          {anchor !== undefined &&
            anchorPoints !== null &&
            anchorCpp !== null && (
              <p className={BODY_CLASS}>
                {anchor.title}: ({formatDollars(anchor.cashFareCents)} −{" "}
                {formatDollars(anchor.taxesFeesCents)}) ÷{" "}
                {formatPoints(anchorPoints)} points = {formatCpp(anchorCpp)} per
                point.
              </p>
            )}
          <p className={BODY_CLASS}>
            When your points reach that program through a transfer, we also
            compute the same figure per source point, the points you actually
            hold. An active transfer bonus lowers the source points needed to
            fund the same award, so the per-source-point figure rises while the
            per-partner-point figure stays fixed.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>What cashing out means</h2>
          <p className={BODY_CLASS}>
            The wow delta compares travel value against cashing out, and cashing
            out is worth a different amount in every program. We use each
            program&apos;s own baseline, never a flat 1.0¢ per point. A flat
            baseline would overstate some deltas and understate others, and it
            is the first thing an expert would attack.
          </p>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-ink/10 border-b">
                <th scope="col" className={`${LABEL_CLASS} pr-4 pb-2`}>
                  Program
                </th>
                <th scope="col" className={`${LABEL_CLASS} pb-2`}>
                  Cash-out value per point
                </th>
              </tr>
            </thead>
            <tbody>
              {enterablePrograms.map((program) => (
                <tr key={program.slug} className="border-ink/10 border-b">
                  <td className={`${BODY_CLASS} py-2 pr-4`}>{program.name}</td>
                  <td className={`${BODY_CLASS} py-2`}>
                    {program.cashOutBaselineCppX100 === null
                      ? "Pure travel value"
                      : formatCpp(program.cashOutBaselineCppX100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={BODY_CLASS}>
            Bilt has effectively no cash-out path, so its figure is a stand-in
            for near zero rather than a published rate. Hotel currencies have no
            cash-out option at all, so their redemptions are shown as pure
            travel value: the delta is the full net cash value of the stay.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>Transfer math</h2>
          <p className={BODY_CLASS}>
            Points move to partners at a published ratio and in fixed
            increments, so a transfer is always rounded down to a whole block.
            {bonusExample !== null && (
              <>
                {" "}
                Some routes carry a structural bonus, such as Marriott&apos;s{" "}
                {formatPoints(bonusExample.milesPerBlock)} bonus miles for every{" "}
                {formatPoints(bonusExample.blockPoints)} points transferred. We
                model these exactly: {formatPoints(bonusExample.partnerMiles)}{" "}
                Alaska miles via Marriott cost{" "}
                {formatPoints(bonusExample.sourcePoints)} Bonvoy points, not the
                naive {formatPoints(bonusExample.naiveSourcePoints)}.
              </>
            )}
          </p>
          <p className={BODY_CLASS}>
            Promotional transfer bonuses multiply the base conversion for the
            length of the promotion and never stack with a structural bonus. We
            only consider single-hop transfers, from a program you hold directly
            to the program that issues the award. When more than one of your
            balances could fund the same award, we pick the cheapest path: the
            fewest source points, with direct use of the issuing program winning
            ties.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>Dynamic award pricing</h2>
          <p className={BODY_CLASS}>
            Many programs now price awards dynamically, so the same seat can
            cost different amounts on different dates. Where that is true, the
            entry carries a range from a typical low to a typical high. We rank
            every redemption, and label it Bookable now, on the high end of that
            range. That is the conservative reading, and it means the site never
            overpromises what your balance can do.
          </p>
          <p className={BODY_CLASS}>
            Award space is not guaranteed. Every entry carries an availability
            rating of wide open, plan ahead, or hard to find, based on how often
            the seats or rooms actually appear. Award prices and transfer
            partners change without notice, and a change can make an entry
            cheaper or more expensive than shown until it is re-verified.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>Verification and freshness</h2>
          <p className={BODY_CLASS}>
            Every redemption shown on the site carries a Verified date, the day
            its award price, cash fare, and transfer path were last checked
            against the program&apos;s own published information. Drafts that
            have not been verified never appear, even if they are in the
            database. The site fails closed.
          </p>
          <p className={BODY_CLASS}>
            Transfer bonuses are entered by hand with their start and end dates.
            When a bonus window ends, every figure that depended on it reverts
            to the base rate automatically.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>Independence</h2>
          <p className={BODY_CLASS}>
            There are no affiliate links on this site and no card
            recommendations in this version. Nothing here is paid placement.
          </p>
          <p className={BODY_CLASS}>
            This site is educational only and is not financial advice. Point
            values depend on how you travel, and the right redemption for you
            depends on where you want to go.
          </p>
        </section>

        <Link href="/" className={LINK_CLASS}>
          Back to your results
        </Link>
      </article>
    </main>
  );
}
