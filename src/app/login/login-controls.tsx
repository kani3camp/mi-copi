"use client";

import { useState } from "react";
import { getLoginStartErrorMessage } from "../../lib/async-action-errors";
import { getAuthClient } from "../../lib/auth/client";
import { ButtonLink } from "../ui/navigation-link";
import { ActionCard, Button, Chip, Notice } from "../ui/primitives";

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
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch {
      setErrorMessage(getLoginStartErrorMessage());
      setIsPending(false);
    }
  }

  return (
    <div className="ui-auth-choice-grid">
      <ActionCard
        tone="brand"
        eyebrow={<Chip tone="brand">クラウド保存</Chip>}
        title="Google でログイン"
        description="結果の保存、統計、設定の同期を使う場合はこちら。"
        footer={
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isPending}
            pending={isPending}
            variant="primary"
            block
          >
            {isPending ? "接続中..." : "Google でログイン"}
          </Button>
        }
      />

      <ActionCard
        eyebrow={<Chip tone="neutral">保存なし</Chip>}
        title="ゲストでそのまま練習"
        description="保存なしで今すぐ試したいときはこちらです。"
        footer={
          <ButtonLink
            href="/"
            variant="secondary"
            block
            pendingLabel="ホームを開いています..."
          >
            ゲストで始める
          </ButtonLink>
        }
      />

      {errorMessage ? <Notice tone="error">{errorMessage}</Notice> : null}
    </div>
  );
}
