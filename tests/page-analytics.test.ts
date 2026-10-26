import { describe, expect, it } from "vitest";

import { stripQuery } from "../src/components/page-analytics";

describe("stripQuery (analytics never records balances)", () => {
  it("drops the balance query string and hash from page views", () => {
    const event = stripQuery({
      type: "pageview",
      url: "https://milesworth.vercel.app/?ur=90000&mr=50000#top",
    });
    expect(event).toEqual({
      type: "pageview",
      url: "https://milesworth.vercel.app/",
    });
  });

  it("keeps the path for non-root pages", () => {
    expect(
      stripQuery({
        type: "pageview",
        url: "https://milesworth.vercel.app/methodology?hyatt=40000",
      }).url,
    ).toBe("https://milesworth.vercel.app/methodology");
  });
});
