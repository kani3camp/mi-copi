import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { GlobalUserSettingsProvider } from "../../features/settings/client/global-user-settings-provider";
import type { GlobalUserSettings } from "../../features/settings/model/global-user-settings";
import { getCurrentUserSettingsSnapshot } from "../../features/settings/server/getCurrentUserSettingsSnapshot";
import { updateGlobalUserSettingsForCurrentUser } from "../../features/settings/server/global-user-settings";
import {
  formatDateTimeLabel,
  formatTrainingModeLabel,
} from "../../features/training/model/format";
import { formatDirectionModeLabel } from "../../features/training/model/interval-notation";
import type { TrainingConfigSnapshot } from "../../features/training/model/types";
import { getSettingsPageDataForCurrentUser } from "../../features/training/server/getSettingsPageData";
import { resetLastUsedTrainingConfigForCurrentUser } from "../../features/training/server/lastUsedTrainingConfig";
import { getCurrentUserOrNullCached } from "../../lib/auth/server";
import { ButtonLink } from "../ui/navigation-link";
import {
  AppShell,
  Chip,
  Notice,
  PageHeader,
  SectionHeader,
  SummaryBlock,
  SummaryStat,
  Surface,
} from "../ui/primitives";
import { GlobalSettingsSection } from "./global-settings-section";
import { ResetConfigSubmitButton } from "./reset-config-submit-button";

interface SettingsPageProps {
  searchParams?: Promise<{
    reset?: string;
    error?: string;
  }>;
}

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const currentUser = await getCurrentUserOrNullCached();
  const [data, userSettingsSnapshot] = await Promise.all([
    getSettingsPageDataForCurrentUser({ currentUser }),
    getCurrentUserSettingsSnapshot({ currentUser }),
  ]);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const resetTarget = resolvedSearchParams?.reset;
  const resetError = resolvedSearchParams?.error;

  async function persistGlobalUserSettingsAction(settings: GlobalUserSettings) {
    "use server";

    return updateGlobalUserSettingsForCurrentUser(settings);
  }

  async function resetDistanceAction() {
    "use server";

    try {
      await resetLastUsedTrainingConfigForCurrentUser("distance");
      revalidatePath("/settings");
      revalidatePath("/train/distance");
    } catch {
      redirect("/settings?error=distance");
    }

    redirect("/settings?reset=distance");
  }

  async function resetKeyboardAction() {
    "use server";

    try {
      await resetLastUsedTrainingConfigForCurrentUser("keyboard");
      revalidatePath("/settings");
      revalidatePath("/train/keyboard");
    } catch {
      redirect("/settings?error=keyboard");
    }

    redirect("/settings?reset=keyboard");
  }

  return (
    <GlobalUserSettingsProvider
      initialSettings={userSettingsSnapshot.settings}
      initialUpdatedAt={userSettingsSnapshot.updatedAt}
      isAuthenticated={userSettingsSnapshot.isAuthenticated}
      persistSettingsAction={persistGlobalUserSettingsAction}
    >
      <AppShell narrow>
        <PageHeader
          title="設定"
          eyebrow="学習環境"
          subtitle="再生、表記、保存済み設定をスマホで短く調整できるようにまとめています。"
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

        <div className="ui-stack-sm">
          {resetTarget ? (
            <Notice tone="success">
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

        <GlobalSettingsSection />

        {data.isAuthenticated ? (
          <>
            <Surface tone="elevated">
              <SectionHeader
                title="保存済みの前回設定"
                description="mode ごとの最後に使った条件を、練習前にここで見直せます。"
              />
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
              <SectionHeader
                title="アカウント概要"
                description="設定と結果のクラウド保存に使っている状態です。"
              />
              <SummaryBlock className="ui-summary-block--insight ui-settings-account-summary">
                <SummaryStat
                  label="名前"
                  value={data.user?.name ?? "不明"}
                  emphasis="primary"
                  className="ui-summary-stat--brand"
                />
                <SummaryStat
                  label="メールアドレス"
                  value={data.user?.email ?? "不明"}
                />
                <SummaryStat
                  label="ログイン状態"
                  value="サインイン中"
                  detail="設定と結果をクラウド保存します。"
                  className="ui-summary-stat--success"
                />
                <SummaryStat
                  label="最終更新"
                  value={
                    data.updatedAt
                      ? formatDateTimeLabel(data.updatedAt)
                      : "まだ保存されていません"
                  }
                  detail="設定のクラウド反映時刻"
                  className="ui-summary-stat--info"
                />
              </SummaryBlock>
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
    </GlobalUserSettingsProvider>
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
            <Chip tone={props.config ? "success" : "neutral"}>
              {stateLabel}
            </Chip>
          </div>
          <span className="ui-mini-note">
            前回その mode で使った条件をここに保持します。
          </span>
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
