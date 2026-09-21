import Link from "next/link";

// Route-level not-found state for every page under src/app (Next App Router
// convention; there was none before, so an unknown address fell through to
// Next's default 404 screen). Server component — no client directive, no
// reset, no button. Renders inside the root layout, so the header and footer
// stay put and only the page body is replaced by a designed state in the same
// editorial shell as error.tsx and /privacy (PLAT-05).
//
// T-04-12 / T-07-19: fixed neutral copy only. The requested path is never
// read or echoed, and this file imports nothing beyond next/link — no Clerk
// server entry point, no database module.
//
// Accent discipline (UI-SPEC): ink only — nothing here is the wow delta.

export default function NotFound() {
  return (
    <main className="bg-cream flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6 md:py-16">
        <h1 className="font-display text-ink text-display font-semibold">
          Page not found
        </h1>
        <p className="text-ink/70 text-base leading-6">
          That address doesn&apos;t go anywhere. Head back to see what your
          points are worth.
        </p>
        <Link
          href="/"
          className="text-ink/70 text-sm leading-5 underline-offset-4 hover:underline"
        >
          Back to your results
        </Link>
      </div>
    </main>
  );
}
