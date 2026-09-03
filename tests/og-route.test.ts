import { describe, expect, it } from "vitest";

import { GET } from "../src/app/og/route";

// PLAT-03: exercises the REAL next/og ImageResponse in the node environment
// (no mocks) — each case renders an actual PNG (~1 s each), so the file is
// deliberately kept to three cases. Requires the vendored Fraunces/Inter
// .woff files from plan 05-01 under src/assets/fonts; a missing or corrupt
// font would surface here as the neutral 500, failing the status assertion.

/** Bytes 1–3 of a PNG are the ASCII signature "PNG" (byte 0 is 0x89). */
async function pngSignature(res: Response): Promise<string> {
  const bytes = new Uint8Array(await res.arrayBuffer());
  return Array.from(bytes.subarray(1, 4))
    .map((b) => String.fromCharCode(b))
    .join("");
}

describe("GET /og", () => {
  it("returns a CDN-cached 1200x630 PNG for a share link", async () => {
    const res = await GET(
      new Request("http://localhost/og?ur=90000&mr=50000"),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("cache-control")).toContain("s-maxage=86400");
    expect(await pngSignature(res)).toBe("PNG");
  });

  it("renders the branded baseline card when no params are given", async () => {
    const res = await GET(new Request("http://localhost/og"));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(await pngSignature(res)).toBe("PNG");
  });

  it("redirects hostile params to the canonical baseline URL instead of erroring (T-05-07)", async () => {
    const res = await GET(
      new Request("http://localhost/og?ur=-5&mr=abc&zz=1&ur=1e9"),
    );

    // Every hostile value drops, so the canonical form of this request is the
    // no-params baseline card — reached by redirect, not by a fresh render.
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("/og");
  });

  it("collapses non-canonical spellings onto one cache key (T-05-08)", async () => {
    // Reordered keys plus a junk key: same balance set, so the CDN must not
    // see a second key for it. No render happens on this path.
    const res = await GET(
      new Request("http://localhost/og?mr=50000&zz=nonce&ur=90000"),
    );

    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("/og?ur=90000&mr=50000");
  });

  it("drops implausibly huge balances rather than minting a cache key", async () => {
    const res = await GET(
      new Request("http://localhost/og?ur=9007199254740991"),
    );

    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("/og");
  });
});
