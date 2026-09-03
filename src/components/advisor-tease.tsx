"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { joinAdvisorWaitlist } from "@/app/actions/interest";
import type { InterestState } from "@/app/actions/interest";

// PLAT-04: the "coming soon" tease for the v2 AI card-roadmap advisor plus a
// one-field interest hook. This component imports ONLY the Server Action
// reference — the database driver never enters the client tree (T-05-13).
//
// Accent discipline (UI-SPEC): no accent color here. The submit uses the
// default ink-on-cream button; the accent stays reserved for "Copy my link".
//
// Honeypot (T-05-12): the hidden "website" field is never shown to humans and
// is skipped by tab order and screen readers. Bots auto-fill it; the action
// then returns success without storing anything.
//
// Consent copy: promise only what the code can honour. There is no
// unsubscribe route yet (interest_signups mints a token for the v2 send, but
// nothing consumes it), so the helper text commits to a single launch email
// instead of "unsubscribe any time".

const INITIAL: InterestState = { status: "idle", message: "" };

export function AdvisorTease() {
  const [state, formAction, pending] = useActionState(joinAdvisorWaitlist, INITIAL);

  return (
    <section
      aria-labelledby="advisor-tease-heading"
      className="mt-12 flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <p className="text-ink/70 text-sm font-semibold">Coming soon</p>
        <h2
          id="advisor-tease-heading"
          className="font-heading text-ink text-[1.75rem] leading-tight font-semibold"
        >
          The AI card-roadmap advisor
        </h2>
        <p className="text-ink/70 text-base leading-6">
          Tell it where you want to go. It works out which card, in what order,
          and when — so &ldquo;almost there&rdquo; becomes &ldquo;booked.&rdquo;
        </p>
      </div>

      {state.status === "ok" ? (
        <p aria-live="polite" className="text-ink text-base leading-6">
          {state.message}
        </p>
      ) : (
        <>
          <form
            action={formAction}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <div className="flex flex-1 flex-col gap-2">
              <Label
                htmlFor="advisor-email"
                className="text-ink text-sm font-semibold"
              >
                Email
              </Label>
              <Input
                id="advisor-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="you@example.com"
                // UI-SPEC 44px touch target — overrides the vendored h-8.
                className="text-ink h-11 bg-white text-base"
              />
            </div>
            {/* prettier-ignore */}
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            <Button
              type="submit"
              disabled={pending}
              className="h-11 px-6 text-base font-semibold"
            >
              {pending ? "Sending" : "Notify me"}
            </Button>
          </form>
          <p aria-live="polite" className="text-ink/70 text-sm leading-5">
            {state.status === "error"
              ? state.message
              : "One email when it launches — that's the only one you'll get."}
          </p>
        </>
      )}
    </section>
  );
}
