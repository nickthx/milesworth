// /account navigation loading state (UI-SPEC A9). The account page awaits the
// session and then the snapshot, so without this file a client navigation
// holds the previous page until both resolve. Server component rendering the
// account shell inline — same main, article, and h1 as the page — plus one
// muted line. No skeletons, no spinner.
//
// T-06-16 / T-07-19: this file must stay free of server-only imports. It does
// not import the page module (whose shell is not exported, and which pulls in
// Clerk's server entry point), the database, or anything else — so the
// loading boundary can never drag request-time code into a static render.
//
// Accent discipline (UI-SPEC): ink only — nothing here is the wow delta.

export default function AccountLoading() {
  return (
    <main className="bg-cream flex flex-1 flex-col">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 md:py-16">
        <header className="flex flex-col gap-6">
          <h1 className="font-display text-ink text-display font-semibold">
            Your account
          </h1>
        </header>
        <p className="text-ink/70 text-base leading-6">Loading your account…</p>
      </article>
    </main>
  );
}
