// The three brand colors, in ONE place for TypeScript consumers (PLAT-05).
// The /og social card and the layout's theme color read them from here. CSS
// cannot import TypeScript, so globals.css carries the same hex strings in
// its @theme block and tests/design-system-gate.test.ts asserts the two
// representations are equal — changing either side alone fails the gate.
//
// This module ships to the client bundle, so it holds literals only: no
// environment reads, no Node built-ins, no secrets. These are design tokens,
// not deployment config — there is deliberately no override.

/** Warm off-white page ground. Equals --color-cream. */
export const CREAM = "#faf7f2";

/** Warm near-black text. Equals --color-ink. */
export const INK = "#262119";

/** Warm accent, re-tuned from #c05f33 for WCAG AA contrast (UI-SPEC A3). Equals --color-terracotta. */
export const TERRACOTTA = "#b25429";
