// Destination-imagery manifest (PLAT-05). This is the CLAUDE.md contract:
// every photo was sourced ONCE under the Unsplash License, re-encoded by
// scripts/optimize-images.ts (3:2, 1600×1067, WebP, metadata stripped) and
// committed under src/images/destinations/. Cards reach a photo only through
// getDestinationImage(imageSlug) — a static import, never a hotlinked URL and
// never a filesystem path built at runtime (T-07-04, T-07-18).
//
// Credits live here. Each entry names the photographer and source; the photo
// page URL sits in the trailing comment for provenance only (T-07-14) — it is
// never rendered and never fetched. The site footer reads "Photos via Unsplash";
// 07-05 Task 3 extends it to "… and Pexels" if any entry's source becomes
// Pexels (UI-SPEC A7). Today every entry is Unsplash.
//
// Alt text (UI-SPEC Imagery Contract — Alt text): 4–10 words describing the
// scene in the frame — never the redemption title.

import type { StaticImageData } from "next/image";

import amsterdam from "./destinations/amsterdam.webp";
import austin from "./destinations/austin.webp";
import bigSur from "./destinations/big-sur.webp";
import boraBora from "./destinations/bora-bora.webp";
import cancun from "./destinations/cancun.webp";
import doha from "./destinations/doha.webp";
import dubai from "./destinations/dubai.webp";
import frankfurt from "./destinations/frankfurt.webp";
import hawaii from "./destinations/hawaii.webp";
import hongKong from "./destinations/hong-kong.webp";
import istanbul from "./destinations/istanbul.webp";
import kauai from "./destinations/kauai.webp";
import kyoto from "./destinations/kyoto.webp";
import london from "./destinations/london.webp";
import maldives from "./destinations/maldives.webp";
import maui from "./destinations/maui.webp";
import paris from "./destinations/paris.webp";
import singapore from "./destinations/singapore.webp";
import tokyo from "./destinations/tokyo.webp";
import venice from "./destinations/venice.webp";

export interface DestinationImage {
  /** Static import — width/height/blurDataURL come from Next's image loader. */
  image: StaticImageData;
  /** 4–10 words, the scene — never the redemption title. */
  alt: string;
  credit: { photographer: string; source: "Unsplash" | "Pexels" };
}

/**
 * imageSlug → asset. Keys match `RedemptionSeed.imageSlug` values in
 * src/data/redemptions-*.ts; tests/image-manifest.test.ts holds the three
 * sets (seed slugs, files on disk, entries here) in sync without importing
 * this module.
 */
export const DESTINATION_IMAGES = {
  tokyo: {
    image: tokyo,
    alt: "Tokyo skyline at golden hour",
    credit: { photographer: "Alexandre Lallemand", source: "Unsplash" },
  }, // https://unsplash.com/photos/UtPC_kz8CAc
  singapore: {
    image: singapore,
    alt: "Marina Bay Sands over Marina Bay at blue hour",
    credit: { photographer: "Julien de Salaberry", source: "Unsplash" },
  }, // https://unsplash.com/photos/viwdmfrbXfI
  "hong-kong": {
    image: hongKong,
    alt: "Victoria Harbour skyline, Hong Kong",
    credit: { photographer: "Man Chung", source: "Unsplash" },
  }, // https://unsplash.com/photos/MZJIfilvWUg
  hawaii: {
    image: hawaii,
    alt: "Waikiki shoreline with Diamond Head, Oahu",
    credit: { photographer: "aussieactive", source: "Unsplash" },
  }, // https://unsplash.com/photos/VxFQCqaI7pk
  london: {
    image: london,
    alt: "Thames riverside and Westminster, London",
    credit: { photographer: "Jay Alexander", source: "Unsplash" },
  }, // https://unsplash.com/photos/nKl1YotZkeA
  paris: {
    image: paris,
    alt: "Paris rooftops with the Eiffel Tower",
    credit: { photographer: "Howard Walsh", source: "Unsplash" },
  }, // https://unsplash.com/photos/jbjjc0JXheg
  frankfurt: {
    image: frankfurt,
    alt: "Frankfurt skyline over the Main river",
    credit: { photographer: "Kai Pilger", source: "Unsplash" },
  }, // https://unsplash.com/photos/m9TjCeDQvhE
  dubai: {
    image: dubai,
    alt: "Dubai skyline in warm morning light",
    credit: { photographer: "Riyas Mohammed", source: "Unsplash" },
  }, // https://unsplash.com/photos/CK9BTsQ-I1Y
  istanbul: {
    image: istanbul,
    alt: "Bosphorus and Istanbul's old-city skyline",
    credit: { photographer: "nurrachmaws", source: "Unsplash" },
  }, // https://unsplash.com/photos/pKz35bMrK4U
  doha: {
    image: doha,
    alt: "Doha corniche and West Bay towers",
    credit: { photographer: "Lukhmanul Hakeem", source: "Unsplash" },
  }, // https://unsplash.com/photos/lIn2iivhtGI
  amsterdam: {
    image: amsterdam,
    alt: "Canal houses along an Amsterdam canal",
    credit: { photographer: "Nastya Dulhiier", source: "Unsplash" },
  }, // https://unsplash.com/photos/3Ze88tZX-p0
  "big-sur": {
    image: bigSur,
    alt: "Bixby Bridge on the Big Sur coast",
    credit: { photographer: "Luke Mitchell", source: "Unsplash" },
  }, // https://unsplash.com/photos/OvwovK3mWwA
  kauai: {
    image: kauai,
    alt: "Na Pali Coast cliffs, Kauai",
    credit: { photographer: "Roberto Nickson", source: "Unsplash" },
  }, // https://unsplash.com/photos/Jat5D3lH_FA
  austin: {
    image: austin,
    alt: "Paddleboarder below the Congress Avenue bridge, Austin",
    credit: { photographer: "Megan Bucknall", source: "Unsplash" },
  }, // https://unsplash.com/photos/rTxDD976hj0
  cancun: {
    image: cancun,
    alt: "Turquoise water and white sand, Cancun",
    credit: { photographer: "Jan Bachor", source: "Unsplash" },
  }, // https://unsplash.com/photos/yHPKC4BdAPY
  maldives: {
    image: maldives,
    alt: "Overwater villas at dusk, Maldives",
    credit: { photographer: "Ismail Mohamed - SoviLe", source: "Unsplash" },
  }, // https://unsplash.com/photos/oM7_m4TvXck
  "bora-bora": {
    image: boraBora,
    alt: "Mount Otemanu across the Bora Bora lagoon",
    credit: { photographer: "Romeo A.", source: "Unsplash" },
  }, // https://unsplash.com/photos/rKirsg6a-2o
  maui: {
    image: maui,
    alt: "Green sea turtle on a Maui beach at dusk",
    credit: { photographer: "Kameron Kincade", source: "Unsplash" },
  }, // https://unsplash.com/photos/CMXEd6SVtMg
  kyoto: {
    image: kyoto,
    alt: "Arashiyama bamboo canopy, Kyoto",
    credit: { photographer: "Caleb Jack", source: "Unsplash" },
  }, // https://unsplash.com/photos/-ZNBunXTdao
  venice: {
    image: venice,
    alt: "Gondolas on the Grand Canal, Venice",
    credit: { photographer: "Rebe Adelaida", source: "Unsplash" },
  }, // https://unsplash.com/photos/zunQwMy5B6M
} as const satisfies Record<string, DestinationImage>;

/** The slug union ("tokyo" | "singapore" | … | "venice"). */
export type ImageSlug = keyof typeof DESTINATION_IMAGES;

/**
 * Lookup by seed `imageSlug`. Unknown or null slugs return null so the card
 * renders its no-image state (UI-SPEC Missing image row) — never a broken
 * <img> (T-07-18). The `in` guard is the only membership check; the slug is
 * never turned into a path.
 */
export function getDestinationImage(
  slug: string | null,
): DestinationImage | null {
  if (slug !== null && slug in DESTINATION_IMAGES) {
    return DESTINATION_IMAGES[slug as ImageSlug];
  }
  return null;
}
