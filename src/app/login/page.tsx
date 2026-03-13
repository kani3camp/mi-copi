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
        eyebrow="アカウント"
        subtitle="Google でログインするか、ゲストでそのまま始めるかを選びます。"
      />

      {hasSessionToken ? (
        <Notice tone="success">
          すでにサインイン済みです。必要ならそのままホームから学習を始められます。
        </Notice>
      ) : null}

      <LoginControls />

      {hasSessionToken ? (
        <Suspense fallback={<LoginAccountLoading />}>
          <LoginCurrentUserSection />
        </Suspense>
      ) : null}

      <Surface>
        <div className="ui-page-aux-actions">
          <ButtonLink
            href="/"
            variant="ghost"
            size="compact"
            pendingLabel="ホームを開いています..."
          >
            ホーム
          </ButtonLink>
        </div>
      </Surface>
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
