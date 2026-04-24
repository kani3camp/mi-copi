import { getCurrentUserOrNullCached } from "../../lib/auth/server";
import { ButtonLink } from "../ui/navigation-link";
import { AppShell, Notice, PageHeader, Surface } from "../ui/primitives";
import { LoginControls } from "./login-controls";
import { LoginSignedInPanel } from "./login-panels";

export default async function LoginPage() {
  const currentUser = await getCurrentUserOrNullCached();

  return (
    <AppShell narrow>
      <PageHeader
        title="ログインして記録を残す"
        eyebrow="アカウント"
        subtitle="保存して続けるか、ゲストで今すぐ練習するかを選べます。"
      />

      {currentUser ? (
        <>
          <Notice tone="success">
            すでにサインイン済みです。このアカウントで結果保存と統計を使えます。
          </Notice>
          <LoginSignedInPanel
            name={currentUser.name}
            email={currentUser.email}
          />
        </>
      ) : (
        <LoginControls />
      )}

      <Surface className="ui-login-secondary-nav">
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
