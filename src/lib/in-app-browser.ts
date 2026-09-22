// LinkedIn in-app-browser detection (PLAT-02, RESEARCH Pattern 5, T-07-03).
// Presentation-only: the result gates one hint sentence under "Sign in to
// save" (per D7-02) and is NEVER an auth or authz decision — a spoofed UA can
// at most show or hide a line of copy. The UA is injected as a string; this
// module never touches a browser global itself, so it stays server-importable
// and unit-testable in the node environment. Callers read the user agent
// inside an effect only (Pitfall 2), never during render.

/** True when the user agent carries LinkedIn's in-app browser marker. */
export function isLinkedInInAppBrowser(ua: string): boolean {
  return ua.includes("[LinkedInApp]") || ua.includes("LinkedInApp");
}
