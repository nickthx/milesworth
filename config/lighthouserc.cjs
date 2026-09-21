// Lighthouse CI config — PLAT-02 (mobile Lighthouse gate) for the four launch routes.
// Source: github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
//
// Location: lives in config/ and is passed with `--config` (see the `lighthouse` npm
// script). RuFlo rule: no new config files at the repo root.
//
// SEO sequencing: `categories:seo` is a WARNING, not an error. The layout-level noindex
// fails Lighthouse's is-crawlable audit until the launch flip in plan 07-09, which
// switches this assertion to "error".
//
// No secrets here: LHCI_BASE_URL is the only env var read (T-07-08). Reports are written
// to .lighthouseci/, which is gitignored. `/og` is never collected — Satori rendering is
// CPU-heavy and must not be hammered by a CI tool (T-07-07).
const BASE = process.env.LHCI_BASE_URL ?? "https://milesworth.vercel.app";

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
      settings: { chromeFlags: "--headless=new" },
    },
    assert: {
      assertions: {
        "categories:performance": [
          "error",
          { minScore: 0.85, aggregationMethod: "median" },
        ],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
