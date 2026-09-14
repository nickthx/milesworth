import { clerkMiddleware } from "@clerk/nextjs/server";

// Clerk request proxy (ACCT-01). Next 16 convention: this file is `proxy.ts`,
// not `middleware.ts` — a file with the old name would not run. Node runtime
// only, so no `runtime` export.
//
// Public by default: no route is protected here, so every route works
// signed out. The proxy exists so that auth() resolves in the Server Actions
// and pages that read it; it gates nothing. Route protection, if ever
// wanted, is an explicit opt-in per route — never a default.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next internals, static files, and /og (T-06-08): the
    // crawler-fetched, CDN-cached PNG must never see Clerk cookies or a
    // handshake redirect — either would defeat the Phase 5 cache proof.
    "/((?!_next|og(?:$|\\?)|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
    // Clerk's own handshake / session endpoints.
    "/__clerk/(.*)",
  ],
};
