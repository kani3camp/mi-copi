import {
  formatDateTimeLabel,
  formatTrainingModeLabel,
} from "../../features/training/model/format";
import { formatDirectionModeLabel } from "../../features/training/model/interval-notation";
import type { TrainingConfigSnapshot } from "../../features/training/model/types";
import type { SettingsPageData } from "../../features/training/server/getSettingsPageData";
import { ButtonLink } from "../ui/navigation-link";
import {
  AppShell,
  Chip,
  Notice,
  PageHeader,
  SectionHeader,
  Surface,
} from "../ui/primitives";
import { GlobalSettingsSection } from "./global-settings-section";
import { ResetConfigSubmitButton } from "./reset-config-submit-button";

export function SettingsPanels({
  data,
  resetTarget,
  resetError,
  resetDistanceAction,
  resetKeyboardAction,
}: {
  data: SettingsPageData;
  resetTarget?: string;
  resetError?: string;
  resetDistanceAction: () => Promise<void>;
  resetKeyboardAction: () => Promise<void>;
}) {
  return (
    <AppShell narrow className="ui-records-shell ui-settings-shell">
      <PageHeader
        title="設定"
        actions={
          <div className="ui-page-aux-actions">
            <ButtonLink
              href="/"
              variant="ghost"
              size="compact"
              pendingLabel="ホームを開いています..."
            >
              ホーム
            </ButtonLink>
            <ButtonLink
              href="/train/distance"
              variant="ghost"
              size="compact"
              pendingLabel="距離モードを開いています..."
            >
              距離モード
            </ButtonLink>
            <ButtonLink
              href="/train/keyboard"
              variant="ghost"
              size="compact"
              pendingLabel="鍵盤モードを開いています..."
            >
              鍵盤モード
            </ButtonLink>
          </div>
        }
      />

      {resetTarget || resetError ? (
        <div className="ui-stack-sm">
          {resetTarget ? (
            <Notice>
              {resetTarget === "distance"
                ? "距離モードの設定を初期値に戻しました。"
                : "鍵盤モードの設定を初期値に戻しました。"}
            </Notice>
          ) : null}

          {resetError ? (
            <Notice tone="error">
              {resetError === "distance"
                ? "距離モードの設定をリセットできませんでした。もう一度お試しください。"
                : "鍵盤モードの設定をリセットできませんでした。もう一度お試しください。"}
            </Notice>
          ) : null}
        </div>
      ) : null}

      <GlobalSettingsSection />

      {data.isAuthenticated ? (
        <>
          <Surface tone="elevated">
            <SectionHeader title="保存済みの前回設定" />
            <div className="ui-settings-snapshot">
              <ConfigSnapshotGroup
                mode="distance"
                config={data.lastDistanceConfig}
                resetAction={resetDistanceAction}
              />
              <ConfigSnapshotGroup
                mode="keyboard"
                config={data.lastKeyboardConfig}
                resetAction={resetKeyboardAction}
              />
            </div>
          </Surface>

          <Surface tone="elevated">
            <SectionHeader title="アカウント概要" />
            <dl className="ui-settings-account-rows">
              <div>
                <dt>名前</dt>
                <dd>{data.user?.name ?? "不明"}</dd>
              </div>
              <div>
                <dt>メールアドレス</dt>
                <dd>{data.user?.email ?? "不明"}</dd>
              </div>
              <div>
                <dt>ログイン状態</dt>
                <dd>サインイン中</dd>
              </div>
              <div>
                <dt>最終更新</dt>
                <dd>
                  {data.updatedAt
                    ? formatDateTimeLabel(data.updatedAt)
                    : "まだ保存されていません"}
                </dd>
              </div>
            </dl>
          </Surface>
        </>
      ) : (
        <Surface tone="elevated">
          <SectionHeader title="保存済み設定" />
          <Notice tone="warning">
            ゲスト利用中です。保存済み設定はログイン後に利用できるようになります。
          </Notice>
        </Surface>
      )}
    </AppShell>
  );
}

function ConfigSnapshotGroup(props: {
  mode: "distance" | "keyboard";
  config: TrainingConfigSnapshot | null;
  resetAction: () => Promise<void>;
}) {
  const modeLabel = formatTrainingModeLabel(props.mode);
  const stateLabel = props.config ? "保存済み" : "未保存";

  return (
    <div className="ui-settings-snapshot__group">
      <div className="ui-settings-snapshot__title">
        <div className="ui-stack-sm">
          <div className="ui-compact-actions">
            <Chip tone="brand">{modeLabel}</Chip>
            <Chip tone="neutral">{stateLabel}</Chip>
          </div>
        </div>
        <form action={props.resetAction}>
          <ResetConfigSubmitButton>初期値に戻す</ResetConfigSubmitButton>
        </form>
      </div>

      {props.config ? (
        <div className="ui-settings-snapshot__rows">
          {getSnapshotRows(props.config).map((row) => (
            <div
              key={`${props.mode}-${row.label}`}
              className="ui-settings-snapshot__row"
            >
              <span className="ui-settings-snapshot__label">{row.label}</span>
              <span className="ui-settings-snapshot__value">{row.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="ui-subtitle">
          {modeLabel} の保存済み設定はまだありません。
        </p>
      )}
    </div>
  );
}

function getSnapshotRows(config: TrainingConfigSnapshot) {
  const rows = [
    {
      label: "音程範囲",
      value: `${config.intervalRange.minSemitone} - ${config.intervalRange.maxSemitone}`,
    },
    {
      label: "出題方向",
      value: formatDirectionModeLabel(config.directionMode),
    },
    {
      label: "基準音モード",
      value: config.baseNoteMode === "fixed" ? "固定" : "ランダム",
    },
    { label: "固定する基準音", value: config.fixedBaseNote ?? "なし" },
    { label: "同音", value: config.includeUnison ? "含める" : "含めない" },
    {
      label: "オクターブ",
      value: config.includeOctave ? "含める" : "含めない",
    },
    {
      label: "終了条件",
      value:
        config.endCondition.type === "question_count"
          ? `問題数 ${config.endCondition.questionCount} 問`
          : `制限時間 ${config.endCondition.timeLimitSeconds} 秒`,
    },
  ];

  if ("intervalGranularity" in config && config.intervalGranularity) {
    rows.push({
      label: "表記粒度",
      value: config.intervalGranularity === "simple" ? "シンプル" : "増減あり",
    });
  }

  return rows;
}
