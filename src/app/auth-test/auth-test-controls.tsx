"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { SaveTrainingSessionResult } from "../../features/training/server/saveTrainingSession";
import { getAuthClient } from "../../lib/auth/client";
import { Button, Notice, SectionHeader, Surface } from "../ui/primitives";

interface AuthTestControlsProps {
  isAuthenticated: boolean;
  saveDummyTrainingSession: () => Promise<SaveTrainingSessionResult>;
}

export function AuthTestControls({
  isAuthenticated,
  saveDummyTrainingSession,
}: AuthTestControlsProps) {
  const authClient = getAuthClient();
  const router = useRouter();
  const { data: session, isPending, error, refetch } = authClient.useSession();
  const [saveResult, setSaveResult] =
    useState<SaveTrainingSessionResult | null>(null);
  const [isSavePending, startSaveTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setActionError(null);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/auth-test",
      });
    } catch {
      setActionError(
        "Google ログインを開始できませんでした。もう一度お試しください。",
      );
    }
  }

  async function handleSignOut() {
    setActionError(null);

    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            refetch();
            router.refresh();
          },
        },
      });
    } catch {
      setActionError("サインアウトに失敗しました。もう一度お試しください。");
    }
  }

  function handleRefreshSession() {
    setActionError(null);

    try {
      refetch();
      router.refresh();
    } catch {
      setActionError(
        "セッション再取得に失敗しました。時間をおいてもう一度お試しください。",
      );
    }
  }

  function handleSaveDummyTrainingSession() {
    setActionError(null);
    setSaveResult(null);

    startSaveTransition(async () => {
      try {
        const result = await saveDummyTrainingSession();
        setSaveResult(result);
        router.refresh();
      } catch {
        setActionError(
          "ダミーセッション保存の呼び出しに失敗しました。認証状態と DB 接続を確認してください。",
        );
      }
    });
  }

  return (
    <div className="ui-stack-lg">
      {actionError ? <Notice tone="error">{actionError}</Notice> : null}
      {error?.message ? (
        <Notice tone="error">Client session hook error: {error.message}</Notice>
      ) : null}

      <Surface>
        <SectionHeader
          title="Client session"
          description="Client hook から見えている session state と、認証操作の結果確認に使います。"
        />
        <pre className="ui-code-block">
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
        <div className="ui-action-row">
          <Button type="button" onClick={handleGoogleSignIn} variant="primary">
            Sign in with Google
          </Button>
          <Button type="button" onClick={handleSignOut} variant="secondary">
            Sign out
          </Button>
          <Button type="button" onClick={handleRefreshSession} variant="ghost">
            Refresh session
          </Button>
        </div>
      </Surface>

      <Surface>
        <SectionHeader
          title="Save test"
          description="サインイン済みのときだけ、保存 entrypoint にダミーセッションを送って疎通確認できます。"
        />
        {!isAuthenticated ? (
          <Notice>
            Save test は server current user
            ベースで有効化しています。先にログインしてから再読み込みしてください。
          </Notice>
        ) : null}
        <div className="ui-action-row">
          <Button
            type="button"
            disabled={!isAuthenticated || isSavePending}
            onClick={handleSaveDummyTrainingSession}
            variant="primary"
          >
            {isSavePending ? "Saving..." : "Save dummy training session"}
          </Button>
        </div>
        <pre className="ui-code-block">
          {JSON.stringify(
            saveResult ?? {
              ok: null,
              hint: isAuthenticated
                ? "Click the button to save a dummy session."
                : "Sign in first to enable the save test.",
            },
            null,
            2,
          )}
        </pre>
      </Surface>
    </div>
  );
}
