"use client";

import { useRouter } from "next/navigation";

import { getAuthClient } from "../../lib/auth/client";

export function AuthTestControls() {
  const authClient = getAuthClient();
  const router = useRouter();
  const { data: session, isPending, error, refetch } = authClient.useSession();

  async function handleGoogleSignIn() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/auth-test",
    });
  }

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          refetch();
          router.refresh();
        },
      },
    });
  }

  return (
    <section style={{ display: "grid", gap: "12px" }}>
      <div>
        <strong>Client session</strong>
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
        {JSON.stringify(
          {
            isPending,
            error: error?.message ?? null,
            session,
          },
          null,
          2,
        )}
      </pre>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button type="button" onClick={handleGoogleSignIn}>
          Sign in with Google
        </button>
        <button type="button" onClick={handleSignOut}>
          Sign out
        </button>
        <button
          type="button"
          onClick={() => {
            refetch();
            router.refresh();
          }}
        >
          Refresh session
        </button>
      </div>
    </section>
  );
}
