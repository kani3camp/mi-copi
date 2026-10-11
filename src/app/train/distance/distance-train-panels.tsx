import type { CSSProperties } from "react";
import type {
  DistanceGuestResult,
  DistanceGuestSummary,
} from "../../../features/training/model/distance-guest";
import { formatResponseTimeMsLabel } from "../../../features/training/model/format";
import {
  formatPitchComparisonSemitoneLabel,
  formatQuestionDirectionLabel,
  getIntervalLabel,
} from "../../../features/training/model/interval-notation";
import { getTargetMidi } from "../../../features/training/model/pitch";
import type {
  IntervalNotationStyle,
  QuestionDirection,
  SessionFinishReason,
} from "../../../features/training/model/types";
import type { SaveTrainingSessionResult } from "../../../features/training/server/saveTrainingSession";
import { AnswerComparison } from "../../ui/answer-comparison";
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
  FeedbackControls,
  FeedbackMetrics,
  FeedbackStatusChip,
  MiniStatRow,
  PlaybackButtonPair,
  TrainingResultPersistenceSection,
  TrainingResultSummary,
} from "../train-ui-shared";

export function DistanceQuestionPanel(props: {
  isPlaybackLocked: boolean;
  questionIndex: number;
  direction: QuestionDirection;
  replayBaseCount: number;
  replayTargetCount: number;
  answerChoiceRows: number[][];
  intervalNotationStyle: IntervalNotationStyle;
  onReplayBase: () => void;
  onReplayTarget: () => void;
  onAnswer: (value: number) => void;
}) {
  return (
    <Surface tone="accent" className="ui-question-panel">
      <SectionHeader
        title="音を聴いて答える"
        actions={
          <Chip tone="neutral">
            {formatQuestionDirectionLabel(props.direction)}
          </Chip>
        }
      />
      <PlaybackButtonPair
        isPlaybackLocked={props.isPlaybackLocked}
        onReplayBase={props.onReplayBase}
        onReplayTarget={props.onReplayTarget}
      />
      <MiniStatRow
        items={[
          {
            id: "direction",
            label: "方向",
            value: formatQuestionDirectionLabel(props.direction),
          },
          {
            id: "base-replay-count",
            label: "基準音",
            value: `${props.replayBaseCount}回`,
          },
          {
            id: "target-replay-count",
            label: "問題音",
            value: `${props.replayTargetCount}回`,
          },
        ]}
      />
      <div className="ui-train-answer-grid">
        {props.answerChoiceRows.map((row) => (
          <div
            key={row.join("-")}
            className="ui-train-answer-grid__row"
            style={{ "--answer-columns": row.length } as CSSProperties}
          >
            {row.map((choice) => (
              <Button
                key={choice}
                type="button"
                onClick={() => props.onAnswer(choice)}
                block
                disabled={props.isPlaybackLocked}
                variant="secondary"
                className="ui-train-answer-button"
              >
                <span className="ui-train-answer-button__label">
                  {getIntervalLabel(choice, props.intervalNotationStyle)}
                </span>
              </Button>
            ))}
          </div>
        ))}
      </div>
    </Surface>
  );
}

export function DistanceFeedbackPanel(props: {
  feedbackResult: DistanceGuestResult;
  lastAnsweredWasFinal: boolean;
  intervalNotationStyle: IntervalNotationStyle;
  onEndSession: () => void;
  onReplayBase: () => void;
  onReplayCorrectTarget: () => void;
  onContinue: () => void;
}) {
  const correctIntervalLabel = getIntervalLabel(
    props.feedbackResult.question.distanceSemitones,
    props.intervalNotationStyle,
  );
  const answeredIntervalLabel = getIntervalLabel(
    props.feedbackResult.answeredDistanceSemitones,
    props.intervalNotationStyle,
  );
  const answerMidi = getTargetMidi(
    props.feedbackResult.question.baseMidi,
    props.feedbackResult.question.direction,
    props.feedbackResult.answeredDistanceSemitones,
  );

  return (
    <Surface tone="elevated" className="ui-feedback-panel">
      <SectionHeader
        title="フィードバック"
        actions={
          <FeedbackStatusChip
            errorSemitones={props.feedbackResult.errorSemitones}
          />
        }
      />

      <SummaryBlock className="ui-feedback-answer-block">
        <SummaryStat
          label="正解"
          value={correctIntervalLabel}
          emphasis="primary"
          tone="success"
        />
        <SummaryStat label="回答" value={answeredIntervalLabel} tone="teal" />
      </SummaryBlock>

      <DistanceFeedbackDiagram
        direction={props.feedbackResult.question.direction}
        correctSemitones={props.feedbackResult.question.distanceSemitones}
        answeredSemitones={props.feedbackResult.answeredDistanceSemitones}
      />

      <FeedbackMetrics
        targetMidi={props.feedbackResult.question.targetMidi}
        answerMidi={answerMidi}
        responseTimeMs={props.feedbackResult.responseTimeMs}
        score={props.feedbackResult.score}
      />

      <FeedbackControls
        lastAnsweredWasFinal={props.lastAnsweredWasFinal}
        onReplayBase={props.onReplayBase}
        onReplayCorrectTarget={props.onReplayCorrectTarget}
        onContinue={props.onContinue}
        onEndSession={props.onEndSession}
      />
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
    <Surface className="ui-training-result">
      <TrainingResultSummary
        summary={props.summary}
        finishReason={props.finishReason}
        cannotSaveBecauseNoAnswers={props.cannotSaveBecauseNoAnswers}
        onReset={props.onReset}
      />

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

      {props.recentResults.length > 0 ? (
        <div className="ui-stack-md">
          <SectionHeader title="直近の回答" />
          <div className="ui-list ui-result-recent-list">
            {props.recentResults.map((result) => (
              <div
                key={result.answeredAt}
                className="ui-list-link ui-list-link--compact"
              >
                <strong>問題 {result.question.questionIndex + 1}</strong>
                <AnswerComparison
                  correct={getIntervalLabel(
                    result.question.distanceSemitones,
                    props.intervalNotationStyle,
                  )}
                  answer={getIntervalLabel(
                    result.answeredDistanceSemitones,
                    props.intervalNotationStyle,
                  )}
                />
                <span className="ui-muted">
                  {formatDistanceErrorLabel(result)} /{" "}
                  {formatResponseTimeMsLabel(result.responseTimeMs)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Surface>
  );
}

function formatDistanceErrorLabel(result: DistanceGuestResult): string {
  const answerMidi = getTargetMidi(
    result.question.baseMidi,
    result.question.direction,
    result.answeredDistanceSemitones,
  );

  return formatPitchComparisonSemitoneLabel({
    targetMidi: result.question.targetMidi,
    answerMidi,
  });
}
