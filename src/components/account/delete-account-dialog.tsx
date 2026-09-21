"use client";

import { useClerk } from "@clerk/nextjs";
import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { deleteAccount } from "@/app/actions/account";
import type { ActionState } from "@/app/actions/account";

// ACCT-04 deletion: an explicit confirmation before the tested Server Action
// runs. The action cascades the database rows BEFORE deleting the Clerk user
// (T-06-06), so this component only confirms and then signs out — it never
// touches data itself. Sign-out happens only on `status === "ok"`; an error
// leaves the session in place so the user can retry.
//
// Imports only Clerk client code, the action reference, and its state type
// (T-06-05). Accent discipline: ink only — the trigger is an outline button
// and the confirm uses the vendored destructive variant, not the accent.
// The trigger label matches the /privacy instruction verbatim.

const INITIAL: ActionState = { status: "idle", message: "" };

export function DeleteAccountDialog() {
  const [state, formAction, pending] = useActionState(deleteAccount, INITIAL);
  const { signOut } = useClerk();

  useEffect(() => {
    if (state.status === "ok") {
      // A6 (typechecked on the installed version): redirectUrl lands on the
      // guest flow once the session is gone.
      void signOut({ redirectUrl: "/" });
    }
  }, [state.status, signOut]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 px-6 text-base font-semibold"
        >
          Delete my account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-ink text-heading font-semibold">
            Delete your account?
          </DialogTitle>
          <DialogDescription className="text-ink/70 text-base leading-6">
            This removes your saved balances, bookmarks, and travel goals and
            deletes your sign-in. It cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <p aria-live="polite" className="text-ink/70 text-sm leading-5">
            {state.status === "error" ? state.message : ""}
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-11 px-6">
                Keep my account
              </Button>
            </DialogClose>
            <Button
              type="submit"
              variant="destructive"
              disabled={pending}
              className="h-11 px-6 text-base font-semibold"
            >
              {pending ? "Deleting" : "Delete everything"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
