import Link from "next/link";

// Site footer (VAL-03 link placement). Server component: no client directive,
// no hooks, no data — a wordmark, the methodology link, and the standing
// disclaimer. Plan 05-05 mounts it in src/app/layout.tsx so it appears under
// every route; this file deliberately stays unmounted until then to avoid a
// layout.tsx conflict with the wave-2 metadata work.
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
          <span className="text-ink/70 text-sm leading-5">
            Educational only — not financial advice
          </span>
        </nav>
      </div>
    </footer>
  );
}
