import { Suspense } from "react";

import {
  getCurrentUserOrNullCached,
  hasSessionTokenCookieCached,
} from "../../lib/auth/server";
import { ButtonLink } from "../ui/navigation-link";
import {
  AppShell,
  Notice,
  PageHeader,
  SectionHeader,
  SummaryBlock,
  SummaryStat,
  Surface,
} from "../ui/primitives";
import { LoginControls } from "./login-controls";

export default async function LoginPage() {
  const hasSessionToken = await hasSessionTokenCookieCached();

  return (
    <AppShell narrow>
      <PageHeader
        title="ログイン"
        eyebrow="Account Access"
        subtitle="Google でログインするか、ゲストでそのまま始めるかを選びます。"
        actions={
          <>
            <ButtonLink
              href="/"
              variant="ghost"
              pendingLabel="ホームを開いています..."
            >
              ホーム
            </ButtonLink>
            <ButtonLink
              href="/train/distance"
              variant="ghost"
              pendingLabel="距離モードを開いています..."
            >
              距離モード
            </ButtonLink>
          </>
        }
      />

      {hasSessionToken ? (
        <Notice tone="success">
          すでにサインイン済みです。必要ならこのままホームへ戻って学習を始められます。
        </Notice>
      ) : null}

      <Surface tone="accent">
        <SectionHeader title="開始方法" />
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
      <SectionHeader title="サインイン中のアカウント" />
      <SummaryBlock>
        <SummaryStat
          label="名前"
          value={currentUser.name ?? "不明"}
          emphasis="primary"
        />
        <SummaryStat
          label="メールアドレス"
          value={currentUser.email ?? "不明"}
        />
      </SummaryBlock>
    </Surface>
  );
}

function LoginAccountLoading() {
  return (
    <Surface>
      <SectionHeader title="アカウント状態を確認中" />
    </Surface>
  );
}
