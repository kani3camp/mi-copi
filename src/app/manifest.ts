import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ミーコピ",
    short_name: "ミーコピ",
    description:
      "基準音ありの相対音感トレーニングを、短く反復できる耳コピ向けWebアプリです。",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F5F4F1",
    theme_color: "#009193",
    lang: "ja",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
