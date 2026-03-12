import { notFound } from "next/navigation";

import { getGlobalUserSettingsForCurrentUser } from "../../../features/settings/server/global-user-settings";
import {
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatDateTimeLabel,
  formatDurationSecondsLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
} from "../../../features/training/model/format";
import {
  formatDirectionModeLabel,
  formatSignedSemitoneLabel,
  getIntervalLabel,
} from "../../../features/training/model/interval-notation";
import { getTrainingSessionDetailForCurrentUser } from "../../../features/training/server/getTrainingSessionDetail";
import { ButtonLink } from "../../ui/navigation-link";
import {
  AppShell,
  KeyValueCard,
  KeyValueGrid,
  List,
  PageHero,
  SectionHeader,
  Surface,
} from "../../ui/primitives";

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
    <AppShell narrow>
      <PageHero
        title="セッション詳細"
        eyebrow="Saved Session"
        subtitle="保存済みセッションの概要、設定、回答結果を確認できます。"
        actions={
          <>
            <ButtonLink href="/" pendingLabel="ホームを開いています...">
              ホームへ戻る
            </ButtonLink>
            <ButtonLink href="/stats" pendingLabel="統計を開いています...">
              統計を見る
            </ButtonLink>
          </>
        }
      />

      <Surface tone="accent">
        <SectionHeader title="概要" />
        <KeyValueGrid>
          <KeyValueCard
            label="モード"
            value={formatDetailModeLabel(detail.mode)}
          />
          <KeyValueCard
            label="作成日時"
            value={formatDateTimeLabel(detail.createdAt)}
          />
          <KeyValueCard
            label="終了日時"
            value={formatDateTimeLabel(detail.endedAt)}
          />
          <KeyValueCard label="問題数" value={detail.answeredQuestionCount} />
          <KeyValueCard label="正解数" value={detail.correctQuestionCount} />
          <KeyValueCard
            label="正答率"
            value={formatAccuracyLabel(detail.accuracyRate)}
          />
          <KeyValueCard
            label="平均誤差"
            value={formatAvgErrorLabel(detail.avgErrorAbs)}
          />
          <KeyValueCard
            label="平均回答時間"
            value={formatResponseTimeMsLabel(detail.avgResponseTimeMs)}
          />
          <KeyValueCard
            label="セッションスコア"
            value={formatScoreLabel(detail.sessionScore)}
          />
        </KeyValueGrid>
      </Surface>

      <Surface>
        <SectionHeader title="設定スナップショット" />
        <KeyValueGrid>
          <KeyValueCard
            label="モード"
            value={formatDetailModeLabel(detail.configSnapshot.mode)}
          />
          <KeyValueCard
            label="音程範囲"
            value={`${detail.configSnapshot.intervalRange.minSemitone} - ${detail.configSnapshot.intervalRange.maxSemitone}`}
          />
          <KeyValueCard
            label="出題方向"
            value={formatDirectionModeLabel(
              detail.configSnapshot.directionMode,
            )}
          />
          <KeyValueCard
            label="基準音モード"
            value={
              detail.configSnapshot.baseNoteMode === "fixed"
                ? "固定"
                : "ランダム"
            }
          />
          <KeyValueCard
            label="固定する基準音"
            value={detail.configSnapshot.fixedBaseNote ?? "なし"}
          />
          <KeyValueCard
            label="同音を含める"
            value={detail.configSnapshot.includeUnison ? "はい" : "いいえ"}
          />
          <KeyValueCard
            label="オクターブを含める"
            value={detail.configSnapshot.includeOctave ? "はい" : "いいえ"}
          />
          <KeyValueCard
            label="終了条件"
            value={
              detail.configSnapshot.endCondition.type === "question_count"
                ? `問題数 (${detail.configSnapshot.endCondition.questionCount})`
                : `制限時間 (${formatTimeLimitSecondsLabel(detail.configSnapshot.endCondition.timeLimitSeconds)})`
            }
          />
          {detail.configSnapshot.mode === "distance" ? (
            <KeyValueCard
              label="音程表記の粒度"
              value={
                detail.configSnapshot.intervalGranularity === "simple"
                  ? "シンプル"
                  : "増減あり"
              }
            />
          ) : (
            <KeyValueCard label="鍵盤の回答形式" value="音名" />
          )}
        </KeyValueGrid>
      </Surface>

      <Surface>
        <SectionHeader title="回答結果" />
        {detail.results.length > 0 ? (
          <List as="div">
            {detail.results.map((result) => (
              <article key={result.id} className="ui-panel-card">
                <strong>問題 {result.questionIndex + 1}</strong>
                {detail.mode === "distance" ? (
                  <>
                    <span className="ui-muted">
                      正解:{" "}
                      {getIntervalLabel(
                        result.targetIntervalSemitones,
                        intervalNotationStyle,
                      )}
                    </span>
                    <span className="ui-muted">
                      回答:{" "}
                      {getIntervalLabel(
                        result.answerIntervalSemitones,
                        intervalNotationStyle,
                      )}
                    </span>
                    <span className="ui-muted">
                      {result.isCorrect ? "正解" : "不正解"} /{" "}
                      {formatSignedSemitoneLabel(result.errorSemitones)} /{" "}
                      {formatResponseTimeMsLabel(result.responseTimeMs)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="ui-muted">
                      {result.baseNoteName} -&gt; {result.targetNoteName} / 回答{" "}
                      {result.answerNoteName}
                    </span>
                    <span className="ui-muted">
                      {result.isCorrect
                        ? "正解"
                        : `誤差 ${formatAvgErrorLabel(Math.abs(result.errorSemitones))}`}{" "}
                      / {formatResponseTimeMsLabel(result.responseTimeMs)}
                    </span>
                  </>
                )}
              </article>
            ))}
          </List>
        ) : (
          <p className="ui-subtitle">回答結果はまだありません。</p>
        )}
      </Surface>
    </AppShell>
  );
}

function formatDetailModeLabel(value: "distance" | "keyboard"): string {
  return value === "distance" ? "距離モード" : "鍵盤モード";
}

function formatTimeLimitSecondsLabel(value: number): string {
  return formatDurationSecondsLabel(value);
}
