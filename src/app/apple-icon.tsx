import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { CREAM, INK } from "@/lib/brand";

// /apple-icon — the 180×180 home-screen icon (PLAT-05 branded mark, UI-SPEC
// A13): the same Fraunces 600 "M", ink on cream, no accent, as src/app/icon.tsx
// at the iOS "Add to Home Screen" size. Next's `apple-icon.tsx` convention
// renders it once at build and emits <link rel="apple-touch-icon">.
//
// Static: no request input, no clock, no auth, no database. Font read from
// the vendored woff at build, never fetched at runtime (T-07-24); colors from
// brand.ts (T-07-04).

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const FONT_PATH = join(
  process.cwd(),
  "src/assets/fonts",
  "fraunces-latin-600-normal.woff",
);

export default async function AppleIcon() {
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
        fontSize: 128,
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
