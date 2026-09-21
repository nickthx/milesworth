import { redemptions } from "@/data";
import { formatDollars } from "@/lib/format";

// ACCT-02: the bookmarked redemptions on /account, rendered by title from the
// seed data. Server component (no client directive): the page hands it the
// slugs from loadAccountSnapshot and it looks each one up in "@/data".
//
// Unknown slugs are skipped here as well as at read time (Pitfall 6 /
// T-06-15: bookmarks carry no FK into the seeded table, so a slug can leave
// the dataset after it was saved). No database, ORM, or Clerk server
// imports (T-06-05). Accent discipline: ink only.

export function BookmarkList({ slugs }: { slugs: readonly string[] }) {
  const items = slugs.flatMap((slug) => {
    const redemption = redemptions.find((r) => r.slug === slug);
    return redemption === undefined ? [] : [redemption];
  });

  if (items.length === 0) {
    return (
      <p className="text-ink/70 text-base leading-6">
        No bookmarks yet. Save a redemption from your results.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {items.map((redemption) => (
        <li
          key={redemption.slug}
          className="border-ink/10 flex flex-col gap-1 border-b pb-4"
        >
          <p className="font-display text-ink text-heading font-semibold">
            {redemption.title}
          </p>
          {redemption.destination !== null && (
            <p className="text-ink text-base leading-6">
              {redemption.destination}
            </p>
          )}
          <p className="text-ink/70 text-sm leading-5">
            ~{formatDollars(redemption.cashFareCents)} cash fare
          </p>
        </li>
      ))}
    </ul>
  );
}
