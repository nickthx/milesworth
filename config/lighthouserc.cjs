// Lighthouse CI config — PLAT-02 (mobile Lighthouse gate) for the four launch routes.
// Source: github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
//
// Location: lives in config/ and is passed with `--config` (see the `lighthouse` npm
// script). RuFlo rule: no new config files at the repo root.
//
// SEO sequencing: `categories:seo` was a WARNING while the layout-level noindex failed
// Lighthouse's is-crawlable audit (07-07 baseline 0.60–0.63). Plan 07-09 removed that
// directive and promoted the assertion to "error"; 07-10 re-measures against production.
//
// No secrets here: LHCI_BASE_URL and LHCI_CHROME_PORT are the only env vars read
// (T-07-08). Reports are written to .lighthouseci/, which is gitignored. `/og` is never
// collected — Satori rendering is CPU-heavy and must not be hammered by a CI tool (T-07-07).
//
// Windows note (07-07 baseline): chrome-launcher deletes its temp profile synchronously
// right after taskkill; on Windows the orphaned Chrome child processes still hold the
// profile files for a moment, so every run dies with "EPERM, Permission denied:
// ...\Temp\lighthouse.NNNN" even though the audit completed. Work around it by attaching
// to a Chrome you start yourself (no temp profile is created or deleted in that path):
//   "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new \
//     --remote-debugging-port=9222 --user-data-dir=%TEMP%\lhci-chrome-profile about:blank
//   LHCI_CHROME_PORT=9222 npm run lighthouse
// Lighthouse still clears the cache and origin storage at the start of every run.
const BASE = process.env.LHCI_BASE_URL ?? "https://milesworth.vercel.app";
const PORT = Number.parseInt(process.env.LHCI_CHROME_PORT ?? "", 10);

module.exports = {
  ci: {
    collect: {
      url: [
        `${BASE}/`,
        `${BASE}/?ur=90000&mr=50000`,
        `${BASE}/methodology`,
        `${BASE}/privacy`,
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: "--headless=new",
        ...(Number.isInteger(PORT) && PORT > 0 ? { port: PORT } : {}),
      },
    },
    assert: {
      assertions: {
        // baseline 2026-09-22 (median of 3, production): / 0.77, /?ur=90000&mr=50000 0.75,
        // /methodology 0.85, /privacy 0.83. Plan 07-07 rule: median − 0.03, floor 0.80.
        // / and /?ur sit below the floor — LCP is the <h1> (text) but Lantern's simulated
        // slow-4G LCP (3.4 s / 4.5 s) and TBT (420 ms / 340 ms) are dominated by the
        // first-party Next chunks and Clerk's clerk-js/ui (~370 KB).
        // 2026-09-22: demoted to warn — Nick accepted 0.77 (/) and 0.75 (/?ur) for
        // launch (07-VERIFICATION override); a11y/SEO 1.00 carry the gate. v1.1 bundle
        // work (trim first-party chunks, defer Clerk UI) re-promotes this to error.
        "categories:performance": [
          "warn",
          { minScore: 0.8, aggregationMethod: "median" },
        ],
        // baseline 2026-09-22: 1.00 on all four routes.
        "categories:accessibility": ["error", { minScore: 0.95 }],
        // baseline 2026-09-22: 0.79 on all four routes (deterministic). The only failing
        // audits are third-party-cookies + inspector-issues for Cloudflare's __cf_bm /
        // _cfuvid set by the Clerk DEVELOPMENT instance host
        // renewing-seal-8576.clerk.accounts.dev — a consequence of D7-01 (b), not of
        // anything in this repo. A Clerk production instance on a custom domain makes
        // FAPI first-party and clears both audits.
        // WARN, not error (orchestrator ruling 2026-09-22, same treatment as SEO): plan
        // 07-10, or whichever plan lands the Clerk production instance, re-promotes this
        // to "error" at minScore 0.90.
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        // error since the 07-09 launch flip: the site-wide noindex is gone, so the
        // is-crawlable audit passes on all four collected routes (/account is never
        // collected and keeps its route-level noindex).
        "categories:seo": ["error", { minScore: 0.9 }],
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
