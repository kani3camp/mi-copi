import { getCurrentUserOrNullCached } from "../../lib/auth/server";
import { ButtonLink } from "../ui/navigation-link";
import {
  AppShell,
  KeyValueCard,
  KeyValueGrid,
  PageHero,
  SectionHeader,
  Surface,
} from "../ui/primitives";
import { LoginControls } from "./login-controls";

export default async function LoginPage() {
  const currentUser = await getCurrentUserOrNullCached();

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
        <LoginControls isAuthenticated={Boolean(currentUser)} />
      </Surface>

      {currentUser ? (
        <Surface>
          <SectionHeader title="サインイン中のアカウント" />
          <KeyValueGrid>
            <KeyValueCard label="名前" value={currentUser.name ?? "不明"} />
            <KeyValueCard
              label="メールアドレス"
              value={currentUser.email ?? "不明"}
            />
          </KeyValueGrid>
        </Surface>
      ) : null}
    </AppShell>
  );
}
