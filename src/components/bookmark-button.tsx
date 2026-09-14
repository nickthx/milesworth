"use client";

import { SignInButton } from "@clerk/nextjs";
import { useOptimistic, useState, useTransition } from "react";

import { setBookmark } from "@/app/actions/account";

// ACCT-02 bookmark toggle. First useOptimistic in the codebase — a single
// boolean: the label flips on click, and the action's revalidatePath("/")
// refreshes the server-derived `bookmarked` prop so it catches up with the
// optimistic value once the transition settles.
//
// Session state is a prop (page.tsx reads auth()); no Clerk client hooks, so
// hydration is exact (Pitfall 5). Imports only the Server Action reference —
// never "@/db" (T-06-05). Errors render the action's fixed copy only (T-06-04).
//
// Accent discipline (UI-SPEC): ink text buttons in both branches, no accent.
// Both branches are h-11 for the 44px touch target.

interface BookmarkButtonProps {
  slug: string;
  bookmarked: boolean;
  isSignedIn: boolean;
}

export function BookmarkButton({
  slug,
  bookmarked,
  isSignedIn,
}: BookmarkButtonProps) {
  const [optimistic, setOptimistic] = useOptimistic(bookmarked);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button
          type="button"
          className="text-ink/70 h-11 text-sm leading-5 underline-offset-4 hover:underline"
        >
          Sign in to save this
        </button>
      </SignInButton>
    );
  }

  return (
    <span className="flex flex-col items-start gap-1">
      <button
        type="button"
        aria-pressed={optimistic}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const next = !optimistic;
            setOptimistic(next);
            const result = await setBookmark(slug, next);
            setError(result.status === "error" ? result.message : "");
          })
        }
        className="text-ink h-11 text-sm font-semibold underline-offset-4 hover:underline"
      >
        {optimistic ? "Saved to my account" : "Save to my account"}
      </button>
      {error !== "" && (
        <span aria-live="polite" className="text-ink/70 text-sm">
          {error}
        </span>
      )}
    </span>
  );
}
