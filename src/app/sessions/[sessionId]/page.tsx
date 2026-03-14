import { notFound } from "next/navigation";

import { getGlobalUserSettingsForCurrentUser } from "../../../features/settings/server/global-user-settings";
import {
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatDateTimeLabel,
  formatDurationSecondsLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
  formatTrainingModeLabel,
} from "../../../features/training/model/format";
import {
  formatDirectionModeLabel,
  formatSignedSemitoneLabel,
  getIntervalLabel,
} from "../../../features/training/model/interval-notation";
import { getTrainingSessionDetailForCurrentUser } from "../../../features/training/server/getTrainingSessionDetail";
import { getCurrentUserOrNullCached } from "../../../lib/auth/server";
import { ButtonLink } from "../../ui/navigation-link";
import {
  AppShell,
  Chip,
  List,
  PageHero,
  SectionHeader,
  SummaryBlock,
  SummaryStat,
  Surface,
  TrainingModeChip,
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
  const currentUser = await getCurrentUserOrNullCached();
  const [detail, globalSettings] = await Promise.all([
    getTrainingSessionDetailForCurrentUser(sessionId, { currentUser }),
    getGlobalUserSettingsForCurrentUser({ currentUser }),
  ]);

  if (!detail) {
    notFound();
  }

  const intervalNotationStyle = globalSettings.settings.intervalNotationStyle;
  const configRows = createConfigRows(detail);

  return (
    <AppShell narrow>
      <PageHero
        title="セッション詳細"
        eyebrow="保存済みセッション"
        subtitle="保存済みセッションの概要、設定、回答結果を確認できます。"
        actions={
          <>
            <ButtonLink
              href="/"
              variant="ghost"
              size="compact"
              pendingLabel="ホームを開いています..."
            >
              ホームへ戻る
            </ButtonLink>
            <ButtonLink
              href="/stats"
              variant="ghost"
              size="compact"
              pendingLabel="統計を開いています..."
            >
              統計を見る
            </ButtonLink>
          </>
        }
      />

      <Surface tone="accent">
        <SectionHeader
          title="概要"
          description="保存済みセッションの主要指標を、1ブロックでまとめて確認できます。"
          actions={<TrainingModeChip mode={detail.mode} />}
        />
        <SummaryBlock className="ui-summary-block--insight">
          <SummaryStat
            label="セッションスコア"
            value={formatScoreLabel(detail.sessionScore)}
            emphasis="primary"
            className="ui-summary-stat--brand"
          />
          <SummaryStat
            label="正答率"
            value={formatAccuracyLabel(detail.accuracyRate)}
            detail={`${detail.correctQuestionCount} / ${detail.answeredQuestionCount} 問`}
            className="ui-summary-stat--teal"
          />
          <SummaryStat
            label="平均誤差"
            value={formatAvgErrorLabel(detail.avgErrorAbs)}
            detail="ズレの平均"
            className="ui-summary-stat--coral"
          />
          <SummaryStat
            label="平均回答時間"
            value={formatResponseTimeMsLabel(detail.avgResponseTimeMs)}
            detail="反応速度"
            className="ui-summary-stat--blue"
          />
          <SummaryStat
            label="作成日時"
            value={formatDateTimeLabel(detail.createdAt)}
          />
          <SummaryStat
            label="終了日時"
            value={formatDateTimeLabel(detail.endedAt)}
          />
        </SummaryBlock>
      </Surface>

      <Surface>
        <SectionHeader
          title="設定スナップショット"
          description="保存時点の出題条件を、フラットな行で確認できます。"
        />
        <dl className="ui-detail-kv-list">
          {configRows.map((row) => (
            <div key={row.label} className="ui-detail-kv-row">
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </Surface>

      <Surface>
        <SectionHeader
          title="回答結果"
          description="正解、回答、評価、誤差、回答時間を罫線ベースで並べています。"
        />
        {detail.results.length > 0 ? (
          <List as="div" className="ui-detail-result-list">
            {detail.results.map((result) => (
              <article key={result.id} className="ui-detail-result-item">
                <div className="ui-detail-result-item__header">
                  <div className="ui-stack-sm">
                    <strong>問題 {result.questionIndex + 1}</strong>
                    {detail.mode === "keyboard" ? (
                      <span className="ui-muted">
                        基準音 {result.baseNoteName}
                      </span>
                    ) : null}
                  </div>
                  <Chip
                    tone={
                      detail.mode === "distance"
                        ? getDistanceEvaluation(result).tone
                        : getKeyboardEvaluation(result).tone
                    }
                  >
                    {detail.mode === "distance"
                      ? getDistanceEvaluation(result).label
                      : getKeyboardEvaluation(result).label}
                  </Chip>
                </div>
                <dl className="ui-detail-result-item__grid">
                  {detail.mode === "distance" ? (
                    <>
                      <div
                        className="ui-detail-result-item__fact"
                        data-tone="brand"
                      >
                        <dt>正解</dt>
                        <dd>
                          {getIntervalLabel(
                            result.targetIntervalSemitones,
                            intervalNotationStyle,
                          )}
                        </dd>
                      </div>
                      <div
                        className="ui-detail-result-item__fact"
                        data-tone="teal"
                      >
                        <dt>回答</dt>
                        <dd>
                          {getIntervalLabel(
                            result.answerIntervalSemitones,
                            intervalNotationStyle,
                          )}
                        </dd>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className="ui-detail-result-item__fact"
                        data-tone="brand"
                      >
                        <dt>正解</dt>
                        <dd>{result.targetNoteName}</dd>
                      </div>
                      <div
                        className="ui-detail-result-item__fact"
                        data-tone="teal"
                      >
                        <dt>回答</dt>
                        <dd>{result.answerNoteName}</dd>
                      </div>
                    </>
                  )}
                  <div className="ui-detail-result-item__fact" data-tone="blue">
                    <dt>誤差</dt>
                    <dd>
                      {detail.mode === "distance"
                        ? formatSignedSemitoneLabel(result.errorSemitones)
                        : formatAvgErrorLabel(Math.abs(result.errorSemitones))}
                    </dd>
                  </div>
                  <div className="ui-detail-result-item__fact" data-tone="blue">
                    <dt>回答時間</dt>
                    <dd>{formatResponseTimeMsLabel(result.responseTimeMs)}</dd>
                  </div>
                </dl>
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

function formatTimeLimitSecondsLabel(value: number): string {
  return formatDurationSecondsLabel(value);
}

function createConfigRows(
  detail: Awaited<ReturnType<typeof getTrainingSessionDetailForCurrentUser>>,
) {
  if (!detail) {
    return [];
  }

  return [
    {
      label: "モード",
      value: formatTrainingModeLabel(detail.configSnapshot.mode),
    },
    {
      label: "音程範囲",
      value: `${detail.configSnapshot.intervalRange.minSemitone} - ${detail.configSnapshot.intervalRange.maxSemitone}`,
    },
    {
      label: "出題方向",
      value: formatDirectionModeLabel(detail.configSnapshot.directionMode),
    },
    {
      label: "基準音モード",
      value:
        detail.configSnapshot.baseNoteMode === "fixed" ? "固定" : "ランダム",
    },
    {
      label: "固定する基準音",
      value: detail.configSnapshot.fixedBaseNote ?? "なし",
    },
    {
      label: "同音を含める",
      value: detail.configSnapshot.includeUnison ? "はい" : "いいえ",
    },
    {
      label: "オクターブを含める",
      value: detail.configSnapshot.includeOctave ? "はい" : "いいえ",
    },
    {
      label: "終了条件",
      value:
        detail.configSnapshot.endCondition.type === "question_count"
          ? `問題数 (${detail.configSnapshot.endCondition.questionCount})`
          : `制限時間 (${formatTimeLimitSecondsLabel(detail.configSnapshot.endCondition.timeLimitSeconds)})`,
    },
    detail.configSnapshot.mode === "distance"
      ? {
          label: "音程表記の粒度",
          value:
            detail.configSnapshot.intervalGranularity === "simple"
              ? "シンプル"
              : "増減あり",
        }
      : {
          label: "鍵盤の回答形式",
          value: "音名",
        },
  ];
}

function getDistanceEvaluation(result: {
  isCorrect: boolean;
  errorSemitones: number;
  answerIntervalSemitones: number;
  targetIntervalSemitones: number;
}): { tone: "brand" | "teal" | "amber" | "coral"; label: string } {
  if (result.isCorrect) {
    return { tone: "brand", label: "正解" };
  }

  const absError = Math.abs(result.errorSemitones);
  const answerDirection = Math.sign(result.answerIntervalSemitones);
  const targetDirection = Math.sign(result.targetIntervalSemitones);

  if (
    answerDirection !== 0 &&
    targetDirection !== 0 &&
    answerDirection !== targetDirection
  ) {
    return { tone: "coral", label: "方向が逆" };
  }

  if (absError === 1) {
    return { tone: "amber", label: "惜しい" };
  }

  if (absError === 2) {
    return { tone: "teal", label: "方向は正しい" };
  }

  return { tone: "coral", label: "大きくズレ" };
}

function getKeyboardEvaluation(result: {
  isCorrect: boolean;
  errorSemitones: number;
}): { tone: "brand" | "amber" | "coral"; label: string } {
  if (result.isCorrect) {
    return { tone: "brand", label: "正解" };
  }

  if (Math.abs(result.errorSemitones) === 1) {
    return { tone: "amber", label: "惜しい" };
  }

  return { tone: "coral", label: "大きくズレ" };
}
