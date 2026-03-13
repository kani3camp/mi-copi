import type {
  DistanceGuestResult,
  DistanceGuestSummary,
} from "../../../features/training/model/distance-guest";
import {
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
} from "../../../features/training/model/format";
import {
  formatQuestionDirectionLabel,
  formatSignedSemitoneLabel,
  getIntervalLabel,
} from "../../../features/training/model/interval-notation";
import type {
  IntervalNotationStyle,
  QuestionDirection,
  SessionFinishReason,
} from "../../../features/training/model/types";
import type { SaveTrainingSessionResult } from "../../../features/training/server/saveTrainingSession";
import {
  Button,
  Chip,
  Notice,
  SectionHeader,
  SummaryBlock,
  SummaryStat,
  Surface,
} from "../../ui/primitives";
import {
  DistanceFeedbackDiagram,
  FeedbackStatusChip,
  formatFinishReasonLabel,
  MiniStatRow,
  PlaybackButtonPair,
  type TrainingPlaybackKind,
  TrainingResultPersistenceSection,
} from "../train-ui-shared";

export function DistanceQuestionPanel(props: {
  phase: "playing" | "answering";
  questionIndex: number;
  direction: QuestionDirection;
  replayBaseCount: number;
  replayTargetCount: number;
  playbackKind: TrainingPlaybackKind;
  answerChoiceValues: number[];
  intervalNotationStyle: IntervalNotationStyle;
  onReplayBase: () => void;
  onReplayTarget: () => void;
  onAnswer: (value: number) => void;
}) {
  const isPlaybackLocked = props.phase === "playing";

  return (
    <Surface tone="accent">
      <SectionHeader
        title="音を聴いて答える"
        description="再生ボタンで聞き直しながら、音程名をひとつ選びます。"
        actions={<Chip tone="teal">回答中</Chip>}
      />
      <PlaybackButtonPair
        isPlaybackLocked={isPlaybackLocked}
        playbackKind={props.playbackKind}
        onReplayBase={props.onReplayBase}
        onReplayTarget={props.onReplayTarget}
      />
      <MiniStatRow
        items={[
          {
            label: "方向",
            value: formatQuestionDirectionLabel(props.direction),
            tone: "teal",
          },
          {
            label: "基準音",
            value: `${props.replayBaseCount}回`,
          },
          {
            label: "問題音",
            value: `${props.replayTargetCount}回`,
            tone: "blue",
          },
        ]}
      />
      <div className="ui-train-answer-grid">
        {props.answerChoiceValues.map((choice) => (
          <Button
            key={choice}
            type="button"
            onClick={() => props.onAnswer(choice)}
            block
            disabled={isPlaybackLocked}
            variant="secondary"
          >
            {getIntervalLabel(choice, props.intervalNotationStyle)}
          </Button>
        ))}
      </div>
    </Surface>
  );
}

export function DistanceFeedbackPanel(props: {
  feedbackResult: DistanceGuestResult;
  lastAnsweredWasFinal: boolean;
  intervalNotationStyle: IntervalNotationStyle;
  onReplayCorrectTarget: () => void;
  onContinue: () => void;
}) {
  return (
    <Surface tone="elevated">
      <SectionHeader
        title="フィードバック"
        actions={
          <FeedbackStatusChip
            errorSemitones={props.feedbackResult.errorSemitones}
            isCorrect={props.feedbackResult.isCorrect}
          />
        }
      />

      <DistanceFeedbackDiagram
        direction={props.feedbackResult.question.direction}
        correctSemitones={props.feedbackResult.question.distanceSemitones}
        answeredSemitones={props.feedbackResult.answeredDistanceSemitones}
      />

      <SummaryBlock>
        <SummaryStat
          label="誤差"
          value={formatSignedSemitoneLabel(props.feedbackResult.errorSemitones)}
        />
        <SummaryStat
          label="回答時間"
          value={formatResponseTimeMsLabel(props.feedbackResult.responseTimeMs)}
        />
        <SummaryStat
          label="スコア"
          value={formatScoreLabel(props.feedbackResult.score)}
        />
      </SummaryBlock>

      <div className="ui-sticky-actions">
        <Button type="button" onClick={props.onReplayCorrectTarget} block>
          正解の音を再生
        </Button>
        <Button
          type="button"
          onClick={props.onContinue}
          variant="primary"
          block
        >
          {props.lastAnsweredWasFinal ? "結果を見る" : "次へ"}
        </Button>
      </div>
    </Surface>
  );
}

export function DistanceResultPanel(props: {
  summary: DistanceGuestSummary;
  recentResults: DistanceGuestResult[];
  intervalNotationStyle: IntervalNotationStyle;
  finishReason: SessionFinishReason | null;
  isAuthenticated: boolean;
  canSaveResult: boolean;
  cannotSaveBecauseNoAnswers: boolean;
  isSavePending: boolean;
  saveResult: SaveTrainingSessionResult | null;
  onRetrySave: () => void;
  onReset: () => void;
}) {
  return (
    <Surface tone="elevated">
      <SectionHeader
        title="結果"
        description="今回の精度と反応速度をまとめました。"
      />

      <SummaryBlock>
        <SummaryStat
          label="セッションスコア"
          value={formatScoreLabel(props.summary.sessionScore)}
          emphasis="primary"
        />
        <SummaryStat
          label="正答率"
          value={formatAccuracyLabel(props.summary.accuracyRate)}
        />
        <SummaryStat label="回答数" value={props.summary.questionCount} />
        <SummaryStat
          label="平均誤差"
          value={formatAvgErrorLabel(props.summary.avgErrorAbs)}
        />
        <SummaryStat
          label="平均回答時間"
          value={formatResponseTimeMsLabel(props.summary.avgResponseTimeMs)}
        />
        <SummaryStat
          label="終了理由"
          value={formatFinishReasonLabel(props.finishReason)}
        />
      </SummaryBlock>

      {props.recentResults.length > 0 ? (
        <div className="ui-stack-md">
          <SectionHeader title="直近の回答" />
          <div className="ui-list">
            {props.recentResults.map((result) => (
              <div
                key={result.answeredAt}
                className="ui-list-link ui-list-link--compact"
              >
                <strong>問題 {result.question.questionIndex + 1}</strong>
                <span className="ui-muted">
                  正解{" "}
                  {getIntervalLabel(
                    result.question.distanceSemitones,
                    props.intervalNotationStyle,
                  )}{" "}
                  / 回答{" "}
                  {getIntervalLabel(
                    result.answeredDistanceSemitones,
                    props.intervalNotationStyle,
                  )}
                </span>
                <span className="ui-muted">
                  {formatSignedSemitoneLabel(result.errorSemitones)} /{" "}
                  {formatResponseTimeMsLabel(result.responseTimeMs)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <TrainingResultPersistenceSection
        isAuthenticated={props.isAuthenticated}
        cannotSaveBecauseNoAnswers={props.cannotSaveBecauseNoAnswers}
        canSaveResult={props.canSaveResult}
        isSavePending={props.isSavePending}
        saveResult={props.saveResult}
        onRetrySave={props.onRetrySave}
      />

      {props.finishReason === "time_up" ? (
        <Notice>
          制限時間に達したため終了しました。進行中で未回答の問題は集計から除外されています。
        </Notice>
      ) : null}

      {props.cannotSaveBecauseNoAnswers ? (
        <Notice>
          回答済みの問題がないため、このセッションは保存できません。時間に余裕を持ってもう一度お試しください。
        </Notice>
      ) : null}

      <div className="ui-sticky-actions">
        <div className="ui-stack-sm">
          <strong>次のセッション</strong>
          <span className="ui-muted">設定に戻って続けて練習できます。</span>
        </div>
        <Button type="button" onClick={props.onReset} block variant="primary">
          {props.cannotSaveBecauseNoAnswers
            ? "新しいセッションを始める"
            : "もう一度始める"}
        </Button>
      </div>
    </Surface>
  );
}
