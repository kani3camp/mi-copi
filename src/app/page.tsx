import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "40px 20px",
        display: "grid",
        gap: "16px",
      }}
    >
      <h1 style={{ margin: 0 }}>ミーコピ</h1>
      <p style={{ margin: 0 }}>
        MVP の最小導線です。guest の distance vertical slice と auth test に入れます。
      </p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Link href="/train/distance">Start distance guest slice</Link>
        <Link href="/auth-test">Open auth test</Link>
      </div>
    </main>
  );
}
