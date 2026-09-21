import type { Metadata } from "next";
import Link from "next/link";

import { PRIVACY_CONTACT_EMAIL, PRIVACY_LAST_UPDATED } from "@/lib/site";

// The privacy policy (ACCT-04). Static server component: no client
// directive, no request-time input, no clock read, no database, and no
// import of Clerk's server entry point — the route prerenders at build and
// ships zero client JS (T-06-16). It is also the consent target configured
// in the Clerk Dashboard, so it must exist before sign-up does.
//
// Plain language, not legal advice (RESEARCH A7). The disclosure below must
// match what src/db/schema.ts actually stores — the Clerk account, the four
// account tables, the waitlist table, the guest localStorage key — and the
// three processors the app actually has (T-06-10). Change the schema, change
// this page; tests/privacy-page.test.ts pins the section list.
//
// Accent discipline (UI-SPEC): ink only. Nothing on this page is the wow
// delta, so the accent color is not used anywhere here.

export const metadata: Metadata = {
  title: "Privacy — Milesworth",
  description:
    "What Milesworth stores, who processes it, and how to delete your account and data.",
};

const SECTION_CLASS = "flex flex-col gap-6";
const HEADING_CLASS = "font-heading text-ink text-heading font-semibold";
const BODY_CLASS = "text-ink text-base leading-6";
const MUTED_CLASS = "text-ink/70 text-base leading-6";
const LABEL_CLASS = "text-ink/70 text-sm font-semibold";
const LINK_CLASS =
  "text-ink/70 text-sm leading-5 underline-offset-4 hover:underline";

export default function PrivacyPage() {
  return (
    <main className="bg-cream flex flex-1 flex-col">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 md:py-16">
        <header className="flex flex-col gap-6">
          <h1 className="font-display text-ink text-display font-semibold">
            Privacy
          </h1>
          <p className={MUTED_CLASS}>
            You can use Milesworth without an account. The guest flow keeps your
            balances in your own browser; nothing you type is sent to our
            server. An optional account stores only what is listed below, and
            you can delete it yourself at any time.
          </p>
          <p className={LABEL_CLASS}>Last updated {PRIVACY_LAST_UPDATED}</p>
        </header>

        <section className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>What we collect</h2>
          <div className="flex flex-col gap-2">
            <p className={LABEL_CLASS}>Guests</p>
            <p className={BODY_CLASS}>
              The balances you type live in the page URL and in your
              browser&apos;s local storage under the key{" "}
              <code>pu:balances:v1</code>. They reach our server only when you
              open a share link, because the balances are part of that URL, or
              when you sign in and choose Save. Closing the tab keeps them on
              your device; clearing your browser storage removes them.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className={LABEL_CLASS}>Signed in</p>
            <p className={BODY_CLASS}>
              Your Clerk account: the email address you sign in with, an
              optional name, and which sign-in method you used. In our own
              database: the balances you save, the redemptions you bookmark, and
              the travel goals you write. Each of these is stored against your
              account ID and nothing else.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className={LABEL_CLASS}>Waitlist</p>
            <p className={BODY_CLASS}>
              If you enter an email in the advisor &quot;coming soon&quot; form,
              we store that address on its own, separately from accounts, so we
              can tell you once when the advisor ships.
            </p>
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>Who processes it</h2>
          <p className={BODY_CLASS}>
            Three companies run the infrastructure behind this site. None of
            them receives more than they need to do their job.
          </p>
          <ul className="flex flex-col gap-3">
            <li className={BODY_CLASS}>
              <span className="font-semibold">Clerk</span> handles
              authentication: your sign-in credentials, session, and consent
              record never touch our own code. See Clerk&apos;s{" "}
              <a href="https://clerk.com/legal/dpa" className={LINK_CLASS}>
                data processing agreement
              </a>{" "}
              and{" "}
              <a
                href="https://clerk.com/legal/subprocessors"
                className={LINK_CLASS}
              >
                list of subprocessors
              </a>
              .
            </li>
            <li className={BODY_CLASS}>
              <span className="font-semibold">Neon</span> hosts our Postgres
              database, where saved balances, bookmarks, goals, and waitlist
              emails live. The database runs in AWS us-east-2 (Ohio, United
              States).
            </li>
            <li className={BODY_CLASS}>
              <span className="font-semibold">Vercel</span> hosts the site and
              keeps short-lived request logs, which include your IP address and
              the pages you request, as any web host does.
            </li>
          </ul>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>What we never do</h2>
          <p className={BODY_CLASS}>
            We run no analytics and no advertising trackers. We do not sell your
            data and do not share it with anyone for marketing.
          </p>
          <p className={BODY_CLASS}>
            We never ask for your card numbers, your program logins, or any
            credential for a points program. Entering balances by hand is the
            privacy feature: the site cannot reach into an account it was never
            given access to.
          </p>
          <p className={BODY_CLASS}>
            There are no affiliate links, so nothing you do here earns us a
            commission.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>Cookies</h2>
          <p className={BODY_CLASS}>
            The only cookies come from Clerk, and all of them are strictly
            necessary. As soon as any page loads, Clerk&apos;s script sets a
            small <code>__client_uat</code> cookie (its value is <code>0</code>{" "}
            while you are signed out) so the site can tell whether a session
            exists without redirecting you. So the guest flow does set this one
            cookie; it identifies nobody and holds no balances.
          </p>
          <p className={BODY_CLASS}>
            Once you sign in, Clerk also sets <code>__session</code> and a{" "}
            <code>__refresh_…</code> cookie so it is still you on the next
            request and your session can be renewed without signing in again.
            Nothing optional is set and we run no analytics, so there is no
            cookie banner to click through.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>Retention and deletion</h2>
          <p className={BODY_CLASS}>
            Account data is kept until you delete your account. To do that, open{" "}
            <Link href="/account" className={LINK_CLASS}>
              Your account
            </Link>{" "}
            and choose &quot;Delete my account&quot;. Deletion is immediate and
            irreversible: it removes your saved balances, bookmarks, and goals
            from our database and then removes your sign-in from Clerk. There is
            no soft-delete and no grace period.
          </p>
          <p className={BODY_CLASS}>
            Waitlist emails are removed on request. For that, or for any other
            question about your data, write to{" "}
            <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className={LINK_CLASS}>
              {PRIVACY_CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>Consent</h2>
          <p className={BODY_CLASS}>
            You accept this policy with the checkbox at sign-up, and Clerk
            records the time you did. Using the guest flow requires no account
            and no acceptance; this page simply describes what happens if you
            choose to sign in.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className={HEADING_CLASS}>Children and changes</h2>
          <p className={BODY_CLASS}>
            Milesworth is not directed at children under 13, and we do not
            knowingly keep an account for anyone under that age.
          </p>
          <p className={BODY_CLASS}>
            If this policy changes, the new version is posted here with a new
            &quot;Last updated&quot; date at the top. Material changes are also
            mentioned in the sign-up consent text, so a new account is always
            agreeing to the current version.
          </p>
        </section>

        <div className="flex flex-col gap-2">
          <Link href="/methodology" className={LINK_CLASS}>
            How we value your points
          </Link>
          <Link href="/" className={LINK_CLASS}>
            Back to your results
          </Link>
        </div>
      </article>
    </main>
  );
}
