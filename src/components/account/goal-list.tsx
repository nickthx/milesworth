"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { formatVerifiedDate } from "@/lib/format";

import { deleteGoal } from "@/app/actions/account";
import type { ActionState } from "@/app/actions/account";
import type { TravelGoalRow } from "@/lib/server/account-data";

// ACCT-03: the saved travel goals with a per-row Remove form. One
// useActionState over deleteGoal serves the whole list; each row submits its
// own hidden goalId. The id is only ever combined with the session userId
// inside the action (T-06-02), so a tampered field cannot reach another
// user's row.
//
// TravelGoalRow is imported with `import type` so the server-only read module
// never enters the client bundle (T-06-05); no database, ORM, or Clerk
// server imports. Accent discipline: ink only; every button is h-11.

const INITIAL: ActionState = { status: "idle", message: "" };

function goalMeta(goal: TravelGoalRow): string | null {
  const parts: string[] = [];
  if (goal.destination) parts.push(goal.destination);
  if (goal.targetDate) parts.push(formatVerifiedDate(goal.targetDate));
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function GoalList({ goals }: { goals: TravelGoalRow[] }) {
  const [state, formAction, pending] = useActionState(deleteGoal, INITIAL);

  if (goals.length === 0) {
    return <p className="text-ink/70 text-base leading-6">No goals yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {goals.map((goal) => {
          const meta = goalMeta(goal);
          return (
            <li
              key={goal.id}
              className="border-ink/10 flex items-start justify-between gap-4 border-b pb-4"
            >
              <div className="flex flex-col gap-1">
                <p className="text-ink text-base leading-6">{goal.text}</p>
                {meta !== null && (
                  <p className="text-ink/70 text-sm leading-5">{meta}</p>
                )}
              </div>
              <form action={formAction}>
                <input type="hidden" name="goalId" value={goal.id} />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={pending}
                  className="h-11 px-4 text-sm font-semibold"
                >
                  Remove
                </Button>
              </form>
            </li>
          );
        })}
      </ul>
      <p aria-live="polite" className="text-ink/70 text-sm leading-5">
        {state.status === "idle" ? "" : state.message}
      </p>
    </div>
  );
}
