import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs/server";

import { AdvisorTease } from "@/components/advisor-tease";
import { CoreExperience } from "@/components/core-experience";
import { loadBalanceParams, paramsToBalances } from "@/lib/balance-params";
import { loadAccountSnapshot } from "@/lib/server/account-data";
import { buildShareContent } from "@/lib/share-content";

// D-04 homepage — Phase 4 replaces the Phase 1 placeholder (wordmark + live
// DB count) with the guest core experience. The DB import, the count query,
// and the forced-dynamic export were DELETED, not migrated: the guest flow never touches
// Postgres (T-04-11), and error handling now lives in the island (T-01-07
// precedent carried forward there).
//
// Server component, no client directive. Awaiting searchParams makes the
// route dynamic implicitly (Pitfall 3 / RESEARCH anti-pattern: do NOT add a
// `dynamic` segment-config export), so a shared URL server-renders full ranked results
// into the initial HTML (INPUT-03).
//
// Phase 6 (ACCT-01/02): the page reads the session with `auth()` and hands the
// island `isSignedIn`, `savedBalances`, and `bookmarkedSlugs` as props
// (RESEARCH Pattern 3 — server-read auth, never a client hook, so hydration is
// exact). page.tsx still imports no "@/db": the read goes through the
// server-only module src/lib/server/account-data.ts (T-06-05), and guests
// short-circuit before any DB code runs. `/` is already dynamic, so `auth()`
// changes no rendering mode (Pitfall 4). A5: after a modal sign-in Clerk
// refreshes the router so these props re-render (verified by the 06-07 human
// checkpoint; the router.refresh() fallback is documented there).

/**
 * Per-share-link social metadata (PLAT-03). The same buildShareContent helper
 * the /og route renders from produces the title/description here, so the
 * unfurl text and the card image can never disagree. og:url and og:image
 * both carry the canonical query string (Pitfall 5 / A1) so distinct balance
 * sets never collapse into one cached preview (T-05-11). The openGraph and
 * twitter objects are returned complete — Next shallow-replaces nested
 * metadata objects, so returning only `images` would drop siteName/type.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const balances = paramsToBalances(await loadBalanceParams(searchParams));
  const asOf = new Date().toISOString().slice(0, 10);
  const share = buildShareContent({ balances, asOf });
  const pageUrl = share.queryString ? `/?${share.queryString}` : "/";
  // The `d` stamp must match the /og route's canonical query exactly or the
  // crawler eats a 308 (see the canonicalization block in og/route.tsx). It
  // dates the CDN entry so a 24h-cached card can never be paired with an
  // og:description computed on a later, differently-gated day.
  const imageUrl = share.queryString
    ? `/og?${share.queryString}&d=${asOf}`
    : "/og";

  return {
    title: share.title,
    description: share.description,
    openGraph: {
      type: "website",
      siteName: "Milesworth",
      title: share.title,
      description: share.description,
      url: pageUrl,
      images: [
        { url: imageUrl, width: 1200, height: 630, alt: share.imageAlt },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: share.title,
      description: share.description,
      images: [imageUrl],
    },
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // nuqs loader — same parser map the island uses (Pattern 1, one source of
  // truth). The island reads the URL itself via useQueryStates; awaiting here
  // is what opts the route into per-request rendering.
  await loadBalanceParams(searchParams);

  // T-06-01: the session is read here, server-side; the island only ever sees
  // a boolean and the current user's own rows — never a userId.
  const { userId } = await auth();
  const account = userId ? await loadAccountSnapshot(userId) : null;

  // Pitfall 7 / Phase 5 Pitfall 10: this page has exactly two server-side
  // clock reads per request — generateMetadata above and this one. The island
  // reuses this prop for every client recompute and the engine never reads
  // the clock, so server HTML and hydrated results agree; share text is never
  // passed into the island.
  const asOf = new Date().toISOString().slice(0, 10);

  return (
    <main className="bg-cream flex flex-1 flex-col">
      <CoreExperience
        asOf={asOf}
        isSignedIn={userId !== null}
        savedBalances={account?.balances ?? null}
        bookmarkedSlugs={account?.bookmarkedSlugs ?? []}
      />
      {/* PLAT-04: v2 advisor tease + interest hook, aligned to the island's
          container. No props — the tease never receives asOf or share text. */}
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
        <AdvisorTease />
      </div>
    </main>
  );
}
