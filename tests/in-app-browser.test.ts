import { describe, expect, it } from "vitest";

import { isLinkedInInAppBrowser } from "../src/lib/in-app-browser";

// PLAT-02 in-app-browser detection (RESEARCH Pattern 5, T-07-03): a pure
// string check over an injected user-agent. It only ever gates a
// presentation hint under "Sign in to save" — never an auth or authz
// decision — so a spoofed UA can at most show or hide one sentence. The UA
// strings below are the verified LinkedIn app values from RESEARCH.

const LINKEDIN_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1 [LinkedInApp]/9.78.4909";
const LINKEDIN_ANDROID =
  "Mozilla/5.0 (Linux; Android 16; SM-A176U Build/BP2A.250605.031; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/151.0.7922.85 Mobile Safari/537.36 [LinkedInApp]/2.312.70";
const DESKTOP_CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36";
const IOS_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1";

describe("isLinkedInInAppBrowser", () => {
  it("detects the LinkedIn iOS in-app browser", () => {
    expect(isLinkedInInAppBrowser(LINKEDIN_IOS)).toBe(true);
  });

  it("detects the LinkedIn Android in-app WebView", () => {
    expect(isLinkedInInAppBrowser(LINKEDIN_ANDROID)).toBe(true);
  });

  it("is false for desktop Chrome", () => {
    expect(isLinkedInInAppBrowser(DESKTOP_CHROME)).toBe(false);
  });

  it("is false for iOS Safari outside the LinkedIn app", () => {
    expect(isLinkedInInAppBrowser(IOS_SAFARI)).toBe(false);
  });

  it("is false for an empty user agent", () => {
    expect(isLinkedInInAppBrowser("")).toBe(false);
  });
});
