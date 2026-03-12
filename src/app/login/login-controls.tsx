"use client";

import Link from "next/link";
import { useState } from "react";

import { getAuthClient } from "../../lib/auth/client";
import {
  buttonStyle,
  navLinkStyle,
  navRowStyle,
  noticeStyle,
  subtleTextStyle,
} from "../ui/polish";

interface LoginControlsProps {
  isAuthenticated: boolean;
}

export function LoginControls({ isAuthenticated }: LoginControlsProps) {
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

  if (isAuthenticated) {
    return (
      <div style={{ display: "grid", gap: "12px" }}>
        <div style={noticeStyle("success")}>
          すでにサインイン済みです。ホームからそのまま学習を始められます。
        </div>
        <div style={navRowStyle}>
          <Link href="/" style={navLinkStyle}>
            ホームへ戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isPending}
        style={buttonStyle("primary", isPending)}
      >
        {isPending ? "接続中..." : "Google でログイン"}
      </button>

      <p style={subtleTextStyle}>
        ログインすると結果の保存、統計、設定のクラウド同期が使えます。
      </p>

      {errorMessage ? (
        <div style={noticeStyle("error")}>{errorMessage}</div>
      ) : null}

      <div style={navRowStyle}>
        <Link href="/" style={navLinkStyle}>
          ゲストで始める
        </Link>
      </div>
    </div>
  );
}
