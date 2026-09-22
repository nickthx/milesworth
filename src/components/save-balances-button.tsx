"use client";

import { SignInButton } from "@clerk/nextjs";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";

import { Button } from "@/components/ui/button";

import { saveBalances } from "@/app/actions/account";
import type { ActionState } from "@/app/actions/account";
import type { Balances } from "@/engine";
import { isLinkedInInAppBrowser } from "@/lib/in-app-browser";
import { NEUTRAL_ERROR_MESSAGE } from "@/lib/site";

// ACCT-01 Save CTA (RESEARCH Open Question 4 ruling): sits beside "Copy my
// link" as a secondary ink/outline button. Explicit save only — never an
// auto-sync (A1: the last explicit save is what a fresh device restores).
//
// Session state arrives as a prop from the server (page.tsx reads auth());
// no Clerk client hooks here, so server HTML and hydration agree (Pitfall 5).
// Imports only the Server Action reference — never "@/db" (T-06-05). The
// modal keeps the visitor on "/" with the balances still in the URL.
//
// Accent discipline (UI-SPEC): ink/outline only — the accent stays on "Copy my
// link". Errors render only fixed neutral copy (T-06-04): the action's own
// result for driver errors, and the same shared string when the action CALL
// rejects in transit (network drop, 5xx, stale action id after a deploy) —
// otherwise React 19 would surface the rejection to the nearest error
// boundary and replace the whole results page.
//
// PLAT-02 / D7-02 (b): Google OAuth stays enabled, so inside the LinkedIn
// in-app browser — where the OAuth popup is unreliable — the signed-out branch
// renders a one-line "open in browser" hint. Detection is presentation-only
// (T-07-03). The user agent is read through useSyncExternalStore with a
// `false` server snapshot (Pitfall 2): server HTML and the hydration pass
// both render without the hint, and React re-renders with the client value
// afterwards — the same guarantee a mount effect gives, without the
// synchronous setState-in-effect the react-hooks lint rule forbids.

const IDLE: ActionState = { status: "idle", message: "" };
const TRANSPORT_FAILED: ActionState = {
  status: "error",
  message: NEUTRAL_ERROR_MESSAGE,
};

/** The UA never changes for a mounted page — nothing to subscribe to. */
function subscribeNoop(): () => void {
  return () => {};
}

/** Client snapshot: a restricted WebView may deny even this read — stay silent. */
function readInAppBrowser(): boolean {
  try {
    return isLinkedInInAppBrowser(navigator.userAgent);
  } catch {
    return false;
  }
}

/** Server / hydration snapshot: never render the hint into server HTML. */
function readInAppBrowserOnServer(): boolean {
  return false;
}

interface SaveBalancesButtonProps {
  balances: Balances;
  isSignedIn: boolean;
}

export function SaveBalancesButton({
  balances,
  isSignedIn,
}: SaveBalancesButtonProps) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState>(IDLE);

  // Same 2s swap idiom as "Link copied": "Saved" reverts to the idle label.
  useEffect(() => {
    if (state.status !== "ok") return;
    const timeout = window.setTimeout(() => setState(IDLE), 2000);
    return () => window.clearTimeout(timeout);
  }, [state.status]);

  const inApp = useSyncExternalStore(
    subscribeNoop,
    readInAppBrowser,
    readInAppBrowserOnServer,
  );

  if (!isSignedIn) {
    return (
      <div className="flex flex-col gap-2">
        <SignInButton mode="modal">
          <Button
            type="button"
            variant="outline"
            className="h-11 min-w-44 px-6 text-base font-semibold"
          >
            Sign in to save
          </Button>
        </SignInButton>
        {inApp && (
          <p className="text-ink/70 text-sm leading-5">
            Signing in works best in your regular browser — tap the menu and
            choose Open in browser.
          </p>
        )}
      </div>
    );
  }

  const label = pending
    ? "Saving"
    : state.status === "ok"
      ? "Saved"
      : "Save my balances";

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={pending || Object.keys(balances).length === 0}
        onClick={() =>
          startTransition(async () => {
            try {
              setState(await saveBalances(balances));
            } catch {
              setState(TRANSPORT_FAILED);
            }
          })
        }
        className="h-11 min-w-44 px-6 text-base font-semibold"
      >
        <span aria-live="polite">{label}</span>
      </Button>
      {state.status === "error" && (
        <p aria-live="polite" className="text-ink/70 text-sm leading-5">
          {state.message}
        </p>
      )}
    </div>
  );
}
