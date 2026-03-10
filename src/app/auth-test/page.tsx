import { getCurrentUserOrNull } from "../../lib/auth/server";
import { AuthTestControls } from "./auth-test-controls";

export default async function AuthTestPage() {
  const currentUser = await getCurrentUserOrNull();

  return (
    <main
      style={{
        maxWidth: "860px",
        margin: "0 auto",
        padding: "40px 20px",
        display: "grid",
        gap: "24px",
      }}
    >
      <header style={{ display: "grid", gap: "8px" }}>
        <h1 style={{ margin: 0 }}>Auth Test</h1>
        <p style={{ margin: 0 }}>
          Better Auth / Google OAuth の疎通確認専用ページです。
        </p>
      </header>

      <section style={{ display: "grid", gap: "12px" }}>
        <div>
          <strong>Server current user</strong>
        </div>
        <pre
          style={{
            margin: 0,
            padding: "12px",
            border: "1px solid #d4d4d8",
            borderRadius: "8px",
            overflowX: "auto",
            background: "#fafafa",
            fontSize: "12px",
          }}
        >
          {JSON.stringify(currentUser, null, 2)}
        </pre>
      </section>

      <AuthTestControls />
    </main>
  );
}
