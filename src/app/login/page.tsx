import { getCurrentUserOrNullCached } from "../../lib/auth/server";
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
  const currentUser = await getCurrentUserOrNullCached();

  return (
    <AppShell narrow>
      <PageHeader
        title="ログイン"
        eyebrow="アカウント"
        subtitle="Google でログインするか、ゲストでそのまま始めるかを選びます。"
      />

      {currentUser ? (
        <Notice tone="success">
          すでにサインイン済みです。必要ならそのままホームから学習を始められます。
        </Notice>
      ) : null}

      <LoginControls />

      {currentUser ? (
        <LoginCurrentUserSection currentUser={currentUser} />
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

function LoginCurrentUserSection(props: {
  currentUser: Awaited<ReturnType<typeof getCurrentUserOrNullCached>>;
}) {
  return (
    <Surface>
      <SectionHeader title="サインイン中のアカウント" />
      <SummaryBlock>
        <SummaryStat
          label="名前"
          value={props.currentUser?.name ?? "不明"}
          emphasis="primary"
        />
        <SummaryStat
          label="メールアドレス"
          value={props.currentUser?.email ?? "不明"}
        />
      </SummaryBlock>
    </Surface>
  );
}
