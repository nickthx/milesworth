"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { addGoal } from "@/app/actions/account";
import type { ActionState } from "@/app/actions/account";

// ACCT-03: the travel-goal entry form on /account. Mirrors advisor-tease.tsx
// exactly: useActionState over the Server Action, a persistent live region
// that only ever changes its text, and focus moved there on success.
//
// Imports only the action reference and its state type — no database,
// ORM, or Clerk server code ever reaches this bundle (T-06-05; gate test).
//
// Accent discipline (UI-SPEC): ink only; every input and button is h-11.
// The form resets on success so a second goal starts from a clean slate.

const INITIAL: ActionState = { status: "idle", message: "" };
const HELPER_COPY =
  "Goals are stored with your account. They do not change your ranking yet.";

export function GoalForm() {
  const [state, formAction, pending] = useActionState(addGoal, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state.status === "ok") {
      formRef.current?.reset();
      statusRef.current?.focus();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-text" className="text-ink text-sm font-semibold">
          Goal
        </Label>
        <Input
          id="goal-text"
          name="text"
          required
          maxLength={280}
          placeholder="Business class to Tokyo next spring"
          className="text-ink h-11 bg-white text-base"
        />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex flex-1 flex-col gap-2">
          <Label
            htmlFor="goal-destination"
            className="text-ink text-sm font-semibold"
          >
            Destination (optional)
          </Label>
          <Input
            id="goal-destination"
            name="destination"
            maxLength={80}
            placeholder="Tokyo"
            className="text-ink h-11 bg-white text-base"
          />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="goal-date" className="text-ink text-sm font-semibold">
            Target date (optional)
          </Label>
          <Input
            id="goal-date"
            name="targetDate"
            type="date"
            className="text-ink h-11 bg-white text-base"
          />
        </div>
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="h-11 self-start px-6 text-base font-semibold"
      >
        {pending ? "Saving" : "Add goal"}
      </Button>
      <p
        ref={statusRef}
        tabIndex={-1}
        aria-live="polite"
        className="text-ink/70 text-sm leading-5 focus:outline-none"
      >
        {state.status === "idle" ? HELPER_COPY : state.message}
      </p>
    </form>
  );
}
