import type { MetadataRoute } from "next";

import { SITE_LAST_MODIFIED, SITE_URL } from "@/lib/site";

// /sitemap.xml — PLAT-02 launch flip (07-09). Static: no clock, no auth, no
// database (T-07-26). Exactly the three public pages (T-07-15): never the
// private account route (noindex + robots-disallowed) and never the social
// card endpoint (an image, not a page). `lastModified` is a hand-bumped
// constant, not a clock read — reading the clock would opt the route out of
// prerendering and would claim the pages change daily when they do not
// (T-05-05). tests/launch-gate.test.ts scans this file's full text.

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, lastModified: SITE_LAST_MODIFIED },
    { url: `${SITE_URL}/methodology`, lastModified: SITE_LAST_MODIFIED },
    { url: `${SITE_URL}/privacy`, lastModified: SITE_LAST_MODIFIED },
  ];
}
