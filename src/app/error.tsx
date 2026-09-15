"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

// Route-level error boundary for every page under src/app (Next App Router
// convention; there was none before, so any thrown render error — or a
// Server Action transport rejection escaping a useActionState form — fell
// through to Next's default "Application error" screen). Renders inside the
// root layout, so the header and footer stay put and only the page body is
// replaced by a designed state in the same editorial shell as /privacy.
//
// T-04-12 / T-06-04: neutral copy only. The `error` prop is deliberately never
// read — no message, stack, or digest reaches the DOM. Not logged either.
//
// Accent discipline (UI-SPEC): ink only — nothing here is the wow delta.

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="bg-cream flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6 md:py-16">
        <h1 className="font-display text-ink text-display font-semibold">
          Something went wrong
        </h1>
        <p className="text-ink/70 text-base leading-6">
          Try again in a moment. Any balances you entered are still in the link
          in your address bar.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          className="h-11 min-w-44 self-start px-6 text-base font-semibold"
        >
          Try again
        </Button>
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
