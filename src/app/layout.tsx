import type { ReactNode } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top, #fff8e8 0%, #f5f1e8 38%, #efe7d7 100%)",
          color: "#1f2937",
          fontFamily:
            '"Hiragino Sans", "Yu Gothic", "Noto Sans JP", system-ui, sans-serif',
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            padding: "24px 0 48px",
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
