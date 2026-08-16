import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Outfit, Zen_Kaku_Gothic_New } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";
import "./ui/accessibility.css";
import "./design-system-v2.css";

const APP_NAME = "ミーコピ";
const APP_DESCRIPTION =
  "基準音ありの相対音感トレーニングを、短く反復できる耳コピ向けWebアプリです。";
const THEME_COLOR = "#009193";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-zen-kaku",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/icons/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/icons/favicon-16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    shortcut: [
      {
        url: "/icons/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${outfit.variable} ${zenKakuGothicNew.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        <div className="app-root">{children}</div>
      </body>
    </html>
  );
}
