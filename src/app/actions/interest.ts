"use server";

import { db, interestSignups } from "@/db";
import { interestSchema } from "@/lib/interest-validation";

// PLAT-04: the advisor-waitlist Server Action. This is the ONLY file under
// src/app + src/components permitted to import "@/db" (grep gate, T-05-13) —
// the client tree stays DB-free so the Phase 4 guest-flow gate holds.
//
// T-05-12 (spam / enumeration): the hidden honeypot short-circuits to success
// without a write; interestSchema caps + validates the email; the UNIQUE
// column + onConflictDoNothing make repeat submits idempotent and return the
// same success copy, so there is no "already registered" oracle.
//
// interestSchema is the ONE honeypot boundary. The raw FormData value reaches
// it unchanged — including the File a multipart submission can smuggle into
// the field — so the schema's `website` rule is the rule that actually runs,
// not a decorative duplicate of an action-level check.
//
// T-05-14 (information disclosure): zod issue text is never returned (it can
// echo the input); driver errors are never returned or logged (they can embed
// connection details). Every message below is fixed, neutral copy.

export type InterestState = {
  status: "idle" | "ok" | "error";
  message: string;
};

export async function joinAdvisorWaitlist(
  _prev: InterestState,
  formData: FormData,
): Promise<InterestState> {
  // FormData.get returns string | File | null. Every one of those shapes is
  // handed to the schema as-is (null becomes undefined, the one value a real
  // browser produces for an unfilled field) so the honeypot rule sees exactly
  // what the attacker sent — a File included.
  const website = formData.get("website");
  const parsed = interestSchema.safeParse({
    email: formData.get("email"),
    website: website ?? undefined,
  });

  if (!parsed.success) {
    // Only the issue PATH is read, never its message (T-05-14). A honeypot
    // issue means a bot: humans never see the field, so they cannot trip it.
    // Bots see the success copy; nothing is stored, nothing is revealed.
    const honeypotTripped = parsed.error.issues.some(
      (issue) => issue.path[0] === "website",
    );
    return honeypotTripped
      ? { status: "ok", message: "You're on the list." }
      : { status: "error", message: "Enter a valid email address." };
  }

  try {
    await db
      .insert(interestSignups)
      .values({ email: parsed.data.email })
      .onConflictDoNothing({ target: interestSignups.email });
    return { status: "ok", message: "You're on the list." };
  } catch {
    return {
      status: "error",
      message: "Something went wrong. Try again in a moment.",
    };
  }
}
