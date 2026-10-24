"use client";

import { useState } from "react";
import { getLoginStartErrorMessage } from "../../lib/async-action-errors";
import { getAuthClient } from "../../lib/auth/client";
import { startGoogleLogin } from "./login-auth-action";
import { LoginChoicePanel } from "./login-panels";

export function LoginControls() {
  const authClient = getAuthClient();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    if (isPending) {
      return;
    }

    setIsPending(true);
    setErrorMessage(null);

    try {
      await startGoogleLogin((request) => authClient.signIn.social(request));
    } catch {
      setErrorMessage(getLoginStartErrorMessage());
      setIsPending(false);
    }
  }

  return (
    <LoginChoicePanel
      isPending={isPending}
      errorMessage={errorMessage}
      onGoogleSignIn={handleGoogleSignIn}
    />
  );
}
