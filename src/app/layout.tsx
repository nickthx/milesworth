import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CREAM } from "@/lib/brand";
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
  title: "Milesworth",
  description: "See what your credit card points are actually worth.",
  // No site-wide robots directive: the D-03 pre-launch gate was lifted in
  // 07-09 (PLAT-02 launch flip). The one private route, /account, carries
  // its own directive in src/app/account/page.tsx and is disallowed in
  // src/app/robots.ts; tests/launch-gate.test.ts pins all three.
  // Relative openGraph/twitter image URLs resolve against this (Pitfall 2 —
  // omitting it is a build error). Note: unfurl crawlers ignore robots
  // directives (A5).
  metadataBase: new URL(SITE_URL),
  // Site-wide social defaults; `/` overrides these per share link with
  // complete openGraph/twitter objects (nested objects are shallow-replaced,
  // not deep-merged). /og with no params renders the branded baseline card.
  openGraph: {
    type: "website",
    siteName: "Milesworth",
    title: "Milesworth",
    description: "See what your credit card points are actually worth.",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "Milesworth — what are your points actually worth?",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Milesworth",
    description: "See what your credit card points are actually worth.",
    images: ["/og"],
  },
};

// PLAT-02 / RESEARCH Pattern 3: viewport-fit=cover lets the `pb-safe` footer
// clear the home indicator inside the LinkedIn WebView, and the cream
// theme-color tints the in-app chrome to match the page. `maximumScale` and
// `userScalable` are deliberately absent — locking zoom fails the Lighthouse
// accessibility meta-viewport audit and is never needed here.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: CREAM,
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
        {/* ACCT-01: ClerkProvider is the outermost child of <body> (Clerk
            Core 3 requirement) and carries NO `dynamic` prop — that prop would
            opt every route into dynamic rendering and un-prerender
            /methodology and /privacy (T-06-16). afterSignOutUrl="/" makes the
            UserButton sign-out land back on the guest flow. */}
        <ClerkProvider afterSignOutUrl="/">
          {/* VAL-03: SiteHeader and SiteFooter sit inside the adapter around
              every route's content; mt-auto pins the footer to the bottom of
              the flex-column body. */}
          <NuqsAdapter>
            <SiteHeader />
            {children}
            <SiteFooter />
          </NuqsAdapter>
        </ClerkProvider>
      </body>
    </html>
  );
}
