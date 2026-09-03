import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

import { SiteFooter } from "@/components/site-footer";
import { SITE_URL } from "@/lib/site";

// D-13: Fraunces chosen for its optical-size (opsz) axis — it carries the big
// dollar numbers in the Phase 4 wow reveal, not just headlines.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Absolute origin for metadataBase (PLAT-03) — see src/lib/site.ts for why it
// is a fixed constant with an env override rather than Vercel's per-deployment
// host (T-05-10). Shared with the /og card footer so the two can never name
// different hosts.

export const metadata: Metadata = {
  title: "Points Unlocked",
  description: "See what your credit card points are actually worth.",
  // D-03 noindex gate: keep the pre-launch site out of search indexes.
  // Removing this is an explicit Phase 7 launch-gate task.
  robots: { index: false, follow: false },
  // Relative openGraph/twitter image URLs resolve against this (Pitfall 2 —
  // omitting it is a build error). Note: unfurl crawlers ignore noindex (A5).
  metadataBase: new URL(SITE_URL),
  // Site-wide social defaults; `/` overrides these per share link with
  // complete openGraph/twitter objects (nested objects are shallow-replaced,
  // not deep-merged). /og with no params renders the branded baseline card.
  openGraph: {
    type: "website",
    siteName: "Points Unlocked",
    title: "Points Unlocked",
    description: "See what your credit card points are actually worth.",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "Points Unlocked — what are your points actually worth?",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Points Unlocked",
    description: "See what your credit card points are actually worth.",
    images: ["/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      {/* Pitfall 1: every nuqs hook throws at runtime without the framework
          adapter wrapping the tree — this is the one required wrap for the
          URL-state balance flow (INPUT-03). */}
      <body className="flex min-h-full flex-col">
        {/* VAL-03: SiteFooter sits inside the adapter after every route's
            content; mt-auto pins it to the bottom of the flex-column body. */}
        <NuqsAdapter>
          {children}
          <SiteFooter />
        </NuqsAdapter>
      </body>
    </html>
  );
}
