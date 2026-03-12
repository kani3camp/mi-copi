"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getAuthClient } from "../lib/auth/client";
import { buttonStyle } from "./ui/polish";

export function HomeSignOutButton() {
  const authClient = getAuthClient();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    if (isPending) {
      return;
    }

    setIsPending(true);

    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.refresh();
          },
        },
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      style={buttonStyle("secondary", isPending)}
    >
      {isPending ? "ログアウト中..." : "ログアウト"}
    </button>
  );
}
