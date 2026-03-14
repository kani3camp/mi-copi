import type { ReactNode } from "react";

import "./globals.css";

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <div className="app-root">{children}</div>
      </body>
    </html>
  );
}
