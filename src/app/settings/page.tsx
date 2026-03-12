import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDateTimeLabel } from "../../features/training/model/format";
import type { TrainingConfigSnapshot } from "../../features/training/model/types";
import { getSettingsPageDataForCurrentUser } from "../../features/training/server/getSettingsPageData";
import { resetLastUsedTrainingConfigForCurrentUser } from "../../features/training/server/lastUsedTrainingConfig";
import {
  buttonStyle,
  cardStyle,
  keyValueCardStyle,
  keyValueGridStyle,
  navLinkStyle,
  navRowStyle,
  noticeStyle,
  pageHeroStyle,
  pageShellStyle,
  sectionTitleStyle,
  subtleTextStyle,
} from "../ui/polish";
import { GlobalSettingsSection } from "./global-settings-section";

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
    <main style={pageShellStyle}>
      <header style={pageHeroStyle}>
        <h1 style={{ ...sectionTitleStyle, fontSize: "40px" }}>設定</h1>
        <p style={subtleTextStyle}>
          全体設定の変更と、保存済みの前回設定の確認 / リセットを行えます。
        </p>
        <div style={navRowStyle}>
          <Link href="/" style={navLinkStyle}>
            ホームへ戻る
          </Link>
          <Link href="/train/distance" style={navLinkStyle}>
            距離モードへ
          </Link>
          <Link href="/train/keyboard" style={navLinkStyle}>
            鍵盤モードへ
          </Link>
        </div>
      </header>

      {resetTarget ? (
        <section style={noticeStyle("success")}>
          {resetTarget === "distance"
            ? "距離モードの設定を初期値に戻しました。"
            : "鍵盤モードの設定を初期値に戻しました。"}
        </section>
      ) : null}

      {resetError ? (
        <section style={noticeStyle("error")}>
          {resetError === "distance"
            ? "距離モードの設定をリセットできませんでした。もう一度お試しください。"
            : "鍵盤モードの設定をリセットできませんでした。もう一度お試しください。"}
        </section>
      ) : null}

      <GlobalSettingsSection />

      {data.isAuthenticated ? (
        <>
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>アカウント概要</h2>
            <div style={keyValueGridStyle}>
              <div style={keyValueCardStyle}>
                <strong>ログイン状態</strong>
                <span>サインイン中</span>
              </div>
              <div style={keyValueCardStyle}>
                <strong>名前</strong>
                <span>{data.user?.name ?? "不明"}</span>
              </div>
              <div style={keyValueCardStyle}>
                <strong>メールアドレス</strong>
                <span>{data.user?.email ?? "不明"}</span>
              </div>
              <div style={keyValueCardStyle}>
                <strong>最終更新</strong>
                <span>
                  {data.updatedAt
                    ? formatDateTimeLabel(data.updatedAt)
                    : "まだ保存されていません"}
                </span>
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>前回の距離モード設定</h2>
            {data.lastDistanceConfig ? (
              <>
                <ConfigSnapshotView config={data.lastDistanceConfig} />
                <form action={resetDistanceAction}>
                  <button type="submit" style={buttonStyle()}>
                    距離モードを初期値に戻す
                  </button>
                </form>
              </>
            ) : (
              <>
                <p style={subtleTextStyle}>
                  距離モードの保存済み設定はまだありません。
                </p>
                <form action={resetDistanceAction}>
                  <button type="submit" style={buttonStyle()}>
                    距離モードを初期値に戻す
                  </button>
                </form>
              </>
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>前回の鍵盤モード設定</h2>
            {data.lastKeyboardConfig ? (
              <>
                <ConfigSnapshotView config={data.lastKeyboardConfig} />
                <form action={resetKeyboardAction}>
                  <button type="submit" style={buttonStyle()}>
                    鍵盤モードを初期値に戻す
                  </button>
                </form>
              </>
            ) : (
              <>
                <p style={subtleTextStyle}>
                  鍵盤モードの保存済み設定はまだありません。
                </p>
                <form action={resetKeyboardAction}>
                  <button type="submit" style={buttonStyle()}>
                    鍵盤モードを初期値に戻す
                  </button>
                </form>
              </>
            )}
          </section>
        </>
      ) : (
        <section style={cardStyle}>
          <p style={subtleTextStyle}>
            ゲスト利用中です。保存済み設定はログイン後に利用できるようになります。
          </p>
        </section>
      )}
    </main>
  );
}

function ConfigSnapshotView(props: { config: TrainingConfigSnapshot }) {
  const { config } = props;

  return (
    <div style={keyValueGridStyle}>
      <div style={keyValueCardStyle}>
        <strong>モード:</strong> {formatConfigModeLabel(config.mode)}
      </div>
      <div style={keyValueCardStyle}>
        <strong>音程範囲:</strong> {config.intervalRange.minSemitone} -{" "}
        {config.intervalRange.maxSemitone}
      </div>
      <div style={keyValueCardStyle}>
        <strong>出題方向:</strong>{" "}
        {config.directionMode === "up_only" ? "上行のみ" : "上下混在"}
      </div>
      <div style={keyValueCardStyle}>
        <strong>基準音モード:</strong>{" "}
        {config.baseNoteMode === "fixed" ? "固定" : "ランダム"}
      </div>
      <div style={keyValueCardStyle}>
        <strong>固定する基準音:</strong> {config.fixedBaseNote ?? "なし"}
      </div>
      <div style={keyValueCardStyle}>
        <strong>同音を含める:</strong>{" "}
        {config.includeUnison ? "はい" : "いいえ"}
      </div>
      <div style={keyValueCardStyle}>
        <strong>オクターブを含める:</strong>{" "}
        {config.includeOctave ? "はい" : "いいえ"}
      </div>
      <div style={keyValueCardStyle}>
        <strong>終了条件:</strong>{" "}
        {config.endCondition.type === "question_count"
          ? `問題数 (${config.endCondition.questionCount})`
          : `制限時間 (${formatTimeLimitSecondsLabel(config.endCondition.timeLimitSeconds)})`}
      </div>
      {"intervalGranularity" in config && config.intervalGranularity ? (
        <div style={keyValueCardStyle}>
          <strong>音程表記の粒度:</strong>{" "}
          {config.intervalGranularity === "simple" ? "シンプル" : "増減あり"}
        </div>
      ) : null}
    </div>
  );
}

function formatTimeLimitSecondsLabel(value: number): string {
  return `${value} 秒`;
}

function formatConfigModeLabel(value: "distance" | "keyboard"): string {
  return value === "distance" ? "距離モード" : "鍵盤モード";
}
