import type { PropsWithChildren } from "react";
import { ButtonLink } from "../ui/navigation-link";
import { AppShell, Button, Notice, PageHeader } from "../ui/primitives";
import styles from "./login-panels.module.css";

export function LoginPageLayout(
  props: PropsWithChildren<{ isAuthenticated: boolean }>,
) {
  return (
    <AppShell narrow className={styles.shell}>
      <PageHeader
        title={props.isAuthenticated ? "ログイン中" : "ログイン"}
        actions={
          <ButtonLink
            href="/"
            variant="ghost"
            size="compact"
            pendingLabel="ホームを開いています..."
          >
            ホーム
          </ButtonLink>
        }
      />
      {props.children}
    </AppShell>
  );
}

export function LoginChoicePanel(props: {
  isPending: boolean;
  errorMessage: string | null;
  onGoogleSignIn: () => void;
}) {
  return (
    <section className={`ui-surface ${styles.panel}`} aria-label="ログイン方法">
      <div className={styles.choice}>
        <p>結果の保存・統計・設定の同期が使えます。</p>
        <Button
          type="button"
          onClick={props.onGoogleSignIn}
          disabled={props.isPending}
          pending={props.isPending}
          variant="primary"
          block
        >
          {props.isPending ? "接続中..." : "Google でログイン"}
        </Button>
      </div>
      <div className={styles.choice}>
        <p>保存せずに、すぐ練習できます。</p>
        <ButtonLink
          href="/"
          variant="secondary"
          block
          pendingLabel="ホームを開いています..."
        >
          ゲストで始める
        </ButtonLink>
      </div>
      {props.errorMessage ? (
        <Notice tone="error">{props.errorMessage}</Notice>
      ) : null}
    </section>
  );
}

export function LoginSignedInPanel(props: {
  name: string | null | undefined;
  email: string | null | undefined;
}) {
  return (
    <section
      className={`ui-surface ${styles.panel}`}
      aria-label="サインイン中のアカウント"
    >
      <dl className={styles.accountSummary}>
        <div>
          <dt className="sr-only">名前</dt>
          <dd className={styles.name}>{props.name ?? "不明"}</dd>
        </div>
        <div>
          <dt className="sr-only">メールアドレス</dt>
          <dd className={styles.email}>{props.email ?? "不明"}</dd>
        </div>
      </dl>
      <ButtonLink
        href="/"
        variant="primary"
        block
        pendingLabel="ホームを開いています..."
      >
        ホームで練習を始める
      </ButtonLink>
    </section>
  );
}
