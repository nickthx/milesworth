// SSR string assertions over the REAL /methodology page (VAL-03 / T-05-04).
// The page is the drift guard: every number it shows must be rendered from
// ../src/data through ../src/engine + the sanctioned formatters, never typed.
// These tests derive their expectations from the same modules, so a
// re-ratified baseline in programs.ts or a re-verified ANA fare moves the
// expectation and the page together — and a hand-typed figure would fail.
//
// No router mock: in the vitest node environment next/link renders as a plain
// <a href> under renderToStaticMarkup (verified at plan time). The source
// scan (T-05-05) borrows the describe shape from tests/balance-params.test.ts.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import MethodologyPage from "../src/app/methodology/page";
import { programs, redemptions, routes } from "../src/data";
import { requiredSourcePoints } from "../src/engine/paths";
import { cppX100 } from "../src/engine/valuation";
import { formatCpp, formatDollars, formatPoints } from "../src/lib/format";

// Rendered once; JSX escapes apostrophes as &#x27;, so decode for prose checks.
const html = renderToStaticMarkup(createElement(MethodologyPage)).replace(
  /&#x27;/g,
  "'",
);

const SECTION_HEADINGS = [
  "What you're looking at",
  "Where cash fares come from",
  "Taxes and fees",
  "Cents per point",
  "What cashing out means",
  "Transfer math",
  "Dynamic award pricing",
  "Verification and freshness",
  "Independence",
] as const;

const anchor = redemptions.find(
  (redemption) => redemption.slug === "ana-business-tokyo-roundtrip",
);

/** The seed route behind the page's structural-bonus example. */
const bonusRoute = routes.find(
  (route) =>
    route.fromProgramSlug === "marriott-bonvoy" &&
    route.toProgramSlug === "alaska-mileage-plan",
);

/** Mirrors the page's EXAMPLE_PARTNER_MILES. */
const EXAMPLE_PARTNER_MILES = 60_000;

describe("/methodology (VAL-03)", () => {
  it('renders the h1 "How we value your points"', () => {
    expect(html).toMatch(/<h1[^>]*>How we value your points<\/h1>/);
  });

  it("renders all nine section headings verbatim, as <h2>, in order", () => {
    let cursor = 0;
    for (const heading of SECTION_HEADINGS) {
      const match = html.indexOf(`>${heading}</h2>`, cursor);
      expect(
        match,
        `missing or out-of-order <h2> "${heading}"`,
      ).toBeGreaterThan(-1);
      cursor = match;
    }
    expect(html.match(/<h2[^>]*>/g)).toHaveLength(SECTION_HEADINGS.length);
  });

  it("renders every enterable program with its own live cash-out baseline", () => {
    const enterable = programs.filter((program) => program.isUserEnterable);
    expect(enterable.length).toBeGreaterThan(0);
    for (const program of enterable) {
      expect(html, `missing program ${program.slug}`).toContain(program.name);
      const expected =
        program.cashOutBaselineCppX100 === null
          ? "Pure travel value"
          : formatCpp(program.cashOutBaselineCppX100);
      expect(html, `missing baseline for ${program.slug}`).toContain(expected);
    }
  });

  it("renders the worked ANA example from cppX100 + formatters", () => {
    expect(anchor).toBeDefined();
    if (anchor === undefined) return;
    const conservativePoints = anchor.pointsMax ?? anchor.pointsMin;
    expect(html).toContain(
      formatCpp(
        cppX100(
          anchor.cashFareCents,
          anchor.taxesFeesCents,
          conservativePoints,
        ),
      ),
    );
    expect(html).toContain(formatDollars(anchor.cashFareCents));
    expect(html).toContain(formatPoints(conservativePoints));
  });

  it("states the A2 conservative reading and the disclaimers", () => {
    expect(html).toContain("high end");
    expect(html).toContain("conservative");
    expect(html).toContain("not financial advice");
    expect(html).toContain("no affiliate links");
    expect(html).toContain("Bilt");
  });

  it("derives the Marriott structural-bonus example from the seed route", () => {
    expect(bonusRoute).toBeDefined();
    if (bonusRoute === undefined) return;
    const { bonusMilesPerBlock, bonusBlockPoints } = bonusRoute;
    expect(bonusMilesPerBlock).not.toBeNull();
    expect(bonusBlockPoints).not.toBeNull();
    if (bonusMilesPerBlock === null || bonusBlockPoints === null) return;

    const sourcePoints = requiredSourcePoints(
      bonusRoute,
      null,
      EXAMPLE_PARTNER_MILES,
    );
    expect(sourcePoints).not.toBeNull();
    if (sourcePoints === null) return;
    const naiveSourcePoints = Math.ceil(
      (EXAMPLE_PARTNER_MILES * bonusRoute.ratioDenominator) /
        bonusRoute.ratioNumerator,
    );

    // The point of the drift guard: change the block bonus or the increment in
    // src/data/transfers.ts and these expectations move with the page. A
    // hand-typed figure fails here instead of shipping green and stale.
    expect(sourcePoints).toBeLessThan(naiveSourcePoints);
    expect(html).toContain(formatPoints(bonusMilesPerBlock));
    expect(html).toContain(formatPoints(bonusBlockPoints));
    expect(html).toContain(formatPoints(sourcePoints));
    expect(html).toContain(formatPoints(naiveSourcePoints));
  });

  it('links back to the results page with href="/"', () => {
    expect(html).toContain('href="/"');
  });

  it("never claims a flat 1¢ baseline and never uses the accent color", () => {
    expect(html).not.toContain("1¢ each");
    expect(html).not.toContain("terracotta");
  });
});

describe("/methodology source scan (T-05-05 static, DB-free route)", () => {
  const source = readFileSync(
    join(__dirname, "..", "src", "app", "methodology", "page.tsx"),
    "utf8",
  );

  it('contains no "use client" directive', () => {
    expect(source).not.toContain('"use client"');
  });

  it("reads no request-time input and forces no dynamic rendering", () => {
    expect(source).not.toContain("searchParams");
    expect(source).not.toContain("export const dynamic");
    expect(source).not.toContain("new Date");
  });

  it("never imports the database", () => {
    expect(source).not.toContain('from "@/db');
  });
});
