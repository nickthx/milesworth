"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

// Balances live in the query string (?ur=90000&mr=50000), so every recorded
// URL is cut back to origin + path before it leaves the browser. The privacy
// page promises analytics never records balances; this is that promise.
export function stripQuery(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  return { ...event, url: `${url.origin}${url.pathname}` };
}

// Client wrapper: beforeSend is a function, which a server-component layout
// cannot pass across the client boundary.
export function PageAnalytics() {
  return <Analytics beforeSend={stripQuery} />;
}
