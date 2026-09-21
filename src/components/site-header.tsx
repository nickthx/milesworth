"use client";

import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

// Site header (ACCT-01 sign-in affordance). Client component ON PURPOSE:
// under the React Server Components export condition, "@clerk/nextjs"
// resolves <Show> to a server implementation that calls auth(), and auth()
// reads request headers — mounting that in the root layout would opt EVERY
// route into dynamic rendering and un-prerender /methodology and /privacy
// (T-06-16, verified against the 7.9.1 build table). The client directive
// makes <Show> resolve to the session-aware client version instead, so the
// header still renders on every page while static routes stay static. It
// holds no data and no secrets; SSR still emits the wordmark and nav shell.
// Mirrors site-footer.tsx (same max-w-3xl rail, same ink-only link styling);
// src/app/layout.tsx mounts it inside ClerkProvider above every route.
//
// T-06-05: never import Clerk's server entry point or the database module
// here — this file ships to the client bundle, and the secret key / DB must
// not.
//
// Accent discipline (UI-SPEC): ink only. Nothing in the header is the wow
// delta, so no accent color appears here. The sign-in button keeps an h-11
// box for the touch-target rule.

export function SiteHeader() {
  return (
    <header className="border-border border-b">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-ink text-heading font-semibold"
        >
          Milesworth
        </Link>
        <nav aria-label="Account" className="flex items-center gap-4">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="text-ink/70 inline-flex h-11 items-center text-sm leading-5 underline-offset-4 hover:underline"
              >
                Sign in
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <Link
              href="/account"
              className="text-ink/70 inline-flex min-h-11 items-center text-sm leading-5 underline-offset-4 hover:underline"
            >
              My account
            </Link>
            <UserButton />
          </Show>
        </nav>
      </div>
    </header>
  );
}
