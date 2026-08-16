import { ButtonLink } from "../ui/navigation-link";
import {
  ActionCard,
  Button,
  Chip,
  Notice,
  SectionHeader,
  SummaryBlock,
  SummaryStat,
  Surface,
} from "../ui/primitives";
import styles from "./login-panels.module.css";

export function LoginChoicePanel(props: {
  isPending: boolean;
  errorMessage: string | null;
  onGoogleSignIn: () => void;
}) {
  return (
    <section className="ui-login-choice-layout" aria-label="ログイン方法">
      <ActionCard
        tone="brand"
        className="ui-login-choice-card ui-login-choice-card--primary"
        eyebrow={<Chip tone="brand">クラウド保存</Chip>}
        title="Google でログイン"
        description="結果の保存、統計、設定の同期を使って練習を続けます。"
        footer={
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
        }
      />

      <ActionCard
        className="ui-login-choice-card ui-login-choice-card--guest"
        eyebrow={<Chip tone="neutral">保存なし</Chip>}
        title="ゲストで始める"
        description="ログインせず、今すぐ距離モードと鍵盤モードを試せます。"
        footer={
          <ButtonLink
            href="/"
            variant="secondary"
            block
            pendingLabel="ホームを開いています..."
          >
            ゲストで始める
          </ButtonLink>
        }
      />

      {props.errorMessage ? (
        <Notice tone="error" className="ui-login-error-notice">
          {props.errorMessage}
        </Notice>
      ) : null}
    </section>
  );
}

export function LoginSignedInPanel(props: {
  name: string | null | undefined;
  email: string | null | undefined;
}) {
  return (
    <Surface className="ui-login-signed-in-panel">
      <SectionHeader
        title="サインイン中のアカウント"
        description="このアカウントで、次回以降の結果保存と統計を使えます。"
      />
      <SummaryBlock
        className={`ui-login-account-summary ${styles.accountSummary}`}
      >
        <SummaryStat
          label="名前"
          value={props.name ?? "不明"}
          emphasis="primary"
          tone="brand"
          className={styles.accountStat}
        />
        <SummaryStat
          label="メールアドレス"
          value={props.email ?? "不明"}
          tone="info"
          className={styles.accountStat}
        />
      </SummaryBlock>
      <div className="ui-nav-row">
        <ButtonLink href="/" pendingLabel="ホームを開いています...">
          ホームで練習を始める
        </ButtonLink>
      </div>
    </Surface>
  );
}
