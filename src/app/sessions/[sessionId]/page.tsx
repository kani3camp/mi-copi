import Link from "next/link";
import { notFound } from "next/navigation";

import { getGlobalUserSettingsForCurrentUser } from "../../../features/settings/server/global-user-settings";
import {
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatDateTimeLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
} from "../../../features/training/model/format";
import {
  formatSignedSemitoneLabel,
  getIntervalLabel,
} from "../../../features/training/model/interval-notation";
import { getTrainingSessionDetailForCurrentUser } from "../../../features/training/server/getTrainingSessionDetail";
import {
  cardStyle,
  keyValueCardStyle,
  keyValueGridStyle,
  listStyle,
  navLinkStyle,
  navRowStyle,
  pageHeroStyle,
  pageShellStyle,
  sectionTitleStyle,
  subtleTextStyle,
} from "../../ui/polish";

interface TrainingSessionDetailPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function TrainingSessionDetailPage({
  params,
}: TrainingSessionDetailPageProps) {
  const { sessionId } = await params;
  const [detail, globalSettings] = await Promise.all([
    getTrainingSessionDetailForCurrentUser(sessionId),
    getGlobalUserSettingsForCurrentUser(),
  ]);

  if (!detail) {
    notFound();
  }

  const intervalNotationStyle = globalSettings.settings.intervalNotationStyle;

  return (
    <main style={pageShellStyle}>
      <header style={pageHeroStyle}>
        <h1 style={{ ...sectionTitleStyle, fontSize: "40px" }}>
          セッション詳細
        </h1>
        <p style={subtleTextStyle}>
          保存済みセッションの概要、設定、回答結果を確認できます。
        </p>
        <div style={navRowStyle}>
          <Link href="/" style={navLinkStyle}>
            ホームへ戻る
          </Link>
          <Link href="/stats" style={navLinkStyle}>
            統計を見る
          </Link>
        </div>
      </header>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>概要</h2>
        <div style={keyValueGridStyle}>
          <div style={keyValueCardStyle}>
            <strong>モード:</strong> {formatDetailModeLabel(detail.mode)}
          </div>
          <div style={keyValueCardStyle}>
            <strong>作成日時:</strong> {formatDateTimeLabel(detail.createdAt)}
          </div>
          <div style={keyValueCardStyle}>
            <strong>終了日時:</strong> {formatDateTimeLabel(detail.endedAt)}
          </div>
          <div style={keyValueCardStyle}>
            <strong>問題数:</strong> {detail.answeredQuestionCount}
          </div>
          <div style={keyValueCardStyle}>
            <strong>正解数:</strong> {detail.correctQuestionCount}
          </div>
          <div style={keyValueCardStyle}>
            <strong>正答率:</strong> {formatAccuracyLabel(detail.accuracyRate)}
          </div>
          <div style={keyValueCardStyle}>
            <strong>平均誤差:</strong> {formatAvgErrorLabel(detail.avgErrorAbs)}
          </div>
          <div style={keyValueCardStyle}>
            <strong>平均回答時間:</strong>{" "}
            {formatResponseTimeMsLabel(detail.avgResponseTimeMs)}
          </div>
          <div style={keyValueCardStyle}>
            <strong>セッションスコア:</strong>{" "}
            {formatScoreLabel(detail.sessionScore)}
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>設定スナップショット</h2>
        <div style={keyValueGridStyle}>
          <div style={keyValueCardStyle}>
            <strong>モード:</strong>{" "}
            {formatDetailModeLabel(detail.configSnapshot.mode)}
          </div>
          <div style={keyValueCardStyle}>
            <strong>音程範囲:</strong>{" "}
            {detail.configSnapshot.intervalRange.minSemitone} -{" "}
            {detail.configSnapshot.intervalRange.maxSemitone}
          </div>
          <div style={keyValueCardStyle}>
            <strong>出題方向:</strong>{" "}
            {detail.configSnapshot.directionMode === "up_only"
              ? "上行のみ"
              : "上下混在"}
          </div>
          <div style={keyValueCardStyle}>
            <strong>基準音モード:</strong>{" "}
            {detail.configSnapshot.baseNoteMode === "fixed"
              ? "固定"
              : "ランダム"}
          </div>
          <div style={keyValueCardStyle}>
            <strong>固定する基準音:</strong>{" "}
            {detail.configSnapshot.fixedBaseNote ?? "なし"}
          </div>
          <div style={keyValueCardStyle}>
            <strong>同音を含める:</strong>{" "}
            {detail.configSnapshot.includeUnison ? "はい" : "いいえ"}
          </div>
          <div style={keyValueCardStyle}>
            <strong>オクターブを含める:</strong>{" "}
            {detail.configSnapshot.includeOctave ? "はい" : "いいえ"}
          </div>
          <div style={keyValueCardStyle}>
            <strong>終了条件:</strong>{" "}
            {detail.configSnapshot.endCondition.type === "question_count"
              ? `問題数 (${detail.configSnapshot.endCondition.questionCount})`
              : `制限時間 (${formatTimeLimitSecondsLabel(detail.configSnapshot.endCondition.timeLimitSeconds)})`}
          </div>
          {detail.configSnapshot.mode === "distance" ? (
            <div style={keyValueCardStyle}>
              <strong>音程表記の粒度:</strong>{" "}
              {detail.configSnapshot.intervalGranularity === "simple"
                ? "シンプル"
                : "増減あり"}
            </div>
          ) : (
            <div style={keyValueCardStyle}>
              <strong>鍵盤の回答形式:</strong> 音名
            </div>
          )}
        </div>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>回答結果</h2>
        {detail.results.length > 0 ? (
          <ul style={listStyle}>
            {detail.results.map((result) => (
              <li
                key={result.id}
                style={{
                  ...keyValueCardStyle,
                  gridTemplateColumns: "none",
                }}
              >
                <strong>問題 {result.questionIndex + 1}</strong>
                {detail.mode === "distance" ? (
                  <>
                    <span style={subtleTextStyle}>
                      正解:{" "}
                      {getIntervalLabel(
                        result.targetIntervalSemitones,
                        intervalNotationStyle,
                      )}
                    </span>
                    <span style={subtleTextStyle}>
                      回答:{" "}
                      {getIntervalLabel(
                        result.answerIntervalSemitones,
                        intervalNotationStyle,
                      )}
                    </span>
                    <span style={subtleTextStyle}>
                      {result.isCorrect ? "正解" : "不正解"} /{" "}
                      {formatSignedSemitoneLabel(result.errorSemitones)} /{" "}
                      {formatResponseTimeMsLabel(result.responseTimeMs)}
                    </span>
                  </>
                ) : (
                  <>
                    <span style={subtleTextStyle}>
                      {result.baseNoteName} -&gt; {result.targetNoteName} / 回答{" "}
                      {result.answerNoteName}
                    </span>
                    <span style={subtleTextStyle}>
                      {result.isCorrect
                        ? "正解"
                        : `誤差 ${formatAvgErrorLabel(Math.abs(result.errorSemitones))}`}{" "}
                      / {formatResponseTimeMsLabel(result.responseTimeMs)}
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p style={subtleTextStyle}>回答結果はまだありません。</p>
        )}
      </section>
    </main>
  );
}

function formatDetailModeLabel(value: "distance" | "keyboard"): string {
  return value === "distance" ? "距離モード" : "鍵盤モード";
}

function formatTimeLimitSecondsLabel(value: number): string {
  return `${value} 秒`;
}
