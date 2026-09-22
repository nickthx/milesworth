import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

// /robots.txt — PLAT-02 launch flip (07-09). Static: no clock, no auth, no
// database, so the route prerenders at build (T-07-26). The single private
// route is disallowed here AND carries its own route-level noindex in
// src/app/account/page.tsx (T-07-06) — a crawler that ignores robots.txt
// still sees the meta directive. The sitemap URL derives from SITE_URL so a
// custom domain never leaves robots.txt pointing at the old host (T-05-10).

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/account" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
