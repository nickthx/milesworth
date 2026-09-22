"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Balances } from "@/engine";
import { shareUrl } from "@/lib/share-url";

// "Copy my link" CTA + clipboard fallback (PLAT-02, RESEARCH Pattern 4 /
// Pitfalls 3–4). Extracted from core-experience.tsx so the island stays under
// the 500-line cap; `children` is the Save button so the CTA row layout is
// unchanged.
//
// T-07-02: the copied string is ALWAYS shareUrl(balances) — SITE_URL plus the
// canonical short keys — never the live location, so a Clerk dev-instance
// handoff token or a tracking param can never ride along into a public post.
//
// T-07-12: when the clipboard is absent or denied (LinkedIn WebView), the
// visitor sees a read-only, pre-selected field holding that same validated
// URL — never echoed user text, never an error style. The Web Share API is
// deliberately not used (Pitfall 4: inconsistent inside WebViews).
//
// Accent discipline (UI-SPEC): this file owns sanctioned accent use #2 — the
// terracotta primary CTA. Everything else here stays ink.

interface ShareLinkProps {
  balances: Balances;
  /** The Save CTA, rendered beside the copy button in the same row. */
  children?: ReactNode;
}

export function ShareLink({ balances, children }: ShareLinkProps) {
  const [copied, setCopied] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const fallbackRef = useRef<HTMLInputElement>(null);

  // 2 s "Link copied" swap, then back to the idle label.
  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  // UI-SPEC Accessibility: focus moves to the fallback field once it appears
  // (effects only — never during render).
  useEffect(() => {
    if (fallbackUrl === null) return;
    fallbackRef.current?.focus();
  }, [fallbackUrl]);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl(balances));
      setCopied(true);
    } catch {
      // Pitfall 3: clipboard absent/denied — show the same canonical link in
      // the field instead of nothing (shareUrl is pure; the call is cheap).
      const url = shareUrl(balances);
      setFallbackUrl(url);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <Button
          type="button"
          onClick={handleCopyLink}
          // Sanctioned accent use #2 + UI-SPEC 44px touch target (h-11).
          className="bg-terracotta hover:bg-terracotta/90 h-11 min-w-44 self-start px-6 text-base font-semibold text-white"
        >
          <span aria-live="polite">
            {copied ? "Link copied" : "Copy my link"}
          </span>
        </Button>
        {/* ACCT-01: explicit save beside the share CTA — ink/outline. */}
        {children}
      </div>
      {fallbackUrl !== null && (
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="share-link-fallback"
            className="text-ink text-sm font-semibold"
          >
            Your link
          </Label>
          <Input
            id="share-link-fallback"
            ref={fallbackRef}
            readOnly
            value={fallbackUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="text-ink h-11 bg-white text-base"
          />
          <p className="text-ink/70 text-sm leading-5">
            Couldn&apos;t reach the clipboard — press and hold the link to copy it.
          </p>
        </div>
      )}
    </div>
  );
}
