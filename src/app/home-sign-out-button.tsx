"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getAuthClient } from "../lib/auth/client";
import { Button } from "./ui/primitives";

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
    <Button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      pending={isPending}
      variant="ghost"
      className="ui-header-link"
    >
      {isPending ? "ログアウト中..." : "ログアウト"}
    </Button>
  );
}
