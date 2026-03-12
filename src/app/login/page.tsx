import { Suspense } from "react";

import {
  getCurrentUserOrNullCached,
  hasSessionTokenCookieCached,
} from "../../lib/auth/server";
import { ButtonLink } from "../ui/navigation-link";
import {
  AppShell,
  KeyValueCard,
  KeyValueGrid,
  Notice,
  PageHero,
  SectionHeader,
  Surface,
} from "../ui/primitives";
import { LoginControls } from "./login-controls";

export default async function LoginPage() {
  const hasSessionToken = await hasSessionTokenCookieCached();

  return (
    <AppShell narrow>
      <PageHero
        title="ログイン"
        eyebrow="Account Access"
        subtitle="Google ログインまたはゲスト開始の入口です。相対音感トレーニングをすぐ始めつつ、必要なときだけ保存機能に切り替えられます。"
        actions={
          <>
            <ButtonLink href="/" pendingLabel="ホームを開いています...">
              ホームへ戻る
            </ButtonLink>
            <ButtonLink
              href="/train/distance"
              pendingLabel="距離モードを開いています..."
            >
              距離モードへ
            </ButtonLink>
            <ButtonLink
              href="/train/keyboard"
              pendingLabel="鍵盤モードを開いています..."
            >
              鍵盤モードへ
            </ButtonLink>
          </>
        }
      />

      <Surface tone="accent">
        <SectionHeader
          title="開始方法"
          description="ミーコピ MVP ではゲストでも練習できます。保存済み履歴や成長確認を使う場合だけログインしてください。"
        />
        <LoginControls />
      </Surface>

      {hasSessionToken ? (
        <Suspense fallback={<LoginAccountLoading />}>
          <LoginCurrentUserSection />
        </Suspense>
      ) : null}
    </AppShell>
  );
}

async function LoginCurrentUserSection() {
  const currentUser = await getCurrentUserOrNullCached();

  if (!currentUser) {
    return null;
  }

  return (
    <Surface>
      <SectionHeader
        title="サインイン中のアカウント"
        description="保存済み履歴と同期設定はこのアカウントに紐づきます。"
      />
      <Notice tone="success">
        すでにサインイン済みです。ホームからそのまま学習を始められます。
      </Notice>
      <KeyValueGrid>
        <KeyValueCard label="名前" value={currentUser.name ?? "不明"} />
        <KeyValueCard
          label="メールアドレス"
          value={currentUser.email ?? "不明"}
        />
      </KeyValueGrid>
    </Surface>
  );
}

function LoginAccountLoading() {
  return (
    <Surface>
      <SectionHeader
        title="アカウント状態を確認中"
        description="サインイン状態を読み込んでいます。"
      />
    </Surface>
  );
}
