import Link from "next/link";

// Site footer (VAL-03 link placement; ACCT-04 privacy link). Server
// component: no client directive, no hooks, no data — a wordmark, the
// methodology and privacy links, and the standing disclaimer. Mounted in
// src/app/layout.tsx (plan 05-05) so it appears under every route.
//
// Accent discipline (UI-SPEC): ink only. Nothing in the footer is the wow
// delta, so no accent color appears here.

export function SiteFooter() {
  return (
    <footer className="border-ink/10 mt-auto border-t">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-ink text-sm font-semibold">Milesworth</p>
        <nav
          aria-label="Footer"
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
        >
          <Link
            href="/methodology"
            className="text-ink/70 text-sm leading-5 underline-offset-4 hover:underline"
          >
            Methodology
          </Link>
          <Link
            href="/privacy"
            className="text-ink/70 text-sm leading-5 underline-offset-4 hover:underline"
          >
            Privacy
          </Link>
          <span className="text-ink/70 text-sm leading-5">
            Educational only — not financial advice
          </span>
        </nav>
      </div>
    </footer>
  );
}
