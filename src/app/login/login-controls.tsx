"use client";

import { useState } from "react";

import { getAuthClient } from "../../lib/auth/client";
import { ButtonLink } from "../ui/navigation-link";
import { Button, Notice } from "../ui/primitives";

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
      setErrorMessage(
        "Google ログインを開始できませんでした。もう一度お試しください。",
      );
      setIsPending(false);
    }
  }

  return (
    <div className="ui-auth-choice-grid">
      <div className="ui-auth-choice-card">
        <div className="ui-stack-sm">
          <span className="ui-hero__eyebrow">Cloud Save</span>
          <strong>Google でログイン</strong>
          <p className="ui-muted">
            結果の保存、統計、設定のクラウド同期を使う場合はこちら。
          </p>
        </div>
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
      </div>

      <div className="ui-auth-choice-card">
        <div className="ui-stack-sm">
          <span className="ui-hero__eyebrow">Guest Start</span>
          <strong>ゲストでそのまま練習</strong>
          <p className="ui-muted">
            保存なしで今すぐ始める軽い反復練習向けです。
          </p>
        </div>
        <ButtonLink href="/" block pendingLabel="ホームを開いています...">
          ゲストで始める
        </ButtonLink>
      </div>

      {errorMessage ? <Notice tone="error">{errorMessage}</Notice> : null}
    </div>
  );
}
