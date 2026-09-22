import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { CREAM, INK } from "@/lib/brand";

// /icon — the 32×32 browser-tab favicon (PLAT-05 branded mark, UI-SPEC A13):
// a Fraunces 600 "M", ink on cream, no accent. Next's `icon.tsx` convention
// renders this once at build and emits the single
// <link rel="icon" sizes="32x32" type="image/png">; the scaffold favicon.ico
// was deleted so the head never carries two icon links.
//
// Static: no request input, no clock, no auth, no database. The font is the
// same vendored @fontsource woff the /og card uses, read from disk at build
// — never fetched at runtime (T-07-24). Brand colors come from brand.ts so
// the tab, the theme-color, and the social card can never drift apart
// (T-07-04).

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const FONT_PATH = join(
  process.cwd(),
  "src/assets/fonts",
  "fraunces-latin-600-normal.woff",
);

export default async function Icon() {
  const fraunces = await readFile(FONT_PATH);

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: CREAM,
        color: INK,
        fontFamily: "Fraunces",
        fontWeight: 600,
        fontSize: 24,
      }}
    >
      M
    </div>,
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: fraunces, weight: 600, style: "normal" },
      ],
    },
  );
}
