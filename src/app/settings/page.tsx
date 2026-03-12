import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  formatDateTimeLabel,
  formatDurationSecondsLabel,
} from "../../features/training/model/format";
import { formatDirectionModeLabel } from "../../features/training/model/interval-notation";
import type { TrainingConfigSnapshot } from "../../features/training/model/types";
import { getSettingsPageDataForCurrentUser } from "../../features/training/server/getSettingsPageData";
import { resetLastUsedTrainingConfigForCurrentUser } from "../../features/training/server/lastUsedTrainingConfig";
import { ButtonLink } from "../ui/navigation-link";
import {
  AppShell,
  KeyValueCard,
  KeyValueGrid,
  Notice,
  PageHero,
  SectionHeader,
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
  const data = await getSettingsPageDataForCurrentUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const resetTarget = resolvedSearchParams?.reset;
  const resetError = resolvedSearchParams?.error;

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
    <AppShell narrow>
      <PageHero
        title="設定"
        eyebrow="Preferences"
        subtitle="全体設定の変更と、保存済みの前回設定の確認やリセットを行えます。"
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
            <SectionHeader title="アカウント概要" />
            <KeyValueGrid>
              <KeyValueCard label="ログイン状態" value="サインイン中" />
              <KeyValueCard label="名前" value={data.user?.name ?? "不明"} />
              <KeyValueCard
                label="メールアドレス"
                value={data.user?.email ?? "不明"}
              />
              <KeyValueCard
                label="最終更新"
                value={
                  data.updatedAt
                    ? formatDateTimeLabel(data.updatedAt)
                    : "まだ保存されていません"
                }
              />
            </KeyValueGrid>
          </Surface>

          <Surface>
            <SectionHeader title="前回の距離モード設定" />
            {data.lastDistanceConfig ? (
              <>
                <ConfigSnapshotView config={data.lastDistanceConfig} />
                <form action={resetDistanceAction}>
                  <ResetConfigSubmitButton>
                    距離モードを初期値に戻す
                  </ResetConfigSubmitButton>
                </form>
              </>
            ) : (
              <>
                <p className="ui-subtitle">
                  距離モードの保存済み設定はまだありません。
                </p>
                <form action={resetDistanceAction}>
                  <ResetConfigSubmitButton>
                    距離モードを初期値に戻す
                  </ResetConfigSubmitButton>
                </form>
              </>
            )}
          </Surface>

          <Surface>
            <SectionHeader title="前回の鍵盤モード設定" />
            {data.lastKeyboardConfig ? (
              <>
                <ConfigSnapshotView config={data.lastKeyboardConfig} />
                <form action={resetKeyboardAction}>
                  <ResetConfigSubmitButton>
                    鍵盤モードを初期値に戻す
                  </ResetConfigSubmitButton>
                </form>
              </>
            ) : (
              <>
                <p className="ui-subtitle">
                  鍵盤モードの保存済み設定はまだありません。
                </p>
                <form action={resetKeyboardAction}>
                  <ResetConfigSubmitButton>
                    鍵盤モードを初期値に戻す
                  </ResetConfigSubmitButton>
                </form>
              </>
            )}
          </Surface>
        </>
      ) : (
        <Surface>
          <p className="ui-subtitle">
            ゲスト利用中です。保存済み設定はログイン後に利用できるようになります。
          </p>
        </Surface>
      )}
    </AppShell>
  );
}

function ConfigSnapshotView(props: { config: TrainingConfigSnapshot }) {
  const { config } = props;

  return (
    <KeyValueGrid className="ui-grid-kv--compact">
      <KeyValueCard
        className="ui-kv-card--dense"
        label="モード"
        value={formatConfigModeLabel(config.mode)}
      />
      <KeyValueCard
        className="ui-kv-card--dense"
        label="音程範囲"
        value={`${config.intervalRange.minSemitone} - ${config.intervalRange.maxSemitone}`}
      />
      <KeyValueCard
        className="ui-kv-card--dense"
        label="出題方向"
        value={formatDirectionModeLabel(config.directionMode)}
      />
      <KeyValueCard
        className="ui-kv-card--dense"
        label="基準音モード"
        value={config.baseNoteMode === "fixed" ? "固定" : "ランダム"}
      />
      <KeyValueCard
        className="ui-kv-card--dense"
        label="固定する基準音"
        value={config.fixedBaseNote ?? "なし"}
      />
      <KeyValueCard
        className="ui-kv-card--dense"
        label="同音を含める"
        value={config.includeUnison ? "はい" : "いいえ"}
      />
      <KeyValueCard
        className="ui-kv-card--dense"
        label="オクターブを含める"
        value={config.includeOctave ? "はい" : "いいえ"}
      />
      <KeyValueCard
        className="ui-kv-card--dense"
        label="終了条件"
        value={
          config.endCondition.type === "question_count"
            ? `問題数 (${config.endCondition.questionCount})`
            : `制限時間 (${formatTimeLimitSecondsLabel(config.endCondition.timeLimitSeconds)})`
        }
      />
      {"intervalGranularity" in config && config.intervalGranularity ? (
        <KeyValueCard
          className="ui-kv-card--dense"
          label="音程表記の粒度"
          value={
            config.intervalGranularity === "simple" ? "シンプル" : "増減あり"
          }
        />
      ) : null}
    </KeyValueGrid>
  );
}

function formatTimeLimitSecondsLabel(value: number): string {
  return formatDurationSecondsLabel(value);
}

function formatConfigModeLabel(value: "distance" | "keyboard"): string {
  return value === "distance" ? "距離モード" : "鍵盤モード";
}
