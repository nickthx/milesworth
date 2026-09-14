import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { BookmarkList } from "@/components/account/bookmark-list";
import { DeleteAccountDialog } from "@/components/account/delete-account-dialog";
import { GoalForm } from "@/components/account/goal-form";
import { GoalList } from "@/components/account/goal-list";
import { programs } from "@/data";
import { balancesToParams } from "@/lib/balance-params";
import { formatPoints } from "@/lib/format";
import { loadAccountSnapshot } from "@/lib/server/account-data";
import type { AccountSnapshot } from "@/lib/server/account-data";

// ACCT-01..04: the account surface. Dynamic, auth-gated server component —
// calling `auth()` opts the route into per-request rendering by itself
// (Pitfall 4), so there is no segment-config export here, and `/methodology`
// and `/privacy` stay static because `auth()` is confined to `/` and this
// route (T-06-16).
//
// T-06-01: the session decides which branch renders; user data is read only
// through loadAccountSnapshot with the session id, never through "@/db"
// directly (T-06-05). The signed-out branch is a prompt with a modal sign-in,
// not a redirect, so the URL stays linkable from the header and from shares.
// T-06-04: a null snapshot renders one fixed neutral line with no detail.
//
// Accent discipline (UI-SPEC): ink only. Nothing here is the wow delta.

export const metadata: Metadata = {
  title: "Your account — Milesworth",
  description: "Your saved balances, bookmarks, and travel goals.",
};

const SECTION_CLASS = "flex flex-col gap-6";
const HEADING_CLASS =
  "font-heading text-ink text-[1.75rem] leading-tight font-semibold";
const BODY_CLASS = "text-ink text-base leading-6";
const MUTED_CLASS = "text-ink/70 text-base leading-6";
const LABEL_CLASS = "text-ink/70 text-sm font-semibold";
const LINK_CLASS =
  "text-ink/70 text-sm leading-5 underline-offset-4 hover:underline";

/** The same canonical short-key query the share link uses, prefixed for `/`. */
function savedResultsHref(balances: NonNullable<AccountSnapshot["balances"]>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(balancesToParams(balances))) {
    if (value !== null) query.set(key, String(value));
  }
  return `/?${query.toString()}`;
}

function programName(slug: string): string {
  return programs.find((p) => p.slug === slug)?.name ?? slug;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="bg-cream flex flex-1 flex-col">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 md:py-16">
        <header className="flex flex-col gap-6">
          <h1 className="font-display text-ink text-display font-semibold">
            Your account
          </h1>
        </header>
        {children}
      </article>
    </main>
  );
}

export default async function AccountPage() {
  const { userId } = await auth();

  if (userId === null) {
    return (
      <Shell>
        <p className={MUTED_CLASS}>
          Sign in to see your saved balances, bookmarks, and travel goals. The
          guest flow never needs an account.
        </p>
        <SignInButton mode="modal">
          <button
            type="button"
            className="text-ink h-11 self-start text-base font-semibold underline-offset-4 hover:underline"
          >
            Sign in
          </button>
        </SignInButton>
        <div className="flex flex-col gap-3">
          <Link href="/privacy" className={LINK_CLASS}>
            How we handle your data
          </Link>
          <Link href="/" className={LINK_CLASS}>
            Back to your results
          </Link>
        </div>
      </Shell>
    );
  }

  const snapshot = await loadAccountSnapshot(userId);

  if (snapshot === null) {
    return (
      <Shell>
        <p className={MUTED_CLASS}>
          Something went wrong loading your account. Refresh the page to try
          again.
        </p>
        <Link href="/" className={LINK_CLASS}>
          Back to your results
        </Link>
      </Shell>
    );
  }

  const balanceEntries =
    snapshot.balances === null ? [] : Object.entries(snapshot.balances);

  return (
    <Shell>
      <section className={SECTION_CLASS}>
        <h2 className={HEADING_CLASS}>Saved balances</h2>
        {snapshot.balances === null ? (
          <p className={MUTED_CLASS}>
            Nothing saved yet. Enter balances on the home page and choose Save
            my balances.
          </p>
        ) : (
          <>
            <dl className="flex flex-col gap-3">
              {balanceEntries.map(([slug, points]) => (
                <div
                  key={slug}
                  className="border-ink/10 flex items-baseline justify-between gap-4 border-b pb-3"
                >
                  <dt className={LABEL_CLASS}>{programName(slug)}</dt>
                  <dd className="font-heading text-ink text-lg font-semibold">
                    {formatPoints(points)}
                  </dd>
                </div>
              ))}
            </dl>
            <Link
              href={savedResultsHref(snapshot.balances)}
              className={LINK_CLASS}
            >
              Open my saved results
            </Link>
          </>
        )}
      </section>

      <section className={SECTION_CLASS}>
        <h2 className={HEADING_CLASS}>Bookmarks</h2>
        <BookmarkList slugs={snapshot.bookmarkedSlugs} />
      </section>

      <section className={SECTION_CLASS}>
        <h2 className={HEADING_CLASS}>Travel goals</h2>
        <GoalList goals={snapshot.goals} />
        <GoalForm />
      </section>

      <section className={SECTION_CLASS}>
        <h2 className={HEADING_CLASS}>Delete your account</h2>
        <p className={BODY_CLASS}>
          Deleting removes everything above and your sign-in. Read the{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            privacy policy
          </Link>{" "}
          for what we store.
        </p>
        <DeleteAccountDialog />
      </section>

      <Link href="/" className={LINK_CLASS}>
        Back to your results
      </Link>
    </Shell>
  );
}
