import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { GlobalUserSettingsProvider } from "../../features/settings/client/global-user-settings-provider";
import type { GlobalUserSettings } from "../../features/settings/model/global-user-settings";
import { getCurrentUserSettingsSnapshot } from "../../features/settings/server/getCurrentUserSettingsSnapshot";
import { updateGlobalUserSettingsForCurrentUser } from "../../features/settings/server/global-user-settings";
import { formatDateTimeLabel } from "../../features/training/model/format";
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
          eyebrow="Preferences"
          subtitle="音量、表記、鍵盤ラベル表示と保存済み設定をここで整えます。"
        />

        <Surface>
          <div className="ui-page-aux-actions">
            <ButtonLink
              href="/"
              variant="ghost"
              className="ui-header-link"
              pendingLabel="ホームを開いています..."
            >
              ホーム
            </ButtonLink>
            <ButtonLink
              href="/train/distance"
              variant="ghost"
              className="ui-header-link"
              pendingLabel="距離モードを開いています..."
            >
              距離モード
            </ButtonLink>
            <ButtonLink
              href="/train/keyboard"
              variant="ghost"
              className="ui-header-link"
              pendingLabel="鍵盤モードを開いています..."
            >
              鍵盤モード
            </ButtonLink>
          </div>
        </Surface>

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

        <GlobalSettingsSection />

        {data.isAuthenticated ? (
          <>
            <Surface>
              <SectionHeader title="保存済みの前回設定" />
              <div className="ui-settings-snapshot">
                <ConfigSnapshotGroup
                  title="距離モード"
                  config={data.lastDistanceConfig}
                  resetAction={resetDistanceAction}
                />
                <ConfigSnapshotGroup
                  title="鍵盤モード"
                  config={data.lastKeyboardConfig}
                  resetAction={resetKeyboardAction}
                />
              </div>
            </Surface>

            <Surface>
              <SectionHeader title="アカウント概要" />
              <SummaryBlock>
                <SummaryStat
                  label="名前"
                  value={data.user?.name ?? "不明"}
                  emphasis="primary"
                />
                <SummaryStat
                  label="メールアドレス"
                  value={data.user?.email ?? "不明"}
                />
                <SummaryStat label="ログイン状態" value="サインイン中" />
                <SummaryStat
                  label="最終更新"
                  value={
                    data.updatedAt
                      ? formatDateTimeLabel(data.updatedAt)
                      : "まだ保存されていません"
                  }
                />
              </SummaryBlock>
            </Surface>
          </>
        ) : (
          <Surface>
            <SectionHeader title="保存済み設定" />
            <p className="ui-subtitle">
              ゲスト利用中です。保存済み設定はログイン後に利用できるようになります。
            </p>
          </Surface>
        )}
      </AppShell>
    </GlobalUserSettingsProvider>
  );
}

function ConfigSnapshotGroup(props: {
  title: string;
  config: TrainingConfigSnapshot | null;
  resetAction: () => Promise<void>;
}) {
  return (
    <div className="ui-settings-snapshot__group">
      <div className="ui-settings-snapshot__title">
        <div className="ui-compact-actions">
          <strong>{props.title}</strong>
          <Chip tone="amber">保存済み</Chip>
        </div>
        <form action={props.resetAction}>
          <ResetConfigSubmitButton>初期値に戻す</ResetConfigSubmitButton>
        </form>
      </div>

      {props.config ? (
        <div className="ui-settings-snapshot__rows">
          {getSnapshotRows(props.config).map((row) => (
            <div
              key={`${props.title}-${row.label}`}
              className="ui-settings-snapshot__row"
            >
              <span className="ui-settings-snapshot__label">{row.label}</span>
              <span className="ui-settings-snapshot__value">{row.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="ui-subtitle">
          {props.title}の保存済み設定はまだありません。
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
